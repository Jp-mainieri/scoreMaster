const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const API_KEY = process.env.CGU_API_KEY ?? 'demo';
const HEADERS = { 'chave-api-dados': API_KEY, 'Accept': 'application/json' };

export interface Contrato {
  id: number;
  numeroContratoOuAta: string;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  valorInicial: number;
  valorFinal?: number;
  objeto: string;
  orgao: { nome: string; codigoSIAFI: string };
}

export async function consultarContratos(cnpj: string): Promise<Contrato[]> {
  const clean = cnpj.replace(/\D/g, '');
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `${BASE_URL}/contratos?cnpjFornecedor=${clean}&pagina=1`,
      { headers: HEADERS, signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
