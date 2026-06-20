import { consultarCNPJ, limparCNPJ } from '@/lib/cnpja';
import { chatCompletion } from '@/lib/claude';

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

export const ALERTAS_VALIDOS = [
  'Novo processo judicial',
  'Sanção CEIS/CNEP',
  'Score rebaixado',
  'Sócio com nova empresa suspeita',
  'Situação cadastral alterada',
  'Sócio saiu da empresa',
  'Score melhorou',
];

interface MockMonitoramento {
  score_atual: number;
  score_anterior: number;
  classificacao: FornecedorMonitorado['classificacao'];
  alertas: string[];
}

function buildPrompt(razaoSocial: string, cnae: string, situacao: string, porte: string): string {
  return `Você é um simulador de monitoramento contínuo de risco B2B, usado apenas para fins de demonstração de produto.

EMPRESA: ${razaoSocial}
CNAE: ${cnae}
SITUAÇÃO CADASTRAL: ${situacao}
PORTE: ${porte}

Gere um cenário FICTÍCIO e PLAUSÍVEL de monitoramento contínuo, como se esta empresa estivesse sendo acompanhada há algumas semanas por um sistema automático de score de risco. Use julgamento sobre o que seria plausível dado o CNAE, a situação cadastral e o porte — a maioria das empresas deve ter cenário estável e sem alertas; só gere alertas graves para uma minoria dos casos.

Escolha entre 0 e 2 alertas da lista abaixo (vazio se o cenário for de empresa estável):
${ALERTAS_VALIDOS.map((a) => `- "${a}"`).join('\n')}

RETORNE APENAS O JSON ABAIXO, SEM TEXTO ADICIONAL:
{
  "score_atual": <0-100>,
  "score_anterior": <0-100>,
  "classificacao": <"baixo"|"medio"|"medio_alto"|"alto"|"critico">,
  "alertas": []
}`;
}

export async function gerarMonitoramentoExemplo(cnpj: string): Promise<FornecedorMonitorado> {
  const clean = limparCNPJ(cnpj);
  const empresa = await consultarCNPJ(clean);

  const prompt = buildPrompt(
    empresa.company.name,
    empresa.mainActivity.text,
    empresa.status.text,
    empresa.company.size.text
  );

  const completion = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 300,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq não retornou JSON válido para o mockup de monitoramento');

  const parsed = JSON.parse(jsonMatch[0]) as MockMonitoramento;

  return {
    id: crypto.randomUUID(),
    cnpj: clean,
    razao_social: empresa.company.name,
    score_atual: parsed.score_atual,
    score_anterior: parsed.score_anterior,
    classificacao: parsed.classificacao,
    alertas: (parsed.alertas ?? []).filter((a) => ALERTAS_VALIDOS.includes(a)),
    variacao: parsed.score_atual - parsed.score_anterior,
    ultima_verificacao: new Date().toISOString(),
  };
}
