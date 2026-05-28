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

  filtroDestaque: string = '';
  listaKpisUnicos: any[] = [];
  listaMetricasUnicas: any[] = [];

  todosResultados: any[] = [];
  todosDados: any[] = [];
  todosDocumentos: any[] = [];
  todasMetricas: any[] = [];
  todosKpis: any[] = [];

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
    scales: { 
      y: { beginAtZero: true },
      x: {
        ticks: {
          callback: function(value) {
            const label = this.getLabelForValue(value as number);
            return label.length > 18 ? label.substring(0, 18) + '...' : label;
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => context[0].label 
        }
      }
    }
  };

  public donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Scope 1 (Interno)', 'Scope 3 (Externo)'],
    datasets: [{ data: [0, 0], backgroundColor: ['#2ecc71', '#e74c3c'] }]
  };
  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }
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
      periodos: this.api.obterPeriodos(),
      kpis: this.api.obterKPIs()
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
        this.todosKpis = res.kpis?.dados || [];
        
        const periodosBrutos = res.periodos?.dados || [];
        this.listaPeriodos = periodosBrutos.map((p: any) => {
          let labelLegivel = p.id_periodo || 'Período Indefinido';
          
          if (p.id_periodo) {
            const idUpper = p.id_periodo.toUpperCase().trim();
            const matchSimples = idUpper.match(/^(\d{4})-[QT]([1-4])$/);
            const matchPrefixado = idUpper.match(/^PER_(\d{4})_[QT]([1-4])$/);
            const matchAnoSimples = idUpper.match(/^(\d{4})$/);

            if (matchSimples) {
              labelLegivel = `Trimestre ${matchSimples[2]}, Ano ${matchSimples[1]}`;
            } else if (matchPrefixado) {
              labelLegivel = `Trimestre ${matchPrefixado[2]}, Ano ${matchPrefixado[1]}`;
            } else if (matchAnoSimples) {
              labelLegivel = `Ano ${matchAnoSimples[1]}`;
            } else if (idUpper.includes('ANUAL')) {
              const ano = idUpper.replace(/[^0-9]/g, '');
              labelLegivel = `Ano ${ano}`;
            } else if (idUpper.includes('M')) {
              const matchMensal = idUpper.match(/(?:PER_)?(\d{4})_M(\d{2})/);
              if (matchMensal) labelLegivel = `Mês ${matchMensal[2]}, Ano ${matchMensal[1]}`;
            }
          }
          return { ...p, labelLegivel };
        });

        this.processarDashboard();
      }
    });
  }

  limparDestaqueEAtualizar(): void {
    this.filtroDestaque = '';
    this.processarDashboard();
  }

  atualizarFiltros(): void {
    this.processarDashboard();
  }

  avaliarMetaESG(idKpi: string, valor: number): any {
    if (!idKpi) return null;
    const chaveTratada = idKpi.toLowerCase().trim();

    // 🎯 Dicionário estrito de metas por ID
    const metasExatas: { [key: string]: { valor: number, label: string } } = {
      'kpi_intensidade_de_emissoes_de_carbono_do_transporte': { valor: 1.85, label: 'Meta Indústria: 1.85 tCO₂e/ton' },
      'kpi_pegada_de_carbono_logistica_por_combustivel': { valor: 0.15  , label: 'Teto de Emissões: 0.15 tCO₂e' },
      'kpi_intensidade_carbonica_do_aco': { valor: 1.400, label: 'Meta Indústria: 1.4 tCO₂e/ton' },
      // 🚀 Adicionado suporte para o ID expandido atualizado
      'kpi_intensidade_carbonica_do_aco_adquirido_e_processado': { valor: 1.400, label: 'Meta Indústria: 1.4 tCO₂e/ton' },
      'kpi_emissoes_totais_scope_1': { valor: 500, label: 'Orçamento Scope 1: 500 tCO₂e' },
      'kpi_emissoes_totais_scope_3': { valor: 2500, label: 'Orçamento Scope 3: 2500 tCO₂e' },
      'meta_fornecedor_aco': { valor: 1.400, label: 'Limite Fornecedor: 1.4 tCO₂e/ton' },
      'meta_fornecedor_logistica': { valor: 0.150, label: 'Limite Transportadora: 0.15 tCO₂e/ton' },
      'meta_fornecedor_scope_1': { valor: 500, label: 'Limite Operacional Metalogalva: 500 tCO₂e' }
    };

    let metaEspecifica = metasExatas[chaveTratada];

    // 🛡️ FILTRO DE SALVAGUARDA: Se não encontrar o ID exato, procura por palavra-chave para evitar falhas visuais
    if (!metaEspecifica) {
      if (chaveTratada.includes('aco') || chaveTratada.includes('aço')) {
        metaEspecifica = { valor: 1.400, label: 'Meta Indústria: 1.4 tCO₂e/ton' };
      } else if (chaveTratada.includes('transporte') || chaveTratada.includes('logistica')) {
        metaEspecifica = { valor: 1.85, label: 'Meta Indústria: 1.85 tCO₂e/ton' };
      }
    }

    if (!metaEspecifica) return null;

    const desvio = valor - metaEspecifica.valor;
    const isBom = desvio <= 0; 
    const percentagem = Math.abs((desvio / metaEspecifica.valor) * 100).toFixed(1);

    return {
      labelMeta: metaEspecifica.label,
      isBom: isBom,
      mensagem: isBom ? `🟢 ${percentagem}% abaixo do limite` : `🔴 ${percentagem}% acima do limite`,
      classeCor: isBom ? 'target-success' : 'target-danger'
    };
  }

  processarDashboard(): void {
    const mapaMetricas = new Map(this.todasMetricas.map(m => [m.id_metrica, m]));
    const mapaEntidades = new Map(this.listaEntidades.map(e => [e.id_entidade, e]));
    const mapaDocumentos = new Map(this.todosDocumentos.map(d => [d.id_documento, d]));
    const mapaKpis = new Map(this.todosKpis.map(k => [k.id_kpi, k]));

    const resultadosFiltrados = this.todosResultados.filter(r => 
      (!this.filtroEntidade || r.id_entidade === this.filtroEntidade) &&
      (!this.filtroPeriodo || r.id_periodo === this.filtroPeriodo) &&
      (!this.filtroEstado || r.estado_validacao === this.filtroEstado) &&
      (mapaKpis.has(r.id_kpi))
    );

    const dadosFiltrados = this.todosDados.filter(d => 
      (!this.filtroEntidade || d.id_entidade === this.filtroEntidade) &&
      (!this.filtroPeriodo || d.id_periodo === this.filtroPeriodo)
    );

    this.kpisDinamicos = [];

    // ─────────────────────────────────────────────────────────────────
    // DROPDOWNS
    // ─────────────────────────────────────────────────────────────────
    const kpisSet = new Map<string, string>();
    resultadosFiltrados.forEach(r => { 
      if (r.id_kpi && r.valor_calculado && parseFloat(r.valor_calculado.toFixed(3)) > 0) {
        const nomeOficial = mapaKpis.get(r.id_kpi)?.nome || r.id_kpi.replace(/^kpi_/i, '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        kpisSet.set(r.id_kpi, nomeOficial);
      }
    });
    this.listaKpisUnicos = Array.from(kpisSet, ([id, nome]) => ({ id, nome })).sort((a,b) => a.nome.localeCompare(b.nome));

    const metricasSet = new Map<string, string>();
    dadosFiltrados.forEach(d => { 
      const v = d.valor_convertido_base || d.valor || 0;
      if (d.id_metrica && v > 0) { 
        metricasSet.set(d.id_metrica, mapaMetricas.get(d.id_metrica)?.nome || d.id_metrica);
      }
    });
    this.listaMetricasUnicas = Array.from(metricasSet, ([id, nome]) => {
      const nomeFormatado = nome.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      return { id, nome: nomeFormatado };
    }).sort((a,b) => a.nome.localeCompare(b.nome));


    // ─────────────────────────────────────────────────────────────────
    // REGRA 1: VISÃO GERAL
    // ─────────────────────────────────────────────────────────────────
    if (!this.filtroEntidade) {
      resultadosFiltrados.forEach(r => {
        if (r.valor_calculado !== null && r.valor_calculado !== undefined) {
          
          let tituloBD = mapaKpis.get(r.id_kpi)?.nome || r.id_kpi.replace(/^kpi_/i, '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); 
          let cor = 'highlight-gray';
          const idLower = r.id_kpi.toLowerCase();
          
          if (idLower.includes('aco') || idLower.includes('aço') || idLower.includes('steel')) cor = 'highlight-blue';
          else if (idLower.includes('log') || idLower.includes('transp') || idLower.includes('combustivel')) cor = 'highlight-green';
          else if (idLower.includes('scope1') || idLower.includes('scope_1')) cor = 'highlight-gray';
          else if (idLower.includes('scope3') || idLower.includes('scope_3')) cor = 'highlight-red';

          const contextoTarget = this.avaliarMetaESG(r.id_kpi, r.valor_calculado);

          this.kpisDinamicos.push({
            idReferencia: r.id_kpi, 
            meta: 'RESULTADO OFICIAL (BD)',
            titulo: tituloBD,
            valor: parseFloat(r.valor_calculado.toFixed(3)),
            unidade: r.id_unidade || mapaKpis.get(r.id_kpi)?.id_unidade_resultado?.simbolo || '',
            cor: cor,
            estado: r.estado_validacao || 'VALIDADO',
            data: r.data_calculo || r.createdAt,
            contexto: contextoTarget 
          });
        }
      });

      if (this.filtroDestaque) {
        const idx = this.kpisDinamicos.findIndex(k => k.idReferencia === this.filtroDestaque);
        if (idx > -1) {
          const cardDestacado = this.kpisDinamicos.splice(idx, 1)[0]; 
          cardDestacado.meta = '⭐ DESTAQUE ESCOLHIDO';
          this.kpisDinamicos.unshift(cardDestacado); 
        }
      }
    } 
    // ─────────────────────────────────────────────────────────────────
    // REGRA 2: VISÃO ENTIDADE ESPECÍFICA
    // ─────────────────────────────────────────────────────────────────
    else {
      const isMetalogalva = this.filtroEntidade === 'ent_metalogalva';
      const metaTag = isMetalogalva ? 'OPERAÇÃO INTERNA (BRUTO)' : 'FORNECEDOR (BRUTO)';
      const nomeFornecedor = mapaEntidades.get(this.filtroEntidade)?.nome?.toLowerCase() || '';

      let emissoes = 0, peso = 0, energia = 0;
      let valorDestaque = 0;
      let unidadeDestaque = '';

      dadosFiltrados.forEach(d => {
        const unidade = (d.id_unidade_base_esperada || d.id_unidade_original || '').toLowerCase();
        const metrica = (d.id_metrica || '').toLowerCase();
        const v = d.valor_convertido_base || d.valor || 0;

        if (this.filtroDestaque && d.id_metrica === this.filtroDestaque) {
          valorDestaque += v;
          unidadeDestaque = unidade;
        }

        if (unidade.includes('co2') || metrica.includes('emissao')) emissoes += v;
        else if (unidade === 'ton' || unidade === 'kg') peso += (unidade === 'kg' ? v / 1000 : v);
        else if (unidade === 'kwh' || metrica.includes('energia') || metrica.includes('eletric')) energia += v;
      });

      let contextoFornecedor = null;
      let racio = 0;

      if (peso > 0 && emissoes > 0) {
        racio = emissoes / peso;
        if (nomeFornecedor.includes('arcelor') || nomeFornecedor.includes('aco')) contextoFornecedor = this.avaliarMetaESG('meta_fornecedor_aco', racio);
        if (nomeFornecedor.includes('transmaia') || nomeFornecedor.includes('logistica')) contextoFornecedor = this.avaliarMetaESG('meta_fornecedor_logistica', racio);
      }

      this.kpisDinamicos.push({
        meta: metaTag, titulo: 'Intensidade Específica', valor: parseFloat(racio.toFixed(3)),
        unidade: 'tCO₂e / ton', cor: 'highlight-blue',
        estado: 'CÁLCULO DINÂMICO', data: new Date().toISOString(),
        contexto: contextoFornecedor
      });

      this.kpisDinamicos.push({
        meta: metaTag, titulo: 'Emissões Totais Extraídas', valor: parseFloat(emissoes.toFixed(2)),
        unidade: 'tCO₂e', cor: isMetalogalva ? 'highlight-gray' : 'highlight-red',
        estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString(),
        contexto: isMetalogalva ? this.avaliarMetaESG('meta_fornecedor_scope_1', emissoes) : null
      });

      this.kpisDinamicos.push({
        meta: metaTag, titulo: 'Volume de Mercadoria', valor: parseFloat(peso.toFixed(2)),
        unidade: 'ton', cor: 'highlight-blue',
        estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
      });

      this.kpisDinamicos.push({
        meta: metaTag, titulo: 'Consumo Energético', valor: parseFloat(energia.toFixed(2)),
        unidade: 'kWh', cor: 'highlight-green',
        estado: 'SOMATÓRIO DE FATURAS', data: new Date().toISOString()
      });

      if (this.filtroDestaque) {
        let nomeDestaque = mapaMetricas.get(this.filtroDestaque)?.nome || this.filtroDestaque;
        nomeDestaque = nomeDestaque.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

        this.kpisDinamicos.unshift({
          meta: '⭐ DESTAQUE ESCOLHIDO', 
          titulo: nomeDestaque, 
          valor: parseFloat(valorDestaque.toFixed(2)),
          unidade: unidadeDestaque, 
          cor: 'highlight-blue',
          estado: 'SELEÇÃO DO UTILIZADOR', 
          data: new Date().toISOString()
        });
      }
    }

    // 🚀 VASSOURA DE SEGURANÇA GLOBAL: ELIMINA TODOS OS CARTÕES COM VALOR 0 OU INFERIOR
    this.kpisDinamicos = this.kpisDinamicos.filter(kpi => kpi.valor > 0);

    // ─────────────────────────────────────────────────────────────────
    // GRÁFICOS E TABELAS
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

      if (unidade === 'tCO2e' || metricaId.includes('co2') || metricaId.includes('emissao')) {
        const valor = d.valor_convertido_base || d.valor || 0;
        if (d.id_entidade === 'ent_metalogalva' || d.origem?.toUpperCase() === 'INTERNO') scope1 += valor;
        else scope3 += valor;
      }
    });

    this.donutChartData.datasets[0].data = [parseFloat(scope1.toFixed(3)), parseFloat(scope3.toFixed(3))];
    this.donutChartData = { ...this.donutChartData };

    this.tabelaRastreabilidade = resultadosFiltrados
      .filter(r => r.valor_calculado && r.valor_calculado > 0)
      .map(r => {
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