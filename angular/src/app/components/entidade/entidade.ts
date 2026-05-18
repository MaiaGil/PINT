import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importa aqui
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-entidade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entidade.html',
  styleUrls: ['./entidade.css']
})
export class EntidadeComponent implements OnInit {
  entidades: any[] = [];
  
  novaEntidade = {
    nome: '',
    sede: '',
    nif: '',
    acesso_log: ''
  };

  // 2. Injeta o ChangeDetectorRef no construtor
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carregarEntidades();
  }

  carregarEntidades(): void {
    this.apiService.getEntidades().subscribe({
      next: (dados: any[]) => {
        this.entidades = dados;
        this.cdr.detectChanges(); // 3. Força o Angular a desenhar os dados na hora!
      },
      error: (err: any) => console.error('Erro ao carregar:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.novaEntidade.nome || !this.novaEntidade.sede || !this.novaEntidade.nif || !this.novaEntidade.acesso_log) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    this.apiService.createEntidade(this.novaEntidade).subscribe({
      next: () => {
        this.carregarEntidades();
        this.novaEntidade = { nome: '', sede: '', nif: '', acesso_log: '' };
        alert('Entidade criada com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar entidade: ' + err.message)
    });
  }
}