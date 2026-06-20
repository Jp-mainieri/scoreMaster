'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ScoreCard from '@/components/ScoreCard';
import SocioCard from '@/components/SocioCard';
import LoadingSteps from '@/components/LoadingSteps';
import RecomendacaoIA from '@/components/RecomendacaoIA';
import ChecklistPilares from '@/components/ChecklistPilares';
import { WATCHLIST_STORAGE_KEY } from '@/lib/watchlist-storage';

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
  bloqueadores: string[];
}

interface PilarChecklistItem {
  pilar: string;
  nome: string;
  status: 'positivo' | 'atencao' | 'negativo';
  motivo: string;
}

interface ApiResponse {
  resultado?: ScoreResult;
  pilares?: PilarChecklistItem[];
  meta?: {
    cnpj: string;
    razao_social: string;
    cnae: string;
    situacao: string;
    socios_count: number;
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
  const [monitorando, setMonitorando] = useState(false);
  const [monitorado, setMonitorado] = useState(false);
  const [monitorarErro, setMonitorarErro] = useState('');

  useEffect(() => {
    const timers = STEP_TIMINGS.map((delay, i) =>
      setTimeout(() => setLoadingStep(i + 1), delay)
    );
    fetchScore();
    return () => timers.forEach(clearTimeout);
  }, [cnpj]);

  useEffect(() => {
    try {
      const atual: Array<{ cnpj: string }> = JSON.parse(
        localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? '[]'
      );
      if (atual.some((f) => f.cnpj === cnpj)) setMonitorado(true);
    } catch {
      // localStorage indisponível — botão segue no estado padrão
    }
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

  async function handleMonitorar() {
    setMonitorando(true);
    setMonitorarErro('');
    try {
      const atual: Array<{ cnpj: string }> = JSON.parse(
        localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? '[]'
      );
      if (atual.some((f) => f.cnpj === cnpj)) {
        setMonitorado(true);
        return;
      }

      const res = await fetch('/api/monitoramento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj }),
      });
      const novo = await res.json();
      if (!res.ok) {
        setMonitorarErro(novo.error ?? 'Erro ao adicionar ao monitoramento.');
        return;
      }

      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([novo, ...atual]));
      setMonitorado(true);
    } catch {
      setMonitorarErro('Erro ao adicionar ao monitoramento. Tente novamente.');
    } finally {
      setMonitorando(false);
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

  const resultado = data?.resultado;
  const pilares = data?.pilares;
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
        <div className="mb-4">
          <ScoreCard
            score_final={resultado.score_final}
            classificacao_risco={resultado.classificacao_risco}
            confianca={resultado.confianca}
            hipotese_principal={resultado.hipotese_principal}
            razao_social={meta?.razao_social}
            cnpj={meta?.cnpj}
          />
        </div>

        {/* Monitorar empresa */}
        <div className="mb-6">
          {monitorado ? (
            <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl py-3">
              <span>✓ Empresa adicionada ao monitoramento</span>
              <a href="/monitoramento" className="underline hover:text-emerald-800">
                Ver watchlist
              </a>
            </div>
          ) : (
            <button
              onClick={handleMonitorar}
              disabled={monitorando}
              className="w-full bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {monitorando ? (
                <>Gerando exemplo de monitoramento...</>
              ) : (
                <>🔔 Monitorar esta empresa</>
              )}
            </button>
          )}
          {monitorarErro && (
            <p className="text-red-500 text-xs mt-2 text-center">{monitorarErro}</p>
          )}
        </div>

        {/* Métricas */}
        {meta && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Sócios', value: meta.socios_count },
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

        {/* Checklist por pilar */}
        {pilares && pilares.length > 0 && (
          <div className="mb-6">
            <ChecklistPilares pilares={pilares} />
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
