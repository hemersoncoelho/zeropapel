import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Search, RefreshCw, TrendingUp, Users,
  CheckCircle2, XCircle, ChevronRight, AlertCircle, Plus
} from 'lucide-react'
import { useAdmin, type AdminCompany, type CompanyPlan } from '../../contexts/AdminContext'
import { CreateCompanyModal } from '../../components/admin/CreateCompanyModal'
import { formatDocument } from '../../lib/utils'

const PLAN_STYLES: Record<CompanyPlan, { label: string; bg: string; text: string; dot: string }> = {
  free:       { label: 'Free',       bg: 'bg-stone-800',  text: 'text-stone-300', dot: 'bg-stone-500' },
  starter:    { label: 'Starter',    bg: 'bg-blue-900/60',  text: 'text-blue-300',  dot: 'bg-blue-400' },
  pro:        { label: 'Pro',        bg: 'bg-rose-900/60',  text: 'text-rose-300',  dot: 'bg-rose-400' },
  enterprise: { label: 'Enterprise', bg: 'bg-amber-900/60', text: 'text-amber-300', dot: 'bg-amber-400' },
}

function PlanBadge({ plan }: { plan: CompanyPlan }) {
  const s = PLAN_STYLES[plan]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.04] p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display">{value}</p>
        <p className="text-xs text-stone-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

const PLANS: (CompanyPlan | 'all')[] = ['all', 'free', 'starter', 'pro', 'enterprise']

export function AdminCompaniesPage() {
  const { companies, loading, error, refreshCompanies } = useAdmin()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<CompanyPlan | 'all'>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const q = search.toLowerCase()
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.document ?? '').includes(q)
      const matchesPlan = filterPlan === 'all' || c.plan === filterPlan
      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' && c.is_active) ||
        (filterActive === 'inactive' && !c.is_active)
      return matchesSearch && matchesPlan && matchesActive
    })
  }, [companies, search, filterPlan, filterActive])

  const stats = useMemo(() => ({
    total: companies.length,
    active: companies.filter(c => c.is_active).length,
    pro: companies.filter(c => c.plan === 'pro' || c.plan === 'enterprise').length,
    members: companies.reduce((a, c) => a + c.member_count, 0),
  }), [companies])

  return (
    <div className="mx-auto min-h-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-white sm:text-2xl">Empresas</h1>
          <p className="mt-0.5 text-sm text-stone-500">Gestão de todas as empresas cadastradas na plataforma</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={refreshCompanies}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-sm text-stone-300 transition-all hover:bg-white/[0.1] hover:text-white sm:min-h-0 sm:py-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition-all hover:bg-rose-700 sm:min-h-0 sm:py-2"
          >
            <Plus size={14} />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de empresas" value={stats.total} icon={Building2} color="bg-stone-600" />
        <StatCard label="Empresas ativas" value={stats.active} icon={CheckCircle2} color="bg-emerald-700" />
        <StatCard label="Planos pagos" value={stats.pro} icon={TrendingUp} color="bg-rose-700" />
        <StatCard label="Total de usuários" value={stats.members} icon={Users} color="bg-blue-700" />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="min-h-[48px] w-full rounded-lg border border-white/[0.08] bg-white/[0.05] py-2.5 pl-9 pr-4 text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:bg-white/[0.07] focus:outline-none sm:min-h-0 sm:text-sm"
          />
        </div>

        {/* Plan filter */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
          {PLANS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPlan(p)}
              className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium capitalize transition-all sm:min-h-0 sm:py-1.5 ${
                filterPlan === p
                  ? 'bg-rose-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'Todos' : p}
            </button>
          ))}
        </div>

        {/* Active filter */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterActive(s)}
              className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium transition-all sm:min-h-0 sm:py-1.5 ${
                filterActive === s
                  ? 'bg-white/[0.12] text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-xl mb-5 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[640px]">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_140px_100px_80px_80px] gap-4 border-b border-white/[0.05] px-5 py-3">
          {['Empresa', 'Plano', 'Membros', 'Status', ''].map((h, i) => (
            <span key={i} className="text-[11px] font-mono uppercase tracking-widest text-stone-600">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-600">
            <Building2 size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Nenhuma empresa encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(company => (
              <CompanyRow
                key={company.id}
                company={company}
                onClick={() => navigate(`/admin/companies/${company.id}`)}
              />
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-stone-600 mt-3 text-right">
          Mostrando {filtered.length} de {companies.length} empresa{companies.length !== 1 ? 's' : ''}
        </p>
      )}

      {showCreateModal && (
        <CreateCompanyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function CompanyRow({ company, onClick }: { company: AdminCompany; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[1fr_140px_100px_80px_80px] items-center gap-4 px-5 py-4 text-left transition-all hover:bg-white/[0.04]"
    >
      {/* Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-700/20 border border-rose-500/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-rose-400">
            {company.name.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{company.name}</p>
          {company.document && (
            <p className="text-xs text-stone-500 font-mono">{formatDocument(company.document)}</p>
          )}
        </div>
      </div>

      {/* Plan */}
      <div><PlanBadge plan={company.plan} /></div>

      {/* Members */}
      <div className="flex items-center gap-1.5 text-sm text-stone-400">
        <Users size={13} />
        {company.member_count}
      </div>

      {/* Active */}
      <div>
        {company.is_active ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 size={12} />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-stone-500 text-xs font-medium">
            <XCircle size={12} />
            Inativo
          </span>
        )}
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <ChevronRight size={15} className="text-stone-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
