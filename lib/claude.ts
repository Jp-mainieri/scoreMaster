import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_PRIMARY = 'llama-3.3-70b-versatile';
const MODEL_FALLBACK = 'llama-3.1-8b-instant';

async function chatCompletion(params: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>) {
  try {
    return await groq.chat.completions.create({ ...params, model: MODEL_PRIMARY });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return await groq.chat.completions.create({ ...params, model: MODEL_FALLBACK });
    }
    throw err;
  }
}

export interface SocioComRede {
  nome: string;
  qualificacao: string;
  empresas_na_rede: Array<{
    cnpj_basico: string;
    razao_social: string | null;
    situacao_cadastral: string | null;
    situacao_especial: string | null;
    cnae_principal: string | null;
    capital_social: string | null;
    porte_empresa: string | null;
    data_entrada: string;
  }>;
}

export interface ScoreContext {
  empresa: {
    cnpj: string;
    razao_social: string;
    situacao: string;
    cnae: string;
    capital_social: number;
    porte: string;
    simples: boolean;
    mei: boolean;
    situacao_especial?: string;
  };
  socios_com_redes: SocioComRede[];
  sancoes: string;
  contratos_count: number;
  contratos_valor: number;
}

export interface ScoreResult {
  score_final: number;
  classificacao_risco: 'baixo' | 'medio' | 'medio_alto' | 'alto' | 'critico';
  confianca: number;
  socios_analisados: Array<{
    nome: string;
    padrao: string;
    score_individual: number;
    empresas_na_rede: number;
    sinais_detectados: string[];
    justificativa: string;
  }>;
  hipotese_principal: string;
  recomendacao: string;
  bloqueadores: string[];
}

function buildPrompt(ctx: ScoreContext): string {
  return `Você é um analista especializado em risco societário B2B brasileiro. Sua função é analisar o perfil de sócios e sua rede de empresas e classificar o risco para quem quer contratar esta empresa como fornecedor.

EMPRESA AVALIADA:
${JSON.stringify(ctx.empresa, null, 2)}

PERFIL DOS SÓCIOS E SUAS REDES:
${JSON.stringify(ctx.socios_com_redes, null, 2)}

DADOS ADICIONAIS:
- Sanções CEIS/CNEP: ${ctx.sancoes}
- Contratos públicos firmados: ${ctx.contratos_count} (valor total: R$ ${ctx.contratos_valor.toLocaleString('pt-BR')})

INSTRUÇÕES:
1. Analise o padrão societário de CADA sócio considerando: número de empresas simultâneas, setores (CNAEs), situações cadastrais das empresas da rede, empresas com situação especial (falência/recuperação), capital social, datas de entrada/saída, endereços compartilhados.
2. Classifique cada sócio em um dos padrões:
   - "investidor_diversificado": múltiplas empresas ativas, setores distintos, histórico limpo
   - "empresa_passagem": empresas com vida curta (<2 anos), baixadas em sequência, capital mínimo
   - "blindagem_patrimonial": empresas no mesmo endereço, holdings cruzadas, controle indireto
   - "concentracao_serial": >7 empresas simultâneas, CNAEs incompatíveis, sem padrão claro
   - "perfil_limpo": poucos vínculos, empresa-alvo como principal, sem situações especiais
3. Considere o CNAE da empresa avaliada para contextualizar o que é normal ou suspeito.
4. Sempre finalize a análise com a melhor estimativa possível, mesmo que os dados disponíveis sejam limitados — não deixe de retornar um score por falta de informação.

RETORNE APENAS O JSON ABAIXO, SEM TEXTO ADICIONAL:
{
  "score_final": <0-100>,
  "classificacao_risco": <"baixo"|"medio"|"medio_alto"|"alto"|"critico">,
  "confianca": <0-100>,
  "socios_analisados": [
    {
      "nome": "<nome>",
      "padrao": "<padrao_classificado>",
      "score_individual": <0-100>,
      "empresas_na_rede": <numero>,
      "sinais_detectados": ["<sinal1>", "<sinal2>"],
      "justificativa": "<explicacao em 2-3 frases diretas>"
    }
  ],
  "hipotese_principal": "<hipotese em 1 frase>",
  "recomendacao": "<o que o tomador deve fazer — acionável e específico>",
  "bloqueadores": ["<bloqueador se houver>"]
}`;
}

export async function analisarPerfilSocietario(ctx: ScoreContext): Promise<ScoreResult> {
  const completion = await chatCompletion({
    messages: [{ role: 'user', content: buildPrompt(ctx) }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2048,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq returned no valid JSON');

  return JSON.parse(jsonMatch[0]) as ScoreResult;
}

export async function compararEmpresas(
  empresa1: ScoreResult & { cnpj: string; razao_social: string },
  empresa2: ScoreResult & { cnpj: string; razao_social: string }
): Promise<string> {
  const prompt = `Você é um consultor de risco B2B. Compare as duas empresas abaixo e dê um veredito direto sobre qual contratar.

EMPRESA 1: ${empresa1.razao_social} (CNPJ: ${empresa1.cnpj})
- Score: ${empresa1.score_final}/100
- Risco: ${empresa1.classificacao_risco}
- Hipótese: ${empresa1.hipotese_principal}
- Recomendação individual: ${empresa1.recomendacao}

EMPRESA 2: ${empresa2.razao_social} (CNPJ: ${empresa2.cnpj})
- Score: ${empresa2.score_final}/100
- Risco: ${empresa2.classificacao_risco}
- Hipótese: ${empresa2.hipotese_principal}
- Recomendação individual: ${empresa2.recomendacao}

Responda em até 4 frases diretas: qual contratar, por quê, e quais cautelas tomar. Linguagem para tomador de decisão, sem jargão técnico.`;

  const completion = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 512,
  });

  return completion.choices[0]?.message?.content ?? '';
}
