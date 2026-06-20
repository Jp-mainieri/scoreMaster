import { NextRequest, NextResponse } from 'next/server';
import { consultarCNPJ, limparCNPJ } from '@/lib/cnpja';
import { consultarCEIS, consultarCNEP } from '@/lib/cgu';
import { consultarContratos } from '@/lib/transparencia';
import { consultarProcessos } from '@/lib/datajud';
import { buscarEmpresasDeSocio, normalizarNome, upsertSituacao } from '@/lib/database';
import { analisarPerfilSocietario, ScoreContext, SocioComRede } from '@/lib/claude';
import fs from 'fs';
import path from 'path';

function loadDemoCache(cnpj: string) {
  const cachePath = path.join(process.cwd(), 'data', 'demo-cnpjs', `${cnpj}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }
  return null;
}

export async function GET(req: NextRequest) {
  const cnpj = req.nextUrl.searchParams.get('cnpj');
  if (!cnpj) return NextResponse.json({ error: 'CNPJ obrigatório' }, { status: 400 });

  const clean = limparCNPJ(cnpj);
  if (clean.length !== 14) return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });

  const demo = loadDemoCache(clean);
  if (demo) return NextResponse.json(demo);

  try {
    const empresa = await consultarCNPJ(clean);

    const cnpjBasico = clean.slice(0, 8);
    upsertSituacao(cnpjBasico, {
      situacao_cadastral: empresa.status.text,
      cnae_principal: String(empresa.mainActivity.id),
    });

    const [ceis, cnep, contratos, processos] = await Promise.all([
      consultarCEIS(clean),
      consultarCNEP(clean),
      consultarContratos(clean),
      consultarProcessos(clean),
    ]);

    const sancoes = [...ceis, ...cnep];
    const sancaoTexto =
      sancoes.length === 0
        ? 'Nenhuma sanção encontrada'
        : `${sancoes.length} sanção(ões): ${sancoes
            .slice(0, 3)
            .map((s) =>
              (s as { tipoSancao?: { descricao: string } }).tipoSancao?.descricao ??
              (s as { descricaoFundamentoLegal?: string }).descricaoFundamentoLegal ??
              'sanção'
            )
            .join(', ')}`;

    const contratosValor = contratos.reduce(
      (acc: number, c: { valorInicial?: number }) => acc + (c.valorInicial ?? 0),
      0
    );

    const members = empresa.company.members ?? [];
    const sociosComRedes: SocioComRede[] = members.map((member) => {
      const nome = member.person.name;
      const nomeNorm = normalizarNome(nome);
      const empresasNaRede = buscarEmpresasDeSocio(nomeNorm);
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
      processos_count: processos.length,
      sancoes: sancaoTexto,
      contratos_count: contratos.length,
      contratos_valor: contratosValor,
    };

    const scoreResponse = await analisarPerfilSocietario(ctx);

    return NextResponse.json({
      ...scoreResponse,
      meta: {
        cnpj: clean,
        razao_social: empresa.company.name,
        cnae: empresa.mainActivity.text,
        situacao: empresa.status.text,
        socios_count: members.length,
        processos_count: processos.length,
        sancoes_count: sancoes.length,
        contratos_count: contratos.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
