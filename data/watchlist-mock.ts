/**
 * Watchlist — dados de monitoramento.
 *
 * O score NÃO fica aqui. Ele é buscado ao vivo na API /api/score
 * para manter consistência com a tela de resultado.
 *
 * O mock guarda apenas: alertas, variação simulada e metadados.
 */
export interface FornecedorMonitorado {
  id: string;
  cnpj: string;
  razao_social: string;
  score_atual: number | null;        // preenchido pela API em runtime
  score_anterior: number | null;     // score da verificação anterior (simulado)
  classificacao: 'baixo' | 'medio' | 'medio_alto' | 'alto' | 'critico' | null;
  alertas: string[];
  variacao: number | null;
  ultima_verificacao: string;
  loading?: boolean;
}

/**
 * Seed inicial da watchlist.
 * Os 3 primeiros usam CNPJs reais do cache (data/demo-cnpjs/).
 * O score_atual começa null e é preenchido pela API.
 * score_anterior simula a "última verificação" para calcular variação.
 */
export const WATCHLIST_SEED: FornecedorMonitorado[] = [
  {
    id: '1',
    cnpj: '33000167000101',
    razao_social: 'PETRÓLEO BRASILEIRO S.A. - PETROBRAS',
    score_atual: null,
    score_anterior: 91,
    classificacao: null,
    alertas: ['Score melhorou'],
    variacao: null,
    ultima_verificacao: '2026-06-20T10:30:00',
  },
  {
    id: '2',
    cnpj: '60701190000104',
    razao_social: 'BANCO BRADESCO S.A.',
    score_atual: null,
    score_anterior: 80,
    classificacao: null,
    alertas: [],
    variacao: null,
    ultima_verificacao: '2026-06-20T09:15:00',
  },
  {
    id: '3',
    cnpj: '07526557000100',
    razao_social: 'RC SERVICOS E COMERCIO LTDA',
    score_atual: null,
    score_anterior: 54,
    classificacao: null,
    alertas: ['Novo processo judicial', 'Score rebaixado', 'Sócio com nova empresa suspeita'],
    variacao: null,
    ultima_verificacao: '2026-06-19T22:45:00',
  },
];
