import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-emissao-carbono',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emissao-carbono.html',
  styleUrls: ['./emissao-carbono.css']
})
export class EmissaoCarbonoComponent implements OnInit {
  emissoes: any[] = [];
  relatorios: any[] = [];

  // CORREÇÃO: Adicionada a propriedade exigida para ligar ao select de Relatórios no teu HTML
  idRelatorioSelecionado: string = '';

  // CORREÇÃO: Objeto atualizado com os nomes exatos que o teu HTML usa no [(ngModel)]
  novaEmissao = {
    escopo: '',
    categoria: '',
    emissoes_tco2e: null,
    metodologia_calculo: '',
    fator_emissao_utilizado: null
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Carregamento assíncrono seguro contra o erro NG0100
    setTimeout(() => {
      this.carregarEmissoes();
      this.carregarRelatoriosAuxiliares();
    }, 0);
  }

  carregarEmissoes(): void {
    this.apiService.getEmissoes().subscribe({
      next: (dados: any[]) => {
        this.emissoes = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao ler emissões de carbono:', err)
    });
  }

  carregarRelatoriosAuxiliares(): void {
    if (this.apiService.getRelatorios) {
      this.apiService.getRelatorios().subscribe({
        next: (dados: any[]) => {
          this.relatorios = dados;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  // Nome da função mantido como submeterFormulario() de acordo com o (ngSubmit) do teu HTML
  submeterFormulario(): void {
    if (!this.idRelatorioSelecionado || !this.novaEmissao.escopo) {
      alert('Por favor, preencha os campos obrigatórios do formulário!');
      return;
    }

    // CORREÇÃO DO ERRO TS2554: Passamos o ID do relatório e os dados em conformidade com o teu api.ts
    this.apiService.createEmissao(this.idRelatorioSelecionado, this.novaEmissao).subscribe({
      next: () => {
        this.carregarEmissoes(); // Atualiza a tabela com o novo registo
        
        // Reset completo ao formulário
        this.idRelatorioSelecionado = '';
        this.novaEmissao = {
          escopo: '',
          categoria: '',
          emissoes_tco2e: null,
          metodologia_calculo: '',
          fator_emissao_utilizado: null
        };
        
        this.cdr.detectChanges();
        alert('Cálculo de emissão registado com sucesso!');
      },
      error: (err: any) => alert('Erro ao guardar emissão: ' + err.message)
    });
  }
}