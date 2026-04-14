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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#141414] border border-white/[0.08] rounded-2xl w-full max-w-md p-8 text-center animate-slide-up">
          <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Usuário criado!</h3>
          <p className="text-sm text-stone-400 mb-6">
            {form.full_name || form.email} foi criado com sucesso.
            {form.company_id ? ' O usuário foi vinculado à empresa selecionada.' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#141414] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center">
              <UserPlus size={15} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Novo Usuário</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
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
              <div className="grid grid-cols-5 gap-1.5">
                {(['owner', 'admin', 'finance', 'manager', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-semibold capitalize transition-all ${
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-stone-400 hover:text-white text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
