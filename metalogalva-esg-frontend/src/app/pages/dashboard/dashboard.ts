import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  
  // ── CARDS DE INDICADORES REAIS (DA TABELA RESULTADOKPI) ────
  emissoesTotaisCO2: number = 0;   // tCO2e Totais calculadas
  consumoEnergiaTotal: number = 0; // kWh Totais calculados
  taxaValidacaoDados: number = 0;  // % de KPIs já validados pela auditoria
  aCarregar: boolean = true;

  // 📊 GRÁFICO 1: KPIs por Pilar de Sustentabilidade
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Ambiental (E)', 'Social (S)', 'Governança (G)'],
    datasets: [
      { data: [0, 0, 0], label: 'Métricas/KPIs Pendentes', backgroundColor: '#f39c12', borderRadius: 4 },
      { data: [0, 0, 0], label: 'KPIs Auditados e Validados', backgroundColor: '#2ecc71', borderRadius: 4 }
    ]
  };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
  };

  // 🥧 GRÁFICO 2: Estado de Validação Geral dos Resultados
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['VALIDADO', 'PENDENTE', 'ESTIMADO', 'REJEITADO'],
    datasets: [
      { data: [0, 0, 0, 0], backgroundColor: ['#2ecc71', '#f1c40f', '#3498db', '#e74c3c'] }
    ]
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDadosCalculados();
  }

  carregarDadosCalculados() {
    this.aCarregar = true;

    // Dispara pedidos paralelos: Resultados de KPIs calculados e tabela de suporte de KPIs
    forkJoin({
      respostaResultados: this.apiService.obterResultadosKPI(), // Garante que tens esta rota configurada no teu api.ts
      respostaKpisGlobais: this.apiService.obterKPIs()
    }).pipe(
      finalize(() => {
        this.aCarregar = false;
        this.cdr.detectChanges(); // Elimina o loading na hora
      })
    ).subscribe({
      next: ({ respostaResultados, respostaKpisGlobais }) => {
        const resultados = respostaResultados.dados || [];
        const kpisDefinidos = respostaKpisGlobais.dados || [];

        // 1. Criar dicionário para descobrir o Pilar associado a cada id_kpi
        const mapaKpis = new Map<string, string>();
        kpisDefinidos.forEach((k: any) => {
          mapaKpis.set(k.id_kpi, k.pilar?.toUpperCase() || 'AMBIENTAL');
        });

        let totalValidados = 0;
        let co2Acumulado = 0;
        let kwhAcumulado = 0;

        // Contadores do gráfico de pilares
        let eVal = 0, ePend = 0;
        let sVal = 0, sPend = 0;
        let gVal = 0, gPend = 0;

        // Contadores do gráfico circular (estados do teu enum)
        let statusVal = 0, statusPend = 0, statusEst = 0, statusRej = 0;

        // 2. Varrer a tabela resultadokpi e processar métricas agregadas
        resultados.forEach((res: any) => {
          const pilar = mapaKpis.get(res.id_kpi) || 'AMBIENTAL';
          const estado = res.estado_validacao?.toUpperCase() || 'PENDENTE';

          if (estado === 'VALIDADO') totalValidados++;

          // Acumulação de valores base para os Cards principais de ESG
          // Verifica se o KPI está relacionado com CO2 ou se usa a tua unidade de emissões do mongosh
          if (res.id_kpi?.toLowerCase().includes('co2') || res.id_unidade === 'TCO2E') {
            co2Acumulado += (res.valor_calculado || 0);
          } else if (res.id_kpi?.toLowerCase().includes('ener') || res.id_unidade === 'KWH') {
            kwhAcumulado += (res.valor_calculado || 0);
          }

          // Distribuir quantidades para o Gráfico de Barras por Pilar
          if (pilar === 'AMBIENTAL' || pilar === 'E') {
            if (estado === 'VALIDADO') eVal++; else ePend++;
          } else if (pilar === 'SOCIAL' || pilar === 'S') {
            if (estado === 'VALIDADO') sVal++; else sPend++;
          } else if (pilar === 'GOVERNANCA' || pilar === 'GOVERNANÇA' || pilar === 'G') {
            if (estado === 'VALIDADO') gVal++; else gPend++;
          }

          // Distribuir quantidades para o Gráfico Circular de Estados Reais
          if (estado === 'VALIDADO') statusVal++;
          else if (estado === 'PENDENTE') statusPend++;
          else if (estado === 'ESTIMADO') statusEst++;
          else if (estado === 'REJEITADO') statusRej++;
        });

        // 3. Fixar os dados reais agregados nos cartões do topo
        this.emissoesTotaisCO2 = parseFloat(co2Acumulado.toFixed(2));
        this.consumoEnergiaTotal = parseFloat(kwhAcumulado.toFixed(2));
        this.taxaValidacaoDados = resultados.length > 0 ? parseFloat(((totalValidados / resultados.length) * 100).toFixed(1)) : 0;

        // 4. Injetar matrizes atualizadas no Chart.js
        this.barChartData.datasets[0].data = [ePend, sPend, gPend];
        this.barChartData.datasets[1].data = [eVal, sVal, gVal];
        this.pieChartData.datasets[0].data = [statusVal, statusPend, statusEst, statusRej];

        // Quebrar referências antigas para forçar atualização reativa instantânea
        this.barChartData = { ...this.barChartData };
        this.pieChartData = { ...this.pieChartData };
      },
      error: (err) => {
        console.error('❌ Falha ao processar matriz de resultados do KPI:', err);
      }
    });
  }
}