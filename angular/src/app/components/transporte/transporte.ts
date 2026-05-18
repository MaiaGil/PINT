import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-transporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transporte.html',
  styleUrls: ['./transporte.css']
})
export class TransporteComponent implements OnInit {
  transportes: any[] = [];
  relatorios: any[] = [];

  idRelatorioSelecionado: string = '';

  novoTransporte = {
    tipo_veiculo: 'carro', // Valor padrão
    distancia_km: 0,
    fator_emissao_gco2_per_km: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carrega o histórico de transportes
    this.apiService.getTransportes().subscribe({
      next: (dados: any[]) => this.transportes = dados,
      error: (err: any) => console.error('Erro ao carregar transportes:', err)
    });

    // Carrega os relatórios para o dropdown
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

    this.apiService.createTransporte(this.idRelatorioSelecionado, this.novoTransporte).subscribe({
      next: () => {
        this.carregarDados(); // Atualiza a tabela
        this.novoTransporte = { tipo_veiculo: 'carro', distancia_km: 0, fator_emissao_gco2_per_km: 0 };
        this.idRelatorioSelecionado = '';
        alert('Dados de transporte registados com sucesso!');
      },
      error: (err: any) => alert('Erro ao registar transporte: ' + err.message)
    });
  }
}