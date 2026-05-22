import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';


// ── Tipos da fórmula ───────────────────────────────────

type Operador = 'SUM' | 'SUB' | 'MUL' | 'DIV' | 'AVG';

interface NoMetrica {
    tipo: 'metrica';
    metrica: string; // id_metrica
}

interface NoOperacao {
    tipo: 'operacao';
    op: Operador;
    left: No;
    right: No;
}

type No = NoMetrica | NoOperacao;

// ── Form ───────────────────────────────────────────────

interface FormKPI {
    nome: string;
    tipo_agregacao: string;
    formula_ast: No | null;
    id_unidade_resultado: string;
    norma_referencia: string;
    ativo: boolean;
    unidade_modo: 'dropdown' | 'manual';
}

const FORM_VAZIO = (): FormKPI => ({
    nome: '',
    tipo_agregacao: '',
    formula_ast: null,
    id_unidade_resultado: '',
    norma_referencia: '',
    ativo: true,
    unidade_modo: 'dropdown'
});

@Component({
    selector: 'app-gestao-kpis',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestao-kpis.html',
    styleUrls: ['./gestao-kpis.css']
})
export class GestaoKpisComponent implements OnInit {

    // ── Dados ──────────────────────────────────────────
    kpis: any[] = [];
    unidades: any[] = [];
    metricas: any[] = [];
    tiposAgregacao: string[] = [];
    operadores: { valor: Operador; label: string; simbolo: string }[] = [
        { valor: 'SUM', label: 'Soma',         simbolo: '+' },
        { valor: 'SUB', label: 'Subtração',    simbolo: '−' },
        { valor: 'MUL', label: 'Multiplicação',simbolo: '×' },
        { valor: 'DIV', label: 'Divisão',      simbolo: '÷' },
        { valor: 'AVG', label: 'Média',        simbolo: 'AVG' }
    ];

    // ── Formulário ─────────────────────────────────────
    form: FormKPI = FORM_VAZIO();
    modoEdicao = false;
    idEmEdicao: string | null = null;
    mostrarFormulario = false;

    // ── UI ─────────────────────────────────────────────
    aCarregar = false;
    aGuardar = false;
    mensagemSucesso = '';
    mensagemErro = '';
    kpiAEliminar: any = null;

    constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.carregarTudo();
    }

    // ======================
    // CARREGAR
    // ======================
