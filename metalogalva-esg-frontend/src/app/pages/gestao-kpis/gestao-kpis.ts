import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

// ── Tipos da fórmula ───────────────────────────────────

type Operador = 'SUM' | 'SUB' | 'MUL' | 'DIV' | 'AVG';

interface NoDado {
    tipo: 'dado';
    dado: string; // id_dado
}

interface NoOperacao {
    tipo: 'operacao';
    op: Operador;
    left: No;
    right: No;
}

type No = NoDado | NoOperacao;

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

    kpis: any[] = [];
    unidades: any[] = [];
    dados: any[] = []; 
    tiposAgregacao: string[] = [];
    operadores: { valor: Operador; label: string; simbolo: string }[] = [
        { valor: 'SUM', label: 'Soma',        simbolo: '+' },
        { valor: 'SUB', label: 'Subtração',   simbolo: '−' },
        { valor: 'MUL', label: 'Multiplicação',simbolo: '×' },
        { valor: 'DIV', label: 'Divisão',      simbolo: '÷' },
        { valor: 'AVG', label: 'Média',        simbolo: 'AVG' }
    ];

    form: FormKPI = FORM_VAZIO();
    modoEdicao = false;
    idEmEdicao: string | null = null;
    mostrarFormulario = false;

    aCarregar = false;
    aGuardar = false;
    mensagemSucesso = '';
    mensagemErro = '';
    kpiAEliminar: any = null;

    constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.carregarTudo();
    }

    carregarTudo(): void {
        this.aCarregar = true;
        let pedidosPendentes = 4;

        const concluirPedido = () => {
            pedidosPendentes--;
            if (pedidosPendentes === 0) {
                this.aCarregar = false;
            }
        };

        this.api.obterKPIEnums().subscribe({
            next: (r) => { this.tiposAgregacao = r.dados?.tipos_agregacao ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nos Enums:', e); concluirPedido(); }
        });

        this.api.obterUnidades().subscribe({
            next: (r) => { this.unidades = r.dados ?? []; concluirPedido(); },
            error: (e) => { console.error('❌ Falha nas Unidades:', e); concluirPedido(); }
        });

        this.api.obterDados().subscribe({
            next: (r) => { 
                const dadosBrutos = r.dados ?? [];
                const mapaUnicos = new Map<string, any>();

                dadosBrutos.forEach((d: any) => {
                    const metricaChave = d.id_metrica || 'desconhecido';

                    if (!mapaUnicos.has(metricaChave)) {
                        const nomeTratado = metricaChave
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c: string) => c.toUpperCase());

                        mapaUnicos.set(metricaChave, {
                            ...d,
                            nome_limpo: nomeTratado
                        });
                    }
                });

                this.dados = Array.from(mapaUnicos.values());
                this.dados.sort((a, b) => a.nome_limpo.localeCompare(b.nome_limpo));

                concluirPedido(); 
            },
            error: (e) => { console.error('❌ Falha nos Dados:', e); concluirPedido(); }
        });

        this.api.obterKPIs().subscribe({
            next: (r) => { 
                try { this.kpis = r?.dados ?? []; } 
                finally { concluirPedido(); }
            },
            error: (e) => { console.error('❌ Falha nos KPIs:', e); concluirPedido(); }
        });
    }

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

    guardar(): void {
        if (!this.formValido()) return;

        this.aGuardar = true;
        this.limparMensagens();

        const formulaLegivel = this.renderizarFormula(this.form.formula_ast);

        const payload = {
            nome: this.form.nome.trim(),
            tipo_agregacao: this.form.tipo_agregacao,
            formula: formulaLegivel,
            id_unidade_resultado: this.form.id_unidade_resultado.trim(),
            norma_referencia: this.form.norma_referencia.trim() || null,
            ativo: this.form.ativo
        };

        const pedido$ = this.modoEdicao && this.idEmEdicao
            ? this.api.atualizarKPI(this.idEmEdicao, payload)
            : this.api.criarKPI(payload);

        pedido$.pipe(finalize(() => { this.aGuardar = false; })).subscribe({
            next: (r) => {
                this.mostrarSucesso(r?.mensagem ?? 'Guardado com sucesso.');
                this.fecharFormulario();
                this.carregarTudo(); 
            },
            error: (e) => { this.mostrarErro(e?.error?.mensagem ?? e?.error?.erro ?? 'Erro ao guardar.'); }
        });
    }

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

    iniciarFormula(): void {
        this.form.formula_ast = {
            tipo: 'operacao', op: 'DIV',
            left:  { tipo: 'dado', dado: '' },
            right: { tipo: 'dado', dado: '' }
        } as NoOperacao;
    }

    limparFormula(): void {
        this.form.formula_ast = null;
    }

    expandirNo(no: NoOperacao, lado: 'left' | 'right'): void {
        no[lado] = {
            tipo: 'operacao', op: 'SUM',
            left:  { tipo: 'dado', dado: '' },
            right: { tipo: 'dado', dado: '' }
        } as NoOperacao;
    }

    colapsarNo(no: NoOperacao, lado: 'left' | 'right'): void {
        no[lado] = { tipo: 'dado', dado: '' };
    }

    renderizarFormula(no: No | null): string {
        if (!no) return '';

        if (no.tipo === 'dado') {
            if (!no.dado) return '?';
            const d = this.dados.find(x => x.id_dado === no.dado);
            return d ? d.nome_limpo : no.dado;
        }

        const op = this.operadores.find(o => o.valor === no.op);
        const simbolo = op?.simbolo ?? no.op;
        const left  = this.renderizarFormula(no.left);
        const right = this.renderizarFormula(no.right);

        if (no.op === 'AVG') return `AVG(${left}, ${right})`;

        return `(${left} ${simbolo} ${right})`;
    }

    isOperacao(no: No): no is NoOperacao { return no.tipo === 'operacao'; }
    isDado(no: No): no is NoDado { return no.tipo === 'dado'; }

    // ─────────────────────────────────────────────────────────────────
    // 🚀 PARSER INTELIGENTE: LÊ TEXTO OU JSON E RECONSTRÓI A ÁRVORE
    // ─────────────────────────────────────────────────────────────────
    private parsearFormula(formula: string): No | null {
        if (!formula) return null;
        formula = formula.trim();

        // Retrocompatibilidade: Se a fórmula antiga guardada for JSON puro, faz o fluxo antigo
        if (formula.startsWith('{') || formula.startsWith('[')) {
            try { return this.migrarFormulaAntiga(JSON.parse(formula)); } 
            catch { return null; }
        }

        // Fluxo Novo: Reconstrói recursivamente a árvore a partir do texto plano (ex: "(Dado A + Dado B)")
        return this.converterStringParaAst(formula);
    }

    private converterStringParaAst(formulaStr: string): No | null {
        if (!formulaStr) return null;
        formulaStr = formulaStr.trim();

        // Caso A: Operação de Média — AVG(left, right)
        if (formulaStr.startsWith('AVG(') && formulaStr.endsWith(')')) {
            const interior = formulaStr.substring(4, formulaStr.length - 1);
            let nivel = 0;
            let posVirgula = -1;

            for (let i = 0; i < interior.length; i++) {
                if (interior[i] === '(') nivel++;
                if (interior[i] === ')') nivel--;
                if (interior[i] === ',' && nivel === 0) {
                    posVirgula = i;
                    break;
                }
            }

            if (posVirgula !== -1) {
                return {
                    tipo: 'operacao',
                    op: 'AVG',
                    left: this.converterStringParaAst(interior.substring(0, posVirgula))!,
                    right: this.converterStringParaAst(interior.substring(posVirgula + 1))!
                } as NoOperacao;
            }
        }

        // Caso B: Operações normais envelopadas em parênteses — (left OP right)
        if (formulaStr.startsWith('(') && formulaStr.endsWith(')')) {
            const interior = formulaStr.substring(1, formulaStr.length - 1);
            let nivel = 0;
            let posOp = -1;
            let simboloEncontrado = '';
            const simbolos = ['+', '−', '×', '÷'];

            for (let i = 0; i < interior.length; i++) {
                if (interior[i] === '(') nivel++;
                if (interior[i] === ')') nivel--;
                if (nivel === 0 && simbolos.includes(interior[i])) {
                    posOp = i;
                    simboloEncontrado = interior[i];
                    break;
                }
            }

            if (posOp !== -1) {
                let opEnum: Operador = 'SUM';
                if (simboloEncontrado === '+') opEnum = 'SUM';
                if (simboloEncontrado === '−') opEnum = 'SUB';
                if (simboloEncontrado === '×') opEnum = 'MUL';
                if (simboloEncontrado === '÷') opEnum = 'DIV';

                return {
                    tipo: 'operacao',
                    op: opEnum,
                    left: this.converterStringParaAst(interior.substring(0, posOp))!,
                    right: this.converterStringParaAst(interior.substring(posOp + 1))!
                } as NoOperacao;
            }
        }

        // Caso C: Nó Folha (Texto limpo do Dado)
        if (formulaStr === '?' || !formulaStr) {
            return { tipo: 'dado', dado: '' };
        }

        // Mapeia o texto de volta para o ID real do Dado associado
        const d = this.dados.find(x => x.nome_limpo.toLowerCase() === formulaStr.toLowerCase() || x.id_dado === formulaStr);
        return {
            tipo: 'dado',
            dado: d ? d.id_dado : formulaStr
        } as NoDado;
    }

    private migrarFormulaAntiga(no: any): No {
        if (!no) return no;
        if (no.tipo === 'operacao') {
            return { ...no, left: this.migrarFormulaAntiga(no.left), right: this.migrarFormulaAntiga(no.right) } as NoOperacao;
        }
        if (no.tipo === 'metrica') { return { tipo: 'dado', dado: no.metrica || '' } as NoDado; }
        return no;
    }

    formValido(): boolean {
        if (!this.form.nome.trim()) { this.mostrarErro('Nome obrigatório.'); return false; }
        if (!this.form.tipo_agregacao) { this.mostrarErro('Tipo de agregação obrigatório.'); return false; }
        if (!this.form.formula_ast) { this.mostrarErro('Fórmula obrigatória.'); return false; }
        if (!this.formulaCompleta(this.form.formula_ast)) { this.mostrarErro('Fórmula incompleta — seleciona todos os dados.'); return false; }
        if (!this.form.id_unidade_resultado.trim()) { this.mostrarErro('Unidade de resultado obrigatória.'); return false; }
        return true;
    }

    private formulaCompleta(no: No): boolean {
        if (no.tipo === 'dado') return !!no.dado;
        return this.formulaCompleta(no.left) && this.formulaCompleta(no.right);
    }

    trocarModoUnidade(modo: 'dropdown' | 'manual'): void {
        this.form.unidade_modo = modo;
        this.form.id_unidade_resultado = '';
    }

    private mostrarSucesso(msg: string): void {
        this.mensagemSucesso = msg; this.mensagemErro = '';
        setTimeout(() => this.mensagemSucesso = '', 4000);
    }

    private mostrarErro(msg: string): void { this.mensagemErro = msg; this.mensagemSucesso = ''; }
    private limparMensagens(): void { this.mensagemSucesso = ''; this.mensagemErro = ''; }
}