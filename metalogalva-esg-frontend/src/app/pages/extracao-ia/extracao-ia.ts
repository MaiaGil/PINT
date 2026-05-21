import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { HttpEventType } from '@angular/common/http';

@Component({
	selector: 'app-extracao-ia',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './extracao-ia.html',
	styleUrls: ['./extracao-ia.css']
})
export class ExtracaoIaComponent {

	textoDocumento = '';
	ficheiroSelecionado: File | null = null;

	aProcessar = false;
	progressoUpload = 0;

	resultadoIA: any = null;
	mensagemErro = '';

	textoExtraido = '';
	inboundJson: any = null;

	constructor(private apiService: ApiService) {}

	// =========================
	// PROCESSAR TEXTO
	// =========================
	processarDocumento(): void {
		if (!this.textoDocumento.trim()) return;

		this.iniciarProcessamento();

		this.apiService.extrairDocumentoIA(this.textoDocumento).subscribe({
			next: (resposta) => {
				this.definirResposta(resposta);
				this.pararProcessamento();
			},
			error: (erro) => {
				this.lidarComErro(erro);
				this.pararProcessamento();
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
	// UPLOAD FILE
	// =========================
	processarUpload(): void {
		if (!this.ficheiroSelecionado) return;

		this.iniciarProcessamento();

		this.apiService.uploadDocumentoIAComProgresso(this.ficheiroSelecionado).subscribe({
			next: (evento: any) => {

				// progresso upload
				if (evento?.tipo === 'progresso') {
					this.progressoUpload = evento.progresso ?? 0;
					return;
				}

				// resposta final HTTP
				if (evento?.type === HttpEventType.Response) {
					this.definirResposta(evento.body);
					this.progressoUpload = 100;
					this.ficheiroSelecionado = null;
					this.pararProcessamento();
				}
			},
			error: (erro) => {
				this.lidarComErro(erro);
				this.pararProcessamento();
			}
		});
	}

	// =========================
	// RESPOSTA
	// =========================
	private definirResposta(resposta: any): void {
		this.resultadoIA = resposta;

		this.inboundJson = resposta?.inbound_json ?? null;
		this.textoExtraido = resposta?.texto_extraido ?? '';
	}

	// =========================
	// STATES
	// =========================
	private iniciarProcessamento(): void {
		this.aProcessar = true;
		this.resultadoIA = null;
		this.inboundJson = null;
		this.textoExtraido = '';
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
		this.resultadoIA = null;
		this.inboundJson = null;
		this.textoExtraido = '';
		this.mensagemErro = '';
		this.progressoUpload = 0;
		this.ficheiroSelecionado = null;
		this.aProcessar = false;
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