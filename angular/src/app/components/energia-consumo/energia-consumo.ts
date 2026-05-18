import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-energia-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './energia-consumo.html',
  styleUrls: ['./energia-consumo.css']
})
export class EnergiaConsumoComponent implements OnInit {
  consumos: any[] = [];
  relatorios: any[] = [];

  idRelatorioSelecionado: string = '';

  novoConsumo = {
    quantidade: 0,
    unidade: 'kWh' // Valor por defeito
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carrega a lista de consumos já registados
    this.apiService.getConsumosEnergia().subscribe({
      next: (dados: any[]) => this.consumos = dados,
      error: (err: any) => console.error('Erro ao carregar consumos:', err)
    });

    // Carrega os relatórios para podermos associar no dropdown
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

    this.apiService.createEnergiaConsumo(this.idRelatorioSelecionado, this.novoConsumo).subscribe({
      next: () => {
        this.carregarDados(); // Recarrega a tabela e listas
        this.novoConsumo = { quantidade: 0, unidade: 'kWh' };
        this.idRelatorioSelecionado = '';
        alert('Consumo de energia registado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar consumo de energia: ' + err.message)
    });
  }
}