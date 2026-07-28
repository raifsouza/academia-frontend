import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PagamentoService, Pagamento } from '../../../../services/pagamento.service'; // Ajuste o caminho
import { UsuarioService } from '../../../../services/usuario.service'; // Ajuste o caminho
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagamentos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pagamentos-section.component.html',
  styleUrls: ['./pagamentos-section.component.scss']
})
export class PagamentosSectionComponent implements OnInit, OnChanges {
  @Input() usuario: any;

  pagamentos: Pagamento[] = [];
  alunos: any[] = [];
  alunoSelecionado: any = null;
  filtroAluno: string = '';

  loading: boolean = false;
  modalAberto: boolean = false;

  novoPagamento: Pagamento = {
    usuario_id: 0,
    valor: 80.00,
    data_pagamento: new Date().toISOString().split('T')[0],
    status: 'PAGO',
    mes_referencia: ''
  };

  constructor(
    private pagamentoService: PagamentoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.inicializar();
    }
  }

  isGestor(): boolean {
    return this.usuario?.tipo_usuario === 1 || this.usuario?.tipo_usuario === 2;
  }

  inicializar(): void {
    if (!this.usuario) return;

    if (this.isGestor()) {
      this.carregarAlunos();
    } else {
      this.carregarPagamentosDoUsuario(this.usuario.id);
    }
  }

  carregarAlunos(): void {
    this.usuarioService.buscarUsuarios().subscribe({
      next: (res) => { this.alunos = res; },
      error: (err) => console.error('Erro ao buscar alunos:', err)
    });
  }

  alunosFiltrados(): any[] {
    if (!this.filtroAluno.trim()) return this.alunos;
    const termo = this.filtroAluno.toLowerCase();
    return this.alunos.filter(a => 
      a.nome?.toLowerCase().includes(termo) || 
      a.matricula?.toLowerCase().includes(termo)
    );
  }

  selecionarAluno(aluno: any): void {
    this.alunoSelecionado = aluno;
    this.carregarPagamentosDoUsuario(aluno.id);
  }

  carregarPagamentosDoUsuario(usuarioId: number): void {
    this.loading = true;
    this.pagamentoService.buscarPorUsuario(usuarioId).subscribe({
      next: (res) => {
        this.pagamentos = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  formatarTelefone(tel: string): string {
    if (!tel) return 'N/A';
    const num = tel.replace(/\D/g, '');
    return num.length === 11 ? `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}` : tel;
  }

  abrirModal(): void {
    if (!this.alunoSelecionado) return;
    
    this.novoPagamento = {
      usuario_id: this.alunoSelecionado.id,
      valor: 80.00,
      data_pagamento: new Date().toISOString().split('T')[0],
      status: 'PAGO',
      mes_referencia: ''
    };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    if (!this.novoPagamento.valor || !this.novoPagamento.mes_referencia) {
      alert('Preencha todos os campos!');
      return;
    }

    this.pagamentoService.registrarPagamento(this.novoPagamento).subscribe({
      next: () => {
        alert('Pagamento registrado com sucesso!');
        this.fecharModal();
        if (this.alunoSelecionado) {
          this.carregarPagamentosDoUsuario(this.alunoSelecionado.id);
        }
      },
      error: (err) => {
        console.error('Erro ao registrar pagamento:', err);
        alert('Falha ao salvar pagamento.');
      }
    });
  }


}