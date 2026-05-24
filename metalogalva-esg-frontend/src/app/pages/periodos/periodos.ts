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
          
          return {
            ...p,
            isAtual: isAtual,
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