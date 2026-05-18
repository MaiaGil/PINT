import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-materia-prima',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materia-prima.html',
  styleUrls: ['./materia-prima.css']
})
export class MateriaPrimaComponent implements OnInit {
  materiasPrimas: any[] = [];
  tiposMaterial: any[] = [];

  idTipoMaterialSelecionado: string = '';

  novaMateria = {
    quantidade_kg: 0,
    conteudo_reciclado_pct: 0,
    intensidade_carbonica: 0,
    processo_producao: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carrega a lista de matérias-primas já registadas
    this.apiService.getMateriasPrimas().subscribe({
      next: (dados: any[]) => this.materiasPrimas = dados,
      error: (err: any) => console.error('Erro ao carregar matérias-primas:', err)
    });

    // Carrega os tipos de material para o select/dropdown
    this.apiService.getTiposMaterial().subscribe({
      next: (dados: any[]) => this.tiposMaterial = dados,
      error: (err: any) => console.error('Erro ao carregar tipos de material:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.idTipoMaterialSelecionado) {
      alert('Por favor, seleciona um Tipo de Material!');
      return;
    }

    this.apiService.createMateriaPrima(this.idTipoMaterialSelecionado, this.novaMateria).subscribe({
      next: () => {
        this.carregarDados(); // Atualiza a tabela
        this.novaMateria = { quantidade_kg: 0, conteudo_reciclado_pct: 0, intensidade_carbonica: 0, processo_producao: '' };
        this.idTipoMaterialSelecionado = '';
        alert('Matéria-Prima registada com sucesso!');
      },
      error: (err: any) => alert('Erro ao registar matéria-prima: ' + err.message)
    });
  }
}