import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api';

@Component({
    selector: 'app-exportar-outbound',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './exportar-outbound.html',
    styleUrls: ['./exportar-outbound.css']
})
export class ExportarOutboundComponent implements OnInit {

    periodos: any[] = [];
    idPeriodoSelecionado = '';
    jsonGerado: any = null;

    aCarregar = false;
    aProcessar = false;
    mensagemErro = '';

    constructor(
        private api: ApiService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.carregarPeriodos();
    }

    carregarPeriodos(): void {
        this.aCarregar = true;
        this.api.obterPeriodos().pipe(
            finalize(() => { this.aCarregar = false; this.cdr.detectChanges(); })
        ).subscribe({
            next: (r) => this.periodos = r.dados ?? [],
            error: (e) => console.error('Erro ao listar períodos:', e)
        });
    }

    gerarOutbound(): void {
        if (!this.idPeriodoSelecionado) {
            this.mensagemErro = 'Por favor, seleciona um período de auditoria.';
            return;
        }

        this.aProcessar = true;
        this.mensagemErro = '';
        this.jsonGerado = null;

        this.api.obterOutboundPorPeriodo(this.idPeriodoSelecionado).pipe(
            finalize(() => { this.aProcessar = false; this.cdr.detectChanges(); })
        ).subscribe({
            next: (respostaJSON) => {
                this.jsonGerado = respostaJSON;
            },
            error: (e) => {
                this.mensagemErro = e?.error?.mensagem ?? 'Não existem KPIs calculados para este período nesta tabela.';
            }
        });
    }

    descarregarFicheiroJSON(): void {
        if (!this.jsonGerado) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.jsonGerado, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `outbound_report_${this.idPeriodoSelecionado}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
}