import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IEntidade, IPeriodo, IDocumento, IDado, ApiResponse } from '../models/esg.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getEntidades(): Observable<ApiResponse<IEntidade[]>> {
    return this.http.get<ApiResponse<IEntidade[]>>(`${this.apiUrl}/entidades`);
  }

  getPeriodos(): Observable<ApiResponse<IPeriodo[]>> {
    return this.http.get<ApiResponse<IPeriodo[]>>(`${this.apiUrl}/periodos`);
  }

  getDocumentos(): Observable<ApiResponse<IDocumento[]>> {
    return this.http.get<ApiResponse<IDocumento[]>>(`${this.apiUrl}/documentos`);
  }

  getDadosESG(): Observable<ApiResponse<IDado[]>> {
    return this.http.get<ApiResponse<IDado[]>>(`${this.apiUrl}/dados`);
  }
}