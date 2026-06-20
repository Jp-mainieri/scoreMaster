const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const API_KEY = process.env.CGU_API_KEY ?? 'demo';
const HEADERS = { 'chave-api-dados': API_KEY, 'Accept': 'application/json' };

export interface SancaoCEIS {
  nomeInformacaoSancionado: string;
  cpfCnpjSancionado: string;
  tipoPessoa: string;
  dataInicioSancao: string;
  dataFimSancao?: string;
  tipoSancao: { descricao: string };
  orgaoSancionador: { nome: string };
  fundamentacaoLegal: string;
}

export interface SancaoCNEP {
  nomeInformacaoSancionado: string;
  cpfCnpjSancionado: string;
  tipoPessoa: string;
  dataPublicacaoDou?: string;
  valorMulta?: number;
  orgaoSancionador: { nome: string };
  descricaoFundamentoLegal: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

export async function consultarCEIS(cnpj: string): Promise<SancaoCEIS[]> {
  const clean = cnpj.replace(/\D/g, '');
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/ceis?cnpj=${clean}&pagina=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function consultarCNEP(cnpj: string): Promise<SancaoCNEP[]> {
  const clean = cnpj.replace(/\D/g, '');
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/cnep?cnpj=${clean}&pagina=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
