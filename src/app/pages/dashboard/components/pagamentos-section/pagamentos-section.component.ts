import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PagamentoService, Pagamento } from '../../../../services/pagamento.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagamentos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pagamentos-section.component.html',
  styleUrls: ['./pagamentos-section.component.scss']
})
export class PagamentosSectionComponent implements OnInit, OnChanges {
  @Input() usuario: any;

  pagamentos: Pagamento[] = [];
  
  alunos: any[] = [];
  alunoSelecionado: any = null;
  filtroAluno: string = '';

  loading: boolean = false;
  modalAberto: boolean = false;
  modalAlunoAberto: boolean = false;
  processandoPagamento: boolean = false;

  alertaStatus: 'EM_DIA' | 'A_VENCER' | 'PENDENTE' | 'INADIMPLENTE' = 'EM_DIA';
  diasParaVencimento: number = 0;
  diasAtraso: number = 0;
  diaVencimentoAluno: number = 10;

  metodoPagamento: 'PIX' | 'CARTAO' = 'PIX';
  chavePix: string = '00020126580014BR.GOV.BCB.PIX0136powershape@academia.com.br520400005303986540580.005802BR5911POWER SHAPE6005BELEM62070503***6304E21A';
  pixCopiado: boolean = false;

  dadosCartao = {
    numero: '',
    validade: '',
    cvv: '',
    nome: ''
  };

  novoPagamento: Pagamento = {
    usuario_id: 0,
    valor: 80.00,
    data_pagamento: new Date().toISOString().split('T')[0],
    status: 'PAGO',
    mes_referencia: ''
  };

