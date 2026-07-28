import { Routes } from '@angular/router';
import { HeroComponent } from './components/hero/hero.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guards';

export const routes: Routes = [
  { path: '', component: HeroComponent },      
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  { path: '**', redirectTo: '' }                
];