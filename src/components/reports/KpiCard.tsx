import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

type Accent = 'emerald' | 'red' | 'stone' | 'amber' | 'blue'

interface KpiCardProps {
  label:      string
  value:      number
  prevValue?: number
  format?:    'currency' | 'count'
  accent?:    Accent
  loading?:   boolean
  icon?:      ReactNode
}

const ACCENT_BG: Record<Accent, string> = {
  emerald: 'bg-emerald-50 border-emerald-100',
  red:     'bg-red-50 border-red-100',
  stone:   'bg-white border-stone-200',
  amber:   'bg-amber-50 border-amber-100',
  blue:    'bg-blue-50 border-blue-100',
}

const ACCENT_TEXT: Record<Accent, string> = {
  emerald: 'text-emerald-700',
  red:     'text-red-600',
  stone:   'text-stone-900',
  amber:   'text-amber-700',
  blue:    'text-blue-700',
}

function computeTrend(value: number, prev: number) {
  if (prev === 0) return { trend: 'neutral' as const, pct: 0 }
  const pct = Math.round(((value - prev) / Math.abs(prev)) * 100)
  return {
    trend: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('neutral' as const),
    pct:   Math.abs(pct),
  }
}

export function KpiCard({
  label,
  value,
  prevValue,
  format  = 'currency',
  accent  = 'stone',
  loading = false,
  icon: _icon,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-5 animate-pulse">
        <div className="h-3 w-24 bg-stone-100 rounded mb-4" />
        <div className="h-7 w-32 bg-stone-100 rounded mb-3" />
        <div className="h-3 w-20 bg-stone-50 rounded" />
      </div>
    )
  }

  const displayValue =
    format === 'currency'
      ? formatCurrency(value)
      : value.toLocaleString('pt-BR')

  const { trend, pct } =
    prevValue !== undefined ? computeTrend(value, prevValue) : { trend: 'neutral' as const, pct: 0 }

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-2.5 ${ACCENT_BG[accent]}`}>
      <span className="text-xs font-mono uppercase tracking-wider text-stone-400 leading-none">
        {label}
      </span>

      <span className={`text-2xl font-display font-semibold tracking-tight ${ACCENT_TEXT[accent]}`}>
        {displayValue}
      </span>

      {prevValue !== undefined && (
        <div className="flex items-center gap-1.5 min-h-[16px]">
          {trend === 'up'      && <TrendingUp   size={13} className="text-emerald-500 shrink-0" />}
          {trend === 'down'    && <TrendingDown  size={13} className="text-red-400 shrink-0"    />}
          {trend === 'neutral' && <Minus         size={13} className="text-stone-400 shrink-0"  />}

          <span
            className={`text-xs font-medium ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-stone-400'
            }`}
          >
            {trend === 'neutral' ? 'Estável vs anterior' : `${pct}% vs anterior`}
          </span>
        </div>
      )}
    </div>
  )
}
