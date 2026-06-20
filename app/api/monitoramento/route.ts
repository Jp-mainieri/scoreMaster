import { NextRequest, NextResponse } from 'next/server';
import { gerarMonitoramentoExemplo } from '@/lib/monitoramento';
import { limparCNPJ } from '@/lib/cnpja';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cnpj = body?.cnpj as string | undefined;

  if (!cnpj) return NextResponse.json({ error: 'CNPJ obrigatório' }, { status: 400 });

  const clean = limparCNPJ(cnpj);
  if (clean.length !== 14) return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });

  try {
    const fornecedor = await gerarMonitoramentoExemplo(clean);
    return NextResponse.json(fornecedor);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
