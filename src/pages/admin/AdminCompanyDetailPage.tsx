import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Users, CheckCircle2, XCircle,
  Save, ShieldAlert, Calendar, Hash, Pencil
} from 'lucide-react'
import { useAdmin, type CompanyPlan, type AdminCompany } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDocument } from '../../lib/utils'

const PLAN_STYLES: Record<CompanyPlan, { label: string; bg: string; text: string }> = {
  free:       { label: 'Free',       bg: 'bg-stone-800',   text: 'text-stone-300' },
  starter:    { label: 'Starter',    bg: 'bg-blue-900/60',  text: 'text-blue-300'  },
  pro:        { label: 'Pro',        bg: 'bg-rose-900/60',  text: 'text-rose-300'  },
  enterprise: { label: 'Enterprise', bg: 'bg-amber-900/60', text: 'text-amber-300' },
}

interface Member {
  id: string
  user_id: string
  role: string
  profiles: { full_name: string | null; email: string | null } | null
}

export function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { companies, updateCompanyPlan, updateCompanyStatus } = useAdmin()
  const { setActiveCompany } = useAuth()

  const company = companies.find(c => c.id === id) as AdminCompany | undefined

  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<CompanyPlan>('free')
  const [savingPlan, setSavingPlan] = useState(false)
  const [planSuccess, setPlanSuccess] = useState(false)

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => {
    if (company) setSelectedPlan(company.plan)
  }, [company])

  useEffect(() => {
    if (!id) return
    const fetchMembers = async () => {
      setLoadingMembers(true)
      const { data } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role,
          profiles ( full_name, email )
        `)
        .eq('company_id', id)
      setMembers((data as unknown as Member[]) ?? [])
      setLoadingMembers(false)
    }
    fetchMembers()
  }, [id])

  const handleSavePlan = async () => {
    if (!company) return
    setSavingPlan(true)
    try {
      await updateCompanyPlan(company.id, selectedPlan)
      setPlanSuccess(true)
      setEditingPlan(false)
      setTimeout(() => setPlanSuccess(false), 3000)
    } finally {
      setSavingPlan(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!company) return
    setTogglingStatus(true)
    try {
      await updateCompanyStatus(company.id, !company.is_active)
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleSupportAccess = () => {
    if (!company) return
    // Build a UserCompany object and set it as active
    const userCompany = {
      ...company,
      role: 'owner' as const // viewing as support
    }
    setActiveCompany(userCompany)
    navigate('/dashboard')
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-3">
        <Building2 size={32} className="opacity-40" />
        <p className="text-sm">Empresa não encontrada</p>
        <button onClick={() => navigate('/admin')} className="text-xs text-rose-400 hover:underline mt-1">
          Voltar para lista
        </button>
      </div>
    )
  }

  const planStyle = PLAN_STYLES[company.plan]

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Empresas
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-700/20 border border-rose-500/20 flex items-center justify-center">
            <span className="text-xl font-bold text-rose-400">
              {company.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">{company.name}</h1>
            {company.document && (
              <p className="text-sm text-stone-500 font-mono mt-0.5">{formatDocument(company.document)}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${planStyle.bg} ${planStyle.text}`}>
                {planStyle.label}
              </span>
              {company.is_active ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 size={12} />Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-stone-500 text-xs font-medium">
                  <XCircle size={12} />Inativo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Support access button */}
        <button
          onClick={handleSupportAccess}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-rose-900/40"
        >
          <ShieldAlert size={15} />
          Acessar como Suporte
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* LEFT: Plan + Info */}
        <div className="col-span-2 space-y-5">

          {/* Plan Management */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Plano</h3>
              {!editingPlan && (
                <button
                  onClick={() => setEditingPlan(true)}
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
                >
                  <Pencil size={12} />
                  Editar
                </button>
              )}
            </div>

            {editingPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(['free', 'starter', 'pro', 'enterprise'] as CompanyPlan[]).map(p => {
                    const s = PLAN_STYLES[p]
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPlan(p)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all capitalize text-xs font-semibold ${
                          selectedPlan === p
                            ? 'border-rose-500/60 bg-rose-900/20 text-white'
                            : 'border-white/[0.06] bg-white/[0.03] text-stone-400 hover:border-white/[0.15] hover:text-white'
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${s.bg} ${s.text}`}>{s.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePlan}
                    disabled={savingPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingPlan ? 'Salvando...' : 'Salvar plano'}
                  </button>
                  <button
                    onClick={() => { setEditingPlan(false); setSelectedPlan(company.plan) }}
                    className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${planStyle.bg} ${planStyle.text}`}>
                  {planStyle.label}
                </span>
                {planSuccess && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 size={12} />
                    Plano atualizado!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">
              Membros <span className="text-stone-500 font-normal">({members.length})</span>
            </h3>

            {loadingMembers ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-stone-600 text-sm">
                <Users size={24} className="mx-auto mb-2 opacity-40" />
                Nenhum membro encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(m.profiles?.full_name ?? m.profiles?.email ?? '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {m.profiles?.full_name ?? 'Sem nome'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{m.profiles?.email}</p>
                    </div>
                    <span className="text-xs font-mono text-stone-500 capitalize bg-white/[0.05] px-2 py-0.5 rounded-md">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Info sidebar */}
        <div className="space-y-5">

          {/* Info card */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Informações</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Calendar size={14} className="text-stone-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-600 uppercase font-mono tracking-wider">Criado em</p>
                  <p className="text-sm text-stone-300">
                    {new Date(company.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Hash size={14} className="text-stone-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-600 uppercase font-mono tracking-wider">ID</p>
                  <p className="text-xs text-stone-500 font-mono break-all">{company.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users size={14} className="text-stone-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-stone-600 uppercase font-mono tracking-wider">Membros</p>
                  <p className="text-sm text-stone-300">{company.member_count} usuário{company.member_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status toggle */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Status da empresa</h3>
            <p className="text-xs text-stone-500 mb-4">
              {company.is_active
                ? 'A empresa está ativa e os usuários podem acessar o sistema.'
                : 'A empresa está inativa. Os usuários não conseguem acessar o sistema.'}
            </p>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                company.is_active
                  ? 'bg-red-900/40 border border-red-500/30 text-red-300 hover:bg-red-900/60'
                  : 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
              }`}
            >
              {togglingStatus
                ? 'Aguarde...'
                : company.is_active ? '⛔ Desativar empresa' : '✅ Reativar empresa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
