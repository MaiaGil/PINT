import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// 1. Caminho para o teu serviço (Confirmado na pasta services)
import { ApiService } from './services/api';

// 2. Importação APENAS dos dois componentes confirmados na imagem do teu VS Code
import { IaExtracaoComponent } from './components/ia-extracao/ia-extracao';
import { DashboardEsgComponent } from './components/dashboard/dashboard.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    IaExtracaoComponent,
    DashboardEsgComponent // Os únicos dois componentes ativos na árvore atual
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  title = 'PINT';
  seccaoAtiva: string = 'dashboard';

  totais = {
    entidades: 0,
    periodos: 0,
    documentos: 0,
    dadosESG: 0
  };

  constructor(
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarMetricasDashboard();
    }
  }

  mudarSeccao(seccao: string): void {
    this.seccaoAtiva = seccao;
    
    if (isPlatformBrowser(this.platformId)) {
      this.carregarMetricasDashboard();
      this.cdr.detectChanges();
    }
  }

  carregarMetricasDashboard(): void {
    const contarItens = (dados: any): number => {
      if (!dados) return 0;
      if (Array.isArray(dados)) return dados.length;
      if (dados.dados && Array.isArray(dados.dados)) return dados.dados.length;
      if (dados.data && Array.isArray(dados.data)) return dados.data.length;
      return 0;
    };

    this.apiService.getEntidades().subscribe({
      next: (d: any) => { this.totais.entidades = contarItens(d); this.cdr.detectChanges(); },
      error: (err: any) => console.error('Erro ao ler entidades:', err)
    });

    this.apiService.getPeriodos().subscribe({
      next: (d: any) => { this.totais.periodos = contarItens(d); this.cdr.detectChanges(); },
      error: (err: any) => console.error('Erro ao ler períodos:', err)
    });

    this.apiService.getDocumentos().subscribe({
      next: (d: any) => { this.totais.documentos = contarItens(d); this.cdr.detectChanges(); },
      error: (err: any) => console.error('Erro ao ler documentos:', err)
    });

    this.apiService.getDadosESG().subscribe({
      next: (d: any) => { this.totais.dadosESG = contarItens(d); this.cdr.detectChanges(); },
      error: (err: any) => console.error('Erro ao ler dados ESG:', err)
    });
  }
}