  constructor(
    private pagamentoService: PagamentoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.inicializar();
    }
  }

  isGestor(): boolean {
    return this.usuario?.tipo_usuario === 1 || this.usuario?.tipo_usuario === 2;
  }

  inicializar(): void {
    if (!this.usuario) return;

    if (this.isGestor()) {
      this.carregarAlunos();
    } else {
      this.carregarPagamentosDoUsuario(this.usuario.id);
    }
  }

  carregarAlunos(): void {
    this.usuarioService.buscarUsuarios().subscribe({
      next: (res) => { this.alunos = res; },
      error: (err) => console.error('Erro ao buscar alunos:', err)
    });
  }

  alunosFiltrados(): any[] {
    if (!this.filtroAluno.trim()) return this.alunos;
    const termo = this.filtroAluno.toLowerCase();
    return this.alunos.filter(a => 
      a.nome?.toLowerCase().includes(termo) || 
      a.matricula?.toLowerCase().includes(termo)
    );
  }

  selecionarAluno(aluno: any): void {
    this.alunoSelecionado = aluno;
    this.carregarPagamentosDoUsuario(aluno.id);
  }

  carregarPagamentosDoUsuario(usuarioId: number): void {
    this.loading = true;
    this.pagamentoService.buscarPorUsuario(usuarioId).subscribe({
      next: (res) => {
        this.pagamentos = res || [];
        
        // Se for a visão do aluno logado, valida a pendência e alertas do mês vigente
        if (!this.isGestor()) {
          this.verificarStatusMensalidadeVigente();
        }
        
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // --- MÉTODOS DE CÁLCULO DE DATA E VENCIMENTO ---

  obterDataVencimentoExata(hoje: Date): Date {
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    if (!this.usuario || !this.usuario.data_vencimento) {
      return new Date(anoAtual, mesAtual, 10, 0, 0, 0);
    }

    const val = this.usuario.data_vencimento;

    if (typeof val === 'string' && val.includes('-')) {
      const partes = val.split('-');
      return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 0, 0, 0);
    }

    if (typeof val === 'string' && val.includes('/')) {
      const partes = val.split('/');
      return new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10), 0, 0, 0);
    }

    const diaNum = parseInt(String(val), 10) || 10;
    return new Date(anoAtual, mesAtual, diaNum, 0, 0, 0);
  }

  verificarStatusMensalidadeVigente(): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVencimento = this.obterDataVencimentoExata(hoje);
    dataVencimento.setHours(0, 0, 0, 0);

    this.diaVencimentoAluno = dataVencimento.getDate();

    // Verifica se já existe pagamento registrado como PAGO neste mês/ano
    const pagamentoPago = this.pagamentos.find(p => {
      const d = new Date(p.data_pagamento);
      return d.getMonth() === dataVencimento.getMonth() &&
             d.getFullYear() === dataVencimento.getFullYear() &&
             p.status === 'PAGO';
    });

    if (pagamentoPago) {
      this.alertaStatus = 'EM_DIA';
      return;
    }

    // Cálculo dos dias entre a data atual e a data de vencimento
    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    const diffDias = Math.round((dataVencimento.getTime() - hoje.getTime()) / MS_POR_DIA);

    // Formata a referência de mês para a interface Pagamento (ex: "Agosto / 2026")
    const nomeMes = dataVencimento.toLocaleString('pt-BR', { month: 'long' });
    const mesRef = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} / ${dataVencimento.getFullYear()}`;

    if (diffDias >= 0) {
      this.diasParaVencimento = diffDias;
      this.alertaStatus = diffDias <= 7 ? 'A_VENCER' : 'EM_DIA';
    } else {
      const atraso = Math.abs(diffDias);
      this.diasAtraso = atraso;
      // Mais de 5 dias de atraso define o estado global como INADIMPLENTE
      this.alertaStatus = atraso > 5 ? 'INADIMPLENTE' : 'PENDENTE';
    }

    // Insere o registro pendente do mês direto no array 'pagamentos' (se não existir nenhum pendente igual)
    const jaExistePendente = this.pagamentos.some(p => p.mes_referencia === mesRef && p.status === 'PENDENTE');
    if (!jaExistePendente) {
      const cobrancaVigente: Pagamento = {
        usuario_id: this.usuario.id,
        valor: 80.00,
        data_pagamento: dataVencimento.toISOString().split('T')[0],
        status: 'PENDENTE',
        mes_referencia: mesRef
      };

      this.pagamentos.unshift(cobrancaVigente);
    }
  }

  // Auxiliar para calcular no HTML a contagem regressiva de vencimento de qualquer linha
  calcularDiasParaVencer(dataStr: string): number {
    if (!dataStr) return 999;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let dataVenc: Date;
    if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      dataVenc = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 0, 0, 0);
    } else {
      dataVenc = new Date(dataStr);
      dataVenc.setHours(0, 0, 0, 0);
    }

    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    return Math.round((dataVenc.getTime() - hoje.getTime()) / MS_POR_DIA);
  }

  // --- MODAL DO GESTOR ---
  abrirModalGestor(): void {
    if (!this.alunoSelecionado) return;
    
    this.novoPagamento = {
      usuario_id: this.alunoSelecionado.id,
      valor: 80.00,
      data_pagamento: new Date().toISOString().split('T')[0],
      status: 'PAGO',
      mes_referencia: this.obterMesAtualExtenso()
    };
    this.modalAberto = true;
  }

  formatarTelefone(tel: string): string {
    if (!tel) return 'N/A';
    const num = tel.replace(/\D/g, '');
    return num.length === 11 ? `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}` : tel;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  // --- MODAL DO ALUNO ---
  abrirModalAluno(): void {
    this.novoPagamento = {
      usuario_id: this.usuario.id,
      valor: 80.00,
      data_pagamento: new Date().toISOString().split('T')[0],
      status: 'PAGO',
      mes_referencia: this.obterMesAtualExtenso()
    };
    this.pixCopiado = false;
    this.modalAlunoAberto = true;
  }

  fecharModalAluno(): void {
    this.modalAlunoAberto = false;
  }

  copiarChavePix(): void {
    navigator.clipboard.writeText(this.chavePix);
    this.pixCopiado = true;
    setTimeout(() => this.pixCopiado = false, 3000);
  }

  obterMesAtualExtenso(): string {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dataAtual = new Date();
    return `${meses[dataAtual.getMonth()]} / ${dataAtual.getFullYear()}`;
  }

  confirmarPagamentoAluno(): void {
    if (this.metodoPagamento === 'CARTAO') {
      if (!this.dadosCartao.numero || !this.dadosCartao.validade || !this.dadosCartao.cvv || !this.dadosCartao.nome) {
        alert('Preencha todos os dados do cartão!');
        return;
      }
    }

    this.processandoPagamento = true;

    setTimeout(() => {
      this.pagamentoService.registrarPagamento(this.novoPagamento).subscribe({
        next: () => {
          alert('Pagamento efetuado com sucesso!');
          this.processandoPagamento = false;
          this.fecharModalAluno();
          this.carregarPagamentosDoUsuario(this.usuario.id);
        },
        error: (err) => {
          console.error('Erro ao registrar pagamento:', err);
          alert('Falha ao processar pagamento.');
          this.processandoPagamento = false;
        }
      });
    }, 1200);
  }

  gerarRecibo(pagamento: Pagamento, dadosAluno: any): void {
    const dataFormatada = new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR');
    const valorFormatado = (pagamento.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const conteudoJanela = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Pagamento - Power Shape</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #fff;
            color: #111;
            padding: 30px;
            margin: 0;
          }
          .receipt-card {
            max-width: 500px;
            margin: auto;
            border: 2px solid #ff6600;
            padding: 25px;
            border-radius: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #ddd;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #ff6600;
            font-size: 24px;
            letter-spacing: 1px;
          }
          .header p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #666;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .label {
            color: #666;
            font-weight: bold;
          }
          .value {
            color: #111;
            font-weight: 600;
          }
          .amount-box {
            background: #fff8f0;
            border: 1px solid #ff6600;
            padding: 12px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .amount-box .val {
            font-size: 22px;
            color: #ff6600;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
          .stamp {
            display: inline-block;
            border: 2px solid #22c55e;
            color: #22c55e;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            letter-spacing: 1px;
            margin-top: 10px;
          }
          @media print {
            body { padding: 0; }
            .receipt-card { border-color: #111; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <h1>POWER SHAPE ACADEMIA</h1>
            <p>COMPROVANTE DE PAGAMENTO DE MENSALIDADE</p>
          </div>

          <div class="row">
            <span class="label">Aluno:</span>
            <span class="value">${dadosAluno?.nome || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Matrícula:</span>
            <span class="value">${dadosAluno?.matricula || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Mês de Referência:</span>
            <span class="value">${pagamento.mes_referencia}</span>
          </div>
          <div class="row">
            <span class="label">Data do Pagamento:</span>
            <span class="value">${dataFormatada}</span>
          </div>

          <div class="amount-box">
            <div class="label">VALOR PAGO</div>
            <div class="val">${valorFormatado}</div>
            <div class="stamp">STATUS: PAGO ✓</div>
          </div>

          <div class="footer">
            <p>Este recibo serve como comprovante de quitação para os serviços prestados pela Power Shape Academia.</p>
            <p>Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=650,height=700');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(conteudoJanela);
      printWindow.document.close();
    }
  }

  salvar(): void {
    if (!this.novoPagamento.valor || !this.novoPagamento.mes_referencia) {
      alert('Preencha todos os campos!');
      return;
    }

    this.pagamentoService.registrarPagamento(this.novoPagamento).subscribe({
      next: () => {
        alert('Pagamento registrado com sucesso!');
        this.fecharModal();
        if (this.alunoSelecionado) {
          this.carregarPagamentosDoUsuario(this.alunoSelecionado.id);
        }
      },
      error: (err) => {
        console.error('Erro ao registrar pagamento:', err);
        alert('Falha ao salvar pagamento.');
      }
    });
  }
}