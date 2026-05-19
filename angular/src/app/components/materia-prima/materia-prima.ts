import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  // Arrays para preencher as listas e as dropdowns de seleção do teu HTML
  materiasPrimas: any[] = [];
  tiposMaterial: any[] = []; 
  relatorios: any[] = [];

  // Variável para armazenar o ID do tipo de material selecionado na dropdown
  idTipoMaterialSelecionado: string = ''; 

  // Objeto estruturado com os nomes exatos que o teu HTML está a mapear no [(ngModel)]
  novaMateria = {
    id_relatorio: '',
    nome: '',
    quantidade_kg: null,
    conteudo_reciclado_pct: null,
    intensidade_carbonica: null,
    processo_producao: ''
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Carregamento assíncrono seguro contra o erro NG0100
    setTimeout(() => {
      this.carregarMateriasPrimas();
      this.carregarTiposMaterial();
      this.carregarRelatoriosAuxiliares();
    }, 0);
  }

  carregarMateriasPrimas(): void {
    this.apiService.getMateriasPrimas().subscribe({
      next: (dados: any[]) => {
        this.materiasPrimas = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar matérias-primas:', err)
    });
  }

  carregarTiposMaterial(): void {
    this.apiService.getTiposMaterial().subscribe({
      next: (dados: any[]) => {
        this.tiposMaterial = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar tipos de material:', err)
    });
  }

  carregarRelatoriosAuxiliares(): void {
    this.apiService.getRelatorios().subscribe({
      next: (dados: any[]) => {
        this.relatorios = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar relatórios auxiliares:', err)
    });
  }

  // Nome da função ajustado para condizer com o (ngSubmit)="submeterFormulario()" do HTML
  submeterFormulario(): void {
    if (!this.idTipoMaterialSelecionado || !this.novaMateria.id_relatorio || !this.novaMateria.nome) {
      alert('Por favor, preencha todos os campos obrigatórios do formulário!');
      return;
    }

    // CORREÇÃO DO ERRO TS2554: Passamos os 2 argumentos que o teu api.ts exige
    this.apiService.createMateriaPrima(this.idTipoMaterialSelecionado, this.novaMateria).subscribe({
      next: () => {
        this.carregarMateriasPrimas(); // Recarrega o histórico
        
        // Faz o reset completo ao formulário no ecrã
        this.idTipoMaterialSelecionado = '';
        this.novaMateria = {
          id_relatorio: '',
          nome: '',
          quantidade_kg: null,
          conteudo_reciclado_pct: null,
          intensidade_carbonica: null,
          processo_producao: ''
        };
        
        this.cdr.detectChanges();
        alert('Matéria-prima registada com sucesso!');
      },
      error: (err: any) => alert('Erro ao submeter matéria-prima: ' + err.message)
    });
  }
}