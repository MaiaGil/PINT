import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Essencial para o modo de edição (ngModel)
import { ApiService } from '../../services/api';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documentos.html',
  styleUrls: ['./documentos.css']
})
export class DocumentosComponent implements OnInit {

  listaDocumentos: any[] = [];
  mapaEntidades = new Map<string, string>();
  
  aCarregar: boolean = true;
  erroMsg: string = '';

  // 🚀 Variável de Controlo de Edição (Guarda o clone do documento que estamos a editar)
  docEmEdicao: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.aCarregar = true;
    
    // Carrega documentos e entidades em paralelo
    forkJoin({
      docs: this.api.obterDocumentos(),
      ents: this.api.obterEntidades()
    }).subscribe({
      next: (res: any) => {
        const entidades = res.ents?.dados || [];
        // Cria um dicionário Rápido (ID -> Nome)
        entidades.forEach((e: any) => this.mapaEntidades.set(e.id_entidade, e.nome));

        // Formata os documentos adicionando o Nome do Emissor
        const documentosBrutos = res.docs?.dados || [];
        this.listaDocumentos = documentosBrutos.map((doc: any) => ({
          ...doc,
          nome_emissor: this.mapaEntidades.get(doc.id_entidade) || 'Entidade Desconhecida'
        }));

        this.aCarregar = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar dados:', err);
        this.erroMsg = 'Não foi possível comunicar com o servidor.';
        this.aCarregar = false;
      }
    });
  }

  // --- MOTOR DE EDIÇÃO ---

  iniciarEdicao(doc: any): void {
    // 🛡️ IMUTABILIDADE: Cria um clone exato do documento.
    // Assim, se o utilizador alterar o texto e clicar em "Cancelar", a tabela original não sofre danos!
    this.docEmEdicao = { ...doc };
    
    // Faz scroll automático para o topo onde está o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicao(): void {
    this.docEmEdicao = null; // Fecha o painel
  }

  guardarEdicao(): void {
    if (!this.docEmEdicao) return;

    // Prepara o pacote de dados a enviar para o Node.js
    const payload = {
      numero_documento: this.docEmEdicao.numero_documento,
      tipo_documento: this.docEmEdicao.tipo_documento,
      estado: this.docEmEdicao.estado
    };

    this.api.atualizarDocumento(this.docEmEdicao.id_documento, payload).subscribe({
      next: () => {
        // Atualiza a tabela na interface sem precisar de ir à Base de Dados de novo
        const index = this.listaDocumentos.findIndex(d => d.id_documento === this.docEmEdicao.id_documento);
        if (index !== -1) {
          // Atualiza apenas a linha correspondente com os novos dados
          this.listaDocumentos[index] = { ...this.listaDocumentos[index], ...payload };
        }
        
        console.log('Documento atualizado com sucesso!');
        this.docEmEdicao = null; // Fecha o painel
      },
      error: (err: any) => {
        console.error('Erro na atualização:', err);
        alert('Erro ao guardar as alterações no servidor.');
      }
    });
  }

  // --- MOTOR DE ELIMINAÇÃO ---

  apagarDocumento(idDocumento: string, numFatura: string): void {
    const confirmacao = window.confirm(`Tens a certeza que queres eliminar o documento "${numFatura}"? Esta ação vai apagar os dados calculados associados a ele.`);
    
    if (confirmacao) {
      this.api.eliminarDocumento(idDocumento).subscribe({
        next: () => {
          // Remove da tabela instantaneamente
          this.listaDocumentos = this.listaDocumentos.filter(d => d.id_documento !== idDocumento);
        },
        error: (err: any) => {
          console.error('Erro ao eliminar:', err);
          alert('Erro ao tentar apagar o documento.');
        }
      });
    }
  }
}