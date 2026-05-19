import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-tipo-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-material.html',
  styleUrls: ['./tipo-material.css']
})
export class TipoMaterialComponent implements OnInit {
  // CORREÇÃO: Alterado o nome para 'tipos' para bater certo com o teu *ngFor do HTML
  tipos: any[] = [];
  
  novoTipo = {
    nome: '',
    unidade: '',
    categoria: ''
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.carregarTiposMaterial();
    }, 0);
  }

  carregarTiposMaterial(): void {
    this.apiService.getTiposMaterial().subscribe({
      next: (dados: any[]) => {
        this.tipos = dados; // Atualizado para a variável correta
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar tipos de material:', err)
    });
  }

  // CORREÇÃO: Alterado o nome para 'submeter()' para condizer com o (ngSubmit) do HTML
  submeter(): void {
    if (!this.novoTipo.nome || !this.novoTipo.unidade || !this.novoTipo.categoria) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    this.apiService.createTipoMaterial(this.novoTipo).subscribe({
      next: () => {
        this.carregarTiposMaterial();
        this.novoTipo = { nome: '', unidade: '', categoria: '' };
        alert('Tipo de material criado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar: ' + err.message)
    });
  }
}