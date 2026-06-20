/** eslint-disable
 * Aqui ele está pegando os dados do fornecedor
 */
export interface FornecedorMonitorado {
  id: string;
  cnpj: string;
  razao_social: string;
  score_atual: number;
  score_anterior: number;
  classificacao: 'baixo' | 'medio' | 'medio_alto' | 'alto' | 'critico';
  alertas: string[];
  variacao: number;
  ultima_verificacao: string;
}

export const WATCHLIST_MOCK: FornecedorMonitorado[] = [
  {
    id: '1',
    cnpj: '12345678000190',
    razao_social: 'CONSTRUTORA ALFA LTDA',
    score_atual: 38,
    score_anterior: 61,
    classificacao: 'alto',
    alertas: ['Novo processo judicial', 'Score rebaixado'],
    variacao: -23,
    ultima_verificacao: '2026-06-20T10:30:00',
  },
  {
    id: '2',
    cnpj: '98765432000110',
    razao_social: 'TECH SOLUTIONS SA',
    score_atual: 87,
    score_anterior: 85,
    classificacao: 'baixo',
    alertas: [],
    variacao: 2,
    ultima_verificacao: '2026-06-20T09:15:00',
  },
  {
    id: '3',
    cnpj: '45678901000123',
    razao_social: 'DISTRIBUIDORA BETA ME',
    score_atual: 54,
    score_anterior: 54,
    classificacao: 'medio',
    alertas: ['Situação cadastral alterada'],
    variacao: 0,
    ultima_verificacao: '2026-06-19T22:45:00',
  },
  {
    id: '4',
    cnpj: '67890123000145',
    razao_social: 'GRUPO GAMA HOLDINGS',
    score_atual: 19,
    score_anterior: 31,
    classificacao: 'critico',
    alertas: ['Sanção CEIS/CNEP', 'Sócio com nova empresa suspeita'],
    variacao: -12,
    ultima_verificacao: '2026-06-20T11:00:00',
  },
];
