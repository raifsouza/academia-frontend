import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Treino } from '../models/treino.model';

@Injectable({
  providedIn: 'root'
})
export class TreinoService {
  // Ajuste a URL base para o endpoint da sua API
  private readonly API_URL = 'http://localhost:3000/api/treinos';

  constructor(private http: HttpClient) {}

  /**
   * Busca todos os treinos vinculados a um usuário/aluno específico.
   */
  buscarPorUsuario(usuarioId: number): Observable<Treino[]> {
    return this.http.get<Treino[]>(`${this.API_URL}?usuario_id=${usuarioId}`);
  }

  /**
   * Cadastra um novo treino para um aluno.
   */
  cadastrarTreino(treino: Treino): Observable<Treino> {
    return this.http.post<Treino>(this.API_URL, treino);
  }

  /**
   * Atualiza as informações de um treino existente.
   */
  atualizarTreino(treino: Treino): Observable<Treino> {
    return this.http.put<Treino>(`${this.API_URL}`, treino);
  }

  /**
   * Remove um treino pelo ID.
   */
  excluirTreino(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}