import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio.html',
  styleUrls: ['./relatorio.css']
})
export class RelatorioComponent implements OnInit {
  relatorios: any[] = [];
  entidades: any[] = [];
  periodos: any[] = [];

  idEntidadeSelecionada: string = '';
  idPeriodoSelecionado: string = '';

  novoRelatorio = {
    versao_esquema: ''
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carregarTodosOsDados();
  }

  carregarTodosOsDados(): void {
    // 1. Procura os relatórios criados
    this.apiService.getRelatorios().subscribe({
      next: (dados) => {
        this.relatorios = dados;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao ir buscar relatórios:', err)
    });

    // 2. Procura as entidades para preencher a dropdown do formulário
    this.apiService.getEntidades().subscribe({
      next: (dados) => {
        this.entidades = dados;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao ir buscar entidades:', err)
    });

    // 3. Procura os períodos para preencher a dropdown do formulário
    this.apiService.getPeriodos().subscribe({
      next: (dados) => {
        this.periodos = dados;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao ir buscar períodos:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.idEntidadeSelecionada || !this.idPeriodoSelecionado || !this.novoRelatorio.versao_esquema) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    this.apiService.createRelatorio(this.idEntidadeSelecionada, this.idPeriodoSelecionado, this.novoRelatorio).subscribe({
      next: () => {
        this.idEntidadeSelecionada = '';
        this.idPeriodoSelecionado = '';
        this.novoRelatorio = { versao_esquema: '' };
        alert('Relatório guardado com sucesso! Faça F5 para atualizar a lista.');
      },
      error: (err) => alert('Erro ao criar relatório: ' + err.message)
    });
  }
}