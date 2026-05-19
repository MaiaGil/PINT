import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-transporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transporte.html',
  styleUrls: ['./transporte.css']
})
export class TransporteComponent implements OnInit {
  transportes: any[] = [];
  relatorios: any[] = [];

  // CORREÇÃO: Adicionada a propriedade que o HTML espera para ligar à dropdown de Relatórios
  idRelatorioSelecionado: string = '';

  // CORREÇÃO: Adicionado o campo 'fator_emissao_gco2_per_km' que o teu [(ngModel)] exige
  novoTransporte = {
    tipo_veiculo: '',
    distancia_km: null,
    combustivel: '',
    fator_emissao_gco2_per_km: null
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Carregamento assíncrono seguro para evitar o erro NG0100
    setTimeout(() => {
      this.carregarTransportes();
      this.carregarRelatoriosAuxiliares();
    }, 0);
  }

  carregarTransportes(): void {
    this.apiService.getTransportes().subscribe({
      next: (dados: any[]) => {
        this.transportes = dados;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar transportes:', err)
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
    if (!this.idRelatorioSelecionado || !this.novoTransporte.tipo_veiculo) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    // CORREÇÃO DO ERRO TS2554: Passamos o idRelatorioSelecionado e o objeto com os dados
    this.apiService.createTransporte(this.idRelatorioSelecionado, this.novoTransporte).subscribe({
      next: () => {
        this.carregarTransportes(); // Atualiza a tabela
        
        // Reset completo ao formulário
        this.idRelatorioSelecionado = '';
        this.novoTransporte = {
          tipo_veiculo: '',
          distancia_km: null,
          combustivel: '',
          fator_emissao_gco2_per_km: null
        };
        
        this.cdr.detectChanges();
        alert('Registo de transporte criado com sucesso!');
      },
      error: (err: any) => alert('Erro ao criar transporte: ' + err.message)
    });
  }
}