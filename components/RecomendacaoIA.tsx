'use client';

interface RecomendacaoIAProps {
  recomendacao: string;
  bloqueadores?: string[];
}

export default function RecomendacaoIA({ recomendacao, bloqueadores = [] }: RecomendacaoIAProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⚡</span>
        <h3 className="font-semibold text-blue-900 text-sm">Recomendação da IA</h3>
      </div>
      <p className="text-sm text-blue-800 leading-relaxed">{recomendacao}</p>

      {bloqueadores.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Bloqueadores</p>
          <ul className="flex flex-col gap-1.5">
            {bloqueadores.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
