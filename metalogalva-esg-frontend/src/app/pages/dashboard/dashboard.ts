import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html', // ou dashboard.component.html dependendo de como nomeaste
  styleUrls: ['./dashboard.css']  // ou dashboard.component.scss
})
export class DashboardComponent implements OnInit {
  
  // Variáveis para as métricas rápidas (Cards)
  totalDocumentos: number = 0;
  totalDadosExtraidos: number = 0;
  aCarregar: boolean = true;

  // 📊 Configuração do Gráfico de Barras (Ex: Consumos por Fatura)
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Consumo Extraído', backgroundColor: '#00b894', borderRadius: 4 }
    ]
  };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  };

  // 🥧 Configuração do Gráfico Circular (Ex: Origem dos Dados)
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
  };
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Faturas Manuais', 'Extração IA (Automática)'],
    datasets: [
      { data: [0, 0], backgroundColor: ['#003366', '#00b894'] }
    ]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    console.log("📍 1. O Dashboard arrancou e chamou o ngOnInit!");
    this.carregarDados();
  }

  carregarDados() {
    console.log("📍 2. A disparar o pedido para o Backend...");
    
    this.apiService.obterDados().subscribe({
      next: (resposta) => {
        console.log("📍 3. SUCESSO! O backend respondeu com:", resposta);
        
        const dados = resposta.dados || []; // Proteção extra caso venha vazio
        this.totalDadosExtraidos = dados.length;
        
        const docsUnicos = new Set(dados.map((d: any) => d.id_documento?.id_documento || d.id_documento));
        this.totalDocumentos = docsUnicos.size;

        this.barChartData.labels = dados.map((d: any) => d.id_metrica?.nome || d.id_metrica || 'Métrica');
        this.barChartData.datasets[0].data = dados.map((d: any) => d.valor);

        const externos = dados.filter((d: any) => d.origem === 'EXTERNO').length;
        const internos = dados.length - externos;
        this.pieChartData.datasets[0].data = [internos, externos];

        this.barChartData = { ...this.barChartData };
        this.pieChartData = { ...this.pieChartData };

        this.aCarregar = false;
      },
      error: (erro) => {
        console.error("📍 3. ERRO! Falha ao comunicar com o backend:", erro);
        this.aCarregar = false;
      }
    });
  }
}