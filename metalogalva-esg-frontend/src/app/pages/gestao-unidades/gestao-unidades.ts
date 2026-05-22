import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { finalize } from 'rxjs/operators';

interface FormUnidade {
    nome: string;
    simbolo: string;
    tipo_unidade: string;
    ativo: boolean;
}

const FORM_VAZIO = (): FormUnidade => ({
    nome: '',
    simbolo: '',
    tipo_unidade: '',
    ativo: true
});

@Component({
    selector: 'app-gestao-unidades',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestao-unidades.html',
    styleUrls: ['./gestao-unidades.css']
})
export class GestaoUnidadesComponent implements OnInit {

    // ── Dados ──────────────────────────────────────────
    unidades: any[] = [];
    unidadesFiltradas: any[] = [];
    
    // Tipos comuns em ESG para o Dropdown
    tiposUnidade = ['MASSA', 'VOLUME', 'ENERGIA', 'EMISSOES', 'AREA', 'COMPRIMENTO', 'FINANCEIRO', 'OUTRO'];

    // ── Filtros ────────────────────────────────────────
    filtroTipo = '';
    filtroTexto = '';

    // ── Formulário ─────────────────────────────────────
    form: FormUnidade = FORM_VAZIO();
    modoEdicao = false;
    idEmEdicao: string | null = null;
    mostrarFormulario = false;

    // ── UI ─────────────────────────────────────────────
    aCarregar = false;
    aGuardar = false;
    mensagemSucesso = '';
    mensagemErro = '';
    unidadeAEliminar: any = null;

    constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.carregarTudo();
    }

    // ======================
    // CARREGAR
    // ======================
    carregarTudo(): void {
        this.aCarregar = true;

        this.api.obterUnidades().subscribe({
            next: (r) => {
                this.unidades = r.dados ?? [];
                this.aplicarFiltros();
                this.aCarregar = false;
            },
            error: (e) => {
                this.mostrarErro('Erro ao carregar unidades de medida.');
                this.aCarregar = false;
            }
        });
    }

    // ======================
    // FILTROS
    // ======================
    aplicarFiltros(): void {
        this.unidadesFiltradas = this.unidades.filter(u => {
            const textoOk = !this.filtroTexto ||
                u.nome?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                u.simbolo?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
                u.id_unidade?.toLowerCase().includes(this.filtroTexto.toLowerCase());
            const tipoOk = !this.filtroTipo || u.tipo_unidade === this.filtroTipo;
            return textoOk && tipoOk;
        });
    }

    limparFiltros(): void {
        this.filtroTipo = '';
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

    abrirFormEdicao(u: any): void {
        this.form = {
            nome:         u.nome ?? '',
            simbolo:      u.simbolo ?? '',
            tipo_unidade: u.tipo_unidade ?? '',
            ativo:        u.ativo ?? true
        };
        this.modoEdicao = true;
        this.idEmEdicao = u.id_unidade;
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
            id_unidade:   this.form.simbolo.trim().toUpperCase(),
            nome:         this.form.nome.trim(),
            simbolo:      this.form.simbolo.trim(),
            tipo_unidade: this.form.tipo_unidade,
            ativo:        this.form.ativo
        };

        const pedido$ = this.modoEdicao && this.idEmEdicao
            ? this.api.atualizarUnidade(this.idEmEdicao, payload)
            : this.api.criarUnidade(payload);

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
    confirmarEliminacao(u: any): void  { this.unidadeAEliminar = u; }
    cancelarEliminacao(): void         { this.unidadeAEliminar = null; }

    eliminar(): void {
        if (!this.unidadeAEliminar) return;
        this.api.eliminarUnidade(this.unidadeAEliminar.id_unidade).subscribe({
            next: (r) => {
                this.mostrarSucesso(r.mensagem ?? 'Unidade eliminada.');
                this.unidadeAEliminar = null;
                this.carregarTudo();
            },
            error: (e) => {
                this.mostrarErro(e?.error?.mensagem ?? 'Erro ao eliminar. Pode estar associada a uma métrica.');
                this.unidadeAEliminar = null;
            }
        });
    }

    // ======================
    // VALIDAÇÃO & HELPERS
    // ======================
    formValido(): boolean {
        if (!this.form.nome.trim())       { this.mostrarErro('Nome obrigatório.');      return false; }
        if (!this.form.simbolo.trim())    { this.mostrarErro('Símbolo obrigatório.');   return false; }
        if (!this.form.tipo_unidade)      { this.mostrarErro('Tipo obrigatório.');      return false; }
        return true;
    }

    corTipo(tipo: string): string {
        const cores: Record<string, string> = {
            ENERGIA:  'amarelo',
            MASSA:    'azul',
            VOLUME:   'ciano',
            EMISSOES: 'vermelho',
            AREA:     'verde'
        };
        return cores[tipo] ?? 'cinza';
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