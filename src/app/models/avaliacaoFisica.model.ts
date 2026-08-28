// Interface para o dropdown de busca de alunos no cabeçalho
export interface AlunoSugestao {
  id: number;
  matricula: string;
  nome: string;
}

// Tipos utilitários para protocolos e opções
export type ProtocoloCardio = 'BRUCE' | 'BALKE' | 'COOPER' | '1_MILHA' | 'ASTRAND';
export type ProtocoloComposicao = 'JACKSON_POLLOCK_3' | 'JACKSON_POLLOCK_7' | 'PETROSKI' | 'GUEDES';
export type RiscoExercicio = 'INTENSO' | 'MODERADO' | 'SEDENTARIO';
export type RiscoHistorico = 'NENHUM' | 'UM_APOS_60' | 'UM_ANTES_60' | 'VARIOS_ANTES_60';
export type RiscoTabagismo = 'NAO_FUMA' | 'ATE_10' | 'ATE_20' | 'MAIS_20';

export interface AvaliacaoFisica {
  id?: number;
  aluno_id: number;
  data_avaliacao: string;
  numero_avaliacao: number;

  // Anamnese & PAR-Q
  anamnese?: {
    objetivos: string;
    pratica_atividade: string;
    medicamentos?: string;
    cirurgia?: string;
    doencas_familia?: string;
    observacoes: string;
    parq_respostas?: { [chave: string]: boolean };
  };

  // Risco Coronariano
  risco_coronariano?: {
    idade: number;
    sexo: 'M' | 'F';
    peso?: number;
    exercicio_fisico: RiscoExercicio | string;
    historico_familiar: RiscoHistorico | string;
    tabagismo: RiscoTabagismo | string;
    colesterol?: string;
    pressao_sistolica?: string;
  };

  // Perímetros (Medidas em cm)
perimetros: {
  ombro?: number;
  torax_relaxado?: number;
  torax_inspirado?: number;
  braco_relaxado_dir?: number;
  braco_relaxado_esq?: number;
  braco_contraido_dir?: number;
  braco_contraido_esq?: number;
  antebraaco_dir?: number;
  antebraaco_esq?: number;
  cintura?: number;
  quadril?: number;
  coxa_dir?: number;
  coxa_esq?: number;
  panturrilha_dir?: number;
  panturrilha_esq?: number;
}
  // Composição Corporal
  composicao?: {
    peso: number;
    altura: number;
    protocolo?: ProtocoloComposicao | string;
    dobras?: {
      subescapular?: number;
      bicipital?: number;
      tricipital?: number;
      suprailiaca?: number;
      coxa?: number;
      abdominal?: number;
      peitoral?: number;
      axilar_media?: number;
      panturrilha?: number;
    };
    bioimpedancia?: {
      perc_gordura: number;
      perc_massa_magra: number;
    };
  };

 // Avaliação Cardiorrespiratória (VO2)
  cardiorrespiratoria?: {
    condicao_fisica?: 'ATLETA' | 'ATIVO' | 'SEDENTARIO' | string; // 👈 Adicionado
    frequencia_cardiaca_repouso?: number;                        // 👈 Adicionado
    protocolo_utilizado?: ProtocoloCardio | string;
    vo2_max_obtido?: number;
    vo2_max_previsto?: number;
    deficit_aerobico_percentual?: number;
  };

  // Testes Neuromotores
  neuromotores?: {
    flexao_bracos_reps?: number;
    abdominal_reps?: number;
    banco_wells_cm?: number;
  };

  // Avaliação Postural
  postural?: {
    foto_anterior_url?: string;
    foto_posterior_url?: string;
    foto_lateral_url?: string;
  };

  // Configuração de exibição
  configuracao?: {
    exibir_anamnese: boolean;
    exibir_risco: boolean;
    exibir_perimetros: boolean;
    exibir_composicao: boolean;
    exibir_cardio: boolean;
    exibir_neuromotores: boolean;
    exibir_postural: boolean;
    tipo_medida_composicao: 'DOBRAS' | 'BIOIMPEDANCIA';
  };
}