import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  aCarregar = true;

  // ── LISTAS DE SUPORTE PARA FILTROS ────────────────────────
  listaEntidades: any[] = [];
  listaPeriodos: any[] = [];
  
  // ── FILTROS GLOBAIS (PONTO 1) ─────────────────────────────
  filtroEntidade: string = '';
  filtroPeriodo: string = '';
  filtroEstado: string = '';

  // ── DADOS BRUTOS DA BASE DE DADOS ─────────────────────────
  todosResultados: any[] = [];
  todosDados: any[] = [];
  todosDocumentos: any[] = [];
  todasMetricas: any[] = [];

  // ── CARDS DE KPIs REAIS (PONTO 2) ─────────────────────────
  kpiIntensidadeAco: any = null; // KPI_01 ou similar
  kpiPegadaLogistica: any = null; // KPI_02 ou similar

  // ── TABELAS DE RASTREABILIDADE (PONTOS 4 E 5) ──────────────
  tabelaRastreabilidade: any[] = [];
  painelDocumentos: any[] = [];

  // 📊 GRÁFICO 1: Dados de Origem por Métrica (PONTO 3)
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Valor Base Extraído', backgroundColor: '#3498db', borderRadius: 4 }]
  };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  };

  // 🍩 GRÁFICO 2: Separação Scope 1 vs Scope 3 (PONTO 6)
  public donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Scope 1 (Frota Própria - Interno)', 'Scope 3 (Fornecedores + Logística - Externo)'],
    datasets: [{ data: [0, 0], backgroundColor: ['#2ecc71', '#e74c3c'] }]
  };
  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDadosMestres();
  }

  carregarDadosMestres(): void {
    this.aCarregar = true;

    forkJoin({
      resultados: this.api.obterResultadosKPI(),
      dados: this.api.obterDados(),
      documentos: this.api.obterDocumentos(),
      metricas: this.api.obterMetricas(),
      entidades: this.api.obterEntidades(),
      periodos: this.api.obterPeriodos()
    }).pipe(
      finalize(() => {
        this.aCarregar = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        this.todosResultados = res.resultados?.dados || [];
        this.todosDados = res.dados?.dados || [];
        this.todosDocumentos = res.documentos?.dados || [];
        this.todasMetricas = res.metricas?.dados || [];
        this.listaEntidades = res.entidades?.dados || [];
        this.listaPeriodos = res.periodos?.dados || [];

        this.processarDashboard();
      },
      error: (err) => console.error('❌ Erro crítico ao carregar ecossistema ESG:', err)
    });
  }

  // Chamar sempre que um filtro global for alterado
  atualizarFiltros(): void {
    this.processarDashboard();
  }

  processarDashboard(): void {
    // 1. Criar Mapas de Tradução Célere em Memória
    const mapaMetricas = new Map(this.todasMetricas.map(m => [m.id_metrica, m]));
    const mapaEntidades = new Map(this.listaEntidades.map(e => [e.id_entidade, e]));
    const mapaDocumentos = new Map(this.todosDocumentos.map(d => [d.id_documento, d]));

    // 2. FILTRAGEM DOS DADOS BASE
    const resultadosFiltrados = this.todosResultados.filter(r => {
      return (!this.filtroEntidade || r.id_entidade === this.filtroEntidade) &&
             (!this.filtroPeriodo || r.id_periodo === this.filtroPeriodo) &&
             (!this.filtroEstado || r.estado_validacao === this.filtroEstado);
    });

    const dadosFiltrados = this.todosDados.filter(d => {
      return (!this.filtroEntidade || d.id_entidade === this.filtroEntidade) &&
             (!this.filtroPeriodo || d.id_periodo === this.filtroPeriodo);
    });

    // 3. ATRIBUIR OS CARDS DE KPIs (PONTO 2)
    // Procuramos os IDs lógicos guardados na tabela de resultados
    this.kpiIntensidadeAco = resultadosFiltrados.find(r => r.id_kpi?.toLowerCase().includes('aco') || r.id_kpi?.toLowerCase().includes('aço')) || 
                             resultadosFiltrados[0] || { valor_calculado: 0.493, estado_validacao: 'SIMULADO', data_calculo: new Date() };
    
    this.kpiPegadaLogistica = resultadosFiltrados.find(r => r.id_kpi?.toLowerCase().includes('log') || r.id_kpi?.toLowerCase().includes('frota')) || 
                              resultadosFiltrados[1] || { valor_calculado: 0.231, estado_validacao: 'SIMULADO', data_calculo: new Date() };

    // 4. GRÁFICO DE BARRAS: Valores brutos por métrica (PONTO 3)
    const metricasAcumuladas = new Map<string, number>();
    dadosFiltrados.forEach(d => {
      const metricaNome = mapaMetricas.get(d.id_metrica)?.nome || d.id_metrica || 'Métrica';
      const totalAtual = metricasAcumuladas.get(metricaNome) || 0;
      metricasAcumuladas.set(metricaNome, totalAtual + (d.valor_convertido_base || d.valor || 0));
    });

    this.barChartData.labels = Array.from(metricasAcumuladas.keys());
    this.barChartData.datasets[0].data = Array.from(metricasAcumuladas.values());
    this.barChartData = { ...this.barChartData };

    // 5. GRÁFICO DE DONUT: Scope 1 vs Scope 3 (PONTO 6)
    let scope1 = 0; // INTERNO
    let scope3 = 0; // EXTERNO

    dadosFiltrados.forEach(d => {
      const metricaDef = mapaMetricas.get(d.id_metrica);
      // Filtramos apenas as subcategorias de Emissões conforme o guião
      if (metricaDef?.subcategoria?.toUpperCase() === 'EMISSOES' || d.id_unidade_base_esperada === 'TCO2E' || d.id_metrica?.toLowerCase().includes('co2')) {
        if (d.origem?.toUpperCase() === 'INTERNO' || d.origem?.toUpperCase() === 'MANUAL') {
          scope1 += (d.valor_convertido_base || d.valor || 0);
        } else {
          scope3 += (d.valor_convertido_base || d.valor || 0);
        }
      }
    });
    this.donutChartData.datasets[0].data = [parseFloat(scope1.toFixed(3)), parseFloat(scope3.toFixed(3))];
    this.donutChartData = { ...this.donutChartData };

    // 6. TABELA DE RASTREABILIDADE (PONTO 4)
    // Cruzamos os resultados com os dados que lhes deram origem
    this.tabelaRastreabilidade = resultadosFiltrados.map(r => {
      // Procuramos o primeiro dado bruto correspondente para extrair a linhagem do ficheiro
      const dadoOrigem = this.todosDados.find(d => d.id_metrica && r.id_kpi?.includes(d.id_metrica.substring(0,3))) || dadosFiltrados[0];
      const docOrigem = dadoOrigem ? mapaDocumentos.get(dadoOrigem.id_documento) : null;
      
      return {
        id_kpi: r.id_kpi,
        valor_kpi: r.valor_calculado,
        unidade: r.id_unidade || 'tCO2e/ton',
        documento: docOrigem ? `${docOrigem.tipo_documento} (${docOrigem.numero_documento || 'N/A'})` : 'Consolidado IA',
        entidade: mapaEntidades.get(r.id_entidade)?.nome || r.id_entidade || 'Metalogalva',
        origem_fluxo: dadoOrigem?.origem || 'EXTRACAO_IA'
      };
    });

    // 7. PAINEL DE DOCUMENTOS PROCESSADOS (PONTO 5)
    this.painelDocumentos = this.todosDocumentos.map(doc => {
      // Descobrir qual o período e entidade da fatura através dos dados nela contidos
      const dadoDoDoc = this.todosDados.find(d => d.id_documento === doc.id_documento);
      return {
        numero: doc.numero_documento || doc.id_documento.substring(0, 12),
        tipo: doc.tipo_documento || 'FATURA',
        emissor: mapaEntidades.get(dadoDoDoc?.id_entidade)?.nome || 'Fornecedor Externo',
        data: doc.data_emissao || doc.createdAt,
        fonte: doc.fonte_ingestao || 'EXTRACAO_IA',
        estado: doc.estado || 'PROCESSADO'
      };
    });

    this.cdr.detectChanges();
  }
}