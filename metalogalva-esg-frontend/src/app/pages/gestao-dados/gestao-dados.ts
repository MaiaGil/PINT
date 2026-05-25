import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api';

interface FormDado {
    id_documento: string;
    id_metrica: string;
    id_entidade: string;
    id_periodo: string;
    id_unidade_original: string;
    id_unidade_base_esperada: string;
    id_fator: string;
    valor: number | null;
    valor_convertido_base: number | null;
    origem: string;
    estado_validacao: string;
    observacao: string;
}

@Component({
    selector: 'app-gestao-dados',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestao-dados.html',
    styleUrls: ['./gestao-dados.css']
})
export class GestaoDadosComponent implements OnInit {

    dados: any[] = [];
    dadosFiltrados: any[] = [];

    metricas: any[] = [];
    entidades: any[] = [];
    periodos: any[] = [];
    unidades: any[] = [];
    
    estadosValidos = ['PENDENTE', 'VALIDADO', 'REJEITADO', 'ESTIMADO'];
    origensValidas = ['EXTRACAO_IA', 'MANUAL', 'IMPORTACAO', 'API'];

    filtroEstado = '';
    filtroOrigem = '';
    filtroTexto = '';

    form: FormDado = this.gerarFormVazio();
    dadoEmEdicao: any = null;
    mostrarFormulario = false;

    aCarregar = false;
    aGuardar = false;
    mensagemSucesso = '';
    mensagemErro = '';
    dadoAEliminar: any = null;

    constructor(
        private api: ApiService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.carregarTudo();
    }

    gerarFormVazio(): FormDado {
        return {
            id_documento: '', id_metrica: '', id_entidade: '', id_periodo: '',
            id_unidade_original: '', id_unidade_base_esperada: '', id_fator: '',
            valor: null, valor_convertido_base: null,
            origem: 'MANUAL', estado_validacao: 'PENDENTE', observacao: ''
        };
    }

    // ======================
    // CARREGAR DADOS E LISTAS
    // ======================
    carregarTudo(): void {
        this.aCarregar = true;

        // 🚀 O FORKJOIN GARANTE QUE SÓ DESENHAMOS O ECRÃ QUANDO TUDO CHEGAR
        forkJoin({
            dadosResult: this.api.obterDados(),
            metricasResult: this.api.obterMetricas(),
            entidadesResult: this.api.obterEntidades(),
            periodosResult: this.api.obterPeriodos(),
            unidadesResult: this.api.obterUnidades()
        }).pipe(
            finalize(() => {
                this.aCarregar = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: any) => {
                this.metricas = res.metricasResult?.dados ?? [];
                this.entidades = res.entidadesResult?.dados ?? [];
                this.unidades = res.unidadesResult?.dados ?? [];

                // 🚀 1. MOTOR DE TRADUÇÃO DOS PERÍODOS
                const periodosBrutos = res.periodosResult?.dados ?? [];
                this.periodos = periodosBrutos.map((p: any) => {
                    let labelLegivel = p.id_periodo || 'Período Indefinido';
                    if (p.id_periodo) {
                        const idUpper = p.id_periodo.toUpperCase().trim();
                        const matchSimples = idUpper.match(/^(\d{4})-[QT]([1-4])$/);
                        const matchPrefixado = idUpper.match(/^PER_(\d{4})_[QT]([1-4])$/);
                        const matchAnoSimples = idUpper.match(/^(\d{4})$/);

                        if (matchSimples) labelLegivel = `Trimestre ${matchSimples[2]}, Ano ${matchSimples[1]}`;
                        else if (matchPrefixado) labelLegivel = `Trimestre ${matchPrefixado[2]}, Ano ${matchPrefixado[1]}`;
                        else if (matchAnoSimples) labelLegivel = `Ano ${matchAnoSimples[1]}`;
                        else if (idUpper.includes('ANUAL')) {
                            const ano = idUpper.replace(/[^0-9]/g, '');
                            labelLegivel = `Ano ${ano}`;
                        } else if (idUpper.includes('M')) {
                            const matchMensal = idUpper.match(/(?:PER_)?(\d{4})_M(\d{2})/);
                            if (matchMensal) labelLegivel = `Mês ${matchMensal[2]}, Ano ${matchMensal[1]}`;
                        }
                    }
                    return { ...p, labelLegivel };
                });

                // 🚀 2. CRIAR DICIONÁRIOS RÁPIDOS PARA A TABELA
                const mapaEntidades = new Map(this.entidades.map(e => [e.id_entidade, e.nome]));
                const mapaPeriodos = new Map(this.periodos.map(p => [p.id_periodo, p.labelLegivel]));
                const mapaMetricas = new Map(this.metricas.map(m => [m.id_metrica, m.nome]));

                // 🚀 3. INJETAR OS NOMES TRADUZIDOS EM CADA DADO DA TABELA
                const dadosBrutos = res.dadosResult?.dados ?? [];
                this.dados = dadosBrutos.map((d: any) => {
                    
                    // Aproveitamos para limpar também o nome da métrica!
                    let nomeMetrica = mapaMetricas.get(d.id_metrica) || d.id_metrica || '';
                    nomeMetrica = nomeMetrica.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

                    return {
                        ...d,
                        nome_entidade: mapaEntidades.get(d.id_entidade) || d.id_entidade,
                        nome_periodo: mapaPeriodos.get(d.id_periodo) || d.id_periodo,
                        nome_metrica: nomeMetrica
                    };
                });

                this.aplicarFiltros();
            },
            error: (e) => {
                console.error('❌ Falha ao carregar dados:', e);
                this.mostrarErro('Falha ao comunicar com o servidor. Verifica a ligação à base de dados.');
            }
        });
    }

