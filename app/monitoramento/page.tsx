'use client';

import { useState } from 'react';
import type { FornecedorMonitorado } from '@/lib/monitoramento';
import AlertaBadge from '@/components/AlertaBadge';

/* ── Risk palette (same as ScoreCard) ── */
const RISCO_CONFIG = {
  baixo:     { label: 'Baixo',      dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  medio:     { label: 'Médio',      dot: 'bg-yellow-400',  text: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30' },
  medio_alto:{ label: 'Médio-Alto', dot: 'bg-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30' },
  alto:      { label: 'Alto',       dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30' },
  critico:   { label: 'Crítico',    dot: 'bg-red-600',     text: 'text-red-500',     bg: 'bg-red-600/20',     border: 'border-red-500/40' },
} as const;

function scoreColor(score: number) {
  if (score >= 81) return 'text-emerald-400';
  if (score >= 61) return 'text-yellow-400';
  if (score >= 31) return 'text-orange-400';
  return 'text-red-400';
}

function borderLeftColor(classificacao: string) {
  if (classificacao === 'critico') return 'border-l-red-500';
  if (classificacao === 'alto') return 'border-l-orange-500';
  return 'border-l-transparent';
}

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, '');
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

function formatInputCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

/* ── Stats header cards ── */
function StatsHeader({ watchlist }: { watchlist: FornecedorMonitorado[] }) {
  const total = watchlist.length;
  const criticos = watchlist.filter((f) => f.classificacao === 'critico' || f.classificacao === 'alto').length;
  const totalAlertas = watchlist.reduce((acc, f) => acc + f.alertas.length, 0);
  const mediaScore = total > 0 ? Math.round(watchlist.reduce((acc, f) => acc + f.score_atual, 0) / total) : 0;

  const cards = [
    { label: 'Monitorados',  value: total,        icon: '👁️', accent: 'text-blue-400' },
    { label: 'Risco Alto/Crítico', value: criticos, icon: '🚨', accent: 'text-red-400' },
    { label: 'Alertas Ativos', value: totalAlertas, icon: '🔔', accent: 'text-orange-400' },
    { label: 'Score Médio',  value: mediaScore,    icon: '📊', accent: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{c.icon}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{c.label}</span>
          </div>
          <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Single watchlist row ── */
function WatchlistRow({
  fornecedor,
  index,
  onRemove,
}: {
  fornecedor: FornecedorMonitorado;
  index: number;
  onRemove: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const config = RISCO_CONFIG[fornecedor.classificacao] ?? RISCO_CONFIG.medio;
  const pulseDanger = fornecedor.variacao < -10;

  function handleRemove() {
    setRemoving(true);
    setTimeout(onRemove, 300);
  }

  return (
    <div
      className={`
        group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-4
        border-l-4 ${borderLeftColor(fornecedor.classificacao)}
        transition-all duration-300
        ${removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Col 1-3: Company info */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-white font-semibold text-sm leading-tight">{fornecedor.razao_social}</p>
          <p className="text-gray-500 text-xs mt-0.5 font-mono">{formatCNPJ(fornecedor.cnpj)}</p>
        </div>

        {/* Col 4: Score */}
        <div className="col-span-4 md:col-span-1 text-center">
          <p className={`text-2xl font-black ${scoreColor(fornecedor.score_atual)}`}>
            {fornecedor.score_atual}
          </p>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Score</p>
        </div>

        {/* Col 5: Risk badge */}
        <div className="col-span-4 md:col-span-2 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${config.text} ${config.bg} ${config.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>

        {/* Col 6: Variation */}
        <div className="col-span-4 md:col-span-1 text-center">
          {fornecedor.variacao > 0 && (
            <span className="text-emerald-400 text-sm font-bold">▲ +{fornecedor.variacao}</span>
          )}
          {fornecedor.variacao < 0 && (
            <span className={`text-red-400 text-sm font-bold ${pulseDanger ? 'animate-pulse' : ''}`}>
              ▼ {fornecedor.variacao}
            </span>
          )}
          {fornecedor.variacao === 0 && (
            <span className="text-gray-500 text-sm font-medium">— estável</span>
          )}
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">Variação</p>
        </div>

        {/* Col 7-9: Alerts */}
        <div className="col-span-12 md:col-span-3">
          {fornecedor.alertas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {fornecedor.alertas.map((alerta) => (
                <AlertaBadge key={alerta} tipo={alerta} />
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-600 italic">Nenhum alerta</span>
          )}
        </div>

        {/* Col 10-12: Actions */}
        <div className="col-span-12 md:col-span-2 flex items-center gap-2 justify-end">
          <span className="text-[10px] text-gray-600 hidden md:inline">{timeAgo(fornecedor.ultima_verificacao)}</span>
          <a
            href={`/resultado/${fornecedor.cnpj}`}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
          >
            Ver detalhes
          </a>
          <button
            onClick={handleRemove}
            className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            title="Remover da watchlist"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function MonitoramentoPage() {
  const [watchlist, setWatchlist] = useState<FornecedorMonitorado[]>([]);
  const [cnpjInput, setCnpjInput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [gerando, setGerando] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    const clean = cnpjInput.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('Digite um CNPJ válido com 14 dígitos.');
      return;
    }
    if (watchlist.some((f) => f.cnpj === clean)) {
      setError('CNPJ já está na watchlist.');
      return;
    }
    setError('');
    setGerando(true);

    try {
      const res = await fetch('/api/monitoramento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: clean }),
      });
      const novo = await res.json();

      if (!res.ok) {
        setError(novo.error ?? 'Erro ao gerar exemplo de monitoramento.');
        return;
      }

      setWatchlist((prev) => [novo as FornecedorMonitorado, ...prev]);
      setCnpjInput('');
      showToast(`✅ ${novo.razao_social} adicionada à watchlist — Score: ${novo.score_atual}`);
    } catch {
      setError('Erro ao buscar dados da empresa. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  function handleRemover(id: string) {
    setWatchlist((prev) => prev.filter((f) => f.id !== id));
    showToast('Fornecedor removido da watchlist.');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Início</a>
              <span className="text-gray-700">|</span>
              <a href="/comparar" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Comparar</a>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                Trust<span className="text-blue-400">Check</span>
                <span className="text-gray-500 font-normal text-lg ml-2">— Monitoramento</span>
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Watchlist de fornecedores. Alertas em tempo real sobre variações de risco.
            </p>
          </div>
        </div>

        {/* Stats */}
        <StatsHeader watchlist={watchlist} />

        {/* Add CNPJ form */}
        <form onSubmit={handleAdicionar} className="mb-8">
          <div className="bg-white/5 border border-white/15 rounded-2xl p-1.5 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">👁️</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Adicionar CNPJ à watchlist..."
                value={cnpjInput}
                onChange={(e) => setCnpjInput(formatInputCNPJ(e.target.value))}
                disabled={gerando}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={gerando}
              className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shrink-0"
            >
              {gerando ? 'Gerando exemplo...' : '🔔 Monitorar'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2 px-2">{error}</p>}
          {gerando && (
            <p className="text-gray-500 text-xs mt-2 px-2">
              Consultando CNPJá e gerando cenário de exemplo com IA...
            </p>
          )}
        </form>

        {/* Watchlist table */}
        {watchlist.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">👁️</p>
            <p className="text-gray-400 text-lg font-medium">Nenhum fornecedor monitorado</p>
            <p className="text-gray-600 text-sm mt-1">Adicione um CNPJ acima para começar a vigiar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[10px] text-gray-600 uppercase tracking-wider font-medium">
              <div className="col-span-3">Fornecedor</div>
              <div className="col-span-1 text-center">Score</div>
              <div className="col-span-2 text-center">Risco</div>
              <div className="col-span-1 text-center">Var.</div>
              <div className="col-span-3">Alertas</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>

            {/* Rows */}
            {watchlist.map((fornecedor, i) => (
              <WatchlistRow
                key={fornecedor.id}
                fornecedor={fornecedor}
                index={i}
                onRemove={() => handleRemover(fornecedor.id)}
              />
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 text-gray-500 text-xs px-4 py-2 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Verificação automática a cada 6 horas — Powered by Claude AI
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 border border-white/20 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl animate-slide-in-up z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
