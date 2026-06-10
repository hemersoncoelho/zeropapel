import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Receipt, Hash, Minus, Wallet,
  LayoutGrid, FileText, BarChart3, ChevronRight,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TimeseriesChart } from '../components/reports/TimeseriesChart'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { useReportData } from '../hooks/useReportData'
import type { ReportOverview, GroupBreakdownRow, RecentTx, TimeseriesGroupBy } from '../types/reports'

// ── Period config ───────────────────────────────────────────────
type PeriodKey = '7d' | 'month' | '3m' | 'year'
type ViewType  = 'resumo' | 'dre' | 'grupos'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '7d',    label: '7 dias'   },
  { key: 'month', label: 'Este mês' },
  { key: '3m',    label: '3 meses'  },
  { key: 'year',  label: 'Este ano' },
]

const VIEWS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'resumo', label: 'Resumo',   icon: <LayoutGrid size={14} /> },
  { key: 'dre',    label: 'DRE',      icon: <FileText   size={14} /> },
  { key: 'grupos', label: 'Por Grupo',icon: <BarChart3  size={14} /> },
]

function computeDateRange(key: PeriodKey): { from: string; to: string } {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (key === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 6)
    return { from: fmt(s), to: fmt(now) }
  }
  if (key === '3m')   return { from: fmt(new Date(y, m - 2, 1)), to: fmt(new Date(y, m + 1, 0)) }
  if (key === 'year') return { from: fmt(new Date(y, 0, 1)),     to: fmt(new Date(y, 11, 31))   }
  return { from: fmt(new Date(y, m, 1)), to: fmt(new Date(y, m + 1, 0)) }
}

function autoGroupBy(p: PeriodKey): TimeseriesGroupBy {
  if (p === '7d') return 'day'
  if (p === 'month') return 'week'
  return 'month'
}

function pctDiff(curr: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((curr - prev) / Math.abs(prev)) * 100)
}

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

