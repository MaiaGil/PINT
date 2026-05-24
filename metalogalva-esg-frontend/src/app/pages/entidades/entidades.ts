import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-entidades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entidades.html',
  styleUrls: ['./entidades.css']
})
export class EntidadesComponent implements OnInit {

  listaEntidades: any[] = [];
  aCarregar: boolean = true;
  erroMsg: string = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregarDadosGerais();
  }

  carregarDadosGerais(): void {
    this.aCarregar = true;
    
    // 🚀 Carrega as entidades e os dados em simultâneo para verificar relacionamentos
    forkJoin({
      entidades: this.api.obterEntidades(),
      dados: this.api.obterDados() // Os dados extraídos da IA têm sempre o id_entidade
    }).subscribe({
      next: (res: any) => {
        const todasEntidades = res.entidades?.dados || [];
        const todosDados = res.dados?.dados || [];

        // Mapeia cada entidade e calcula se ela está presa a algum dado/documento
        this.listaEntidades = todasEntidades.map((ent: any) => {
          
          // Filtra quantos dados (linhas de faturas/relatórios) existem para esta entidade
          const dadosRelacionados = todosDados.filter((d: any) => d.id_entidade === ent.id_entidade);
          const qtdDados = dadosRelacionados.length;
          const temRelacionamentos = qtdDados > 0;
          
          // Bloqueia se for a Metalogalva OU se tiver faturas/dados associados
          const bloqueado = ent.id_entidade === 'ent_metalogalva' || temRelacionamentos;
          
          // Cria a mensagem de contexto para a Tooltip (hover)
          let motivoBloqueio = '';
          if (ent.id_entidade === 'ent_metalogalva') {
            motivoBloqueio = '⚠️ Protegido: Entidade raiz do sistema.';
          } else if (temRelacionamentos) {
            motivoBloqueio = `🔒 Bloqueado: Esta entidade tem ${qtdDados} registo(s) extraído(s) associado(s).`;
          } else {
            motivoBloqueio = 'Apagar Entidade (Sem dados associados)';
          }

          return {
            ...ent,
            qtdDados: qtdDados,
            bloqueado: bloqueado,
            motivoBloqueio: motivoBloqueio
          };
        });

        this.aCarregar = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar dados:', err);
        this.erroMsg = 'Não foi possível carregar as informações da base de dados.';
        this.aCarregar = false;
      }
    });
  }

  apagarEntidade(idEntidade: string, nomeEntidade: string): void {
    // Salvaguarda final: O botão já está desativado no HTML, mas garantimos também no JS
    const entidadeAlvo = this.listaEntidades.find(e => e.id_entidade === idEntidade);
    if (entidadeAlvo?.bloqueado) return;

    const confirmacao = window.confirm(`Tens a certeza que pretendes apagar o fornecedor "${nomeEntidade}"? Como não tem dados associados, será removido definitivamente.`);
    
    if (confirmacao) {
      this.api.eliminarEntidade(idEntidade).subscribe({
        next: () => {
          // Remove visualmente a entidade da lista de forma instantânea
          this.listaEntidades = this.listaEntidades.filter(ent => ent.id_entidade !== idEntidade);
          console.log(`Entidade ${idEntidade} eliminada com sucesso.`);
        },
        error: (err: any) => {
          console.error('Erro ao apagar entidade:', err);
          alert('Ocorreu um erro no servidor ao tentar apagar esta entidade.');
        }
      });
    }
  }
}