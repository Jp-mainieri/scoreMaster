'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ScoreCard from '@/components/ScoreCard';
import SocioCard from '@/components/SocioCard';
import LoadingSteps from '@/components/LoadingSteps';
import RecomendacaoIA from '@/components/RecomendacaoIA';

interface ScoreResult {
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

interface ApiResponse {
  status: 'completo' | 'pendente_resposta';
  resultado?: ScoreResult;
  perguntas?: string[];
  contexto?: unknown;
  meta?: {
    cnpj: string;
    razao_social: string;
    cnae: string;
    situacao: string;
    socios_count: number;
    processos_count: number;
    sancoes_count: number;
    contratos_count: number;
  };
  error?: string;
}

const STEP_TIMINGS = [800, 2000, 4000, 7000];

export default function ResultadoPage() {
  const params = useParams();
  const cnpj = params.cnpj as string;

  const [loadingStep, setLoadingStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');
  const [respostas, setRespostas] = useState<string[]>([]);
  const [inputRespostas, setInputRespostas] = useState<string[]>([]);
  const [respondendo, setRespondendo] = useState(false);

  useEffect(() => {
    const timers = STEP_TIMINGS.map((delay, i) =>
      setTimeout(() => setLoadingStep(i + 1), delay)
    );
    fetchScore();
    return () => timers.forEach(clearTimeout);
  }, [cnpj]);

  async function fetchScore() {
    try {
      const res = await fetch(`/api/score?cnpj=${cnpj}`);
      const json: ApiResponse = await res.json();
      setData(json);
      if (json.error) setError(json.error);
    } catch {
      setError('Erro ao buscar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }

  async function responderPerguntas() {
    if (!data?.contexto) return;
    setRespondendo(true);
    try {
      const res = await fetch('/api/score/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto: data.contexto, respostas: inputRespostas }),
      });
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      setError('Erro ao processar respostas.');
    } finally {
      setRespondendo(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Trust<span className="text-blue-500">Check</span>
            </h1>
            <p className="text-gray-500 text-sm">
              Analisando CNPJ {cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
            </p>
          </div>
          <LoadingSteps currentStep={loadingStep} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na análise</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/" className="text-blue-500 hover:underline text-sm">← Voltar</a>
        </div>
      </main>
    );
  }

  // Pending disambiguation questions
  if (data?.status === 'pendente_resposta' && data.perguntas && !respondendo) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤔</span>
              <h2 className="font-bold text-gray-900">Preciso de mais informações</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Para aumentar a precisão da análise, responda:
            </p>
            <div className="flex flex-col gap-4">
              {data.perguntas.map((pergunta, i) => (
                <div key={i}>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {i + 1}. {pergunta}
                  </label>
                  <input
                    type="text"
                    value={inputRespostas[i] ?? ''}
                    onChange={(e) => {
                      const updated = [...inputRespostas];
                      updated[i] = e.target.value;
                      setInputRespostas(updated);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Sua resposta..."
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={responderPerguntas}
                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Analisar com contexto
              </button>
              <button
                onClick={() => setData({ ...data, status: 'completo', resultado: undefined })}
                className="text-gray-500 hover:text-gray-700 text-sm px-4"
              >
                Pular
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const resultado = data?.resultado;
  const meta = data?.meta;

  if (!resultado) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">← Voltar</a>
          <span className="text-gray-200">|</span>
          <a href="/comparar" className="text-blue-500 hover:text-blue-400 transition-colors text-sm">
            Comparar com outra empresa
          </a>
          <span className="text-gray-200">|</span>
          <a href="/monitoramento" className="text-blue-500 hover:text-blue-400 transition-colors text-sm">
            🔔 Monitoramento
          </a>
        </div>

        {/* Score principal */}
        <div className="mb-6">
          <ScoreCard
            score_final={resultado.score_final}
            classificacao_risco={resultado.classificacao_risco}
            confianca={resultado.confianca}
            hipotese_principal={resultado.hipotese_principal}
            razao_social={meta?.razao_social}
            cnpj={meta?.cnpj}
          />
        </div>

        {/* Métricas */}
        {meta && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Sócios', value: meta.socios_count },
              { label: 'Processos', value: meta.processos_count },
              { label: 'Sanções', value: meta.sancoes_count },
              { label: 'Contratos', value: meta.contratos_count },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className={`text-2xl font-bold ${m.value > 0 && m.label !== 'Contratos' ? 'text-red-500' : 'text-gray-900'}`}>
                  {m.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recomendação */}
        <div className="mb-6">
          <RecomendacaoIA
            recomendacao={resultado.recomendacao}
            bloqueadores={resultado.bloqueadores}
          />
        </div>

        {/* Sócios */}
        {resultado.socios_analisados.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Análise societária individual
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultado.socios_analisados.map((socio, i) => (
                <SocioCard key={i} {...socio} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
