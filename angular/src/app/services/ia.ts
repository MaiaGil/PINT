import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) {}

  /**
   * Envia o texto bruto extraído de qualquer documento para ser 
   * processado pela OpenAI no backend e distribuído no MongoDB.
   */
  enviarParaExtraDocIA(texto: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ia/extrair`, { textoDocumento: texto });
  }
}