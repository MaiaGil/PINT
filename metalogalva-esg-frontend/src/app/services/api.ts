import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ApiService {

	private apiUrl = 'http://localhost:3000/api';

	constructor(private http: HttpClient) {}

	// ── Fornecedor ────────────────────────────────────────

	extrairDocumentoIA(textoDocumento: string): Observable<any> {
		return this.http.post(
			`${this.apiUrl}/ia/extrair`,
			{ texto_documento: textoDocumento }
		);
	}

	uploadDocumentoIA(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);
		return this.http.post(`${this.apiUrl}/ia/extrair-ficheiro`, formData);
	}

	uploadDocumentoIAComProgresso(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);

		return this.http.post(
			`${this.apiUrl}/ia/extrair-ficheiro`,
			formData,
			{ reportProgress: true, observe: 'events' }
		).pipe(
			map((event: HttpEvent<any>) => {
				if (event.type === HttpEventType.UploadProgress) {
					return {
						tipo: 'progresso',
						progresso: event.total
							? Math.round((100 * event.loaded) / event.total)
							: 0
					};
				}
				if (event.type === HttpEventType.Response) {
					return { tipo: 'resposta', body: event.body };
				}
				return { tipo: 'outro', event };
			}),
			catchError((err) => of({ tipo: 'erro', erro: err }))
		);
	}

	// ── Empresa (Metalogalva) ─────────────────────────────

	extrairDocumentoIAEmpresa(textoDocumento: string): Observable<any> {
		return this.http.post(
			`${this.apiUrl}/ia/empresa/extrair`,
			{ texto_documento: textoDocumento }
		);
	}

	uploadDocumentoIAEmpresa(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);
		return this.http.post(`${this.apiUrl}/ia/empresa/extrair-ficheiro`, formData);
	}

	uploadDocumentoIAEmpresaComProgresso(ficheiro: File): Observable<any> {
		const formData = new FormData();
		formData.append('ficheiro', ficheiro);

		return this.http.post(
			`${this.apiUrl}/ia/empresa/extrair-ficheiro`,
			formData,
			{ reportProgress: true, observe: 'events' }
		).pipe(
			map((event: HttpEvent<any>) => {
				if (event.type === HttpEventType.UploadProgress) {
					return {
						tipo: 'progresso',
						progresso: event.total
							? Math.round((100 * event.loaded) / event.total)
							: 0
					};
				}
				if (event.type === HttpEventType.Response) {
					return { tipo: 'resposta', body: event.body };
				}
				return { tipo: 'outro', event };
			}),
			catchError((err) => of({ tipo: 'erro', erro: err }))
		);
	}

	// ── Dados / KPI / Meta ────────────────────────────────

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

	// ── KPIs ──────────────────────────────────────────────

	obterKPIs(): Observable<any> {
		return this.http.get(`${this.apiUrl}/kpis`);
	}

	obterKPIEnums(): Observable<any> {
		return this.http.get(`${this.apiUrl}/kpis/enums`);
	}

	criarKPI(kpi: any): Observable<any> {
		return this.http.post(`${this.apiUrl}/kpis`, kpi);
	}

	atualizarKPI(idKpi: string, kpi: any): Observable<any> {
		return this.http.put(`${this.apiUrl}/kpis/${idKpi}`, kpi);
	}

	eliminarKPI(idKpi: string): Observable<any> {
		return this.http.delete(`${this.apiUrl}/kpis/${idKpi}`);
	}

	// ── Unidades de Medida ────────────────────────────────

	obterUnidades(tipoUnidade?: string): Observable<any> {
		const url = tipoUnidade
			? `${this.apiUrl}/unidades-medida?tipo_unidade=${tipoUnidade}`
			: `${this.apiUrl}/unidades-medida`;
		return this.http.get(url);
	}

	obterUnidadePorId(idUnidade: string): Observable<any> {
		return this.http.get(`${this.apiUrl}/unidades-medida/${idUnidade}`);
	}

	criarUnidade(unidade: any): Observable<any> {
		return this.http.post(`${this.apiUrl}/unidades-medida`, unidade);
	}

	atualizarUnidade(idUnidade: string, unidade: any): Observable<any> {
		return this.http.put(`${this.apiUrl}/unidades-medida/${idUnidade}`, unidade);
	}

	eliminarUnidade(idUnidade: string): Observable<any> {
		return this.http.delete(`${this.apiUrl}/unidades-medida/${idUnidade}`);
	}

	// ── Métricas ──────────────────────────────────────────

	obterMetricas(): Observable<any> {
		return this.http.get(`${this.apiUrl}/metricas`);
	}

	obterMetricaEnums(): Observable<any> {
		return this.http.get(`${this.apiUrl}/metricas/enums`);
	}

	criarMetrica(metrica: any): Observable<any> {
		return this.http.post(`${this.apiUrl}/metricas`, metrica);
	}

	atualizarMetrica(idMetrica: string, metrica: any): Observable<any> {
		return this.http.put(`${this.apiUrl}/metricas/${idMetrica}`, metrica);
	}

	eliminarMetrica(idMetrica: string): Observable<any> {
		return this.http.delete(`${this.apiUrl}/metricas/${idMetrica}`);
	}

	atualizarDado(idDado: string, dado: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/dados/${idDado}`, dado);
    }

    eliminarDado(idDado: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/dados/${idDado}`);
    }

	obterOutboundPorPeriodo(idPeriodo: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/exportar/outbound/${idPeriodo}`);
    }
}