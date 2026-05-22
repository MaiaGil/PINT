import { Routes } from '@angular/router';
import { ExtracaoIaComponent } from './pages/extracao-ia/extracao-ia'; 
import { DashboardComponent } from './pages/dashboard/dashboard'; 
import { GestaoKpisComponent } from './pages/gestao-kpis/gestao-kpis'; 
import { GestaoMetricasComponent } from './pages/gestao-metricas/gestao-metricas'; 
import { GestaoUnidadesComponent } from './pages/gestao-unidades/gestao-unidades';
import { GestaoDadosComponent } from './pages/gestao-dados/gestao-dados'; 
import { ExportarOutboundComponent } from './pages/exportar-outbound/exportar-outbound';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'extracao', component: ExtracaoIaComponent },
  { path: 'kpis', component: GestaoKpisComponent },
  { path: 'metricas', component: GestaoMetricasComponent },
  { path: 'dados', component: GestaoDadosComponent },
  { path: 'unidades', component: GestaoUnidadesComponent },
  { path: 'outbound', component: ExportarOutboundComponent },
];