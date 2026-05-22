import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api';

// ── Interface atualizada com TODOS os campos do teu Schema ──
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
    
    // Enums extraídos do teu Schema
    estadosValidos = ['PENDENTE', 'VALIDADO', 'REJEITADO', 'ESTIMADO'];
    origensValidas = ['EXTRACAO_IA', 'MANUAL', 'IMPORTACAO', 'API'];

    filtroEstado = '';
    filtroOrigem = '';
    filtroTexto = '';

    // Formulário
    form: FormDado = this.gerarFormVazio();
    dadoEmEdicao: any = null;
    mostrarFormulario = false;

    // UI
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
        let pedidosPendentes = 5; // Temos 5 chamadas à API

        const concluirPedido = () => {
            pedidosPendentes--;
            if (pedidosPendentes === 0) {
                this.aCarregar = false;
                this.cdr.detectChanges(); // O ecrã atualiza quando tudo chegar!
            }
        };

        // 1. Tabela Principal (Dados)
        this.api.obterDados().subscribe({
            next: (r) => { this.dados = r.dados ?? []; this.aplicarFiltros(); concluirPedido(); },
            error: (e) => { console.error('❌ Falha nos Dados:', e); concluirPedido(); }
        });

        // 2. Lista de Métricas
        this.api.obterMetricas().subscribe({
            next: (r) => { this.metricas = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Métricas:', e); concluirPedido(); }
        });

        // 3. Lista de Entidades
        this.api.obterEntidades().subscribe({
            next: (r) => { this.entidades = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Entidades:', e); concluirPedido(); }
        });

        // 4. Lista de Períodos
        this.api.obterPeriodos().subscribe({
            next: (r) => { this.periodos = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nos Períodos:', e); concluirPedido(); }
        });

        // 5. Lista de Unidades
        this.api.obterUnidades().subscribe({
            next: (r) => { this.unidades = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Unidades:', e); concluirPedido(); }
        });
    }

    aplicarFiltros(): void {
        this.dadosFiltrados = this.dados.filter(d => {
            const textoOk = !this.filtroTexto ||
                d.id_dado?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                d.id_metrica?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                d.id_entidade?.toLowerCase().includes(this.filtroTexto.toLowerCase());
            
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
        
        // Mapeamento direto de todos os campos da base de dados para o formulário
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

        // Envia o objeto completo (exatamente como desenhaste no Schema)
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