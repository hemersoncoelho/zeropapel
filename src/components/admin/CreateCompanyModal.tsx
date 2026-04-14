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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141414] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-900/40 border border-rose-500/30 flex items-center justify-center">
              <Building2 size={15} className="text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Nova Empresa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-stone-600 focus:outline-none focus:border-rose-500/50 transition-all font-mono"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">Plano</label>
            <div className="grid grid-cols-4 gap-2">
              {(['free', 'starter', 'pro', 'enterprise'] as CompanyPlan[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, plan: p }))}
                  className={`py-2 px-1 rounded-lg border text-xs font-semibold capitalize transition-all ${
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
              <FileText size={14} />
              {saving ? 'Criando...' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
