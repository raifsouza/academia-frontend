export interface Treino {
  id?: number;
  usuario_id: number;
  titulo: string;
  dia_semana: string;
  descricao: string;
  data_criacao?: string;
}