'use client';

const RISCO_CONFIG = {
  baixo: { label: 'Baixo Risco', color: '#22c55e', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  medio: { label: 'Risco Médio', color: '#eab308', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  medio_alto: { label: 'Risco Médio-Alto', color: '#f97316', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  alto: { label: 'Alto Risco', color: '#ef4444', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  critico: { label: 'Risco Crítico', color: '#991b1b', textColor: 'text-red-900', bgColor: 'bg-red-100', borderColor: 'border-red-400' },
};

function getScoreColor(score: number): string {
  if (score >= 81) return '#22c55e';
  if (score >= 61) return '#f97316';
  if (score >= 31) return '#eab308';
  return '#ef4444';
}

interface ScoreCardProps {
  score_final: number;
  classificacao_risco: keyof typeof RISCO_CONFIG;
  confianca: number;
  hipotese_principal: string;
  razao_social?: string;
  cnpj?: string;
}

export default function ScoreCard({
  score_final,
  classificacao_risco,
  confianca,
  hipotese_principal,
  razao_social,
  cnpj,
}: ScoreCardProps) {
  const config = RISCO_CONFIG[classificacao_risco] ?? RISCO_CONFIG.medio;
  const color = getScoreColor(score_final);

  // SVG semicircle gauge
  const R = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = 180;
  const endAngle = 0;
  const totalDeg = 180;
  const scoreDeg = (score_final / 100) * totalDeg;

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToCartesian(cx, cy, r, endDeg);
    const e = polarToCartesian(cx, cy, r, startDeg);
    const large = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  }

  const bgPath = describeArc(cx, cy, R, 180, 360);
  const fgPath = describeArc(cx, cy, R, 180, 180 + scoreDeg);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {razao_social && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Empresa avaliada</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">{razao_social}</p>
          {cnpj && <p className="text-sm text-gray-500 mt-0.5">{cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}</p>}
        </div>
      )}

      <div className="flex justify-center mb-2">
        <svg width="200" height="110" viewBox="0 0 200 115">
          <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
          <path d={fgPath} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
          <text x="100" y="98" textAnchor="middle" fontSize="36" fontWeight="800" fill="#111827">
            {score_final}
          </text>
          <text x="100" y="112" textAnchor="middle" fontSize="11" fill="#6b7280">
            de 100
          </text>
        </svg>
      </div>

      <div className="flex justify-center mb-4">
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${config.textColor} ${config.bgColor} ${config.borderColor}`}>
          {config.label}
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-3">
        <p className="text-xs text-gray-500 font-medium mb-1">Hipótese principal</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">{hipotese_principal}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
            style={{ width: `${confianca}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{confianca}% de confiança</span>
      </div>
    </div>
  );
}
