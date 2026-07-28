import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

export const authGuard: CanActivateFn = (route, state) => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  if (usuarioService.estaAutenticado()) {
    // Usuário está autenticado, permite o acesso à rota
    return true;
  }

  // Usuário não está logado: redireciona para o login
  alert('Acesso negado! Faça login para acessar esta página.');
  router.navigate(['/login']); // Ajuste a rota de destino do seu formulário de login se necessário
  return false;
};