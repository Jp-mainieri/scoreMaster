'use client';

interface PilarChecklistItem {
  pilar: string;
  nome: string;
  status: 'positivo' | 'atencao' | 'negativo';
  motivo: string;
}

const STATUS_CONFIG = {
  positivo: { icon: '✓', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  atencao: { icon: '!', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  negativo: { icon: '✕', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

export default function ChecklistPilares({ pilares }: { pilares: PilarChecklistItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Por que esse score? — checklist por pilar
      </h2>
      <div className="flex flex-col gap-3">
        {pilares.map((p) => {
          const config = STATUS_CONFIG[p.status];
          return (
            <div
              key={p.pilar}
              className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${config.dot}`}
                >
                  {config.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">{p.pilar}</span>
                    <span className={`text-sm font-semibold ${config.color}`}>{p.nome}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.motivo}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
