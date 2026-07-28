import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent implements OnInit {
  cadastroForm!: FormGroup;
  photoPreview: string | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  
  // Controle da Matrícula e Modal
  matriculaGerada: string | null = null;
  showSuccessModal: boolean = false;

  diasVencimento: number[] = Array.from({ length: 28 }, (_, i) => i + 1);

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hoje = new Date();
    const dataCadastroFormatada = this.formatDate(hoje);

    this.cadastroForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      dataNascimento: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      dataCadastro: [{ value: dataCadastroFormatada, disabled: true }],
      diaVencimento: [hoje.getDate(), [Validators.required]],
      agendarAulaExperimental: ['', [this.dataFuturaValidator]],
      foto: [null],
      realizouAvaliacao: [false],
      tipoUsuario: [3]
    }, { validators: this.senhasIguaisValidator });
  }

  private dataFuturaValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const dataSelecionada = new Date(control.value);
    const agora = new Date();

    if (dataSelecionada < agora) {
      return { dataPassada: true };
    }
    return null;
  }

  private senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('senha')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      control.get('confirmarSenha')?.setErrors({ senhasDiferentes: true });
      return { senhasDiferentes: true };
    }
    return null;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  private calcularDataVencimentoCompleta(dia: number): string {
    const hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = hoje.getMonth();

    if (dia < hoje.getDate()) {
      mes += 1;
      if (mes > 11) {
        mes = 0;
        ano += 1;
      }
    }

    const dataVenc = new Date(ano, mes, dia);
    return this.formatDate(dataVenc);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.cadastroForm.patchValue({ foto: this.photoPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.cadastroForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const formValues = this.cadastroForm.getRawValue();
      const dataVencimentoCalculada = this.calcularDataVencimentoCompleta(Number(formValues.diaVencimento));

      const payload = {
        nome: formValues.nome,
        email: formValues.email,
        senha: formValues.senha,
        telefone: formValues.telefone,
        data_nascimento: formValues.dataNascimento,
        foto_url: formValues.foto || null,
        data_vencimento: dataVencimentoCalculada,
        agendar_aula_experimental: formValues.agendarAulaExperimental || null,
        realizou_avaliacao: formValues.realizouAvaliacao,
        tipo_usuario: formValues.tipoUsuario
      };

      this.usuarioService.cadastrarUsuario(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.matriculaGerada = res.matricula; // Guarda a matrícula retornada
          this.showSuccessModal = true;        // Exibe o modal
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro na requisição:', err);
          this.errorMessage = err.error?.error || 'Erro ao conectar ao servidor.';
        }
      });

    } else {
      this.cadastroForm.markAllAsTouched();
    }
  }

  fecharModalEIrParaLogin(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }
}