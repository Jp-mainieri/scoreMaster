'use client';

import { useState } from 'react';
import ComparacaoView from '@/components/ComparacaoView';
import LoadingSteps from '@/components/LoadingSteps';

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

export default function CompararPage() {
  const [cnpj1, setCnpj1] = useState('');
  const [cnpj2, setCnpj2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score1: unknown; score2: unknown; veredito: string } | null>(null);
  const [error, setError] = useState('');

  async function handleComparar(e: React.FormEvent) {
    e.preventDefault();
    const c1 = cnpj1.replace(/\D/g, '');
    const c2 = cnpj2.replace(/\D/g, '');
    if (c1.length !== 14 || c2.length !== 14) {
      setError('Digite dois CNPJs válidos com 14 dígitos.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/comparar?cnpj1=${c1}&cnpj2=${c2}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError('Erro ao buscar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Início</a>
          <span className="text-gray-200">|</span>
          <a href="/monitoramento" className="text-blue-500 hover:text-blue-400 text-sm transition-colors">🔔 Monitoramento</a>
          <h1 className="text-2xl font-bold text-gray-900 ml-auto">
            Trust<span className="text-blue-500">Check</span>
            <span className="text-gray-400 font-normal text-lg ml-2">— Comparar</span>
          </h1>
        </div>

        <form onSubmit={handleComparar} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-8">
          <p className="text-sm text-gray-500 mb-4">Compare duas empresas e receba um veredito da IA sobre qual contratar.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Empresa 1</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="XX.XXX.XXX/XXXX-XX"
                value={cnpj1}
                onChange={(e) => setCnpj1(formatCNPJ(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Empresa 2</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="XX.XXX.XXX/XXXX-XX"
                value={cnpj2}
                onChange={(e) => setCnpj2(formatCNPJ(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Analisando...' : 'Comparar empresas'}
          </button>
        </form>

        {loading && (
          <div className="max-w-md mx-auto">
            <LoadingSteps currentStep={2} />
          </div>
        )}

        {result && (
          <ComparacaoView
            score1={result.score1 as Parameters<typeof ComparacaoView>[0]['score1']}
            score2={result.score2 as Parameters<typeof ComparacaoView>[0]['score2']}
            veredito={result.veredito}
          />
        )}
      </div>
    </main>
  );
}
