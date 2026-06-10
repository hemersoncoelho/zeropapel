import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import type { TimeseriesGroupBy } from '../../types/reports'

interface ReportFiltersProps {
  dateFrom:     string
  dateTo:       string
  groupBy:      TimeseriesGroupBy
  loading:      boolean
  onDateFrom:   (v: string) => void
  onDateTo:     (v: string) => void
  onGroupBy:    (v: TimeseriesGroupBy) => void
  onRefresh:    () => void
}

type QuickRange = { label: string; from: string; to: string }

function buildQuickRanges(): QuickRange[] {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  return [
    {
      label: 'Este mês',
      from:  fmt(new Date(y, m, 1)),
      to:    fmt(new Date(y, m + 1, 0)),
    },
    {
      label: 'Mês anterior',
      from:  fmt(new Date(y, m - 1, 1)),
      to:    fmt(new Date(y, m, 0)),
    },
    {
      label: 'Este trimestre',
      from:  fmt(new Date(y, Math.floor(m / 3) * 3, 1)),
      to:    fmt(new Date(y, Math.floor(m / 3) * 3 + 3, 0)),
    },
    {
      label: 'Este ano',
      from:  fmt(new Date(y, 0, 1)),
      to:    fmt(new Date(y, 11, 31)),
    },
  ]
}

const QUICK_RANGES = buildQuickRanges()

const GROUP_OPTIONS: { value: TimeseriesGroupBy; label: string }[] = [
  { value: 'day',   label: 'Por dia'    },
  { value: 'week',  label: 'Por semana' },
  { value: 'month', label: 'Por mês'   },
]

export function ReportFilters({
  dateFrom,
  dateTo,
  groupBy,
  loading,
  onDateFrom,
  onDateTo,
  onGroupBy,
  onRefresh,
}: ReportFiltersProps) {
  const applyQuick = (range: QuickRange) => {
    onDateFrom(range.from)
    onDateTo(range.to)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">

      {/* Atalhos de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mr-1">Atalhos</span>
        {QUICK_RANGES.map(range => (
          <button
            key={range.label}
            onClick={() => applyQuick(range)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
              dateFrom === range.from && dateTo === range.to
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-100'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Data inicial</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Data final</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Granularidade do gráfico</label>
          <select
            value={groupBy}
            onChange={e => onGroupBy(e.target.value as TimeseriesGroupBy)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {GROUP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Button
            variant="primary"
            icon={<RefreshCw size={14} />}
            onClick={onRefresh}
            loading={loading}
            className="w-full"
          >
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  )
}
