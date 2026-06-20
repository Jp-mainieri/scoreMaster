import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

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
  respostas_adicionais?: string;
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
  perguntas_desambiguacao: string[];
  bloqueadores: string[];
}

export interface ScoreResponse {
  status: 'completo' | 'pendente_resposta';
  resultado?: ScoreResult;
  perguntas?: string[];
  contexto?: ScoreContext;
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
${ctx.respostas_adicionais ? `- Informações adicionais fornecidas: ${ctx.respostas_adicionais}` : ''}

INSTRUÇÕES:
1. Analise o padrão societário de CADA sócio considerando: número de empresas simultâneas, setores (CNAEs), situações cadastrais das empresas da rede, empresas com situação especial (falência/recuperação), capital social, datas de entrada/saída, endereços compartilhados.
2. Classifique cada sócio em um dos padrões:
   - "investidor_diversificado": múltiplas empresas ativas, setores distintos, histórico limpo
   - "empresa_passagem": empresas com vida curta (<2 anos), baixadas em sequência, capital mínimo
   - "blindagem_patrimonial": empresas no mesmo endereço, holdings cruzadas, controle indireto
   - "concentracao_serial": >7 empresas simultâneas, CNAEs incompatíveis, sem padrão claro
   - "perfil_limpo": poucos vínculos, empresa-alvo como principal, sem situações especiais
3. Considere o CNAE da empresa avaliada para contextualizar o que é normal ou suspeito.
4. Se o grau de confiança for < 70%, inclua até 2 perguntas de desambiguação no campo "perguntas_desambiguacao".${ctx.respostas_adicionais ? '\n5. O usuário já respondeu a uma rodada de perguntas de desambiguação (vide "Informações adicionais fornecidas" acima). NÃO faça novas perguntas — retorne "perguntas_desambiguacao" como array vazio e finalize a análise com a melhor estimativa possível, mesmo que a confiança permaneça abaixo de 70%.' : ''}

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
  "perguntas_desambiguacao": [],
  "bloqueadores": ["<bloqueador se houver>"]
}`;
}

export async function analisarPerfilSocietario(ctx: ScoreContext): Promise<ScoreResponse> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(ctx) }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2048,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Groq returned no valid JSON');

  const resultado: ScoreResult = JSON.parse(jsonMatch[0]);

  if (resultado.perguntas_desambiguacao?.length > 0) {
    return {
      status: 'pendente_resposta',
      perguntas: resultado.perguntas_desambiguacao,
      contexto: ctx,
    };
  }

  return { status: 'completo', resultado };
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

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 512,
  });

  return completion.choices[0]?.message?.content ?? '';
}