// ======================
    // CARREGAR
    // ======================
    // ======================
    // CARREGAR
    // ======================
    carregarTudo(): void {
        this.aCarregar = true;
        let pedidosPendentes = 4; // Temos 4 pedidos a fazer

        // Função auxiliar que desliga o loading apenas quando os 4 pedidos terminarem
        const concluirPedido = () => {
            pedidosPendentes--;
            if (pedidosPendentes === 0) {
                this.aCarregar = false;
            }
        };

        // 1. Enums
        this.api.obterKPIEnums().subscribe({
            next: (r) => { this.tiposAgregacao = r.dados?.tipos_agregacao ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nos Enums:', e); concluirPedido(); }
        });

        // 2. Unidades
        this.api.obterUnidades().subscribe({
            next: (r) => { this.unidades = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Unidades:', e); concluirPedido(); }
        });

        // 3. Métricas
        this.api.obterMetricas().subscribe({
            next: (r) => { this.metricas = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Métricas:', e); concluirPedido(); }
        });

        // 4. KPIs
        // Exemplo para um dos teus 4 pedidos
        this.api.obterKPIs().subscribe({
            next: (r) => { 
                try {
                    // O '?.' protege caso o 'r' venha nulo da API
                    this.kpis = r?.dados ?? []; 
                } finally {
                    concluirPedido(); // O finally garante que isto corre sempre!
                }
            },
            error: (e) => { 
                console.error('❌ Falha nos KPIs:', e); 
                concluirPedido(); 
            }
        });
    }
    // ======================
    // ABRIR / FECHAR FORM
    // ======================
    abrirFormNovo(): void {
        this.form = FORM_VAZIO();
        this.modoEdicao = false;
        this.idEmEdicao = null;
        this.limparMensagens();
        this.mostrarFormulario = true;
    }

    abrirFormEdicao(kpi: any): void {
        this.form = {
            nome: kpi.nome,
            tipo_agregacao: kpi.tipo_agregacao,
            formula_ast: kpi.formula ? this.parsearFormula(kpi.formula) : null,
            id_unidade_resultado: kpi.id_unidade_resultado?.id_unidade ?? kpi.id_unidade_resultado ?? '',
            norma_referencia: kpi.norma_referencia ?? '',
            ativo: kpi.ativo,
            unidade_modo: 'dropdown'
        };
        this.modoEdicao = true;
        this.idEmEdicao = kpi.id_kpi;
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
            nome: this.form.nome.trim(),
            tipo_agregacao: this.form.tipo_agregacao,
            formula: JSON.stringify(this.form.formula_ast),
            id_unidade_resultado: this.form.id_unidade_resultado.trim(),
            norma_referencia: this.form.norma_referencia.trim() || null,
            ativo: this.form.ativo
        };

        const pedido$ = this.modoEdicao && this.idEmEdicao
            ? this.api.atualizarKPI(this.idEmEdicao, payload)
            : this.api.criarKPI(payload);

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
    confirmarEliminacao(kpi: any): void { this.kpiAEliminar = kpi; }
    cancelarEliminacao(): void { this.kpiAEliminar = null; }

    eliminar(): void {
        if (!this.kpiAEliminar) return;
        this.api.eliminarKPI(this.kpiAEliminar.id_kpi).subscribe({
            next: (r) => {
                this.mostrarSucesso(r.mensagem ?? 'KPI eliminado.');
                this.kpiAEliminar = null;
                this.carregarTudo();
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? 'Erro ao eliminar.');
                this.kpiAEliminar = null;
            }
        });
    }

    // ======================
    // CONSTRUTOR DE FÓRMULA
    // ======================

    // Inicia a fórmula com uma operação raiz
    iniciarFormula(): void {
        this.form.formula_ast = {
            tipo: 'operacao',
            op: 'DIV',
            left:  { tipo: 'metrica', metrica: '' },
            right: { tipo: 'metrica', metrica: '' }
        } as NoOperacao;
    }

    limparFormula(): void {
        this.form.formula_ast = null;
    }

    // Converte um nó folha (métrica) em operação
    expandirNo(no: NoOperacao, lado: 'left' | 'right'): void {
        no[lado] = {
            tipo: 'operacao',
            op: 'SUM',
            left:  { tipo: 'metrica', metrica: '' },
            right: { tipo: 'metrica', metrica: '' }
        } as NoOperacao;
    }

    // Colapsa um nó operação de volta a folha
    colapsarNo(no: NoOperacao, lado: 'left' | 'right'): void {
        no[lado] = { tipo: 'metrica', metrica: '' };
    }

    // Gera a representação legível da fórmula para preview
    renderizarFormula(no: No | null): string {
        if (!no) return '';

        if (no.tipo === 'metrica') {
            if (!no.metrica) return '?';
            const m = this.metricas.find(x => x.id_metrica === no.metrica);
            return m ? m.nome : no.metrica;
        }

        const op = this.operadores.find(o => o.valor === no.op);
        const simbolo = op?.simbolo ?? no.op;
        const left  = this.renderizarFormula(no.left);
        const right = this.renderizarFormula(no.right);

        // AVG trata-se diferente
        if (no.op === 'AVG') return `AVG(${left}, ${right})`;

        return `(${left} ${simbolo} ${right})`;
    }

    isOperacao(no: No): no is NoOperacao {
        return no.tipo === 'operacao';
    }

    isMetrica(no: No): no is NoMetrica {
        return no.tipo === 'metrica';
    }

    // Parse do JSON guardado na BD ao editar
    private parsearFormula(formula: string): No | null {
        try {
            return JSON.parse(formula) as No;
        } catch {
            return null;
        }
    }

    // ======================
    // VALIDAÇÃO
    // ======================
    formValido(): boolean {
        if (!this.form.nome.trim())
            { this.mostrarErro('Nome obrigatório.'); return false; }
        if (!this.form.tipo_agregacao)
            { this.mostrarErro('Tipo de agregação obrigatório.'); return false; }
        if (!this.form.formula_ast)
            { this.mostrarErro('Fórmula obrigatória.'); return false; }
        if (!this.formulaCompleta(this.form.formula_ast))
            { this.mostrarErro('Fórmula incompleta — seleciona todas as métricas.'); return false; }
        if (!this.form.id_unidade_resultado.trim())
            { this.mostrarErro('Unidade de resultado obrigatória.'); return false; }
        return true;
    }

    private formulaCompleta(no: No): boolean {
        if (no.tipo === 'metrica') return !!no.metrica;
        return this.formulaCompleta(no.left) && this.formulaCompleta(no.right);
    }

    // ======================
    // UI HELPERS
    // ======================
    trocarModoUnidade(modo: 'dropdown' | 'manual'): void {
        this.form.unidade_modo = modo;
        this.form.id_unidade_resultado = '';
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