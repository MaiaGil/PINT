import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../services/ia'; // MUDANÇA: Importa o novo serviço isolado

@Component({
  selector: 'app-ia-extracao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ia-extracao.html'
})
export class IaExtracaoComponent {
  textoFatura: string = '';
  logsProcessamento: string[] = [];
  carregando: boolean = false;

  // MUDANÇA: Injetamos o IaService em vez do ApiService antigo
  constructor(private iaService: IaService, private cdr: ChangeDetectorRef) {}

  carregarFicheiroTexto(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.textoFatura = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsText(file);
    }
  }

  processarComIA() {
    if (!this.textoFatura.trim()) {
      alert('Por favor, cole o texto ou carregue um ficheiro primeiro.');
      return;
    }

    this.carregando = true;
    this.logsProcessamento = [];

    // MUDANÇA: Chama o método através do novo iaService
    this.iaService.enviarParaExtraDocIA(this.textoFatura).subscribe({
      next: (resposta) => {
        this.logsProcessamento = resposta.logExplicativo;
        this.carregando = false;
        this.textoFatura = ''; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.carregando = false;
        alert('Erro ao processar o documento com a API da IA.');
      }
    });
  }
}