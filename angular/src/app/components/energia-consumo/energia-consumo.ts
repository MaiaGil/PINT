import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-energia-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './energia-consumo.html',
  styleUrls: ['./energia-consumo.css']
})
export class EnergiaConsumoComponent implements OnInit {
  consumosEnergia: any[] = [];
  relatorios: any[] = [];
  idRelatorioSelecionado: string = ''; 

  // CORREÇÃO: Propriedades mapeadas exatamente como o teu HTML [(ngModel)] exige
  novoConsumo = {
    tipo_energia: '',
    quantidade: null,
    unidade: '',
    custo_total: null
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Carregamento assíncrono protetor contra o erro NG0100
    setTimeout(() => {
      this.carregarConsumosEnergia();
      this.carregarRelatoriosAuxiliares();
    }, 0);
  }

  carregarConsumosEnergia(): void {
    this.apiService.getConsumosEnergia().subscribe({
      next: (dados: any[]) => {
        this.consumosEnergia = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar consumos de energia:', err)
    });
  }

  carregarRelatoriosAuxiliares(): void {
    if (this.apiService.getRelatorios) {
      this.apiService.getRelatorios().subscribe({
        next: (dados: any[]) => {
          this.relatorios = dados;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  submeterFormulario(): void {
    if (!this.idRelatorioSelecionado || !this.novoConsumo.tipo_energia || !this.novoConsumo.quantidade) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    // Agora o ApiService já reconhece esta função
    this.apiService.createConsumoEnergia(this.idRelatorioSelecionado, this.novoConsumo).subscribe({
      next: () => {
        this.carregarConsumosEnergia(); // Atualiza o histórico no ecrã
        
        // Reset completo ao formulário
        this.idRelatorioSelecionado = '';
        this.novoConsumo = { 
          tipo_energia: '', 
          quantidade: null, 
          unidade: '', 
          custo_total: null 
        };
        
        this.cdr.detectChanges();
        alert('Consumo de energia registado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar consumo: ' + err.message)
    });
  }
}