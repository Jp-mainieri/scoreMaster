'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_CNPJS = [
  { cnpj: '33000167000101', label: 'Petrobras S.A.', hint: 'Score alto esperado' },
  { cnpj: '60701190000104', label: 'Banco Bradesco', hint: 'Score alto esperado' },
  { cnpj: '07526557000100', label: 'Exemplo médio', hint: 'Score médio esperado' },
];

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

export default function Home() {
  const router = useRouter();
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('Digite um CNPJ válido com 14 dígitos.');
      return;
    }
    setError('');
    router.push(`/resultado/${clean}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo + headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-5 border border-white/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Powered by Claude AI
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Trust<span className="text-blue-400">Check</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Score de risco societário com IA.<br />
            Analise qualquer empresa antes de contratar.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-1.5 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite o CNPJ..."
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 text-base outline-none"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              Analisar
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2 px-1">{error}</p>}
        </form>

        {/* Demo pills */}
        <div className="text-center mb-3">
          <p className="text-xs text-gray-500 mb-2">Exemplos rápidos</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {DEMO_CNPJS.map((d) => (
              <button
                key={d.cnpj}
                onClick={() => router.push(`/resultado/${d.cnpj}`)}
                className="bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation links */}
        <div className="text-center mt-6 flex items-center justify-center gap-4">
          <a href="/comparar" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            ⚖️ Comparar empresas
          </a>
          <span className="text-gray-700">|</span>
          <a href="/monitoramento" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            🔔 Monitoramento
          </a>
        </div>
      </div>

      {/* Pillars */}
      <div className="mt-16 w-full max-w-2xl">
        <p className="text-xs text-gray-500 text-center uppercase tracking-widest mb-5">6 pilares de análise</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { n: 'P1', t: 'Cadastral', d: 'Situação, CNAE, capital, porte' },
            { n: 'P2', t: 'Tributário', d: 'Simples Nacional, MEI' },
            { n: 'P3', t: 'Integridade', d: 'CEIS/CNEP — sanções' },
            { n: 'P4', t: 'Judicial', d: 'Processos ativos DataJud' },
            { n: 'P5', t: 'Operacional', d: 'Contratos públicos' },
            { n: 'P6', t: 'Rede ★', d: 'Mapeamento societário IA' },
          ].map((p) => (
            <div key={p.n} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-blue-400 text-xs font-bold">{p.n}</span>
              <p className="text-white text-sm font-medium mt-0.5">{p.t}</p>
              <p className="text-gray-500 text-xs mt-0.5">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
