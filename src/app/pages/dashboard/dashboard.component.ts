import { Component, OnInit } from '@angular/core';
import { TreinosSectionComponent } from "./components/treinos-section/treinos-section.component";
import { PagamentosSectionComponent } from "./components/pagamentos-section/pagamentos-section.component";
import { UserProfileCardComponent } from "./components/user-profile-card/user-profile-card.component";
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule,TreinosSectionComponent, PagamentosSectionComponent, UserProfileCardComponent]
})
export class DashboardComponent implements OnInit {
  usuarioLogado: any;
  abaAtiva: string = 'treino';
  private userSub!: Subscription;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Inscreve no estado reativo do serviço
    this.userSub = this.usuarioService.usuario$.subscribe(usuario => {
      this.usuarioLogado = usuario;

      if (this.isProfessor()|| this.isAdmin()) {
        this.abaAtiva = 'alunos';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  selecionarAba(aba: string): void {
    this.abaAtiva = aba;
  }

  isAluno(): boolean { return this.usuarioLogado?.tipo_usuario === 3; }
  isProfessor(): boolean { return this.usuarioLogado?.tipo_usuario === 2; }
  isAdmin(): boolean { return this.usuarioLogado?.tipo_usuario === 1; }
}