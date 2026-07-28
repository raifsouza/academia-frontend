import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreinoService } from '../../../../services/treino.service'; // Ajuste o caminho do seu serviço
import { Treino } from '../../../../models/treino.model';
import { UsuarioService } from '../../../../services/usuario.service'; // Ajuste o caminho do seu serviço
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-treinos-section',
  standalone: true, // Se for standalone
  imports: [ CommonModule, ReactiveFormsModule, FormsModule ],
  templateUrl: './treinos-section.component.html',
  styleUrls: ['./treinos-section.component.scss']
})
export class TreinosSectionComponent implements OnInit {
  @Input() usuario: any;
  @Input() modoGestao: boolean = false; // Define se exibe a gestão de alunos (Prof/Admin) ou apenas visão de aluno

  alunos: any[] = [];
  alunoSelecionado: any = null;
  treinosDoAluno: Treino[] = [];
  filtroAluno: string = '';

  loadingAlunos: boolean = false;
  loadingTreinos: boolean = false;
  salvandoTreino: boolean = false;

  // Modais
  modalNovoAberto: boolean = false;
  modalEdicaoAberto: boolean = false;

  // Form de Novo Treino
  treinoForm!: FormGroup;

  // Objeto para edição
  treinoEmEdicao: any = { id: 0, titulo: '', dia_semana: 'Segunda-feira', descricao: '' };

  constructor(
    private fb: FormBuilder,
    private treinoService: TreinoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.iniciarFormulario();

    if (this.modoGestao) {
      this.carregarAlunos();
    } else {
      // Se for visão do próprio aluno, carrega direto os treinos dele
      this.carregarTreinos(this.usuario.id);
    }
  }

  iniciarFormulario(): void {
    this.treinoForm = this.fb.group({
      titulo: ['', Validators.required],
      dia_semana: ['Segunda-feira', Validators.required],
      descricao: ['', Validators.required]
    });
  }

  // --- MÉTODOS DE BUSCA ---
  carregarAlunos(): void {
    this.loadingAlunos = true;
    this.usuarioService.buscarUsuarios().subscribe({
      next: (res) => {
        this.alunos = res;
        this.loadingAlunos = false;
      },
      error: (err) => {
        console.error('Erro ao carregar alunos:', err);
        this.loadingAlunos = false;
      }
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

  selecionarAlunoParaTreino(aluno: any): void {
    this.alunoSelecionado = aluno;
    this.carregarTreinos(aluno.id);
  }

  carregarTreinos(usuarioId: number): void {
    this.loadingTreinos = true;
    this.treinoService.buscarPorUsuario(usuarioId).subscribe({
      next: (res) => {
        this.treinosDoAluno = res;
        this.loadingTreinos = false;
      },
      error: (err) => {
        console.error('Erro ao carregar treinos:', err);
        this.loadingTreinos = false;
      }
    });
  }

  // --- MODAL NOVO TREINO ---
  abrirModalNovoTreino(): void {
    if (!this.alunoSelecionado) return;
    this.treinoForm.reset({ dia_semana: 'Segunda-feira' });
    this.modalNovoAberto = true;
  }

  fecharModalNovoTreino(): void {
    this.modalNovoAberto = false;
  }

  salvarNovoTreino(): void {
    if (this.treinoForm.invalid || !this.alunoSelecionado) return;

    this.salvandoTreino = true;
    const payload = {
      ...this.treinoForm.value,
      usuario_id: this.alunoSelecionado.id
    };

    this.treinoService.cadastrarTreino(payload).subscribe({
      next: () => {
        alert('Treino cadastrado com sucesso!');
        this.salvandoTreino = false;
        this.fecharModalNovoTreino();
        this.carregarTreinos(this.alunoSelecionado.id);
      },
      error: (err) => {
        console.error('Erro ao cadastrar treino:', err);
        alert('Erro ao cadastrar treino.');
        this.salvandoTreino = false;
      }
    });
  }

  // --- MODAL EDIÇÃO DE TREINO ---
  abrirModalEdicao(treino: any): void {
    this.treinoEmEdicao = { ...treino };
    this.modalEdicaoAberto = true;
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
  }

  salvarEdicaoTreino(): void {
    if (!this.treinoEmEdicao.titulo || !this.treinoEmEdicao.descricao) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    this.salvandoTreino = true;
    this.treinoService.atualizarTreino(this.treinoEmEdicao).subscribe({
      next: () => {
        alert('Treino atualizado com sucesso!');
        this.salvandoTreino = false;
        this.fecharModalEdicao();
        const idAlvo = this.modoGestao ? this.alunoSelecionado.id : this.usuario.id;
        this.carregarTreinos(idAlvo);
      },
      error: (err) => {
        console.error('Erro ao editar treino:', err);
        alert('Erro ao atualizar treino.');
        this.salvandoTreino = false;
      }
    });
  }

  // --- EXCLUSÃO DE TREINO ---
  excluirTreino(id?: number): void {

    if (id === undefined) {
    alert('Erro: ID do treino não encontrado.');
    return;
  }

    if (!confirm('Deseja realmente excluir este treino?')) return;

    this.treinoService.excluirTreino(id).subscribe({
      next: () => {
        alert('Treino excluído com sucesso!');
        const idAlvo = this.modoGestao ? this.alunoSelecionado.id : this.usuario.id;
        this.carregarTreinos(idAlvo);
      },
      error: (err) => {
        console.error('Erro ao excluir treino:', err);
        alert('Erro ao excluir treino.');
      }
    });
  }

  formatarTelefone(tel: string): string {
    if (!tel) return 'N/A';
    const num = tel.replace(/\D/g, '');
    return num.length === 11 ? `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}` : tel;
  }
}