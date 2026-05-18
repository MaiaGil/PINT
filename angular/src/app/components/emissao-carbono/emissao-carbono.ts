import { Component, OnInit } from '@angular/core';
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

  idRelatorioSelecionado: string = '';
  
  novaEmissao = {
    escopo: '1', // valor padrão
    categoria: '',
    emissoes_tco2e: 0,
    metodologia_calculo: '',
    fator_emissao_utilizado: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carrega a lista de emissões já registadas
    this.apiService.getEmissoes().subscribe({
      next: (dados: any[]) => this.emissoes = dados,
      error: (err: any) => console.error('Erro ao carregar emissões:', err)
    });

    // Carrega a lista de relatórios para o dropdown
    this.apiService.getRelatorios().subscribe({
      next: (dados: any[]) => this.relatorios = dados,
      error: (err: any) => console.error('Erro ao carregar relatórios:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.idRelatorioSelecionado) {
      alert('Por favor, seleciona um Relatório!');
      return;
    }

    this.apiService.createEmissao(this.idRelatorioSelecionado, this.novaEmissao).subscribe({
      next: () => {
        this.carregarDados(); // Atualiza as listas
        this.novaEmissao = {
          escopo: '1',
          categoria: '',
          emissoes_tco2e: 0,
          metodologia_calculo: '',
          fator_emissao_utilizado: ''
        };
        this.idRelatorioSelecionado = '';
        alert('Registo de Emissão de Carbono criado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar emissão: ' + err.message)
    });
  }
}