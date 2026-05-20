import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// CORREÇÃO DOS IMPORTS: Aponta para o nome real dos teus ficheiros ('api' e 'esg.interfaces')
import { ApiService } from '../../services/api';
import { IDado } from '../../models/esg.interfaces';

@Component({
  selector: 'app-dashboard-esg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardEsgComponent implements OnInit {
  private apiService = inject(ApiService);
  
  listaDadosESG: IDado[] = [];
  carregando: boolean = true;

  ngOnInit(): void {
    this.carregarMetricasDashboard();
  }

  carregarMetricasDashboard(): void {
    this.carregando = true;
    this.apiService.getDadosESG().subscribe({
      next: (resposta) => {
        // Aceita tanto 'success' como 'sucesso' dependendo do formato do teu backend factory
        if (resposta.success || resposta.sucesso) {
          this.listaDadosESG = resposta.data;
        }
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao alimentar o painel ESG:', err);
        this.carregando = false;
      }
    });
  }

  getPilarClass(pilar: 'E' | 'S' | 'G'): string {
    const classes = {
      'E': 'bg-green-100 text-green-800', // Ambiental
      'S': 'bg-blue-100 text-blue-800',   // Social
      'G': 'bg-purple-100 text-purple-800' // Governação
    };
    return classes[pilar] || 'bg-gray-100 text-gray-800';
  }
}