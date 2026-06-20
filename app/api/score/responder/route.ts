import { NextRequest, NextResponse } from 'next/server';
import { analisarPerfilSocietario, ScoreContext } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { contexto, respostas }: { contexto: ScoreContext; respostas: string[] } = body;

  if (!contexto || !respostas) {
    return NextResponse.json({ error: 'contexto e respostas são obrigatórios' }, { status: 400 });
  }

  const ctxEnriquecido: ScoreContext = {
    ...contexto,
    respostas_adicionais: respostas.join(' | '),
  };

  try {
    const result = await analisarPerfilSocietario(ctxEnriquecido);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
