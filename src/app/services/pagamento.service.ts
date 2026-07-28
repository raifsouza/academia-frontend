import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pagamento {
  id?: number;
  usuario_id: number;
  aluno_nome?: string;
  valor: number;
  data_pagamento: string;
  status: 'PAGO' | 'PENDENTE' | 'CANCELADO';
  mes_referencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {
  private apiUrl = 'http://localhost:3000/api/pagamentos';

  constructor(private http: HttpClient) {}

  // Buscar histórico de um aluno
  buscarPorUsuario(usuarioId: number): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(`${this.apiUrl}?usuario_id=${usuarioId}`);
  }

  // Buscar todos os pagamentos (Admin)
  buscarTodos(): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(this.apiUrl);
  }

  // Registrar pagamento
  registrarPagamento(pagamento: Pagamento): Observable<any> {
    return this.http.post(this.apiUrl, pagamento);
  }
}