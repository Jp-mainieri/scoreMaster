'use client';

export const ALERTA_CONFIG: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  'Novo processo judicial':        { icon: '⚖️', bg: 'bg-red-600',     text: 'text-white',    border: 'border-red-700' },
  'Sanção CEIS/CNEP':              { icon: '🚫', bg: 'bg-red-600',     text: 'text-white',    border: 'border-red-700' },
  'Score rebaixado':               { icon: '📉', bg: 'bg-orange-500',  text: 'text-white',    border: 'border-orange-600' },
  'Sócio com nova empresa suspeita': { icon: '🕵️', bg: 'bg-orange-500', text: 'text-white',   border: 'border-orange-600' },
  'Situação cadastral alterada':   { icon: '📋', bg: 'bg-yellow-500',  text: 'text-gray-900', border: 'border-yellow-600' },
  'Sócio saiu da empresa':         { icon: '🚪', bg: 'bg-yellow-500',  text: 'text-gray-900', border: 'border-yellow-600' },
  'Score melhorou':                { icon: '📈', bg: 'bg-emerald-500', text: 'text-white',    border: 'border-emerald-600' },
};

interface AlertaBadgeProps {
  tipo: string;
}

export default function AlertaBadge({ tipo }: AlertaBadgeProps) {
  const config = ALERTA_CONFIG[tipo] ?? { icon: '⚠️', bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} shadow-sm`}
    >
      <span className="text-[11px]">{config.icon}</span>
      {tipo}
    </span>
  );
}
