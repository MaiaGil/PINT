import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {

  listaResultados: any[] = [];
  aCarregar: boolean = true;
  erroMsg: string = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregarResultados();
  }

  carregarResultados(): void {
    this.aCarregar = true;
    
    // 🚀 ATUALIZAÇÃO: Carrega os resultados, entidades, dados brutos e definições de métricas em paralelo
    forkJoin({
      resultados: this.api.obterResultadosKPI(),
      entidades: this.api.obterEntidades(),
      dados: this.api.obterDados(),
      metricas: this.api.obterMetricas()
    }).subscribe({
      next: (res: any) => {
        const entidades = res.entidades?.dados || [];
        const resultadosBrutos = res.resultados?.dados || [];
        const todosDados = res.dados?.dados || [];
        const todasMetricas = res.metricas?.dados || [];
        
        // Mapeamento rápido de Entidades (ID -> Nome)
        const mapaEntidades = new Map<string, string>();
        entidades.forEach((e: any) => mapaEntidades.set(e.id_entidade, e.nome));

        // Mapeamento rápido de Definições de Métricas (ID -> Objeto da Métrica)
        const mapaMetricas = new Map<string, any>();
        todasMetricas.forEach((m: any) => mapaMetricas.set(m.id_metrica, m));

        this.listaResultados = resultadosBrutos.map((r: any) => {
          
          const kpiIdTratado = r.id_kpi ? r.id_kpi.toLowerCase().trim() : '';
          const nomeKpi = r.id_kpi ? r.id_kpi.replace(/^kpi_/i, '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'KPI Desconhecido';
          
          // 1. Vai buscar a fórmula guardada no teu snapshot da Base de Dados
          let contaFeita = r.snapshot_formula || '';
          
          // 2. Se a fórmula existir, vamos traduzir os UUIDs técnicos para nomes humanos
          if (contaFeita) {
            // Expressão regular que apanha o padrão 'dad_' seguido pelo código UUID v4
            const regexDado = /dad_[a-fA-F0-9-]+/g;
            
            contaFeita = contaFeita.replace(regexDado, (match: string) => {
              // Procura na lista de dados qual é o registo que tem este id_dado
              const dadoCorrespondente = todosDados.find((d: any) => d.id_dado === match);
              
              if (dadoCorrespondente) {
                // Se encontrou o dado, vai buscar a definição legível da métrica (ex: consumo_gasoleo_rodoviario)
                const metricaDef = mapaMetricas.get(dadoCorrespondente.id_metrica);
                const nomeCru = metricaDef?.nome || dadoCorrespondente.id_metrica;
                
                // Limpa os underscores e capitaliza o nome para apresentação
                return nomeCru.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              }
              
              // Caso o dado específico já não exista no sistema, limpa apenas o prefixo técnico
              return match.replace(/^dad_/i, 'Dado ').substring(0, 12);
            });
          } 
          // 3. Fallback de segurança caso tenhas registos antigos na BD sem a snapshot_formula preenchida
          else {
            const dicionarioFormulas: { [key: string]: string } = {
              'kpi_intensidade_de_emissoes_de_carbono_do_transporte': '( ∑ Emissões de Transporte ) ÷ ( ∑ Toneladas Transportadas )',
              'kpi_pegada_de_carbono_logistica_por_combustivel': '( ∑ Litros de Combustível ) × ( Fator de Emissão CO₂/L )',
              'kpi_intensidade_carbonica_do_aco': '( ∑ Emissões do Aço ) ÷ ( ∑ Toneladas de Aço Adquirido )',
              'kpi_emissoes_totais_scope_1': '∑ ( Emissões Diretas da Operação Metalogalva )',
              'kpi_emissoes_totais_scope_3': '∑ ( Emissões Indiretas da Cadeia de Valor / Fornecedores )'
            };
            contaFeita = dicionarioFormulas[kpiIdTratado] || '∑ ( Valores Base Extraídos e Convertidos )';
          }

          return {
            ...r,
            nome_kpi: nomeKpi,
            nome_entidade: mapaEntidades.get(r.id_entidade) || 'Global / Consolidado',
            conta_feita: contaFeita
          };
        });

        // Ordenação cronológica (Mais recentes primeiro)
        this.listaResultados.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        this.aCarregar = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar resultados:', err);
        this.erroMsg = 'Não foi possível carregar os resultados calculados da base de dados.';
        this.aCarregar = false;
      }
    });
  }
}