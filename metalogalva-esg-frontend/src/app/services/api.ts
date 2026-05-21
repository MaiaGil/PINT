import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ApiService {

	private apiUrl = 'http://localhost:3000/api';

	constructor(private http: HttpClient) {}

	extrairDocumentoIA(textoDocumento: string): Observable<any> {
		return this.http.post(
			`${this.apiUrl}/ia/extrair`,
			{ texto_documento: textoDocumento }
		);
	}

	uploadDocumentoIA(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);

		return this.http.post(
			`${this.apiUrl}/ia/extrair-ficheiro`,
			formData
		);
	}

	uploadDocumentoIAComProgresso(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);

		return this.http.post(
			`${this.apiUrl}/ia/extrair-ficheiro`,
			formData,
			{
				reportProgress: true,
				observe: 'events'
			}
		).pipe(
			map((event: HttpEvent<any>) => {

				switch (event.type) {

					case HttpEventType.UploadProgress:
						return {
							tipo: 'progresso',
							progresso: event.total
								? Math.round((100 * event.loaded) / event.total)
								: 0
						};

					case HttpEventType.Response:
						return {
							tipo: 'resposta',
							body: event.body
						};

					default:
						return { tipo: 'outro' };
				}
			}),

			catchError((err) => {
				return of({
					tipo: 'erro',
					erro: err
				});
			})
		);
	}

	obterDados(): Observable<any> {
		return this.http.get(`${this.apiUrl}/dados`);
	}

	obterResultadosKPI(): Observable<any> {
		return this.http.get(`${this.apiUrl}/resultados-kpi`);
	}

	obterDocumentos(): Observable<any> {
		return this.http.get(`${this.apiUrl}/documentos`);
	}

	obterEntidades(): Observable<any> {
		return this.http.get(`${this.apiUrl}/entidades`);
	}

	obterPeriodos(): Observable<any> {
		return this.http.get(`${this.apiUrl}/periodos`);
	}

	downloadInboundJson(idDocumento: string): Observable<Blob> {
		return this.http.get(
			`${this.apiUrl}/ia/download-inbound/${idDocumento}`,
			{ responseType: 'blob' }
		);
	}

	eliminarDocumento(idDocumento: string): Observable<any> {
		return this.http.delete(`${this.apiUrl}/documentos/${idDocumento}`);
	}
}