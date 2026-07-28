import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';


export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  telefone: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api';

  // 1. Inicializa o BehaviorSubject lendo o valor salvo no localStorage
  private usuarioSubject = new BehaviorSubject<any>(this.getUsuarioDoStorage());


  // 2. Expõe como Observable para os componentes apenas "ouvirem" (sem poder emitir valores diretamente)
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Lê com segurança o usuário inicial do localStorage
  private getUsuarioDoStorage(): any {
  const userStr = localStorage.getItem('usuario');
  try {
    if (!userStr) return null;
    const parsed = JSON.parse(userStr);
    
    // Se estiver envelopado ({ message, usuario }), extrai apenas a chave 'usuario'
    return parsed.usuario ? parsed.usuario : parsed;
  } catch {
    return null;
  }
}


  /**
   * Retorna o valor atual síncrono do usuário logado
   */
  public get usuarioAtual(): any {
    return this.usuarioSubject.value;
  }


  /**
   * Verifica se existe um usuário autenticado no momento
   */
  public estaAutenticado(): boolean {
    return !!this.usuarioSubject.value;
  }


  cadastrarUsuario(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/alunos`, dados);
  }



  // --- MÉTODOS EXISTENTES DO SERVICE ---
  buscarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/alunos`);
  }
  


 /**
   * Método de Login: Autentica na API e notifica todos os inscritos (Subscribers)
   */
  login(credenciais: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/login`, credenciais).pipe(
    tap((resposta) => {
      // Pega o objeto interno se vier { message, usuario }, caso contrário pega a resposta direta
      const usuarioDados = resposta.usuario ? resposta.usuario : resposta;

      // Salva no localStorage já "desembrulhado"
      localStorage.setItem('usuario', JSON.stringify(usuarioDados));
      
      // Notifica os componentes com os dados corretos do usuário
      this.usuarioSubject.next(usuarioDados);
    })
  );
}

  /**
   * Método de Logout: Limpa a sessão e notifica a aplicação inteira
   */
 logout(): void {
  // 1. Remove todas as chaves associadas ao login
  localStorage.removeItem('usuario');
  localStorage.removeItem('usuario_logado');
  
  // Ou se preferir limpar todo o localStorage da aplicação:
  // localStorage.clear();

  // 2. Notifica a stream do RxJS que não há mais usuário (emite null)
  this.usuarioSubject.next(null);
}
  /**
   * Se precisar atualizar os dados do usuário logado sem deslogar (ex: trocou foto ou nome)
   */
  atualizarEstadoUsuario(usuarioAtualizado: any): void {
    localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
    this.usuarioSubject.next(usuarioAtualizado);
  }


  /**
   * Atualiza a foto do usuário no backend e atualiza a aplicação
   */
  atualizarFotoUsuario(idUsuario: number, fotoBase64: string): Observable<any> {
    const payload = { foto_url: fotoBase64 };

    // Ajuste o endpoint da API conforme seu backend (ex: PUT /api/usuarios/7/foto ou PATCH /api/usuarios/7)
    return this.http.put<any>(`${this.apiUrl}/alunos/${idUsuario}`, payload).pipe(
      tap((resposta) => {
        const usuarioEditado = {
          ...this.usuarioAtual,
          foto_url: fotoBase64
        };
        this.atualizarEstadoUsuario(usuarioEditado);
      })
    );
  }

}