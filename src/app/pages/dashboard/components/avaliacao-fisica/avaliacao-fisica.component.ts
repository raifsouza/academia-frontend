import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { AvaliacaoFisica } from '../../../../models/avaliacaoFisica.model';
import { AvaliacaoService } from '../../../../services/avaliacao.service';

export type ProtocoloComposicao = 'JACKSON_POLLOCK_3' | 'JACKSON_POLLOCK_7' | 'FAULKNER' | 'PETROSKI' | 'GUEDES';

@Component({
  selector: 'app-avaliacao-fisica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avaliacao-fisica.component.html',
  styleUrls: ['./avaliacao-fisica.component.scss']
})
export class AvaliacaoFisicaComponent implements OnInit {
  @Input() usuarioLogado: any; // Gestor/Professor logado
  @Input() aluno: any; // Aluno em foco

  abaAtiva: string = 'anamnese';
  subAbaAnamnese: string = 'anamnese';
  tipoComposicao: 'DOBRAS' | 'BIOIMPEDANCIA' = 'DOBRAS';
  salvando: boolean = false;

  // --- RESULTADOS DA COMPOSIÇÃO CORPORAL ---
  percentualGorduraAtual: number = 0;
  massaMagraKg: number = 0;
  massaGordaKg: number = 0;
  gorduraIdealPerc: number = 15;

  // --- PESQUISA DE ALUNOS ---
  termoBusca: string = '';
  sugestoesAlunos: Array<{ id: number; matricula: string; nome: string }> = [];
  mostrarDropdown: boolean = false;
  private buscaSubject = new Subject<string>();

  // Objeto base da Avaliação Física
  avaliacao: AvaliacaoFisica = this.criarAvaliacaoVazia();

  constructor(private avaliacaoService: AvaliacaoService) {}

