import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../contexts/AdminContext'

interface Props {
  onClose: () => void
}

export function CreateUserModal({ onClose }: Props) {
  const { companies, refreshCompanies } = useAdmin()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    company_id: '',
    role: 'viewer' as 'owner' | 'admin' | 'finance' | 'manager' | 'viewer',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password.trim()) {
      setError('E-mail e senha são obrigatórios.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setSaving(true)
    setError(null)

    // 1. Create the auth user via sign-up
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim() || undefined },
        // Skip email confirmation — if disabled in Supabase
        emailRedirectTo: undefined,
      },
    })

    if (signUpErr || !authData.user) {
      setError(signUpErr?.message ?? 'Erro ao criar usuário')
      setSaving(false)
      return
    }

    const userId = authData.user.id

    // 2. Ensure profile exists (trigger may have already created it)
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: form.full_name.trim() || null,
      email: form.email.trim(),
    }, { onConflict: 'id' })

    // 3. Link user to company if selected
    if (form.company_id) {
      const { error: memberErr } = await supabase.from('company_members').insert({
        user_id: userId,
        company_id: form.company_id,
        role: form.role,
      })
      if (memberErr) {
        setError(`Usuário criado, mas erro ao vincular empresa: ${memberErr.message}`)
        setSaving(false)
        return
      }
    }

    await refreshCompanies()
    setSaving(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div className="relative mx-4 mb-[env(safe-area-inset-bottom)] max-h-[min(92dvh,100%)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#141414] p-6 text-center animate-slide-up sm:mx-0 sm:mb-0 sm:p-8">
          <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Usuário criado!</h3>
          <p className="text-sm text-stone-400 mb-6">
            {form.full_name || form.email} foi criado com sucesso.
            {form.company_id ? ' O usuário foi vinculado à empresa selecionada.' : ''}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-rose-700 sm:w-auto sm:min-h-0 sm:py-2.5"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#141414] shadow-2xl animate-slide-up sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center">
              <UserPlus size={15} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Novo Usuário</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              E-mail <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Senha inicial <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Vincular à empresa <span className="text-stone-600">(opcional)</span>
            </label>
            <select
              value={form.company_id}
              onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-base text-white transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            >
              <option value="" className="bg-[#141414]">— Nenhuma empresa —</option>
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-[#141414]">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Role — only if company selected */}
          {form.company_id && (
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Cargo na empresa</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-1.5">
                {(['owner', 'admin', 'finance', 'manager', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`min-h-[44px] rounded-lg border px-1 py-2 text-[10px] font-semibold capitalize transition-all sm:min-h-0 sm:py-1.5 ${
                      form.role === r
                        ? 'border-rose-500/60 bg-rose-900/20 text-white'
                        : 'border-white/[0.06] bg-white/[0.03] text-stone-500 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">⚠ {error}</p>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-lg border border-white/[0.08] py-3 text-sm text-stone-400 transition-colors hover:text-white sm:min-h-0 sm:py-2.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 py-3 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:opacity-50 sm:min-h-0 sm:py-2.5"
            >
              <UserPlus size={14} />
              {saving ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
