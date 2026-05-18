import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodo.html',
  styleUrls: ['./periodo.css']
})

// ... (resto do teu código acima mantém-se igual)

export class PeriodoComponent implements OnInit {
  periodos: any[] = [];
  
  novoPeriodo = {
    ano: null,
    trimestre: null
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.carregarPeriodos();
    }, 0);
  }

  // NOVA FUNÇÃO: Calcula dinamicamente se o período da lista é o atual
  ePeriodoAtual(ano: number, trimestre: number): boolean {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0 = Janeiro, 11 = Dezembro
    
    // Calcula o trimestre atual com base no mês
    // Jan(0)-Mar(2) = 1º | Abr(3)-Jun(5) = 2º | Jul(6)-Set(8) = 3º | Out(9)-Dez(11) = 4º
    const trimestreAtual = Math.floor(mesAtual / 3) + 1;

    return ano === anoAtual && trimestre === trimestreAtual;
  }

  carregarPeriodos(): void {
    this.apiService.getPeriodos().subscribe({
      next: (dados: any[]) => {
        this.periodos = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar períodos:', err)
    });
  }

  submeterFormulario(): void {
    if (!this.novoPeriodo.ano || !this.novoPeriodo.trimestre) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    this.apiService.createPeriodo(this.novoPeriodo).subscribe({
      next: () => {
        this.carregarPeriodos();
        this.novoPeriodo = { ano: null, trimestre: null };
        alert('Período criado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar período: ' + err.message)
    });
  }
}