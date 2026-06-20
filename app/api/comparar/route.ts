import { NextRequest, NextResponse } from 'next/server';
import { consultarCNPJ, limparCNPJ } from '@/lib/cnpja';
import { consultarCEIS, consultarCNEP } from '@/lib/cgu';
import { consultarContratos } from '@/lib/transparencia';
import { buscarEmpresasDeSocio, normalizarNome, upsertSituacao } from '@/lib/database';
import {
  analisarPerfilSocietario,
  compararEmpresas,
  ScoreContext,
  SocioComRede,
  ScoreResult,
} from '@/lib/claude';

async function buildScore(
  cnpj: string
): Promise<{ resultado: ScoreResult; meta: Record<string, unknown> }> {
  const clean = limparCNPJ(cnpj);
  const empresa = await consultarCNPJ(clean);

  upsertSituacao(clean.slice(0, 8), {
    situacao_cadastral: empresa.status.text,
    cnae_principal: String(empresa.mainActivity.id),
  });

  const [ceis, cnep, contratos] = await Promise.all([
    consultarCEIS(clean),
    consultarCNEP(clean),
    consultarContratos(clean),
  ]);

  const sancoes = [...ceis, ...cnep];
  const sancaoTexto =
    sancoes.length === 0 ? 'Nenhuma sanção encontrada' : `${sancoes.length} sanção(ões)`;

  const contratosValor = contratos.reduce(
    (acc: number, c: { valorInicial?: number }) => acc + (c.valorInicial ?? 0),
    0
  );

  const members = empresa.company.members ?? [];
  const sociosComRedes: SocioComRede[] = members.map((member) => {
    const nome = member.person.name;
    const nomeNorm = normalizarNome(nome);
    const empresasNaRede = buscarEmpresasDeSocio(nomeNorm, member.person.taxId);
    return {
      nome,
      qualificacao: member.role.text,
      empresas_na_rede: empresasNaRede.map((e) => ({
        cnpj_basico: e.cnpj_basico,
        razao_social: e.razao_social,
        situacao_cadastral: e.situacao_cadastral,
        situacao_especial: e.situacao_especial,
        cnae_principal: e.cnae_principal,
        capital_social: e.capital_social,
        porte_empresa: e.porte_empresa,
        data_entrada: e.data_entrada_sociedade,
      })),
    };
  });

  const ctx: ScoreContext = {
    empresa: {
      cnpj: clean,
      razao_social: empresa.company.name,
      situacao: empresa.status.text,
      cnae: `${empresa.mainActivity.id} - ${empresa.mainActivity.text}`,
      capital_social: empresa.company.equity,
      porte: empresa.company.size.text,
      simples: empresa.company.simples.optant,
      mei: empresa.company.simei.optant,
    },
    socios_com_redes: sociosComRedes,
    sancoes: sancaoTexto,
    contratos_count: contratos.length,
    contratos_valor: contratosValor,
  };

  const resultado = await analisarPerfilSocietario(ctx);

  return {
    resultado,
    meta: {
      cnpj: clean,
      razao_social: empresa.company.name,
      situacao: empresa.status.text,
    },
  };
}

export async function GET(req: NextRequest) {
  const cnpj1 = req.nextUrl.searchParams.get('cnpj1');
  const cnpj2 = req.nextUrl.searchParams.get('cnpj2');

  if (!cnpj1 || !cnpj2) {
    return NextResponse.json({ error: 'cnpj1 e cnpj2 são obrigatórios' }, { status: 400 });
  }

  try {
    const [score1, score2] = await Promise.all([buildScore(cnpj1), buildScore(cnpj2)]);

    const veredito = await compararEmpresas(
      {
        ...score1.resultado,
        cnpj: limparCNPJ(cnpj1),
        razao_social: score1.meta.razao_social as string,
      },
      {
        ...score2.resultado,
        cnpj: limparCNPJ(cnpj2),
        razao_social: score2.meta.razao_social as string,
      }
    );

    return NextResponse.json({ score1, score2, veredito });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