// ── Shared atoms ────────────────────────────────────────────────
function TrendBadge({ curr, prev }: { curr: number; prev?: number }) {
  if (prev === undefined || prev === 0) return null
  const pct = pctDiff(curr, prev)
  if (pct === null) return null
  if (Math.abs(pct) < 1) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-400">
      <Minus size={11} />Estável
    </span>
  )
  const up = pct > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
      up ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
    }`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

const STATUS_PILL: Record<string, { bg: string; text: string; label: string }> = {
  open:     { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Aberto'   },
  paid:     { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pago'     },
  partial:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Parcial'  },
  overdue:  { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Vencido'  },
  canceled: { bg: 'bg-stone-100',   text: 'text-stone-500',   label: 'Cancelado'},
}

// ── KPI card ────────────────────────────────────────────────────
interface MetricCardProps {
  label:       string
  value:       number
  prevValue?:  number
  format?:     'currency' | 'count'
  icon:        React.ReactNode
  iconBg:      string
  iconText:    string
  accentColor: string
  alert?:      boolean
  loading?:    boolean
}

function MetricCard({
  label, value, prevValue, format = 'currency',
  icon, iconBg, iconText, accentColor, alert, loading,
}: MetricCardProps) {
  return (
    <div className={`
      relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4
      shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5
      before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-2xl before:${accentColor}
    `}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <span className={iconText}>{icon}</span>
        </div>
        {prevValue !== undefined && <TrendBadge curr={value} prev={prevValue} />}
        {alert && value > 0 && (
          <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-1.5">
          <div className="h-2.5 w-16 bg-stone-100 rounded" />
          <div className="h-7 w-28 bg-stone-100 rounded" />
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">{label}</p>
          <p className={`text-xl font-display font-bold tracking-tight sm:text-2xl ${
            alert && value > 0 ? 'text-red-600' : 'text-stone-900'
          }`}>
            {format === 'currency' ? formatCurrency(value) : value.toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {/* decorative bg blob */}
      <div className={`absolute -bottom-5 -right-5 w-14 h-14 rounded-full opacity-[0.06] ${accentColor}`} />
    </div>
  )
}

// ── Activity feed ───────────────────────────────────────────────
function ActivityFeed({ data, loading, onViewAll }: { data: RecentTx[]; loading: boolean; onViewAll: () => void }) {
  if (loading) return (
    <div className="space-y-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5 border-b border-stone-50 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-stone-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-44 bg-stone-100 rounded" />
            <div className="h-2.5 w-28 bg-stone-50 rounded" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-20 bg-stone-100 rounded" />
            <div className="h-2.5 w-12 bg-stone-50 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )

  if (data.length === 0) return (
    <div className="py-14 flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-1">
        <Receipt size={20} className="text-stone-300" />
      </div>
      <p className="text-sm text-stone-400">Nenhum lançamento no período.</p>
    </div>
  )

  return (
    <div>
      {data.slice(0, 8).map(tx => {
        const isRec = tx.direction === 'receivable'
        const pill  = STATUS_PILL[tx.status] ?? STATUS_PILL.open
        return (
          <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-stone-50 last:border-0 -mx-5 px-5 hover:bg-stone-50/60 transition-colors group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isRec ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              {isRec
                ? <ArrowUpRight size={14} className="text-emerald-600" />
                : <ArrowDownRight size={14} className="text-rose-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{tx.description}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {fmtDate(tx.tx_date)}{tx.operational_group ? ` · ${tx.operational_group}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-mono font-semibold ${isRec ? 'text-emerald-600' : 'text-stone-800'}`}>
                {isRec ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${pill.bg} ${pill.text}`}>
                {pill.label}
              </span>
            </div>
          </div>
        )
      })}
      {data.length > 8 && (
        <button type="button" onClick={onViewAll} className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1 py-2.5 text-xs font-medium text-rose-600 transition-colors hover:text-rose-700 sm:min-h-0">
          Ver todos os lançamentos <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

// ── DRE view ────────────────────────────────────────────────────
function DreView({ overview, breakdown, loading }: { overview: ReportOverview | null; breakdown: GroupBreakdownRow[]; loading: boolean }) {
  const revenues = breakdown.filter(r => r.direction === 'receivable')
  const expenses = breakdown.filter(r => r.direction === 'payable')
  const balance  = overview?.balance_total ?? 0
  const positive = balance >= 0

  if (loading) return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <div className="h-3 bg-stone-100 rounded w-48" />
          <div className="h-3 bg-stone-100 rounded w-24" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* DRE header */}
      <div className="flex flex-col gap-3 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-800">Demonstração do Resultado</h3>
          <p className="mt-0.5 text-xs text-stone-400">Estrutura receitas ↔ despesas do período</p>
        </div>
        <span className={`shrink-0 self-start text-xs font-medium px-2.5 py-1 rounded-full sm:self-auto ${
          positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {positive ? 'Superávit' : 'Déficit'}
        </span>
      </div>

      {/* RECEITAS */}
      <div className="px-4 py-4 sm:px-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Receitas
        </p>
        <div className="space-y-0">
          {revenues.length > 0 ? revenues.map(r => (
            <div key={r.group_name} className="flex flex-col gap-1 border-b border-stone-50 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xs font-mono text-stone-400">(+)</span>
                <span className="truncate text-sm text-stone-600">{r.group_name}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs font-mono text-stone-400">{r.percentage.toFixed(1)}%</span>
                <span className="shrink-0 text-right font-mono text-sm font-semibold text-emerald-600 tabular-nums">
                  {formatCurrency(r.total_amount)}
                </span>
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-stone-400 italic">Sem grupos cadastrados</span>
              <span className="text-sm font-mono font-semibold text-emerald-600">{formatCurrency(overview?.revenue_total ?? 0)}</span>
            </div>
          )}
        </div>
        <div className="-mx-4 mt-1 flex items-center justify-between border-t border-emerald-100 bg-emerald-50/50 px-4 py-2.5 sm:-mx-6 sm:px-6">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Receitas</span>
          <span className="text-base font-display font-bold text-emerald-700">{formatCurrency(overview?.revenue_total ?? 0)}</span>
        </div>
      </div>

      {/* DESPESAS */}
      <div className="border-t border-dashed border-stone-200 px-4 py-4 sm:px-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          Despesas
        </p>
        <div className="space-y-0">
          {expenses.length > 0 ? expenses.map(r => (
            <div key={r.group_name} className="flex flex-col gap-1 border-b border-stone-50 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xs font-mono text-stone-400">(-)</span>
                <span className="truncate text-sm text-stone-600">{r.group_name}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs font-mono text-stone-400">{r.percentage.toFixed(1)}%</span>
                <span className="shrink-0 text-right font-mono text-sm font-semibold text-stone-700 tabular-nums">
                  ({formatCurrency(r.total_amount)})
                </span>
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-stone-400 italic">Sem grupos cadastrados</span>
              <span className="text-sm font-mono font-semibold text-stone-700">({formatCurrency(overview?.expense_total ?? 0)})</span>
            </div>
          )}
        </div>
        <div className="-mx-4 mt-1 flex items-center justify-between border-t border-rose-100 bg-rose-50/50 px-4 py-2.5 sm:-mx-6 sm:px-6">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Total Despesas</span>
          <span className="text-base font-display font-bold text-rose-700">({formatCurrency(overview?.expense_total ?? 0)})</span>
        </div>
      </div>

      {/* RESULTADO */}
      <div className={`border-t-2 px-4 py-5 sm:px-6 ${positive ? 'border-emerald-500 bg-emerald-50/40' : 'border-red-500 bg-red-50/30'}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="min-w-0">
            <p className="mb-0.5 text-xs font-mono uppercase tracking-widest text-stone-500">Resultado Líquido</p>
            {overview && overview.revenue_total > 0 && (
              <p className="text-xs text-stone-400">
                Margem: {Math.round((balance / overview.revenue_total) * 100)}%
              </p>
            )}
          </div>
          <p className={`break-words text-2xl font-display font-bold sm:text-3xl ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Por Grupo view ──────────────────────────────────────────────
const EXPENSE_COLORS = ['bg-rose-400', 'bg-orange-400', 'bg-red-500', 'bg-rose-500', 'bg-orange-500', 'bg-red-400']
const REVENUE_COLORS = ['bg-emerald-400', 'bg-teal-400', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-green-400']

function GroupPanel({
  title, total, rows, colors, emptyMsg, loading,
}: {
  title: string; total: number; rows: GroupBreakdownRow[]; colors: string[]; emptyMsg: string; loading: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        <span className="font-mono text-sm font-bold tabular-nums text-stone-900">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="flex justify-between">
                <div className="h-2.5 w-32 bg-stone-100 rounded" />
                <div className="h-2.5 w-16 bg-stone-100 rounded" />
              </div>
              <div className="h-2 bg-stone-100 rounded-full" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">{emptyMsg}</p>
        ) : (
          rows.map((row, i) => (
            <div key={row.group_name}>
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                  <span className="font-medium text-stone-700 truncate">{row.group_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-stone-500 font-mono tabular-nums">
                  <span>{formatCurrency(row.total_amount)}</span>
                  <span className="text-stone-300">·</span>
                  <span className="font-semibold text-stone-600">{row.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                  style={{ width: `${Math.min(100, Math.max(1, row.percentage))}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function GruposView({ overview, breakdown, loading }: { overview: ReportOverview | null; breakdown: GroupBreakdownRow[]; loading: boolean }) {
  const expenses = breakdown.filter(r => r.direction === 'payable')
  const revenues = breakdown.filter(r => r.direction === 'receivable')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GroupPanel
        title="Despesas por Grupo"
        total={overview?.expense_total ?? 0}
        rows={expenses}
        colors={EXPENSE_COLORS}
        emptyMsg="Nenhuma despesa no período."
        loading={loading}
      />
      <GroupPanel
        title="Receitas por Grupo"
        total={overview?.revenue_total ?? 0}
        rows={revenues}
        colors={REVENUE_COLORS}
        emptyMsg="Nenhuma receita no período."
        loading={loading}
      />
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export function DashboardPage() {
  const { activeCompany, profile } = useAuth()
  const { can }  = usePermission()
  const navigate = useNavigate()

  const [activePeriod, setActivePeriod] = useState<PeriodKey>('month')
  const [groupBy,      setGroupBy]      = useState<TimeseriesGroupBy>('week')
  const [activeView,   setActiveView]   = useState<ViewType>('resumo')

  const { from: dateFrom, to: dateTo } = useMemo(() => computeDateRange(activePeriod), [activePeriod])

  const { overview, timeseries, breakdown, recentTx, loading, error, refetch } =
    useReportData(activeCompany?.id, dateFrom, dateTo, groupBy)

  const handlePeriod = (key: PeriodKey) => {
    setActivePeriod(key)
    setGroupBy(autoGroupBy(key))
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const overdueAlert = (overview?.overdue_count ?? 0) > 0

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-24 pt-1 sm:px-6 sm:pb-20">

      {/* ── Header banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-gradient-to-br from-rose-50 via-orange-50/20 to-stone-50 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-200/20 pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-24 h-24 rounded-full bg-orange-200/20 pointer-events-none" />
        <div className="absolute top-2 right-64 w-10 h-10 rounded-full bg-rose-300/10 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-semibold text-stone-900 flex items-center gap-2">
              {greeting}{firstName ? `, ${firstName}` : ''} <span>👋</span>
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {activeCompany?.name} · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="-mx-1 flex max-w-full touch-pan-x items-center gap-0.5 overflow-x-auto rounded-xl border border-stone-200/80 bg-white/70 p-0.5 shadow-sm backdrop-blur-sm scrollbar-hide sm:mx-0">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePeriod(p.key)}
                  className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:py-1.5 ${
                    activePeriod === p.key
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-white/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {can('create:transactions') && (
              <Button className="w-full shrink-0 sm:w-auto" icon={<Plus size={14} />} size="sm" onClick={() => navigate('/lancamentos')}>
                Lançamento
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-start">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Dados analíticos indisponíveis</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {error.includes('get_report')
                ? 'Execute a migration 20260416000002 no Supabase para ativar os relatórios.'
                : error}
            </p>
          </div>
          <button type="button" onClick={refetch} className="min-h-[44px] shrink-0 self-start text-left text-xs font-medium text-amber-700 underline sm:min-h-0">
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Receita total"
          value={overview?.revenue_total ?? 0}
          prevValue={overview?.revenue_prev}
          icon={<TrendingUp size={17} />}
          iconBg="bg-emerald-50"
          iconText="text-emerald-600"
          accentColor="bg-emerald-500"
          loading={loading}
        />
        <MetricCard
          label="Despesa total"
          value={overview?.expense_total ?? 0}
          prevValue={overview?.expense_prev}
          icon={<TrendingDown size={17} />}
          iconBg="bg-rose-50"
          iconText="text-rose-600"
          accentColor="bg-rose-500"
          loading={loading}
        />
        <MetricCard
          label="Saldo do período"
          value={overview?.balance_total ?? 0}
          prevValue={overview?.balance_prev}
          icon={<Wallet size={17} />}
          iconBg={(overview?.balance_total ?? 0) >= 0 ? 'bg-blue-50' : 'bg-red-50'}
          iconText={(overview?.balance_total ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}
          accentColor={(overview?.balance_total ?? 0) >= 0 ? 'bg-blue-500' : 'bg-red-500'}
          loading={loading}
        />
        <MetricCard
          label="Ticket médio"
          value={overview?.avg_ticket ?? 0}
          icon={<Receipt size={17} />}
          iconBg="bg-violet-50"
          iconText="text-violet-600"
          accentColor="bg-violet-500"
          loading={loading}
        />
        <MetricCard
          label="Lançamentos"
          value={overview?.tx_count ?? 0}
          format="count"
          icon={<Hash size={17} />}
          iconBg="bg-stone-50"
          iconText="text-stone-500"
          accentColor="bg-stone-400"
          loading={loading}
        />
      </div>

      {/* ── View tabs ──────────────────────────────────────── */}
      <div className="-mx-1 flex w-full max-w-full touch-pan-x items-center gap-1 self-start overflow-x-auto rounded-xl border border-stone-200/60 bg-stone-100/80 p-1 scrollbar-hide sm:mx-0 sm:w-fit">
        {VIEWS.map(v => (
          <button
            key={v.key}
            type="button"
            onClick={() => setActiveView(v.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:px-4 sm:py-2 ${
              activeView === v.key
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className={activeView === v.key ? 'text-rose-600' : ''}>{v.icon}</span>
            {v.label}
          </button>
        ))}
        {overdueAlert && (
          <div className="ml-1 mr-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-600">{overview?.overdue_count} vencido{overview!.overdue_count > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── View content ───────────────────────────────────── */}
      {activeView === 'resumo' && (
        <div className="space-y-4">
          {/* Chart */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Evolução Financeira</h3>
                <p className="text-xs text-stone-400 mt-0.5">Receita, despesa e saldo — {dateFrom} → {dateTo}</p>
              </div>
              <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5 self-start sm:self-auto">
                {(['day', 'week', 'month'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      groupBy === g ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {g === 'day' ? 'Dia' : g === 'week' ? 'Semana' : 'Mês'}
                  </button>
                ))}
              </div>
            </div>
            <TimeseriesChart data={timeseries} groupBy={groupBy} loading={loading} />
          </div>

          {/* Activity + quick breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Atividade Recente</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Últimos lançamentos do período</p>
                </div>
                <button onClick={() => navigate('/lancamentos')} className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors flex items-center gap-0.5">
                  Ver todos <ChevronRight size={12} />
                </button>
              </div>
              <ActivityFeed data={recentTx} loading={loading} onViewAll={() => navigate('/lancamentos')} />
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-stone-800">Distribuição</h3>
                <p className="text-xs text-stone-400 mt-0.5">Top grupos do período</p>
              </div>
              {/* Quick breakdown — top 3 per direction */}
              <GroupPanel
                title=""
                total={overview?.expense_total ?? 0}
                rows={breakdown.filter(r => r.direction === 'payable').slice(0, 3)}
                colors={EXPENSE_COLORS}
                emptyMsg="Sem despesas no período."
                loading={loading}
              />
              {!loading && overview && overview.revenue_total > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
                  <p className="text-xs text-stone-400">Margem líquida</p>
                  <p className={`text-lg font-display font-bold ${overview.balance_total >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {Math.round((overview.balance_total / overview.revenue_total) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'dre' && (
        <DreView overview={overview} breakdown={breakdown} loading={loading} />
      )}

      {activeView === 'grupos' && (
        <GruposView overview={overview} breakdown={breakdown} loading={loading} />
      )}

    </div>
  )
}
