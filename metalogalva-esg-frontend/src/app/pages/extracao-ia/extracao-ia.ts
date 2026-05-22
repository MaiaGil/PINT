import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

type Modo = 'fornecedor' | 'empresa';

@Component({
    selector: 'app-extracao-ia',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './extracao-ia.html',
    styleUrls: ['./extracao-ia.css']
})
export class ExtracaoIaComponent implements OnDestroy {

    modo: Modo = 'fornecedor';

    textoDocumento = '';
    ficheiroSelecionado: File | null = null;

    aProcessar = false;
    progressoUpload = 0;

    resultadoIA: any = null;
    mensagemErro = '';
    inboundJson: any = null;

    private sub: Subscription | null = null;
    private fakeProgressSub: Subscription | null = null;

    constructor(private apiService: ApiService) {}

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.fakeProgressSub?.unsubscribe();
    }

    selecionarModo(m: Modo): void {
        this.modo = m;
        this.limparResultado();
    }

    // =========================
    // PROCESSAR TEXTO
    // =========================
    processarDocumento(): void {
        if (!this.textoDocumento.trim()) return;

        this.iniciarProcessamento();
        this.iniciarFakeProgress();

        const pedido$ = this.modo === 'empresa'
            ? this.apiService.extrairDocumentoIAEmpresa(this.textoDocumento)
            : this.apiService.extrairDocumentoIA(this.textoDocumento);

        this.sub = pedido$.subscribe({
            next: (resposta) => {
                this.pararFakeProgress();
                this.definirResposta(resposta);
                this.pararProcessamento();
            },
            error: (erro) => {
                this.pararFakeProgress();
                this.lidarComErro(erro);
            }
        });
    }

    // =========================
    // FILE SELECT
    // =========================
    onFileSelected(event: any): void {
        const file: File = event.target.files?.[0];
        if (file) {
            this.ficheiroSelecionado = file;
            this.mensagemErro = '';
        }
    }

    // =========================
    // UPLOAD — chamada simples sem reportProgress
    // =========================
    processarUpload(): void {
        if (!this.ficheiroSelecionado) return;

        this.iniciarProcessamento();
        this.iniciarFakeProgress();

        const pedido$ = this.modo === 'empresa'
            ? this.apiService.uploadDocumentoIAEmpresa(this.ficheiroSelecionado)
            : this.apiService.uploadDocumentoIA(this.ficheiroSelecionado);

        this.sub = pedido$.subscribe({
            next: (resposta) => {
                this.pararFakeProgress();
                this.definirResposta(resposta);
                this.progressoUpload = 100;
                this.ficheiroSelecionado = null;
                this.pararProcessamento();
            },
            error: (erro) => {
                this.pararFakeProgress();
                this.lidarComErro(erro);
            }
        });
    }

    // =========================
    // FAKE PROGRESS
    // Avança até 90% enquanto aguarda resposta do servidor.
    // O salto para 100% é feito manualmente ao receber resposta.
    // =========================
    private iniciarFakeProgress(): void {
        this.progressoUpload = 0;

        this.fakeProgressSub = interval(600)
            .pipe(takeWhile(() => this.progressoUpload < 90))
            .subscribe(() => {
                // desacelera à medida que se aproxima de 90%
                const restante = 90 - this.progressoUpload;
                this.progressoUpload += Math.max(1, Math.floor(restante * 0.12));
            });
    }

    private pararFakeProgress(): void {
        this.fakeProgressSub?.unsubscribe();
        this.fakeProgressSub = null;
    }

    // =========================
    // RESPOSTA
    // =========================
    private definirResposta(resposta: any): void {
        this.resultadoIA = resposta;
        this.inboundJson = resposta?.inbound_json ?? null;
    }

    // =========================
    // STATES
    // =========================
    private iniciarProcessamento(): void {
        this.aProcessar = true;
        this.resultadoIA = null;
        this.inboundJson = null;
        this.mensagemErro = '';
        this.progressoUpload = 0;
    }

    private pararProcessamento(): void {
        this.aProcessar = false;
    }

    // =========================
    // ERROS
    // =========================
    private lidarComErro(erro: any): void {
        console.error('ERRO IA:', erro);
        this.mensagemErro =
            erro?.error?.erro ||
            erro?.error?.mensagem ||
            'Erro ao processar documento com IA.';
        this.progressoUpload = 0;
        this.aProcessar = false;
    }

    // =========================
    // UI HELPERS
    // =========================
    limparResultado(): void {
        this.sub?.unsubscribe();
        this.pararFakeProgress();
        this.resultadoIA = null;
        this.inboundJson = null;
        this.mensagemErro = '';
        this.progressoUpload = 0;
        this.ficheiroSelecionado = null;
        this.aProcessar = false;
        this.textoDocumento = '';
    }

    formatarJson(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    descarregarInbound(): void {
        if (!this.inboundJson) return;

        const blob = new Blob(
            [JSON.stringify(this.inboundJson, null, 2)],
            { type: 'application/json' }
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inbound.json';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}