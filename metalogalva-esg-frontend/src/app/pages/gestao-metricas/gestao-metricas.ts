import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { finalize } from 'rxjs/operators';

interface FormMetrica {
    nome: string;
    pilar: string;
    subcategoria: string;
    natureza: string;
    id_unidade_base: string;
    norma_referencia: string;
    ativo: boolean;
    unidade_modo: 'dropdown' | 'manual';
}

const FORM_VAZIO = (): FormMetrica => ({
    nome: '',
    pilar: '',
    subcategoria: '',
    natureza: '',
    id_unidade_base: '',
    norma_referencia: '',
    ativo: true,
    unidade_modo: 'dropdown'
});

@Component({
    selector: 'app-gestao-metricas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestao-metricas.html',
    styleUrls: ['./gestao-metricas.css']
})
export class GestaoMetricasComponent implements OnInit {

    // ── Dados ──────────────────────────────────────────
    metricas: any[] = [];
    metricasFiltradas: any[] = [];
    unidades: any[] = [];
    pilares: string[] = [];
    naturezas: string[] = [];

    // ── Filtros ────────────────────────────────────────
    filtroPilar = '';
    filtroNatureza = '';
    filtroTexto = '';

    // ── Formulário ─────────────────────────────────────
    form: FormMetrica = FORM_VAZIO();
    modoEdicao = false;
    idEmEdicao: string | null = null;
    mostrarFormulario = false;

    // ── UI ─────────────────────────────────────────────
    aCarregar = false;
    aGuardar = false;
    mensagemSucesso = '';
    mensagemErro = '';
    metricaAEliminar: any = null;

    constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.carregarTudo();
    }

    // ======================
    // CARREGAR
    // ======================
    carregarTudo(): void {
        this.aCarregar = true;

        this.api.obterMetricaEnums().subscribe({
            next: (r) => {
                this.pilares   = r.dados?.pilares   ?? [];
                this.naturezas = r.dados?.naturezas ?? [];
            },
            error: () => {}
        });

        this.api.obterUnidades().subscribe({
            next: (r) => this.unidades = r.dados ?? [],
            error: () => {}
        });

        this.api.obterMetricas().subscribe({
            next: (r) => {
                try {
                    this.metricas = r.dados ?? [];
                    this.aplicarFiltros();
                } catch (erroInterno) {
                    console.error("Erro ao aplicar filtros:", erroInterno);
                } finally {
                    this.aCarregar = false; // O 'finally' garante que desliga SEMPRE o loading
                }
            },
            error: () => {
                this.mostrarErro('Erro ao carregar métricas.');
                this.aCarregar = false;
            }
        });
    }

    // ======================
    // FILTROS
    // ======================
    aplicarFiltros(): void {
        this.metricasFiltradas = this.metricas.filter(m => {
            const textoOk = !this.filtroTexto ||
                m.nome?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                m.id_metrica?.toLowerCase().includes(this.filtroTexto.toLowerCase());
            
            const pilarOk    = !this.filtroPilar    || m.pilar    === this.filtroPilar;
            const naturezaOk = !this.filtroNatureza || m.natureza === this.filtroNatureza;
            
            return textoOk && pilarOk && naturezaOk;
        });
    }

    limparFiltros(): void {
        this.filtroPilar = '';
        this.filtroNatureza = '';
        this.filtroTexto = '';
        this.aplicarFiltros();
    }

    // ======================
    // FORMULÁRIO
    // ======================
    abrirFormNovo(): void {
        this.form = FORM_VAZIO();
        this.modoEdicao = false;
        this.idEmEdicao = null;
        this.limparMensagens();
        this.mostrarFormulario = true;
    }

    abrirFormEdicao(m: any): void {
        this.form = {
            nome:              m.nome,
            pilar:             m.pilar,
            subcategoria:      m.subcategoria,
            natureza:          m.natureza,
            id_unidade_base:   m.id_unidade_base?.id_unidade ?? m.id_unidade_base ?? '',
            norma_referencia:  m.norma_referencia ?? '',
            ativo:             m.ativo,
            unidade_modo:      'dropdown'
        };
        this.modoEdicao = true;
        this.idEmEdicao = m.id_metrica;
        this.limparMensagens();
        this.mostrarFormulario = true;
    }

    fecharFormulario(): void {
        this.mostrarFormulario = false;
        this.form = FORM_VAZIO();
        this.modoEdicao = false;
        this.idEmEdicao = null;
        this.limparMensagens();
    }

    // ======================
    // GUARDAR
    // ======================
    guardar(): void {
        if (!this.formValido()) return;

        this.aGuardar = true;
        this.limparMensagens();

        const payload = {
            nome:              this.form.nome.trim(),
            pilar:             this.form.pilar,
            subcategoria:      this.form.subcategoria.trim(),
            natureza:          this.form.natureza,
            id_unidade_base:   this.form.id_unidade_base.trim(),
            norma_referencia:  this.form.norma_referencia.trim() || null,
            ativo:             this.form.ativo
        };

        const pedido$ = this.modoEdicao && this.idEmEdicao
            ? this.api.atualizarMetrica(this.idEmEdicao, payload)
            : this.api.criarMetrica(payload);

        pedido$.pipe(
            finalize(() => {
                this.aGuardar = false; // ISTO DESLIGA SEMPRE O BOTAO! Aconteça o que acontecer.
            })
        ).subscribe({
            next: (r) => {
                this.mostrarSucesso(r?.mensagem ?? 'Guardado com sucesso.');
                this.fecharFormulario();
                this.carregarTudo(); // Pede à tabela para se atualizar
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? e?.error?.erro ?? 'Erro ao guardar.');
            }
        });
    }

    // ======================
    // ELIMINAR
    // ======================
    confirmarEliminacao(m: any): void  { this.metricaAEliminar = m; }
    cancelarEliminacao(): void         { this.metricaAEliminar = null; }

    eliminar(): void {
        if (!this.metricaAEliminar) return;
        this.api.eliminarMetrica(this.metricaAEliminar.id_metrica).subscribe({
            next: (r) => {
                this.mostrarSucesso(r.mensagem ?? 'Métrica eliminada.');
                this.metricaAEliminar = null;
                this.carregarTudo();
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? 'Erro ao eliminar.');
                this.metricaAEliminar = null;
            }
        });
    }

    // ======================
    // VALIDAÇÃO
    // ======================
    formValido(): boolean {
        if (!this.form.nome.trim())           { this.mostrarErro('Nome obrigatório.');              return false; }
        if (!this.form.pilar)                 { this.mostrarErro('Pilar obrigatório.');             return false; }
        if (!this.form.subcategoria.trim())   { this.mostrarErro('Subcategoria obrigatória.');      return false; }
        if (!this.form.natureza)              { this.mostrarErro('Natureza obrigatória.');          return false; }
        if (!this.form.id_unidade_base.trim()){ this.mostrarErro('Unidade base obrigatória.');      return false; }
        return true;
    }

    // ======================
    // HELPERS
    // ======================
    trocarModoUnidade(modo: 'dropdown' | 'manual'): void {
        this.form.unidade_modo = modo;
        this.form.id_unidade_base = '';
    }

    corPilar(pilar: string): string {
        const cores: Record<string, string> = {
            AMBIENTAL:  'verde',
            SOCIAL:     'azul',
            GOVERNANCA: 'roxo'
        };
        return cores[pilar] ?? '';
    }

    private mostrarSucesso(msg: string): void {
        this.mensagemSucesso = msg;
        this.mensagemErro = '';
        setTimeout(() => this.mensagemSucesso = '', 4000);
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