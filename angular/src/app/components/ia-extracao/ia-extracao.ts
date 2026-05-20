import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// CAMINHO CIRÚRGICO: Como este ficheiro está dentro de duas pastas (components/ia-extracao), 
// ele precisa de recuar dois níveis (../../) para chegar à pasta services/ia
import { IaService } from '../../services/ia';

@Component({
  selector: 'app-ia-extracao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ia-extracao.html',   // Sem o .component a meio
  styleUrls: ['./ia-extracao.css']     // Sem o .component a meio
})
export class IaExtracaoComponent { // 👈 GARANTE QUE O NOME É EXATAMENTE ESTE
  private iaService = inject(IaService);
  private cdr = inject(ChangeDetectorRef);

  textoFatura: string = '';
  logsProcessamento: string[] = [];
  carregando: boolean = false;

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

    this.iaService.enviarParaExtraDocIA(this.textoFatura).subscribe({
      next: (resposta) => {
        this.logsProcessamento = resposta.logExplicativo || [];
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