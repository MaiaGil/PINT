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
    
    // 🚀 Adicionamos 'kpis' ao forkJoin para termos acesso às fórmulas oficiais
    forkJoin({
      resultados: this.api.obterResultadosKPI(),
      entidades: this.api.obterEntidades(),
      dados: this.api.obterDados(),
      kpis: this.api.obterKPIs()
    }).subscribe({
      next: (res: any) => {
        const entidades = res.entidades?.dados || [];
        const resultadosBrutos = res.resultados?.dados || [];
        const todosDados = res.dados?.dados || [];
        const todosKpis = res.kpis?.dados || [];
        
        const mapaEntidades = new Map<string, string>();
        entidades.forEach((e: any) => mapaEntidades.set(e.id_entidade, e.nome));

        // Mapeamento de KPIs para busca rápida
        const mapaKpis = new Map<string, any>();
        todosKpis.forEach((k: any) => mapaKpis.set(k.id_kpi, k));

        this.listaResultados = resultadosBrutos.map((r: any) => {
          const kpiDefinicao = mapaKpis.get(r.id_kpi);
          
          let isErro = false;
          let mensagemErro = '';
          
          // 🚀 BUSCA DA FÓRMULA OFICIAL
          // O sistema agora prioriza a fórmula que está guardada no documento do KPI
          let contaFeita = kpiDefinicao ? kpiDefinicao.formula : 'Fórmula não definida';

          // 🛡️ Validação de Integridade (Se o KPI não existir ou faltarem dados)
          if (!kpiDefinicao) {
            isErro = true;
            mensagemErro = 'O KPI associado já não existe';
          } else {
            // Verifica se os dados (operandos) referenciados na fórmula ainda existem
            const dependencias = contaFeita.match(/dad_[a-fA-F0-9-]+/g) || [];
            // Altera esta linha dentro do teu método carregarResultados():
            if (dependencias.some((id: string) => !todosDados.some((d: any) => d.id_dado === id))) {
              isErro = true;
              mensagemErro = 'Dados não disponíveis na base de dados';
            }
          }

          return {
            ...r,
            nome_kpi: kpiDefinicao ? kpiDefinicao.nome : 'KPI Desconhecido',
            nome_entidade: mapaEntidades.get(r.id_entidade) || 'Global / Consolidado',
            conta_feita: contaFeita,
            tem_erro: isErro,
            mensagem_erro: mensagemErro
          };
        });

        this.listaResultados.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        this.aCarregar = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar resultados:', err);
        this.erroMsg = 'Não foi possível carregar os resultados calculados.';
        this.aCarregar = false;
      }
    });
  }
}