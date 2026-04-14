import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, TrendingUp, CheckCircle2,
  XCircle, ChevronRight, BarChart3
} from 'lucide-react'
import { useAdmin, type CompanyPlan } from '../../contexts/AdminContext'

const PLAN_STYLES: Record<CompanyPlan, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: 'text-stone-400', bg: 'bg-stone-800' },
  starter:    { label: 'Starter',    color: 'text-blue-400',  bg: 'bg-blue-900/50' },
  pro:        { label: 'Pro',        color: 'text-rose-400',  bg: 'bg-rose-900/50' },
  enterprise: { label: 'Enterprise', color: 'text-amber-400', bg: 'bg-amber-900/50' },
}

function BigStat({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-6 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white font-display tracking-tight">{value}</p>
        <p className="text-xs text-stone-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { companies, loading } = useAdmin()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const byPlan = (plan: CompanyPlan) => companies.filter(c => c.plan === plan).length
    return {
      total: companies.length,
      active: companies.filter(c => c.is_active).length,
      inactive: companies.filter(c => !c.is_active).length,
      totalMembers: companies.reduce((a, c) => a + c.member_count, 0),
      free: byPlan('free'),
      starter: byPlan('starter'),
      pro: byPlan('pro'),
      enterprise: byPlan('enterprise'),
    }
  }, [companies])

  // 5 most recent companies
  const recent = useMemo(() =>
    [...companies].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5)
  , [companies])

  return (
    <div className="min-h-full p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-0.5">Visão geral da plataforma ZeroPapel</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <BigStat label="Total de empresas" value={stats.total}       icon={Building2}    accent="bg-stone-600" />
        <BigStat label="Empresas ativas"   value={stats.active}      icon={CheckCircle2} accent="bg-emerald-700" />
        <BigStat label="Empresas inativas" value={stats.inactive}    icon={XCircle}      accent="bg-stone-700" />
        <BigStat label="Total de usuários" value={stats.totalMembers} icon={Users}        accent="bg-blue-700" />
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Plan breakdown */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={15} className="text-rose-400" />
            <h3 className="text-sm font-semibold text-white">Distribuição de Planos</h3>
          </div>
          <div className="space-y-3">
            {(['enterprise', 'pro', 'starter', 'free'] as CompanyPlan[]).map(plan => {
              const s = PLAN_STYLES[plan]
              const count = stats[plan]
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-stone-500">{count} empresa{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.bg}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent companies */}
        <div className="col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Empresas Recentes</h3>
            </div>
            <button
              onClick={() => navigate('/admin/companies')}
              className="text-xs text-stone-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              Ver todas <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-10 text-stone-600 text-sm">
              <Building2 size={24} className="mx-auto mb-2 opacity-40" />
              Nenhuma empresa cadastrada ainda
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(c => {
                const s = PLAN_STYLES[c.plan]
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/admin/companies/${c.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-700/20 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-rose-400">
                        {c.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-stone-500">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                      {s.label}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <Users size={11} />
                      {c.member_count}
                    </div>
                    {c.is_active
                      ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      : <XCircle size={14} className="text-stone-600 shrink-0" />
                    }
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
