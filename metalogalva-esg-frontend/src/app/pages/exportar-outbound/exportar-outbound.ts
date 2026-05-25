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
            next: (r) => {
                const dadosBrutos = r.dados ?? [];
                
                // 🚀 O MESMO MOTOR DE TRADUÇÃO DO ECRÃ DE PERÍODOS
                this.periodos = dadosBrutos.map((p: any) => {
                    let labelLegivel = p.id_periodo || 'Período Indefinido';
                    
                    if (p.id_periodo) {
                        const idUpper = p.id_periodo.toUpperCase().trim();
                        const matchSimples = idUpper.match(/^(\d{4})-[QT]([1-4])$/);
                        const matchPrefixado = idUpper.match(/^PER_(\d{4})_[QT]([1-4])$/);
                        const matchAnoSimples = idUpper.match(/^(\d{4})$/);

                        if (matchSimples) {
                            labelLegivel = `Trimestre ${matchSimples[2]}, ${matchSimples[1]}`;
                        } else if (matchPrefixado) {
                            labelLegivel = `Trimestre ${matchPrefixado[2]}, ${matchPrefixado[1]}`;
                        } else if (matchAnoSimples) {
                            labelLegivel = `Ano ${matchAnoSimples[1]}`;
                        } else if (idUpper.includes('ANUAL')) {
                            const ano = idUpper.replace(/[^0-9]/g, '');
                            labelLegivel = `Ano ${ano}`;
                        } else if (idUpper.includes('M')) {
                            const matchMensal = idUpper.match(/(?:PER_)?(\d{4})_M(\d{2})/);
                            if (matchMensal) labelLegivel = `Mês ${matchMensal[2]}, ${matchMensal[1]}`;
                        }
                    }

                    return {
                        ...p,
                        labelLegivel: labelLegivel // Guarda o nome limpo para o HTML usar
                    };
                });
            },
            error: (e) => console.error('Erro ao listar períodos:', e)
        });
    }

    gerarMetadadosDocumento(): any {
        const periodoObj = this.periodos.find(p => p.id_periodo === this.idPeriodoSelecionado);
        
        // 🚀 MUITO MAIS SIMPLES: 
        // Como o Backend (Mongoose) agora infere as datas automaticamente, o Angular só precisa de as ler.
        // O '.split('T')[0]' garante que mostramos só a parte da data (ex: '2024-10-01') e ignoramos a hora.
        const inicio = periodoObj?.data_inicio ? periodoObj.data_inicio.split('T')[0] : this.idPeriodoSelecionado;
        const fim = periodoObj?.data_fim ? periodoObj.data_fim.split('T')[0] : this.idPeriodoSelecionado;

        const dataEmissaoAtual = new Date().toISOString().split('T')[0];
        
        // A magia acontece aqui com os dados tratados pelo backend
        const nomeFicheiroOrigem = `outbound_metalogalva_${inicio}_${fim}.json`;

        return {
            id_documento: `OUT-MET-${this.idPeriodoSelecionado}-001`,
            tipo_documento: "OUTBOUND_ESG",
            numero_documento: `MET-OUT-${this.idPeriodoSelecionado}-001`,
            data_emissao: dataEmissaoAtual,
            fonte_ingestao: "SISTEMA_ESG_INTERNO",
            ficheiro_origem: nomeFicheiroOrigem
        };
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
                
                // Garante que o meta existe
                if (!respostaJSON.meta) {
                    respostaJSON.meta = {};
                }
                
                // Injeta os metadados dinâmicos
                respostaJSON.meta.documento = this.gerarMetadadosDocumento();
                this.jsonGerado = respostaJSON;
            },
            error: (e) => {
                // 🚀 1. Encontra o nome bonito do período selecionado
                const periodoObj = this.periodos.find(p => p.id_periodo === this.idPeriodoSelecionado);
                const nomeBonito = periodoObj?.labelLegivel || this.idPeriodoSelecionado;

                // 🚀 2. Trata a mensagem de erro para o utilizador
                if (e?.error?.mensagem) {
                    // Se o teu backend (Node.js) devolver uma mensagem que inclua o ID,
                    // esta linha deteta o ID e substitui-o instantaneamente pelo nome limpo!
                    this.mensagemErro = e.error.mensagem.replace(this.idPeriodoSelecionado, nomeBonito);
                } else {
                    // Fallback local caso o servidor não envie nenhuma mensagem específica
                    this.mensagemErro = `Não existem KPIs calculados para o ${nomeBonito} nesta tabela.`;
                }
            }
        });
    }

    descarregarFicheiroJSON(): void {
        if (!this.jsonGerado) return;
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.jsonGerado, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        
        const nomeFicheiro = this.jsonGerado.meta?.documento?.ficheiro_origem || `outbound_${this.idPeriodoSelecionado}.json`;
        downloadAnchor.setAttribute("download", nomeFicheiro);
        
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
}