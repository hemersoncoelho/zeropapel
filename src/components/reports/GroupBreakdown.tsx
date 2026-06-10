import { formatCurrency } from '../../lib/utils'
import type { GroupBreakdownRow } from '../../types/reports'

interface GroupBreakdownProps {
  data:     GroupBreakdownRow[]
  loading?: boolean
}

const EXPENSE_PALETTE = [
  'bg-red-400',
  'bg-rose-400',
  'bg-orange-400',
  'bg-rose-500',
  'bg-red-500',
  'bg-orange-500',
]

const REVENUE_PALETTE = [
  'bg-emerald-400',
  'bg-teal-400',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-green-400',
]

function Section({
  title,
  rows,
  palette,
}: {
  title:   string
  rows:    GroupBreakdownRow[]
  palette: string[]
}) {
  if (rows.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3">{title}</h4>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={`${row.group_name}-${row.direction}`}>
            <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
              <span className="font-medium text-stone-700 truncate">{row.group_name}</span>
              <span className="font-mono text-stone-500 shrink-0 tabular-nums">
                {formatCurrency(row.total_amount)}&nbsp;·&nbsp;{row.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${palette[i % palette.length]}`}
                style={{ width: `${Math.min(100, Math.max(1, row.percentage))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GroupBreakdown({ data, loading }: GroupBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-3 w-40 bg-stone-100 rounded mb-2" />
            <div className="h-1.5 bg-stone-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const expenses = data.filter(r => r.direction === 'payable')
  const revenues = data.filter(r => r.direction === 'receivable')

  if (data.length === 0) {
    return (
      <p className="text-sm text-stone-400 py-6 text-center">
        Nenhum dado no período selecionado.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <Section title="Despesas por grupo" rows={expenses} palette={EXPENSE_PALETTE} />
      <Section title="Receitas por grupo"  rows={revenues} palette={REVENUE_PALETTE} />
    </div>
  )
}
