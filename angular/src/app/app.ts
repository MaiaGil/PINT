import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService } from './services/api';

// Importação dos componentes
import { EntidadeComponent } from './components/entidade/entidade';
import { RelatorioComponent } from './components/relatorio/relatorio';
import { EmissaoCarbonoComponent } from './components/emissao-carbono/emissao-carbono';
import { EnergiaConsumoComponent } from './components/energia-consumo/energia-consumo';
import { EnergiaMixComponent } from './components/energia-mix/energia-mix';
import { TransporteComponent } from './components/transporte/transporte';
import { PeriodoComponent } from './components/periodo/periodo';
import { TipoMaterialComponent } from './components/tipo-material/tipo-material';
import { MateriaPrimaComponent } from './components/materia-prima/materia-prima';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    EntidadeComponent, PeriodoComponent, TipoMaterialComponent,
    MateriaPrimaComponent, RelatorioComponent, EmissaoCarbonoComponent,
    EnergiaConsumoComponent, EnergiaMixComponent, TransporteComponent
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
    tiposMaterial: 0,
    materiasPrimas: 0,
    relatorios: 0,
    emissoes: 0,
    consumosEnergia: 0,
    mixEnergia: 0,
    transportes: 0
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

  // SOLUÇÃO CENTRALIZADA: Altera apenas esta função no teu projeto!
  mudarSeccao(seccao: string): void {
    this.seccaoAtiva = seccao;
    
    if (isPlatformBrowser(this.platformId)) {
      // Sempre que o utilizador navega (entra numa tabela ou volta ao menu), 
      // o sistema força um refresh global aos dados e aos contadores na hora.
      this.carregarMetricasDashboard();
      
      // Força o Angular a redesenhar a árvore de componentes inteira
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
      next: (d) => { this.totais.entidades = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getPeriodos().subscribe({
      next: (d) => { this.totais.periodos = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getTiposMaterial().subscribe({
      next: (d) => { this.totais.tiposMaterial = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getMateriasPrimas().subscribe({
      next: (d) => { this.totais.materiasPrimas = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getRelatorios().subscribe({
      next: (d) => { this.totais.relatorios = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getEmissoes().subscribe({
      next: (d) => { this.totais.emissoes = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getConsumosEnergia().subscribe({
      next: (d) => { this.totais.consumosEnergia = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getEnergiaMix().subscribe({
      next: (d) => { this.totais.mixEnergia = contarItens(d); this.cdr.detectChanges(); }
    });

    this.apiService.getTransportes().subscribe({
      next: (d) => { this.totais.transportes = contarItens(d); this.cdr.detectChanges(); }
    });
  }
}