import { useState, useEffect, useMemo } from 'react'
import { Users, UserPlus, X, Trash2, ChevronDown, Crown, Shield, BarChart2, Briefcase, Eye } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { CompanyRole } from '../types/database'
import { ROLE_LABELS, ROLE_COLORS } from '../types/database'
import { getInitials } from '../lib/utils'

// ── Types ─────────────────────────────────────────────────────
interface MemberRow {
  id:         string   // company_members.id
  user_id:    string
  role:       CompanyRole
  created_at: string
  profile: {
    full_name: string | null
    email:     string | null
    avatar_url: string | null
  } | null
}

// ── Role icons ────────────────────────────────────────────────
const ROLE_ICONS: Record<CompanyRole, React.ReactNode> = {
  owner:   <Crown   size={13} />,
  admin:   <Shield  size={13} />,
  finance: <BarChart2 size={13} />,
  manager: <Briefcase size={13} />,
  viewer:  <Eye     size={13} />,
}

// ── Role selector inline ──────────────────────────────────────
function RoleSelector({
  value,
  onChange,
  disabled,
}: {
  value:    CompanyRole
  onChange: (role: CompanyRole) => void
  disabled: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as CompanyRole)}
        disabled={disabled}
        className={`
          appearance-none cursor-pointer rounded-lg border py-1.5 pl-2.5 pr-7 text-xs font-medium
          focus:outline-none focus:ring-2 focus:ring-stone-300 transition-colors
          disabled:cursor-not-allowed disabled:opacity-60
          ${ROLE_COLORS[value]}
          border-transparent hover:border-stone-200 bg-opacity-80
        `}
      >
        {(Object.entries(ROLE_LABELS) as [CompanyRole, string][]).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      {!disabled && (
        <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60" />
      )}
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────
function InviteModal({
  onClose,
  onInvite,
}: {
  onClose:  () => void
  onInvite: (email: string, role: CompanyRole) => Promise<void>
}) {
  const [email, setEmail]   = useState('')
  const [role,  setRole]    = useState<CompanyRole>('viewer')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Informe um e-mail.'); return }
    setSaving(true)
    setError(null)
    try {
      await onInvite(email.trim().toLowerCase(), role)
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao convidar usuário.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Convidar Membro</h2>
            <p className="text-xs text-stone-400 mt-0.5">O usuário deve já ter uma conta no ZeroPapel.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form id="invite-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6">

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">E-mail do usuário *</label>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">Papel na empresa</label>
            <div className="space-y-2">
              {(Object.entries(ROLE_LABELS) as [CompanyRole, string][])
                .filter(([key]) => key !== 'owner')
                .map(([key, label]) => (
                  <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    role === key ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value={key}
                      checked={role === key}
                      onChange={() => setRole(key)}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[key]}`}>
                          {ROLE_ICONS[key]}{label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-400">
                        {key === 'admin'   && 'Gerencia membros, categorias e configurações.'}
                        {key === 'finance' && 'Cria e edita lançamentos, transferências e relatórios.'}
                        {key === 'manager' && 'Acesso completo exceto gestão de usuários.'}
                        {key === 'viewer'  && 'Apenas leitura — visualiza dados sem editar.'}
                      </p>
                    </div>
                  </label>
                ))}
            </div>
          </div>

        </form>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl sm:px-6 sm:py-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="invite-form" className="w-full sm:w-auto" loading={saving} icon={<UserPlus size={14} />}>
            Convidar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function UsersPage() {
  const { activeCompany, user } = useAuth()
  const { can, isOwner } = usePermission()

  const [members,     setMembers]     = useState<MemberRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [feedback,    setFeedback]    = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)

  const canManage = can('manage:users')
  const canDelete = can('delete:users')

  const fetchMembers = async () => {
    if (!activeCompany) return
    setLoading(true)

    const { data, error } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', activeCompany.id)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMembers(data.map((row: any) => ({
        id:         row.id,
        user_id:    row.user_id,
        role:       row.role as CompanyRole,
        created_at: row.created_at,
        profile:    Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [activeCompany])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4500)
  }

  // ── Invite ──────────────────────────────────────────────────
  const handleInvite = async (email: string, role: CompanyRole) => {
    if (!activeCompany) return

    // Find user by email in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle()

    if (profileError) throw new Error('Erro ao buscar usuário: ' + profileError.message)
    if (!profileData) throw new Error(`Nenhum usuário encontrado com o e-mail "${email}". Peça que ele crie uma conta primeiro.`)

    // Check already member
    const alreadyMember = members.some(m => m.user_id === profileData.id)
    if (alreadyMember) throw new Error('Este usuário já é membro desta empresa.')

    const { data: newMember, error: insertError } = await supabase
      .from('company_members')
      .insert({
        company_id: activeCompany.id,
        user_id:    profileData.id,
        role,
      })
      .select(`id, user_id, role, created_at, profiles(full_name, email, avatar_url)`)
      .single()

    if (insertError) throw new Error('Erro ao adicionar membro: ' + insertError.message)

    const row = newMember as any
    setMembers(prev => [...prev, {
      id:         row.id,
      user_id:    row.user_id,
      role:       row.role as CompanyRole,
      created_at: row.created_at,
      profile:    Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    }])
    showFeedback('success', `${profileData.full_name ?? email} adicionado como ${ROLE_LABELS[role]}.`)
    setInviteOpen(false)
  }

  // ── Change role ──────────────────────────────────────────────
  const handleChangeRole = async (member: MemberRow, newRole: CompanyRole) => {
    setUpdatingId(member.id)
    const { error } = await supabase
      .from('company_members')
      .update({ role: newRole })
      .eq('id', member.id)

    setUpdatingId(null)
    if (error) { showFeedback('error', 'Erro ao alterar papel: ' + error.message); return }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    showFeedback('success', 'Papel atualizado com sucesso.')
  }

  // ── Remove member ────────────────────────────────────────────
  const handleRemove = async (member: MemberRow) => {
    const name = member.profile?.full_name ?? member.profile?.email ?? 'este membro'
    if (!window.confirm(`Remover ${name} da empresa? Ele perderá o acesso imediatamente.`)) return

    const { error } = await supabase
      .from('company_members')
      .delete()
      .eq('id', member.id)

    if (error) { showFeedback('error', 'Erro ao remover: ' + error.message); return }
    setMembers(prev => prev.filter(m => m.id !== member.id))
    showFeedback('success', `${name} foi removido da empresa.`)
  }

  // ── Derived ──────────────────────────────────────────────────
  const sortedMembers = useMemo(() => {
    const ORDER: Record<CompanyRole, number> = { owner: 0, admin: 1, manager: 2, finance: 3, viewer: 4 }
    return [...members].sort((a, b) => ORDER[a.role] - ORDER[b.role])
  }, [members])

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Usuários</h1>
          <p className="text-sm text-stone-500 mt-1">
            Membros da empresa <span className="font-medium text-stone-700">{activeCompany?.name}</span>
          </p>
        </div>
        {canManage && (
          <Button variant="primary" className="w-full sm:w-auto" icon={<UserPlus size={15} />} onClick={() => setInviteOpen(true)}>
            Convidar Membro
          </Button>
        )}
      </div>

      {/* FEEDBACK */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          feedback.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* STATS STRIP */}
      {!loading && members.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(ROLE_LABELS) as [CompanyRole, string][]).map(([role, label]) => {
            const count = members.filter(m => m.role === role).length
            if (!count) return null
            return (
              <div key={role} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${ROLE_COLORS[role]}`}>
                  {ROLE_ICONS[role]}
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-stone-900 leading-none">{count}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{label}{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MEMBERS LIST */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 bg-stone-100 rounded" />
                  <div className="h-2.5 w-48 bg-stone-50 rounded" />
                </div>
                <div className="h-6 w-24 bg-stone-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : sortedMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum membro cadastrado"
            description="Convide membros para colaborar nesta empresa."
            action={canManage ? { label: 'Convidar Membro', onClick: () => setInviteOpen(true) } : undefined}
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {sortedMembers.map(member => {
              const isCurrentUser = member.user_id === user?.id
              const isOwnerRow    = member.role === 'owner'
              const canEditRole   = canManage && !isOwnerRow && !isCurrentUser
              const canRemoveRow  = (canDelete || (canManage && !isOwnerRow)) && !isCurrentUser && !isOwnerRow

              return (
                <li key={member.id} className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50/60 sm:px-5 ${isCurrentUser ? 'bg-blue-50/30' : ''}`}>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.profile.full_name ?? ''}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-stone-200 to-stone-300 text-xs font-bold text-stone-600">
                        {getInitials(member.profile?.full_name ?? member.profile?.email ?? '?')}
                      </div>
                    )}
                    {isCurrentUser && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500" title="Você" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-stone-800 truncate">
                        {member.profile?.full_name ?? '(sem nome)'}
                      </p>
                      {isCurrentUser && (
                        <span className="inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">você</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {member.profile?.email ?? '—'}
                      <span className="mx-1.5 text-stone-200">·</span>
                      desde {fmtDate(member.created_at)}
                    </p>
                  </div>

                  {/* Role selector */}
                  <div className="shrink-0">
                    {updatingId === member.id ? (
                      <div className="h-7 w-28 animate-pulse rounded-lg bg-stone-100" />
                    ) : (
                      <RoleSelector
                        value={member.role}
                        onChange={role => handleChangeRole(member, role)}
                        disabled={!canEditRole}
                      />
                    )}
                  </div>

                  {/* Remove */}
                  {canRemoveRow ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-300 transition-all hover:bg-red-50 hover:text-red-500 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Remover membro"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <div className="w-10 sm:w-9" />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Role legend */}
      {!loading && members.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Hierarquia de Papéis</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(ROLE_LABELS) as [CompanyRole, string][]).map(([role, label]) => (
              <div key={role} className="flex items-start gap-2">
                <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${ROLE_COLORS[role]}`}>
                  {ROLE_ICONS[role]}{label}
                </span>
                <span className="text-xs text-stone-500">
                  {role === 'owner'   && 'Acesso total. Apenas 1 por empresa.'}
                  {role === 'admin'   && 'Gerencia usuários e configurações.'}
                  {role === 'manager' && 'Acesso financeiro completo.'}
                  {role === 'finance' && 'Lançamentos, contas e relatórios.'}
                  {role === 'viewer'  && 'Somente leitura.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  )
}