  ngOnInit(): void {
    if (!this.isGestor()) {
      this.aluno = this.usuarioLogado; // Se for o próprio aluno logado
      if (this.aluno?.matricula) {
        this.carregarAvaliacaoVigente(this.aluno.matricula);
      }
    } else if (this.aluno?.matricula) {
      this.termoBusca = `${this.aluno.matricula} - ${this.aluno.nome || ''}`;
      this.carregarAvaliacaoVigente(this.aluno.matricula);
    }

    // Configura o debounce da busca por nome/matrícula
    this.buscaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((termo) => {
        if (!termo || termo.trim().length < 2) {
          this.mostrarDropdown = false;
          return of([]);
        }
        return this.avaliacaoService.buscarAlunos(termo).pipe(
          catchError((err) => {
            console.error('Erro ao buscar alunos:', err);
            return of([]);
          })
        );
      })
    ).subscribe((resultados) => {
      this.sugestoesAlunos = resultados;
      this.mostrarDropdown = resultados.length > 0;
    });
  }

  isGestor(): boolean {
    // Permite Gestor (tipo/perfil 1) e Professor (tipo/perfil 2)
    const tipo = this.usuarioLogado?.tipo_usuario || this.usuarioLogado?.perfil_id;
    return tipo === 1 || tipo === 2;
  }

  // --- CONTROLE DE PESQUISA ---
  onDigitarBusca(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termoBusca = input.value;
    this.buscaSubject.next(this.termoBusca);
  }

  selecionarAluno(alunoEncontrado: { id: number; matricula: string; nome: string }): void {
    this.aluno = alunoEncontrado;
    this.termoBusca = `${alunoEncontrado.matricula} - ${alunoEncontrado.nome}`;
    this.mostrarDropdown = false;
    this.sugestoesAlunos = [];

    // Carregar avaliação vinculada a essa matrícula
    this.carregarAvaliacaoVigente(alunoEncontrado.matricula);
  }

  fecharDropdownComDelay(): void {
    setTimeout(() => (this.mostrarDropdown = false), 200);
  }

  // --- CARREGAMENTO E CRIAÇÃO DE AVALIAÇÃO ---
  criarAvaliacaoVazia(): AvaliacaoFisica {
    return {
      aluno_id: this.aluno?.id || 0,
      data_avaliacao: new Date().toISOString().split('T')[0],
      numero_avaliacao: 1,
      anamnese: { 
        objetivos: '', 
        pratica_atividade: '', 
        medicamentos: '', 
        cirurgia: '', 
        doencas_familia: '', 
        observacoes: '' 
      },
      risco_coronariano: { 
        idade: 25, 
        sexo: 'M', 
        peso: 70, 
        exercicio_fisico: 'SEDENTARIO', 
        historico_familiar: 'NENHUM', 
        tabagismo: 'NAO_FUMA', 
        colesterol: 'NORMAL', 
        pressao_sistolica: 'NORMAL' 
      },
      perimetros: {
        ombro: 0,
        torax_relaxado: 0,
        torax_inspirado: 0,
        braco_relaxado_dir: 0,
        braco_relaxado_esq: 0,
        braco_contraido_dir: 0,
        braco_contraido_esq: 0,
        antebraaco_dir: 0,
        antebraaco_esq: 0,
        cintura: 0,
        quadril: 0,
        coxa_dir: 0,
        coxa_esq: 0,
        panturrilha_dir: 0,
        panturrilha_esq: 0
      },
      composicao: { 
        peso: 70, 
        altura: 1.70, 
        protocolo: 'JACKSON_POLLOCK_3', 
        dobras: { 
          subescapular: 0,
          bicipital: 0,
          tricipital: 0,
          axilar_media: 0,
          suprailiaca: 0,
          peitoral: 0,
          abdominal: 0,
          coxa: 0,
          panturrilha: 0
        },
        bioimpedancia: {
          perc_gordura: 0,
          perc_massa_magra: 0
        }
      },
      cardiorrespiratoria: {
        condicao_fisica: 'SEDENTARIO',
        protocolo_utilizado: '1_MILHA',
        frequencia_cardiaca_repouso: 70,
        vo2_max_obtido: 0,
        vo2_max_previsto: 0,
        deficit_aerobico_percentual: 0
      },
      neuromotores: { flexao_bracos_reps: 0, abdominal_reps: 0, banco_wells_cm: 0 },
      postural: {},
      configuracao: {
        exibir_anamnese: true,
        exibir_risco: true,
        exibir_perimetros: true,
        exibir_composicao: true,
        exibir_cardio: true,
        exibir_neuromotores: true,
        exibir_postural: true,
        tipo_medida_composicao: 'DOBRAS'
      }
    };
  }

  carregarAvaliacaoVigente(matricula: string): void {
    if (!matricula) return;

    this.avaliacaoService.buscarUltimaPorMatricula(matricula).subscribe({
      next: (res: AvaliacaoFisica | null) => {
        if (res) {
          this.avaliacao = res;
          this.calcularComposicao();
        } else {
          this.avaliacao = this.criarAvaliacaoVazia();
          if (this.aluno?.id) {
            this.avaliacao.aluno_id = this.aluno.id;
          }
        }
      },
      error: (err) => {
        console.log('Nenhuma avaliação encontrada, iniciando nova.', err);
        this.avaliacao = this.criarAvaliacaoVazia();
      }
    });
  }

  // --- CÁLCULOS AUTOMÁTICOS ---
  calcularIMC(): number {
    const peso = this.avaliacao.composicao?.peso || 0;
    const altura = this.avaliacao.composicao?.altura || 0;
    if (!peso || !altura) return 0;
    return Number((peso / (altura * altura)).toFixed(2));
  }

  calcularRCQ(): number {
    const cintura = this.avaliacao.perimetros?.cintura || 0;
    const quadril = this.avaliacao.perimetros?.quadril || 0;
    if (!cintura || !quadril) return 0;
    return Number((cintura / quadril).toFixed(2));
  }

  calcularTMB(): number {
    const peso = this.avaliacao.composicao?.peso || 0;
    const alturaCm = (this.avaliacao.composicao?.altura || 0) * 100;
    const idade = this.avaliacao.risco_coronariano?.idade || 30;
    const sexo = this.avaliacao.risco_coronariano?.sexo || 'M';

    if (!peso || !alturaCm) return 0;

    let tmb = (10 * peso) + (6.25 * alturaCm) - (5 * idade);
    tmb += (sexo === 'M') ? 5 : -161;

    return Math.round(tmb);
  }

  // --- REGRAS DE CÁLCULO DE COMPOSIÇÃO CORPORAL ---
  calcularComposicao(): void {
    const peso = this.avaliacao.composicao?.peso;
    if (!peso || peso <= 0) return;

    const d = this.avaliacao.composicao?.dobras || {};
    const sexo = this.avaliacao.risco_coronariano?.sexo || 'M';
    const idade = this.avaliacao.risco_coronariano?.idade || 25;
    const protocolo = this.avaliacao.composicao?.protocolo as ProtocoloComposicao || 'JACKSON_POLLOCK_3';

    let percentualGordura = 0;
    let densidadeCorporal = 0;

    switch (protocolo) {
      case 'JACKSON_POLLOCK_3': {
        if (sexo === 'M') {
          const soma = (d.peitoral || 0) + (d.abdominal || 0) + (d.coxa || 0);
          densidadeCorporal = 1.10938 - (0.0008267 * soma) + (0.0000016 * Math.pow(soma, 2)) - (0.0002574 * idade);
        } else {
          const soma = (d.tricipital || 0) + (d.suprailiaca || 0) + (d.coxa || 0);
          densidadeCorporal = 1.0994921 - (0.0009929 * soma) + (0.0000023 * Math.pow(soma, 2)) - (0.0001392 * idade);
        }
        percentualGordura = this.converterSiri(densidadeCorporal);
        break;
      }

      case 'JACKSON_POLLOCK_7': {
        const soma = (d.peitoral || 0) + (d.axilar_media || 0) + (d.tricipital || 0) + 
                     (d.subescapular || 0) + (d.abdominal || 0) + (d.suprailiaca || 0) + (d.coxa || 0);

        if (sexo === 'M') {
          densidadeCorporal = 1.112 - (0.00043499 * soma) + (0.00000055 * Math.pow(soma, 2)) - (0.00028826 * idade);
        } else {
          densidadeCorporal = 1.097 - (0.00046971 * soma) + (0.00000056 * Math.pow(soma, 2)) - (0.00012828 * idade);
        }
        percentualGordura = this.converterSiri(densidadeCorporal);
        break;
      }

      case 'FAULKNER': {
        const soma = (d.tricipital || 0) + (d.subescapular || 0) + (d.suprailiaca || 0) + (d.abdominal || 0);
        percentualGordura = (soma * 0.153) + 5.783;
        break;
      }

      case 'PETROSKI': {
        if (sexo === 'M') {
          const soma = (d.subescapular || 0) + (d.tricipital || 0) + (d.suprailiaca || 0) + (d.panturrilha || 0);
          densidadeCorporal = 1.10726863 - (0.00081201 * soma) + (0.00000212 * Math.pow(soma, 2)) - (0.00041761 * idade);
        } else {
          const soma = (d.axilar_media || 0) + (d.suprailiaca || 0) + (d.coxa || 0) + (d.panturrilha || 0);
          densidadeCorporal = 1.12351221 - (0.00086705 * soma) + (0.00000237 * Math.pow(soma, 2)) - (0.00041695 * idade);
        }
        percentualGordura = this.converterSiri(densidadeCorporal);
        break;
      }

      case 'GUEDES': {
        if (sexo === 'M') {
          const soma = (d.tricipital || 0) + (d.suprailiaca || 0) + (d.abdominal || 0);
          densidadeCorporal = 1.1714 - (0.0671 * Math.log10(soma || 1));
        } else {
          const soma = (d.subescapular || 0) + (d.suprailiaca || 0) + (d.coxa || 0);
          densidadeCorporal = 1.1668 - (0.0706 * Math.log10(soma || 1));
        }
        percentualGordura = this.converterSiri(densidadeCorporal);
        break;
      }
    }

    this.percentualGorduraAtual = Math.max(0, percentualGordura);
    this.massaGordaKg = (peso * this.percentualGorduraAtual) / 100;
    this.massaMagraKg = peso - this.massaGordaKg;
  }

  private converterSiri(densidade: number): number {
    if (densidade <= 0) return 0;
    return ((4.95 / densidade) - 4.5) * 100;
  }

  // --- UPLOAD DE FOTOS POSTURAIS ---
  uploadFotoPostural(event: any, tipo: 'anterior' | 'posterior' | 'lateral'): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (!this.avaliacao.postural) this.avaliacao.postural = {};
        if (tipo === 'anterior') this.avaliacao.postural.foto_anterior_url = e.target.result;
        if (tipo === 'posterior') this.avaliacao.postural.foto_posterior_url = e.target.result;
        if (tipo === 'lateral') this.avaliacao.postural.foto_lateral_url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // --- SALVAR AVALIAÇÃO ---
  salvarAvaliacao(): void {
    if (!this.isGestor()) return;

    this.avaliacao.aluno_id = this.aluno?.id || this.avaliacao.aluno_id;
    (this.avaliacao as any).professor_id = this.usuarioLogado?.id;

    if (!this.avaliacao.aluno_id) {
      alert('Por favor, selecione um aluno válido antes de salvar.');
      return;
    }

    this.salvando = true;
    this.avaliacaoService.salvarAvaliacao(this.avaliacao).subscribe({
      next: (res) => {
        alert('Avaliação Física salva com sucesso!');
        if (res && res.id) {
          this.avaliacao.id = res.id;
        }
        this.salvando = false;
      },
      error: (err: any) => {
        console.error('Erro ao salvar:', err);
        alert(typeof err.message === 'string' ? err.message : 'Falha ao salvar a avaliação.');
        this.salvando = false;
      }
    });
  }
}