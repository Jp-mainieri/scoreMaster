'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { label: 'Consultando Receita Federal...', icon: '🏛️' },
  { label: 'Mapeando rede societária...', icon: '🕸️' },
  { label: 'Analisando padrões com IA...', icon: '🧠' },
  { label: 'Gerando score...', icon: '📊' },
];

export default function LoadingSteps({ currentStep = 0 }: { currentStep?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <div className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                done
                  ? 'bg-emerald-50 border-emerald-200'
                  : active
                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}
            >
              <span className={`text-xl ${active ? 'animate-pulse' : ''}`}>{step.icon}</span>
              <span
                className={`text-sm font-medium ${
                  done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {done && (
                <span className="ml-auto text-emerald-500 text-base">✓</span>
              )}
              {active && (
                <span className="ml-auto flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
