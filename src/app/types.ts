export interface LotteryResult {
  numero: number;
  numeroConcursoProximo?: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  trevosSorteados?: string[];
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  nomeMunicipioUFSorteio?: string;
  localSorteio?: string;
  listaRateioPremio?: {
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'free' | 'pro' | 'admin';
  avatar?: string;
  favorite_lottery?: string;
  cpf_cnpj?: string;
  premium_until?: string | null;
  show_in_ranking?: boolean;
  city?: string;
  state?: string;
}

export interface SavedGame {
  id: string;
  lottery: string;
  numbers: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  adminUsers: number;
  freeUsers: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'free' | 'pro' | 'admin';
  created_at: string;
}

export type ThemeType = 'meganeon' | 'cyberpunk' | 'matrix' | 'dracula' | 'ice';

export interface BetRecord {
  id: string;
  lottery: string;
  numbers: string;
  contest_num: number;
  cost: number;
  prize_won: number;
  created_at: string;
}
