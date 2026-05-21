import { Routes } from '@angular/router';
import { ExtracaoIaComponent } from './pages/extracao-ia/extracao-ia'; 
import { DashboardComponent } from './pages/dashboard/dashboard'; 

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'extracao', component: ExtracaoIaComponent }
];