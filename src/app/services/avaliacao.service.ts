import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlunoSugestao, AvaliacaoFisica } from '../models/avaliacaoFisica.model';

@Injectable({
  providedIn: 'root'
})
export class AvaliacaoService {
  private readonly http = inject(HttpClient);
  
  // Endpoint Next.js (Ajuste a porta/domínio se seu Next.js estiver rodando em outra URL)
  private readonly apiUrl = '/api/avaliacoes';
  private readonly apiUrl2 = '/api/alunos';


buscarAlunos(query: string): Observable<AlunoSugestao[]> {
    return this.http.get<AlunoSugestao[]>(this.apiUrl2).pipe(
      map((alunos: AlunoSugestao[]) => {
        if (!query || !query.trim()) {
          return [];
        }

        const termo = query.toLowerCase().trim();

        return alunos
          .filter(aluno => 
            aluno.nome?.toLowerCase().includes(termo) || 
            aluno.matricula?.toLowerCase().includes(termo)
          )
          .slice(0, 10);
      }),
      catchError((error) => {
        console.error('Erro ao buscar alunos:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca a avaliação física do aluno por Matrícula
   * Trata o erro 404 (aluno novo / sem avaliação) retornando null pacificamente
   */
 buscarAvaliacoesPorMatricula(matricula: string): Observable<AvaliacaoFisica[]> {
    // Chamada usando caminho relativo '/api/avaliacoes'
    return this.http.get<AvaliacaoFisica[]>(`${this.apiUrl}?matricula=${matricula}`).pipe(
      catchError((error) => {
        // Trata erro sem travar a aplicação
        return of([]);
      })
    );
  }

  /**
   * Busca todas as avaliações registradas de um aluno informando o aluno_id.
   */
  buscarHistoricoPorAluno(alunoId: number): Observable<AvaliacaoFisica[]> {
    const params = new HttpParams().set('aluno_id', alunoId.toString());
    return this.http.get<AvaliacaoFisica[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Busca a avaliação mais recente do aluno por matrícula.
   */
  buscarUltimaPorMatricula(matricula: string): Observable<AvaliacaoFisica | null> {
    return this.buscarAvaliacoesPorMatricula(matricula).pipe(
      map((avaliacoes: AvaliacaoFisica[]) => (avaliacoes?.length ? avaliacoes[0] : null))
    );
  }

  /**
   * Cria uma nova avaliação física ou atualiza uma existente no Next.js/MySQL.
   * Envia o objeto completo com todas as abas preenchidas.
   */
  salvarAvaliacao(avaliacao: AvaliacaoFisica): Observable<AvaliacaoFisica> {
  if (avaliacao.id) {
    // Atualização (PUT) - Envia para /api/avaliacoes/:id
    return this.http.put<AvaliacaoFisica>(`${this.apiUrl}/${avaliacao.id}`, avaliacao).pipe(
      catchError(this.handleError)
    );
  }

  // Criação (POST) - Remove o ID para não conflitar com a geração do backend
  const { id, ...dadosParaSalvar } = avaliacao;

  return this.http.post<AvaliacaoFisica>(this.apiUrl, dadosParaSalvar).pipe(
    catchError(this.handleError)
  );
}

  /**
   * Envia foto postural para o servidor.
   */
  uploadFotoPostural(
    avaliacaoId: number, 
    tipo: 'anterior' | 'posterior' | 'lateral', 
    arquivo: File
  ): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('foto', arquivo);
    formData.append('tipo', tipo);
    formData.append('avaliacao_id', avaliacaoId.toString());

    return this.http.post<{ url: string }>(`${this.apiUrl}/fotos`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handler de erros HTTP centralizado.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro inesperado na requisição.';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente / rede
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else if (error.error && error.error.error) {
      // Mensagem customizada vinda do backend Next.js (ex: { error: 'Mensagem...' })
      errorMessage = error.error.error;
    } else {
      // Erro retornado pelo servidor
      errorMessage = `Erro no servidor (${error.status}): ${error.message}`;
    }

    console.error('AvaliacaoService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}