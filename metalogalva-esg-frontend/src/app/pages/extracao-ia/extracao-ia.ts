import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    mensagemSucesso = ''; 
    inboundJson: any = null;
    
    exibirConfirmacao = false; 

    private sub: Subscription | null = null;
    private fakeProgressSub: Subscription | null = null;

    // 🚀 INJETAMOS O CHANGEDETECTORREF AQUI
    constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.fakeProgressSub?.unsubscribe();
    }

    selecionarModo(m: Modo): void {
        this.modo = m;
        this.limparResultado();
    }

    // =========================
    // PROCESSAR TEXTO (Extração Pura)
    // =========================
    processarDocumento(): void {
        if (!this.textoDocumento.trim()) return;

        this.iniciarProcessamento();
        this.iniciarFakeProgress();
        
        // 🚀 Força o Angular a mostrar o loading imediatamente
        this.cdr.detectChanges();

        const pedido$ = this.modo === 'empresa'
            ? this.apiService.extrairDocumentoIAEmpresa(this.textoDocumento)
            : this.apiService.extrairDocumentoIA(this.textoDocumento);

        this.sub = pedido$.subscribe({
            next: (resposta) => {
                this.pararFakeProgress();
                this.definirRespostaExtracao(resposta);
                this.pararProcessamento();
                // 🚀 Força o Angular a mostrar a pré-visualização
                this.cdr.detectChanges();
            },
            error: (erro) => {
                this.pararFakeProgress();
                this.lidarComErro(erro);
                // 🚀 Força o Angular a mostrar o erro
                this.cdr.detectChanges();
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
            this.cdr.detectChanges(); // Atualiza nome do ficheiro selecionado
        }
    }

    // =========================
    // UPLOAD (Extração Pura)
    // =========================
    processarUpload(): void {
        if (!this.ficheiroSelecionado) return;

        this.iniciarProcessamento();
        this.iniciarFakeProgress();
        
        // 🚀 Força o Angular a mostrar o loading e começar a barra
        this.cdr.detectChanges();

        const pedido$ = this.modo === 'empresa'
            ? this.apiService.uploadDocumentoIAEmpresa(this.ficheiroSelecionado)
            : this.apiService.uploadDocumentoIA(this.ficheiroSelecionado);

        this.sub = pedido$.subscribe({
            next: (resposta) => {
                this.pararFakeProgress();
                this.definirRespostaExtracao(resposta);
                this.progressoUpload = 100;
                this.ficheiroSelecionado = null;
                this.pararProcessamento();
                
                // 🚀 Força o Angular a mostrar o botão de Aceitar/Negar
                this.cdr.detectChanges();
            },
            error: (erro) => {
                this.pararFakeProgress();
                this.lidarComErro(erro);
                this.cdr.detectChanges();
            }
        });
    }

    // =========================
    // CONFIRMAR E GRAVAR NA BD
    // =========================
    confirmarGravacao(): void {
        if (!this.inboundJson) return;

        this.iniciarProcessamento();
        this.exibirConfirmacao = false; 
        this.cdr.detectChanges(); // Atualiza UI para modo de gravação

        const payload = { inbound_json: this.inboundJson };

        this.sub = this.apiService.confirmarEGravarBD(payload).subscribe({
            next: (resposta) => {
                this.pararProcessamento();
                this.resultadoIA = resposta; 
                this.mensagemSucesso = resposta.mensagem || 'Dados gravados com sucesso!';
                this.cdr.detectChanges(); // Atualiza UI mostrando os cartões de sucesso
            },
            error: (erro) => {
                this.pararProcessamento();
                this.lidarComErro(erro);
                this.exibirConfirmacao = true; 
                this.cdr.detectChanges();
            }
        });
    }

    negarGravacao(): void {
        this.limparResultado();
        this.mensagemSucesso = "Extração descartada pelo utilizador.";
        this.cdr.detectChanges();
        
        setTimeout(() => {
            this.mensagemSucesso = '';
            this.cdr.detectChanges();
        }, 4000);
    }

    // =========================
    // FAKE PROGRESS
    // =========================
    private iniciarFakeProgress(): void {
        this.progressoUpload = 0;

        this.fakeProgressSub = interval(600)
            .pipe(takeWhile(() => this.progressoUpload < 90))
            .subscribe(() => {
                const restante = 90 - this.progressoUpload;
                this.progressoUpload += Math.max(1, Math.floor(restante * 0.12));
                
                // 🚀 Isto é o que faz a barra azul mover-se sem precisares de clicar em nada!
                this.cdr.detectChanges();
            });
    }

    private pararFakeProgress(): void {
        this.fakeProgressSub?.unsubscribe();
        this.fakeProgressSub = null;
    }

    // =========================
    // RESPOSTA EXTRAÇÃO (Pre-Gravação)
    // =========================
    private definirRespostaExtracao(resposta: any): void {
        this.inboundJson = 
            resposta?.inbound_json || 
            resposta?.inboundJson || 
            resposta?.dados?.inbound_json || 
            resposta?.dados?.inboundJson || 
            null;

        console.log('📦 Inbound JSON Extraído:', this.inboundJson);

        if (this.inboundJson) {
            this.exibirConfirmacao = true; 
        } else {
            this.lidarComErro({ error: { erro: "O motor de IA não devolveu um JSON de inbound válido." }});
        }
    }

    // =========================
    // STATES
    // =========================
    private iniciarProcessamento(): void {
        this.aProcessar = true;
        this.resultadoIA = null;
        this.mensagemErro = '';
        this.mensagemSucesso = '';
        this.progressoUpload = 0;
    }

    private pararProcessamento(): void {
        this.aProcessar = false;
    }

    // =========================
    // ERROS E LIMPEZA
    // =========================
    private lidarComErro(erro: any): void {
        console.error('ERRO IA:', erro);
        this.mensagemErro =
            erro?.error?.erro ||
            erro?.error?.mensagem ||
            'Erro ao comunicar com o motor inteligente.';
        this.progressoUpload = 0;
        this.aProcessar = false;
    }

    limparResultado(): void {
        this.sub?.unsubscribe();
        this.pararFakeProgress();
        this.resultadoIA = null;
        this.inboundJson = null;
        this.mensagemErro = '';
        this.mensagemSucesso = '';
        this.progressoUpload = 0;
        this.ficheiroSelecionado = null;
        this.aProcessar = false;
        this.exibirConfirmacao = false;
        this.textoDocumento = '';
        this.cdr.detectChanges(); // Limpa o ecrã instantaneamente
    }

    // =========================
    // UI HELPERS
    // =========================
    formatarJson(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    descarregarInbound(): void {
        if (!this.inboundJson) return;

        const entidade = this.inboundJson.meta?.entidade?.id_entidade || 'ENTIDADE';
        const tipoDoc = this.inboundJson.meta?.documento?.tipo_documento || 'DOC';
        const numDoc = this.inboundJson.meta?.documento?.numero_documento || 'SEM_NUMERO';

        const nomeFicheiroLimpo = `${entidade}_${tipoDoc}_${numDoc}`
            .replace(/[\\/:*?"<>| ]/g, '_')
            .toUpperCase();

        const blob = new Blob(
            [JSON.stringify(this.inboundJson, null, 2)],
            { type: 'application/json' }
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        a.download = `INBOUND_${nomeFicheiroLimpo}.json`; 
        
        a.click();
        window.URL.revokeObjectURL(url);
    }
}