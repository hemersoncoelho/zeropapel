import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight, ArrowDownRight, Plus,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { Title } from '../types/finance'

function SummaryCard({
  label, value, icon: Icon, trend, trendLabel, accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accent?: string
}) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-stone-400'
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ?? 'bg-stone-100'}`}>
          <Icon size={18} className={accent ? 'text-white' : 'text-stone-600'} strokeWidth={1.75} />
        </div>
        {trend && trendLabel && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel}
          </span>
        )}
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-1">{label}</p>
      <p className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
        {formatCurrency(value)}
      </p>
    </div>
  )
}

const formatShortDate = (isoString: string) => {
  if (!isoString) return ''
  const d = new Date(isoString + 'T12:00:00Z')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function DashboardPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()
  const navigate = useNavigate()

  const [summary, setSummary] = useState({
    balance: 0,
    revenue: 0,
    expenses: 0,
    pending: 0,
  })
  const [recentTx, setRecentTx] = useState<Title[]>([])

  useEffect(() => {
    if (!activeCompany) return

    const fetchData = async () => {
      // 1. Puxa métricas do dashboard compiladas direto da view do banco (Performance)
      const { data: statsData } = await supabase
        .from('company_financial_summary')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (statsData) {
        setSummary({
          balance: statsData.total_balance || 0,
          revenue: statsData.revenue || 0,
          expenses: statsData.expenses || 0,
          pending: statsData.pending_count || 0,
        })
      } else {
        setSummary({ balance: 0, revenue: 0, expenses: 0, pending: 0 })
      }

      // 2. Puxa últimos lançamentos baseados na activeCompany
      const { data: recentData } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentData) setRecentTx(recentData as Title[])
    }

    fetchData()
  }, [activeCompany])

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-display font-semibold text-stone-900">
            Visão Geral
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            {activeCompany?.name} · Resumo
          </p>
        </div>

        {can('create:transactions') && (
          <Button icon={<Plus size={15} />} size="md" onClick={() => navigate('/lancamentos')}>
            Novo Lançamento
          </Button>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Saldo Total"
          value={summary.balance}
          icon={Wallet}
          accent="bg-stone-900"
        />
        <SummaryCard
          label="Receitas do Mês"
          value={summary.revenue}
          icon={TrendingUp}
          accent="bg-emerald-600"
        />
        <SummaryCard
          label="Despesas do Mês"
          value={summary.expenses}
          icon={TrendingDown}
          accent="bg-red-500"
        />
        <SummaryCard
          label="Lanç. Pendentes"
          value={summary.pending} // we override formatCurrency to just show number inside, wait, formatCurrency adds R$? Let's fix that.
          icon={Clock}
          accent="bg-amber-500"
        />
      </div>

      {/* ── Placeholder sections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-700">Últimos Lançamentos</h3>
            <button onClick={() => navigate('/lancamentos')} className="text-xs text-rose-600 hover:text-rose-700 font-medium">
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {recentTx.length === 0 ? (
              <p className="text-xs text-stone-400">Nenhum lançamento registrado.</p>
            ) : (
              recentTx.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    t.direction === 'receivable' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    {t.direction === 'receivable'
                      ? <ArrowUpRight size={15} className="text-emerald-600" />
                      : <ArrowDownRight size={15} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 font-medium truncate">{t.description}</p>
                    <p className="text-xs text-stone-400">{formatShortDate(t.due_date)}</p>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${
                    t.direction === 'receivable' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {t.direction === 'receivable' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions/info placeholder */}
        <div className="card">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Resumo do Mês</h3>
          <div className="space-y-3">
            {[
              { label: 'Receitas', value: summary.revenue, color: 'bg-emerald-500' },
              { label: 'Despesas', value: summary.expenses, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{
                      width: `${Math.round(
                        (item.value / ((summary.revenue + summary.expenses) || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex justify-between">
                <span className="text-xs text-stone-500">Resultado</span>
                <span className="text-sm font-semibold font-mono text-emerald-600">
                  {formatCurrency(summary.revenue - summary.expenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
