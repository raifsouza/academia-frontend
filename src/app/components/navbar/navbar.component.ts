import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  // Guardamos o Observable direto para usar no HTML com o pipe async
  usuarioLogado$: Observable<any> | undefined;

  constructor(private router: Router, private usuarioService: UsuarioService,) {

    this.usuarioLogado$ = this.usuarioService.usuario$;

  }

  ngOnInit(): void {}


  logout(): void {
    this.usuarioService.logout();
    this.router.navigate(['/login']);
  }
}