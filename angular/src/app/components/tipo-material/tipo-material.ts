import { Component, OnInit } from '@angular/core';
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
  tipos: any[] = [];
  novoTipo = { nome: '', unidade: 'kg', categoria: '' };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.apiService.getTiposMaterial().subscribe({
      next: (dados: any[]) => this.tipos = dados,
      error: (err: any) => console.error(err)
    });
  }

  submeter(): void {
    this.apiService.createTipoMaterial(this.novoTipo).subscribe({
      next: () => { this.carregar(); alert('Tipo de Material guardado!'); },
      error: (err: any) => alert(err.message)
    });
  }
}