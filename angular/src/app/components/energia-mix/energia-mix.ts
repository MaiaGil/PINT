import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-energia-mix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './energia-mix.html',
  styleUrls: ['./energia-mix.css']
})
export class EnergiaMixComponent implements OnInit {
  mixes: any[] = [];
  consumos: any[] = [];

  idEnergiaConsumoSelecionado: string = '';

  novoMix = {
    fonte: 'renovavel', // Valor padrão do enum
    percentagem: 0,
    fator_emissao_gco2_per_kwh: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carrega a lista de registos do mix de energia
    this.apiService.getEnergiaMix().subscribe({
      next: (dados: any[]) => this.mixes = dados,
      error: (err: any) => console.error('Erro ao carregar mix de energia:', err)
    });

    // Carrega a lista de consumos para associar no select
    this.apiService.getConsumosEnergia().subscribe({
      next: (dados: any[]) => this.consumos = dados,
      error: (err: any) => console.error('Erro ao carregar consumos de energia:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.idEnergiaConsumoSelecionado) {
      alert('Por favor, seleciona um Registo de Consumo de Energia!');
      return;
    }

    if (this.novoMix.percentagem < 0 || this.novoMix.percentagem > 100) {
      alert('A percentagem deve estar entre 0 e 100%!');
      return;
    }

    this.apiService.createEnergiaMix(this.idEnergiaConsumoSelecionado, this.novoMix).subscribe({
      next: () => {
        this.carregarDados(); // Atualiza a tabela
        this.novoMix = { fonte: 'renovavel', percentagem: 0, fator_emissao_gco2_per_kwh: 0 };
        this.idEnergiaConsumoSelecionado = '';
        alert('Mix de Energia registado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar o mix de energia: ' + err.message)
    });
  }
}