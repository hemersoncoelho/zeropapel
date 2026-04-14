import { useState, useEffect, useMemo } from 'react'
import { Search, Users, Building2, AlertCircle, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../contexts/AdminContext'
import { CreateUserModal } from '../../components/admin/CreateUserModal'

interface PlatformMember {
  user_id: string
  full_name: string | null
  email: string | null
  company_count: number
  companies: string[]
  created_at: string
}

export function AdminMembersPage() {
  const { companies } = useAdmin()
  const [members, setMembers] = useState<PlatformMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get all company members with profile data
        const { data, error: err } = await supabase
          .from('company_members')
          .select(`
            user_id,
            company_id,
            profiles ( full_name, email, created_at ),
            companies ( name )
          `)

        if (err) throw err

        // Aggregate by user
        const byUser: Record<string, PlatformMember> = {}
        for (const row of data ?? []) {
          const uid = row.user_id
          const profile = row.profiles as unknown as { full_name: string | null; email: string | null; created_at: string } | null
          const company = row.companies as unknown as { name: string } | null

          if (!byUser[uid]) {
            byUser[uid] = {
              user_id: uid,
              full_name: profile?.full_name ?? null,
              email: profile?.email ?? null,
              created_at: profile?.created_at ?? '',
              company_count: 0,
              companies: [],
            }
          }

          byUser[uid].company_count++
          if (company?.name) byUser[uid].companies.push(company.name)
        }

        setMembers(Object.values(byUser))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao buscar membros')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return members
    return members.filter(m =>
      (m.full_name ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    )
  }, [members, search])

  const totalUsers = members.length
  const avgCompanies = totalUsers > 0
    ? (members.reduce((a, m) => a + m.company_count, 0) / totalUsers).toFixed(1)
    : '0'

  return (
    <div className="min-h-full p-6 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Usuários</h1>
          <p className="text-sm text-stone-500 mt-0.5">Todos os usuários cadastrados na plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all text-sm font-semibold shadow-lg shadow-rose-900/30"
        >
          <Plus size={14} />
          Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white font-display">{totalUsers}</p>
            <p className="text-xs text-stone-500 mt-0.5">Total de usuários</p>
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-stone-600 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white font-display">{companies.length}</p>
            <p className="text-xs text-stone-500 mt-0.5">Total de empresas</p>
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-700 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white font-display">{avgCompanies}</p>
            <p className="text-xs text-stone-500 mt-0.5">Empresas por usuário (média)</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-xl mb-5 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_200px_120px] gap-4 px-5 py-3 border-b border-white/[0.05]">
          {['Usuário', 'Empresas', 'Cadastro'].map((h, i) => (
            <span key={i} className="text-[11px] font-mono uppercase tracking-widest text-stone-600">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-600">
            <Users size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(m => (
              <div
                key={m.user_id}
                className="grid grid-cols-[1fr_200px_120px] gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-all"
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {((m.full_name ?? m.email ?? '?')).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.full_name ?? '—'}</p>
                    <p className="text-xs text-stone-500 truncate">{m.email}</p>
                  </div>
                </div>

                {/* Companies */}
                <div className="flex flex-wrap gap-1">
                  {m.companies.slice(0, 2).map((name, i) => (
                    <span key={i} className="inline-block text-[10px] px-2 py-0.5 bg-white/[0.06] rounded-full text-stone-400 truncate max-w-[90px]">
                      {name}
                    </span>
                  ))}
                  {m.companies.length > 2 && (
                    <span className="inline-block text-[10px] px-2 py-0.5 bg-white/[0.06] rounded-full text-stone-500">
                      +{m.companies.length - 2}
                    </span>
                  )}
                </div>

                {/* Created at */}
                <p className="text-xs text-stone-500">
                  {m.created_at
                    ? new Date(m.created_at).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-stone-600 mt-3 text-right">
          {filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
