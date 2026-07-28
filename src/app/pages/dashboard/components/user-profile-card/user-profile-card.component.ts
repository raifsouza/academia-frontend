import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioService } from '../../../../services/usuario.service';

@Component({
  selector: 'app-user-profile-card',
  standalone: true, // Se o seu componente for Standalone
  imports: [CommonModule], // 2. Adicione aqui no array imports
  templateUrl: './user-profile-card.component.html', // ou a sua template inline
  styleUrls: ['./user-profile-card.component.scss']
})
export class UserProfileCardComponent {
  @Input() usuario: any;

  public fotoProcessada: SafeUrl | string = '';
  public carregandoFoto: boolean = false;

  public avatarPadrao: string = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%23ff6600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
  constructor(private sanitizer: DomSanitizer, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.atualizarFoto();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.atualizarFoto();
    }
  }

  private atualizarFoto(): void {
    if (!this.usuario) {
      this.fotoProcessada = this.avatarPadrao;
      return;
    }

    // Busca foto_url ou foto no objeto
    const foto = this.usuario.foto_url || this.usuario.foto;

    if (!foto) {
      this.fotoProcessada = this.avatarPadrao;
      return;
    }

    // Se for Base64 (data:image/...)
    if (typeof foto === 'string' && foto.startsWith('data:')) {
      this.fotoProcessada = this.sanitizer.bypassSecurityTrustUrl(foto);
      return;
    }

    // Se for URL HTTP/HTTPS
    if (typeof foto === 'string' && foto.startsWith('http')) {
      this.fotoProcessada = foto;
      return;
    }

    // Se for caminho relativo do backend
    this.fotoProcessada = `http://localhost:3000${foto.startsWith('/') ? '' : '/'}${foto}`;
  }

  /**
   * Método disparado quando o usuário escolhe uma nova imagem no input file
   */
  onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files[0]) {
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    this.carregandoFoto = true;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;

      // Atualiza direto no estado local sem disparar requisição HTTP com falha
      const usuarioEditado = { ...this.usuario, foto_url: base64Image };
      this.usuarioService.atualizarEstadoUsuario(usuarioEditado);
      
      this.carregandoFoto = false;
    };

    reader.readAsDataURL(file);
  }
}

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.avatarPadrao;
  }

  formatarTelefone(tel: string): string {
    if (!tel) return 'N/A';
    const num = tel.replace(/\D/g, '');
    if (num.length === 11) {
      return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
    }
    return tel;
  }

 
  getDiaVencimento(dataStr: string): string {
    if (!dataStr) return '--';
    const partes = dataStr.split('T')[0].split('-');
    return partes[2] || '--';
  }
}