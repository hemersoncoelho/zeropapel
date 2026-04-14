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
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
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
    <div className="min-h-full p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Empresas</h1>
          <p className="text-sm text-stone-500 mt-0.5">Gestão de todas as empresas cadastradas na plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshCompanies}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-stone-300 hover:text-white hover:bg-white/[0.1] transition-all text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all text-sm font-semibold shadow-lg shadow-rose-900/30"
          >
            <Plus size={14} />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total de empresas" value={stats.total} icon={Building2} color="bg-stone-600" />
        <StatCard label="Empresas ativas" value={stats.active} icon={CheckCircle2} color="bg-emerald-700" />
        <StatCard label="Planos pagos" value={stats.pro} icon={TrendingUp} color="bg-rose-700" />
        <StatCard label="Total de usuários" value={stats.members} icon={Users} color="bg-blue-700" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        {/* Plan filter */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
          {PLANS.map(p => (
            <button
              key={p}
              onClick={() => setFilterPlan(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
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
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterActive(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_140px_100px_80px_80px] gap-4 px-5 py-3 border-b border-white/[0.05]">
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
      onClick={onClick}
      className="w-full grid grid-cols-[1fr_140px_100px_80px_80px] gap-4 px-5 py-4 hover:bg-white/[0.04] transition-all group text-left items-center"
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
