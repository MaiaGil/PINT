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

  listaEntidades: any[] = [];
  listaPeriodos: any[] = [];
  
  filtroEntidade: string = '';
  filtroPeriodo: string = '';
  filtroEstado: string = '';

  todosResultados: any[] = [];
  todosDados: any[] = [];
  todosDocumentos: any[] = [];
  todasMetricas: any[] = [];

  // ARRAY ONDE A MÁGICA ACONTECE
  kpisDinamicos: any[] = [];

  tabelaRastreabilidade: any[] = [];
  painelDocumentos: any[] = [];

  public barChartDataAbaixo5000: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Valores Base (< 5000)', backgroundColor: '#3498db', borderRadius: 4 }]
  };

  public barChartDataAcima5000: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Grandes Volumes (>= 5000)', backgroundColor: '#e67e22', borderRadius: 4 }]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  };

  public donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Scope 1 (Interno)', 'Scope 3 (Externo)'],
    datasets: [{ data: [0, 0], backgroundColor: ['#2ecc71', '#e74c3c'] }]
  };
  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

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
      }
    });
  }

  atualizarFiltros(): void {
    this.processarDashboard();
  }

  processarDashboard(): void {
    const mapaMetricas = new Map(this.todasMetricas.map(m => [m.id_metrica, m]));
    const mapaEntidades = new Map(this.listaEntidades.map(e => [e.id_entidade, e]));
    const mapaDocumentos = new Map(this.todosDocumentos.map(d => [d.id_documento, d]));

    const resultadosFiltrados = this.todosResultados.filter(r => 
      (!this.filtroEntidade || r.id_entidade === this.filtroEntidade) &&
      (!this.filtroPeriodo || r.id_periodo === this.filtroPeriodo) &&
      (!this.filtroEstado || r.estado_validacao === this.filtroEstado)
    );

    const dadosFiltrados = this.todosDados.filter(d => 
      (!this.filtroEntidade || d.id_entidade === this.filtroEntidade) &&
      (!this.filtroPeriodo || d.id_periodo === this.filtroPeriodo)
    );

    this.kpisDinamicos = []; // Limpa cartões a cada alteração de filtro

    // ─────────────────────────────────────────────────────────────────
    // REGRA 1: VISÃO GERAL (SÓ RESULTADOS OFICIAIS, NUNCA ZEROS)
    // ─────────────────────────────────────────────────────────────────
    if (!this.filtroEntidade) {
      resultadosFiltrados.forEach(r => {
        if (r.valor_calculado && r.valor_calculado > 0) {
          
          let titulo = r.id_kpi;
          let cor = 'highlight-gray';
          
          const id = r.id_kpi.toLowerCase();
          if (id.includes('aco') || id.includes('aço')) { titulo = 'Intensidade Carbónica do Aço'; cor = 'highlight-blue'; }
          else if (id.includes('log') || id.includes('transp')) { titulo = 'Pegada Carbónica Logística'; cor = 'highlight-green'; }
          else if (id.includes('scope1') || id.includes('scope_1')) { titulo = 'Total Scope 1 (Interno)'; cor = 'highlight-gray'; }
          else if (id.includes('scope3') || id.includes('scope_3')) { titulo = 'Total Scope 3 (Externo)'; cor = 'highlight-red'; }

          this.kpisDinamicos.push({
            meta: 'RESULTADO OFICIAL (BD)',
            titulo: titulo,
            valor: parseFloat(r.valor_calculado.toFixed(3)),
            unidade: r.id_unidade || '',
            cor: cor,
            estado: r.estado_validacao || 'VALIDADO',
            data: r.data_calculo || r.createdAt
          });
        }
      });
    } 
    // ─────────────────────────────────────────────────────────────────
    // REGRA 2: VISÃO ENTIDADE (SÓ DADOS BRUTOS AGREGADOS, NUNCA ZEROS)
    // ─────────────────────────────────────────────────────────────────
    else {
      const isMetalogalva = this.filtroEntidade === 'ent_metalogalva';
      const metaTag = isMetalogalva ? 'OPERAÇÃO INTERNA (BRUTO)' : 'FORNECEDOR (BRUTO)';

      let emissoes = 0, peso = 0, energia = 0, volumeL = 0;

      dadosFiltrados.forEach(d => {
        const unidade = (d.id_unidade_base_esperada || d.id_unidade_original || '').toLowerCase();
        const metrica = (d.id_metrica || '').toLowerCase();
        const v = d.valor_convertido_base || d.valor || 0;

        if (unidade.includes('co2') || metrica.includes('emissao')) emissoes += v;
        else if (unidade === 'ton' || unidade === 'kg') peso += (unidade === 'kg' ? v / 1000 : v);
        else if (unidade === 'kwh' || metrica.includes('energia') || metrica.includes('eletric')) energia += v;
        else if (unidade === 'l' || unidade === 'litro' || metrica.includes('gasoleo') || metrica.includes('combustivel')) volumeL += v;
      });

      // Cria os cartões dinamicamente APENAS se o valor for superior a zero
      if (emissoes > 0) {
        this.kpisDinamicos.push({
          meta: metaTag, titulo: 'Emissões Totais Extraídas', valor: parseFloat(emissoes.toFixed(2)),
          unidade: 'tCO₂e', cor: isMetalogalva ? 'highlight-gray' : 'highlight-red',
          estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
        });
      }

      if (peso > 0) {
        this.kpisDinamicos.push({
          meta: metaTag, titulo: 'Volume de Mercadoria', valor: parseFloat(peso.toFixed(2)),
          unidade: 'ton', cor: 'highlight-blue',
          estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
        });
      }

      if (energia > 0) {
        this.kpisDinamicos.push({
          meta: metaTag, titulo: 'Consumo Energético', valor: parseFloat(energia.toFixed(2)),
          unidade: 'kWh', cor: 'highlight-green',
          estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
        });
      }

      if (volumeL > 0) {
        this.kpisDinamicos.push({
          meta: metaTag, titulo: 'Consumo de Combustível', valor: parseFloat(volumeL.toFixed(2)),
          unidade: 'L', cor: 'highlight-green',
          estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // GRÁFICOS E TABELAS (Mantém-se igual para todas as visões)
    // ─────────────────────────────────────────────────────────────────
    const metricasAbaixo5000 = new Map<string, number>();
    const metricasAcima5000 = new Map<string, number>();

    dadosFiltrados.forEach(d => {
      const metricaId = (d.id_metrica || '').toLowerCase();
      const metricaNome = mapaMetricas.get(d.id_metrica)?.nome || d.id_metrica || 'Métrica';
      const unidade = (d.id_unidade_base_esperada || d.id_unidade_original || '').toUpperCase();

      if (unidade === 'EUR' || unidade === 'EUR_TON' || metricaId.includes('fatura') || metricaId.includes('preco') || metricaNome.toLowerCase().includes('fatura')) return; 

      const valor = d.valor_convertido_base || d.valor || 0;
      if (valor > 0 && valor < 5000) metricasAbaixo5000.set(metricaNome, (metricasAbaixo5000.get(metricaNome) || 0) + valor);
      else if (valor >= 5000) metricasAcima5000.set(metricaNome, (metricasAcima5000.get(metricaNome) || 0) + valor);
    });

    this.barChartDataAbaixo5000.labels = Array.from(metricasAbaixo5000.keys());
    this.barChartDataAbaixo5000.datasets[0].data = Array.from(metricasAbaixo5000.values());
    this.barChartDataAbaixo5000 = { ...this.barChartDataAbaixo5000 };

    this.barChartDataAcima5000.labels = Array.from(metricasAcima5000.keys());
    this.barChartDataAcima5000.datasets[0].data = Array.from(metricasAcima5000.values());
    this.barChartDataAcima5000 = { ...this.barChartDataAcima5000 };

    let scope1 = 0;
    let scope3 = 0;
    dadosFiltrados.forEach(d => {
      const metricaId = (d.id_metrica || '').toLowerCase();
      const unidade = (d.id_unidade_base_esperada || d.id_unidade_original || '').toUpperCase();

      if (unidade === 'TCO2E' || metricaId.includes('co2') || metricaId.includes('emissao')) {
        const valor = d.valor_convertido_base || d.valor || 0;
        if (d.id_entidade === 'ent_metalogalva' || d.origem?.toUpperCase() === 'INTERNO') scope1 += valor;
        else scope3 += valor;
      }
    });

    this.donutChartData.datasets[0].data = [parseFloat(scope1.toFixed(3)), parseFloat(scope3.toFixed(3))];
    this.donutChartData = { ...this.donutChartData };

    this.tabelaRastreabilidade = resultadosFiltrados.map(r => {
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

    this.painelDocumentos = this.todosDocumentos.map(doc => {
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