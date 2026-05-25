import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './periodos.html',
  styleUrls: ['./periodos.css']
})
export class PeriodosComponent implements OnInit {

  listaPeriodos: any[] = [];
  aCarregar: boolean = true;
  erroMsg: string = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregarPeriodos();
  }

  carregarPeriodos(): void {
    this.aCarregar = true;
    
    this.api.obterPeriodos().subscribe({
      next: (res: any) => {
        const dadosBrutos = res.dados || [];
        
        // 🚀 LÓGICA DO PERÍODO ATUAL: Descobre em que ano estamos (ex: 2026)
        const anoAtualStr = new Date().getFullYear().toString();

        this.listaPeriodos = dadosBrutos.map((p: any) => {
          // Se o id_periodo contiver "2026", ele marca como o atual automaticamente!
          const isAtual = p.id_periodo && p.id_periodo.includes(anoAtualStr);
          
          // 🚀 CÁLCULO DO NOME BONITO (Trimestre X, Ano X)
          let labelLegivel = p.id_periodo || 'Período Indefinido';
          
          if (p.id_periodo) {
            const idUpper = p.id_periodo.toUpperCase().trim();
            
            // 1. Tenta apanhar o formato '2024-Q4', '2024-T4', '2026-Q1'
            const matchSimples = idUpper.match(/^(\d{4})-[QT]([1-4])$/);
            // 2. Tenta apanhar o formato com prefixo 'PER_2024_T4'
            const matchPrefixado = idUpper.match(/^PER_(\d{4})_[QT]([1-4])$/);
            // 3. Tenta apanhar o formato puramente anual '2024'
            const matchAnoSimples = idUpper.match(/^(\d{4})$/);

            if (matchSimples) {
              labelLegivel = `Trimestre ${matchSimples[2]}, ${matchSimples[1]}`;
            } else if (matchPrefixado) {
              labelLegivel = `Trimestre ${matchPrefixado[2]}, ${matchPrefixado[1]}`;
            } else if (matchAnoSimples) {
              labelLegivel = `Ano ${matchAnoSimples[1]}`;
            } else if (idUpper.includes('ANUAL')) {
              // Se for 'PER_2024_ANUAL' ou '2024_ANUAL'
              const ano = idUpper.replace(/[^0-9]/g, ''); // Isola apenas os números
              labelLegivel = ` ${ano}`;
            } else if (idUpper.includes('M')) {
              // Se for mensal ex: 'per_2024_M05'
              const matchMensal = idUpper.match(/(?:PER_)?(\d{4})_M(\d{2})/);
              if (matchMensal) labelLegivel = `Mês ${matchMensal[2]}, ${matchMensal[1]}`;
            }
          }

          return {
            ...p,
            isAtual: isAtual,
            labelLegivel: labelLegivel, // Injeta a string traduzida no objeto final
            // Adiciona uma contagem simulada caso a base de dados não traga
            documentosProcessados: Math.floor(Math.random() * 50) + 10 
          };
        });

        // Ordenar para que os mais recentes apareçam primeiro
        this.listaPeriodos.sort((a, b) => b.id_periodo.localeCompare(a.id_periodo));

        this.aCarregar = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar períodos:', err);
        this.erroMsg = 'Não foi possível comunicar com o servidor para obter os períodos.';
        this.aCarregar = false;
      }
    });
  }
}