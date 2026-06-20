'use client';

import ScoreCard from './ScoreCard';
import SocioCard from './SocioCard';

interface ScoreData {
  resultado: {
    score_final: number;
    classificacao_risco: 'baixo' | 'medio' | 'medio_alto' | 'alto' | 'critico';
    confianca: number;
    hipotese_principal: string;
    recomendacao: string;
    socios_analisados: Array<{
      nome: string;
      padrao: string;
      score_individual: number;
      empresas_na_rede: number;
      sinais_detectados: string[];
      justificativa: string;
    }>;
  };
  meta: {
    cnpj: string;
    razao_social: string;
  };
}

interface ComparacaoViewProps {
  score1: ScoreData;
  score2: ScoreData;
  veredito: string;
}

export default function ComparacaoView({ score1, score2, veredito }: ComparacaoViewProps) {
  const winner =
    score1.resultado.score_final > score2.resultado.score_final ? 1 :
    score2.resultado.score_final > score1.resultado.score_final ? 2 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[score1, score2].map((s, i) => (
          <div key={i} className="relative">
            {winner === i + 1 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Recomendado
                </span>
              </div>
            )}
            <div className={`rounded-2xl overflow-hidden ${winner === i + 1 ? 'ring-2 ring-emerald-400' : ''}`}>
              <ScoreCard
                score_final={s.resultado.score_final}
                classificacao_risco={s.resultado.classificacao_risco}
                confianca={s.resultado.confianca}
                hipotese_principal={s.resultado.hipotese_principal}
                razao_social={s.meta.razao_social}
                cnpj={s.meta.cnpj}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚖️</span>
          <h3 className="font-semibold text-white">Veredito da IA</h3>
        </div>
        <p className="text-gray-200 leading-relaxed text-sm">{veredito}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[score1, score2].map((s, i) => (
          <div key={i}>
            <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
              Sócios — {s.meta.razao_social}
            </h4>
            <div className="flex flex-col gap-3">
              {s.resultado.socios_analisados.map((socio, j) => (
                <SocioCard key={j} {...socio} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