    aplicarFiltros(): void {
        this.dadosFiltrados = this.dados.filter(d => {
            // Atualizámos o filtro de texto para pesquisar pelos nomes bonitos e não pelos IDs!
            const textoOk = !this.filtroTexto ||
                d.nome_metrica?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                d.nome_entidade?.toLowerCase().includes(this.filtroTexto.toLowerCase());
            
            const estadoOk = !this.filtroEstado || d.estado_validacao === this.filtroEstado;
            const origemOk = !this.filtroOrigem || d.origem === this.filtroOrigem;
            
            return textoOk && estadoOk && origemOk;
        });
        this.cdr.detectChanges();
    }

    limparFiltros(): void {
        this.filtroEstado = '';
        this.filtroOrigem = '';
        this.filtroTexto = '';
        this.aplicarFiltros();
    }

    // ======================
    // ABRIR FORMULÁRIO COM TUDO
    // ======================
    abrirFormEdicao(dado: any): void {
        this.dadoEmEdicao = dado;
        
        this.form = {
            id_documento: dado.id_documento ?? '',
            id_metrica: dado.id_metrica ?? '',
            id_entidade: dado.id_entidade ?? '',
            id_periodo: dado.id_periodo ?? '',
            id_unidade_original: dado.id_unidade_original ?? '',
            id_unidade_base_esperada: dado.id_unidade_base_esperada ?? '',
            id_fator: dado.id_fator ?? '',
            valor: dado.valor,
            valor_convertido_base: dado.valor_convertido_base ?? null,
            origem: dado.origem ?? 'EXTRACAO_IA',
            estado_validacao: dado.estado_validacao ?? 'PENDENTE',
            observacao: dado.observacao ?? ''
        };
        
        this.limparMensagens();
        this.mostrarFormulario = true;
    }

    fecharFormulario(): void {
        this.mostrarFormulario = false;
        this.dadoEmEdicao = null;
        this.form = this.gerarFormVazio();
        this.limparMensagens();
    }

    // ======================
    // GUARDAR TUDO
    // ======================
    guardar(): void {
        if (this.form.valor === null || this.form.valor === undefined) {
            this.mostrarErro('O valor numérico (original) é obrigatório.');
            return;
        }
        if (!this.form.id_metrica || !this.form.id_entidade || !this.form.id_periodo) {
            this.mostrarErro('Métrica, Entidade e Período são chaves obrigatórias.');
            return;
        }

        this.aGuardar = true;
        this.limparMensagens();

        const payload = {
            id_documento: this.form.id_documento.trim() || null,
            id_metrica: this.form.id_metrica.trim(),
            id_entidade: this.form.id_entidade.trim(),
            id_periodo: this.form.id_periodo.trim(),
            id_unidade_original: this.form.id_unidade_original.trim() || null,
            id_unidade_base_esperada: this.form.id_unidade_base_esperada.trim() || null,
            id_fator: this.form.id_fator.trim() || null,
            valor: this.form.valor,
            valor_convertido_base: this.form.valor_convertido_base,
            origem: this.form.origem,
            estado_validacao: this.form.estado_validacao,
            observacao: this.form.observacao.trim()
        };

        this.api.atualizarDado(this.dadoEmEdicao.id_dado, payload).pipe(
            finalize(() => {
                this.aGuardar = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (r) => {
                this.mostrarSucesso('Registo integralmente atualizado na BD.');
                this.fecharFormulario();
                this.carregarTudo();
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? e?.error?.erro ?? 'Erro ao atualizar o registo.');
            }
        });
    }

    // ======================
    // ELIMINAR E HELPERS
    // ======================
    confirmarEliminacao(dado: any): void { this.dadoAEliminar = dado; }
    cancelarEliminacao(): void { this.dadoAEliminar = null; }

    eliminar(): void {
        if (!this.dadoAEliminar) return;
        this.api.eliminarDado(this.dadoAEliminar.id_dado).subscribe({
            next: (r) => {
                this.mostrarSucesso('Registo eliminado definitivamente.');
                this.dadoAEliminar = null;
                this.carregarTudo();
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? 'Erro ao eliminar registo.');
                this.dadoAEliminar = null;
            }
        });
    }

    corEstado(estado: string): string {
        const cores: Record<string, string> = {
            PENDENTE: 'amarelo',
            VALIDADO: 'verde',
            REJEITADO: 'vermelho',
            ESTIMADO: 'azul'
        };
        return cores[estado] ?? 'cinza';
    }

    private mostrarSucesso(msg: string): void {
        this.mensagemSucesso = msg;
        this.mensagemErro = '';
        setTimeout(() => { this.mensagemSucesso = ''; this.cdr.detectChanges(); }, 4000);
    }

    private mostrarErro(msg: string): void {
        this.mensagemErro = msg;
        this.mensagemSucesso = '';
    }

    private limparMensagens(): void {
        this.mensagemSucesso = '';
        this.mensagemErro = '';
    }
}