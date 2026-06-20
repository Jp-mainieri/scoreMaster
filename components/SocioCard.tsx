'use client';

const PADRAO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  investidor_diversificado: { label: 'Investidor Diversificado', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  empresa_passagem: { label: 'Empresa Passagem', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  blindagem_patrimonial: { label: 'Blindagem Patrimonial', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  concentracao_serial: { label: 'Concentração Serial', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  perfil_limpo: { label: 'Perfil Limpo', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

interface SocioCardProps {
  nome: string;
  padrao: string;
  score_individual: number;
  empresas_na_rede: number;
  sinais_detectados: string[];
  justificativa: string;
}

export default function SocioCard({
  nome,
  padrao,
  score_individual,
  empresas_na_rede,
  sinais_detectados,
  justificativa,
}: SocioCardProps) {
  const config = PADRAO_CONFIG[padrao] ?? { label: padrao, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
  const iniciais = nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const barColor =
    score_individual >= 75 ? 'bg-emerald-500' :
    score_individual >= 50 ? 'bg-amber-400' :
    score_individual >= 30 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {iniciais}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{nome}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.color} ${config.bg} ${config.border}`}>
            {config.label}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-900">{score_individual}</p>
          <p className="text-xs text-gray-400">score</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Score individual</span>
          <span className="font-medium">{score_individual}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${score_individual}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <span className="font-medium text-gray-700">{empresas_na_rede}</span>
        <span>empresa{empresas_na_rede !== 1 ? 's' : ''} na rede societária</span>
      </div>

      {sinais_detectados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sinais_detectados.map((sinal, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 border border-gray-200">
              {sinal}
            </span>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div className="flex gap-2">
          <span className="text-sm shrink-0">⚡</span>
          <p className="text-xs text-gray-700 leading-relaxed">{justificativa}</p>
        </div>
      </div>
    </div>
  );
}
