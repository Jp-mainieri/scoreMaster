const BASE_URL = 'https://open.cnpja.com';
const cache = new Map<string, { data: CnpjaOffice; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export interface CnpjaMember {
  since: string | null;
  person: {
    id: string;
    type: string;
    name: string;
    taxId: string | null;
    age?: string;
    country?: { id: number; name: string };
  };
  role: { id: number; text: string };
}

export interface CnpjaOffice {
  taxId: string;
  alias?: string;
  founded?: string;
  head?: boolean;
  status: { id: number; text: string };
  statusDate?: string;
  mainActivity: { id: number; text: string };
  sideActivities?: Array<{ id: number; text: string }>;
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zip: string;
    details?: string;
  };
  company: {
    id: string;
    name: string;
    equity: number;
    nature: { id: number; text: string };
    size: { id: number; acronym: string; text: string };
    simples: { optant: boolean; since: string | null };
    simei: { optant: boolean; since: string | null };
    members: CnpjaMember[];
  };
}

export async function consultarCNPJ(cnpj: string): Promise<CnpjaOffice> {
  const clean = cnpj.replace(/\D/g, '');
  const cached = cache.get(clean);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${BASE_URL}/office/${clean}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`CNPJá API error ${res.status}: ${await res.text()}`);
    }

    const data: CnpjaOffice = await res.json();
    cache.set(clean, { data, ts: Date.now() });
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function formatarCNPJ(cnpj: string): string {
  const c = limparCNPJ(cnpj);
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
