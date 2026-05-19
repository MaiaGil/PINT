import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) {}

  // ==========================================
  // 1. ENTIDADES
  // ==========================================
  getEntidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/entidades`);
  }
  createEntidade(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/entidades`, dados);
  }

  // ==========================================
  // 2. PERÍODOS
  // ==========================================
  getPeriodos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/periodos`);
  }
  createPeriodo(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/periodos`, dados);
  }

  // ==========================================
  // 3. TIPOS DE MATERIAL
  // ==========================================
  getTiposMaterial(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipos-material`);
  }
  createTipoMaterial(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tipos-material`, dados);
  }

  // ==========================================
  // 4. MATÉRIAS-PRIMAS
  // ==========================================
  getMateriasPrimas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/materias-primas`);
  }
  createMateriaPrima(idTipoMaterial: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tipos-material/${idTipoMaterial}/materias-primas`, dados);
  }

  // ==========================================
  // 5. RELATÓRIOS
  // ==========================================
  getRelatorios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/relatorios`);
  }
  createRelatorio(idEntidade: string, idPeriodo: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/entidades/${idEntidade}/periodos/${idPeriodo}/relatorios`, dados);
  }

  // ==========================================
  // 6. EMISSÕES DE CARBONO
  // ==========================================
  getEmissoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/emissoes`);
  }
  createEmissao(idRelatorio: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/relatorios/${idRelatorio}/emissoes`, dados);
  }

  // ==========================================
  // 7. ENERGIA CONSUMO
  // ==========================================
  getConsumosEnergia(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consumos-energia`);
  }
  createEnergiaConsumo(idRelatorio: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/relatorios/${idRelatorio}/consumos-energia`, dados);
  }

  // ==========================================
  // 8. ENERGIA MIX
  // ==========================================
  getEnergiaMix(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/energia-mix`);
  }
  createEnergiaMix(idEnergiaConsumo: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/consumos-energia/${idEnergiaConsumo}/energia-mix`, dados);
  }

  // ==========================================
  // 9. TRANSPORTES
  // ==========================================
  getTransportes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transportes`);
  }
  createTransporte(idRelatorio: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/relatorios/${idRelatorio}/transportes`, dados);
  }

  createConsumoEnergia(idRelatorio: string, dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/consumos-energia/${idRelatorio}`, dados);
  }
}