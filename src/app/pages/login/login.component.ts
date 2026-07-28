import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]], // E-mail ou Matrícula
      senha: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const credenciais = this.loginForm.value;

      this.usuarioService.login(credenciais).subscribe({
        next: (res) => {
          this.loading = false;
          
          // Guarda as informações do usuário autenticado na sessão (localStorage)
          localStorage.setItem('usuario_logado', JSON.stringify(res.usuario));

          alert(`Bem-vindo(a), ${res.usuario.nome}!`);
          
          // Redireciona para o Dashboard / Área do Aluno
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro de autenticação:', err);
          this.errorMessage = err.error?.error || 'Erro ao conectar ao servidor!';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}