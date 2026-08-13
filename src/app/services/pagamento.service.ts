import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface Pagamento {
  id?: number;
  usuario_id: number;
  aluno_nome?: string;
  valor: number;
  data_pagamento: string;
  status: 'PAGO' | 'PENDENTE' | 'CANCELADO'|'INADIMPLENTE';
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

  // Buscar pagamentos e processar pendência/vencimento do mês vigente
  obterPagamentosDoAluno(usuario: any): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(`${this.apiUrl}/usuario/${usuario.id}`).pipe(
      map((pagamentos: Pagamento[]) => {
        return this.injetarCobrancaVigenteSeNecessario(pagamentos, usuario);
      })
    );
  }

  private injetarCobrancaVigenteSeNecessario(pagamentos: Pagamento[], usuario: any): Pagamento[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Identifica o dia do vencimento do cadastro do usuário
    let diaVencimento = 10;
    if (usuario?.data_vencimento) {
      const val = String(usuario.data_vencimento);
      if (val.includes('-')) diaVencimento = parseInt(val.split('-')[2], 10) || 10;
      else if (val.includes('/')) diaVencimento = parseInt(val.split('/')[0], 10) || 10;
      else diaVencimento = parseInt(val, 10) || 10;
    }

    // Monta a data de vencimento no mês/ano atual
    const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento, 0, 0, 0);

    // Verifica se já tem pagamento com status PAGO neste mês/ano
    const temPagamentoPago = pagamentos.some(p => {
      const d = new Date(p.data_pagamento);
      return d.getMonth() === dataVencimento.getMonth() &&
             d.getFullYear() === dataVencimento.getFullYear() &&
             p.status === 'PAGO';
    });

    // Se já estiver pago, retorna o array original sem alterações
    if (temPagamentoPago) {
      return pagamentos;
    }

    // Formata mês de referência (ex: "Agosto / 2026")
    const nomeMes = dataVencimento.toLocaleString('pt-BR', { month: 'long' });
    const mesRef = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} / ${dataVencimento.getFullYear()}`;

    // Cria o registro pendente na lista original de pagamentos
    const cobrancaVigente: Pagamento = {
      usuario_id: usuario.id,
      aluno_nome: usuario.nome,
      valor: 80.00,
      data_pagamento: dataVencimento.toISOString(),
      status: 'PENDENTE',
      mes_referencia: mesRef
    };

    // Coloca a cobrança do mês no topo da lista existente
    return [cobrancaVigente, ...pagamentos];
  }

  // Registrar pagamento
  registrarPagamento(pagamento: Pagamento): Observable<any> {
    return this.http.post(this.apiUrl, pagamento);
  }
}