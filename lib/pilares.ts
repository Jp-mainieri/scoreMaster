import { ScoreContext, ScoreResult } from '@/lib/claude';

export interface PilarChecklist {
  pilar: string;
  nome: string;
  status: 'positivo' | 'atencao' | 'negativo';
  motivo: string;
}

const PADROES_RISCO = ['empresa_passagem', 'blindagem_patrimonial', 'concentracao_serial'];

function avaliarP1Cadastral(empresa: ScoreContext['empresa']): PilarChecklist {
  const base = { pilar: 'P1', nome: 'Cadastral' as const };

  if (empresa.situacao_especial) {
    return {
      ...base,
      status: 'negativo',
      motivo: `Empresa possui situação especial registrada ("${empresa.situacao_especial}") — sinal cadastral grave que costuma indicar falência, recuperação judicial ou liquidação.`,
    };
  }

  if (empresa.situacao !== 'Ativa') {
    return {
      ...base,
      status: 'negativo',
      motivo: `Situação cadastral atual é "${empresa.situacao}", não "Ativa" — empresas fora dessa situação representam risco alto para qualquer contratação.`,
    };
  }

  if (empresa.capital_social < 1000) {
    return {
      ...base,
      status: 'atencao',
      motivo: `Situação cadastral está Ativa, mas o capital social declarado é muito baixo (R$ ${empresa.capital_social.toLocaleString('pt-BR')}) — pode indicar baixa capacidade financeira formal, comum em empresas de fachada.`,
    };
  }

  return {
    ...base,
    status: 'positivo',
    motivo: `Situação cadastral Ativa, capital social de R$ ${empresa.capital_social.toLocaleString('pt-BR')} e porte "${empresa.porte}" — sem alertas cadastrais na Receita Federal.`,
  };
}

function avaliarP2Tributario(empresa: ScoreContext['empresa']): PilarChecklist {
  const base = { pilar: 'P2', nome: 'Tributário' as const };

  if (empresa.mei) {
    return {
      ...base,
      status: 'atencao',
      motivo: 'Empresa optante pelo MEI — regime com teto de faturamento e estrutura mínima, o que pode limitar a capacidade de honrar contratos de maior porte.',
    };
  }

  if (empresa.simples) {
    return {
      ...base,
      status: 'positivo',
      motivo: 'Optante do Simples Nacional — regime tributário regular e compatível com pequenas/médias empresas, sem implicação direta de risco.',
    };
  }

  return {
    ...base,
    status: 'positivo',
    motivo: 'Não optante do Simples Nacional — regime tributário compatível com empresas de maior porte ou faturamento.',
  };
}

function avaliarP3Integridade(sancoes: string): PilarChecklist {
  const base = { pilar: 'P3', nome: 'Integridade' as const };

  const semSancoes = sancoes.toLowerCase().includes('nenhuma');

  if (semSancoes) {
    return {
      ...base,
      status: 'positivo',
      motivo: 'Nenhuma sanção encontrada nos cadastros CEIS (inidôneas/suspensas) ou CNEP (atos lesivos à administração pública) da CGU.',
    };
  }

  return {
    ...base,
    status: 'negativo',
    motivo: `Sanção(ões) ativa(s) encontrada(s) nos cadastros CEIS/CNEP da CGU: ${sancoes}. Isso restringe ou impede a contratação por órgãos públicos e é um forte sinal de alerta para contratantes privados.`,
  };
}

function avaliarP4Operacional(contratosCount: number, contratosValor: number): PilarChecklist {
  const base = { pilar: 'P4', nome: 'Operacional' as const };

  if (contratosCount > 0) {
    return {
      ...base,
      status: 'positivo',
      motivo: `${contratosCount} contrato(s) público(s) firmado(s), totalizando R$ ${contratosValor.toLocaleString('pt-BR')} — indica capacidade operacional comprovada junto ao setor público.`,
    };
  }

  return {
    ...base,
    status: 'atencao',
    motivo: 'Nenhum contrato público encontrado no Portal da Transparência — não é necessariamente negativo (empresa pode atuar só no setor privado), mas não há essa evidência de capacidade operacional disponível.',
  };
}

function avaliarP5Rede(socios: ScoreResult['socios_analisados']): PilarChecklist {
  const base = { pilar: 'P5', nome: 'Rede societária' as const };

  if (socios.length === 0) {
    return {
      ...base,
      status: 'atencao',
      motivo: 'Nenhum sócio identificado para análise de rede societária.',
    };
  }

  const sociosDeRisco = socios.filter((s) => PADROES_RISCO.includes(s.padrao));

  if (sociosDeRisco.length > 0) {
    const nomes = sociosDeRisco.map((s) => `${s.nome} (${s.padrao.replace(/_/g, ' ')})`).join(', ');
    return {
      ...base,
      status: 'negativo',
      motivo: `${sociosDeRisco.length} de ${socios.length} sócio(s) com padrão societário de risco identificado pela IA: ${nomes}. Ver análise individual de cada sócio abaixo.`,
    };
  }

  return {
    ...base,
    status: 'positivo',
    motivo: `Todos os ${socios.length} sócio(s) analisados apresentam padrão societário limpo ou de investimento diversificado, sem sinais de empresa-passagem, blindagem patrimonial ou concentração serial. Ver análise individual de cada sócio abaixo.`,
  };
}

export function avaliarPilares(ctx: ScoreContext, resultado: ScoreResult): PilarChecklist[] {
  return [
    avaliarP1Cadastral(ctx.empresa),
    avaliarP2Tributario(ctx.empresa),
    avaliarP3Integridade(ctx.sancoes),
    avaliarP4Operacional(ctx.contratos_count, ctx.contratos_valor),
    avaliarP5Rede(resultado.socios_analisados),
  ];
}
