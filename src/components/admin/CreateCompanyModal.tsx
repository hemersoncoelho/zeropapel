import { useState } from 'react'
import { X, Building2, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../contexts/AdminContext'
import type { CompanyPlan } from '../../contexts/AdminContext'

interface Props {
  onClose: () => void
}

export function CreateCompanyModal({ onClose }: Props) {
  const { refreshCompanies } = useAdmin()
  const [form, setForm] = useState({
    name: '',
    document: '',
    plan: 'free' as CompanyPlan,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('O nome da empresa é obrigatório.')
      return
    }

    setSaving(true)
    setError(null)

    const { data: newCompany, error: err } = await supabase
      .from('companies')
      .insert({
        name: form.name.trim(),
        document: form.document.trim() || null,
        plan: form.plan,
        is_active: true,
      })
      .select()
      .single()

    setSaving(false)

    if (err) {
      setError(err.message || 'Erro desconhecido ao criar empresa no banco.')
      return
    }

    if (!newCompany) {
      setError('A empresa não foi retornada pelo banco. Verifique suas permissões.')
      return
    }

    await refreshCompanies()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#141414] shadow-2xl animate-slide-up sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-900/40 border border-rose-500/30 flex items-center justify-center">
              <Building2 size={15} className="text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Nova Empresa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Nome da empresa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Empresa ABC Ltda"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              CNPJ <span className="text-stone-600">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="00.000.000/0001-00"
              value={form.document}
              onChange={e => setForm(f => ({ ...f, document: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 font-mono text-base text-white placeholder-stone-600 transition-all focus:border-rose-500/50 focus:outline-none sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Plano</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['free', 'starter', 'pro', 'enterprise'] as CompanyPlan[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, plan: p }))}
                  className={`min-h-[44px] rounded-lg border px-1 py-2 text-xs font-semibold capitalize transition-all sm:min-h-0 sm:py-2 ${
                    form.plan === p
                      ? 'border-rose-500/60 bg-rose-900/20 text-white'
                      : 'border-white/[0.06] bg-white/[0.03] text-stone-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
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
              <FileText size={14} />
              {saving ? 'Criando...' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
