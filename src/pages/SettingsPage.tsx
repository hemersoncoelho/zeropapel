import { useState, useEffect } from 'react'
import {
  Settings, Building2, User, Save, X, ExternalLink, CreditCard,
  Bell, Shield, ChevronRight, Pencil, Check,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import { formatDocument } from '../lib/utils'

// ── Section wrapper ───────────────────────────────────────────
function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title:       string
  description: string
  icon:        React.ElementType
  children:    React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-stone-200 shadow-sm">
          <Icon size={16} className="text-stone-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}

// ── Field row ─────────────────────────────────────────────────
function FieldRow({
  label,
  children,
  hint,
}: {
  label:    string
  children: React.ReactNode
  hint?:    string
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-6">
      <label className="w-full shrink-0 text-xs font-semibold text-stone-500 sm:w-36 sm:pt-2.5">{label}</label>
      <div className="flex-1 min-w-0">
        {children}
        {hint && <p className="mt-1.5 text-[11px] text-stone-400">{hint}</p>}
      </div>
    </div>
  )
}

// ── Feedback toast ────────────────────────────────────────────
function useFeedback() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const show = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }
  return { feedback, show }
}

// ── Company Section ───────────────────────────────────────────
function CompanySection() {
  const { activeCompany, setActiveCompany, companies } = useAuth()
  const { can } = usePermission()
  const { feedback, show } = useFeedback()

  const canEdit = can('edit:settings')

  const [form, setForm] = useState({
    name:     activeCompany?.name     ?? '',
    document: activeCompany?.document ?? '',
    logo_url: activeCompany?.logo_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    setForm({
      name:     activeCompany?.name     ?? '',
      document: activeCompany?.document ?? '',
      logo_url: activeCompany?.logo_url ?? '',
    })
    setDirty(false)
  }, [activeCompany])

  const patch = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return
    if (!form.name.trim()) { show('error', 'O nome da empresa é obrigatório.'); return }
    setSaving(true)
    const { error } = await supabase
      .from('companies')
      .update({
        name:     form.name.trim(),
        document: form.document.trim() || null,
        logo_url: form.logo_url.trim() || null,
      })
      .eq('id', activeCompany.id)

    setSaving(false)
    if (error) { show('error', 'Erro ao salvar: ' + error.message); return }

    // Sync active company in context
    const updated = companies.find(c => c.id === activeCompany.id)
    if (updated) {
      setActiveCompany({ ...updated, name: form.name.trim(), document: form.document.trim() || null, logo_url: form.logo_url.trim() || null })
    }
    setDirty(false)
    show('success', 'Dados da empresa atualizados com sucesso.')
  }

  return (
    <Section icon={Building2} title="Dados da Empresa" description="Nome, CNPJ e logotipo exibidos na plataforma.">
      {feedback && (
        <div className={`mb-5 rounded-lg border px-4 py-2.5 text-sm ${
          feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <FieldRow label="Nome da empresa *" hint="Exibido em todos os módulos.">
          <input
            type="text"
            value={form.name}
            onChange={e => patch('name', e.target.value)}
            disabled={!canEdit}
            placeholder="Minha Empresa Ltda"
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 disabled:opacity-60 disabled:cursor-not-allowed sm:min-h-0"
          />
        </FieldRow>

        <FieldRow label="CNPJ / CPF" hint="Apenas para exibição. Não é validado.">
          <input
            type="text"
            value={form.document}
            onChange={e => patch('document', e.target.value)}
            disabled={!canEdit}
            placeholder="00.000.000/0001-00"
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 font-mono placeholder:text-stone-400 focus:outline-none focus:border-stone-400 disabled:opacity-60 disabled:cursor-not-allowed sm:min-h-0"
          />
        </FieldRow>

        <FieldRow label="URL do Logotipo" hint="Link HTTPS para uma imagem PNG/SVG. Deixe em branco para usar as iniciais.">
          <input
            type="url"
            value={form.logo_url}
            onChange={e => patch('logo_url', e.target.value)}
            disabled={!canEdit}
            placeholder="https://exemplo.com/logo.png"
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 disabled:opacity-60 disabled:cursor-not-allowed sm:min-h-0"
          />
          {form.logo_url && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={form.logo_url}
                alt="Logo"
                className="h-8 w-8 rounded-md object-contain border border-stone-200 bg-stone-50"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <span className="text-xs text-stone-400">Prévia</span>
            </div>
          )}
        </FieldRow>

        {canEdit && (
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={saving} disabled={!dirty} icon={<Save size={13} />}>
              Salvar Alterações
            </Button>
          </div>
        )}
      </form>
    </Section>
  )
}

// ── Profile Section ───────────────────────────────────────────
function ProfileSection() {
  const { profile, refreshProfile } = useAuth()
  const { feedback, show } = useFeedback()

  const [form, setForm]   = useState({ full_name: profile?.full_name ?? '', avatar_url: profile?.avatar_url ?? '' })
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    setForm({ full_name: profile?.full_name ?? '', avatar_url: profile?.avatar_url ?? '' })
    setDirty(false)
  }, [profile])

  const patch = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  form.full_name.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) { show('error', 'Erro ao salvar: ' + error.message); return }
    await refreshProfile()
    setDirty(false)
    show('success', 'Perfil atualizado com sucesso.')
  }

  return (
    <Section icon={User} title="Meu Perfil" description="Nome e avatar exibidos na sidebar e nos registros de auditoria.">
      {feedback && (
        <div className={`mb-5 rounded-lg border px-4 py-2.5 text-sm ${
          feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Email (read-only) */}
        <FieldRow label="E-mail" hint="O e-mail não pode ser alterado por aqui.">
          <input
            type="email"
            value={profile?.email ?? ''}
            disabled
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 cursor-not-allowed sm:min-h-0"
          />
        </FieldRow>

        <FieldRow label="Nome completo">
          <input
            type="text"
            value={form.full_name}
            onChange={e => patch('full_name', e.target.value)}
            placeholder="Seu nome completo"
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 sm:min-h-0"
          />
        </FieldRow>

        <FieldRow label="URL do Avatar" hint="Link HTTPS para foto de perfil.">
          <input
            type="url"
            value={form.avatar_url}
            onChange={e => patch('avatar_url', e.target.value)}
            placeholder="https://exemplo.com/avatar.jpg"
            className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 sm:min-h-0"
          />
        </FieldRow>

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" loading={saving} disabled={!dirty} icon={<Save size={13} />}>
            Salvar Perfil
          </Button>
        </div>
      </form>
    </Section>
  )
}

// ── Plan Section (placeholder) ────────────────────────────────
function PlanSection() {
  return (
    <Section icon={CreditCard} title="Plano & Assinatura" description="Gerencie sua assinatura e limites de uso.">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100">
          <CreditCard size={24} className="text-rose-500" />
        </div>
        <h3 className="text-sm font-semibold text-stone-800 mb-1">Plano Gratuito</h3>
        <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
          Você está no plano gratuito com acesso completo durante o período beta. Planos pagos serão lançados em breve.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            <Check size={11} />Beta gratuito
          </span>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 flex items-center gap-1 text-xs text-stone-400 cursor-not-allowed"
        >
          Ver planos disponíveis <ExternalLink size={11} />
        </button>
      </div>
    </Section>
  )
}

// ── Danger Zone ───────────────────────────────────────────────
function DangerSection() {
  const { can } = usePermission()
  if (!can('delete:company')) return null

  return (
    <Section icon={Shield} title="Zona de Risco" description="Ações irreversíveis. Proceda com atenção.">
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Excluir empresa</p>
            <p className="text-xs text-red-500 mt-0.5">
              Remove todos os dados permanentemente. Não pode ser desfeito.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => alert('Funcionalidade disponível em breve. Entre em contato com o suporte.')}
          >
            Excluir empresa
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function SettingsPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()
  const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'plan' | 'danger'>('company')

  const tabs = [
    { key: 'company' as const, label: 'Empresa',    icon: Building2,  show: can('read:settings') },
    { key: 'profile' as const, label: 'Meu Perfil', icon: User,       show: true },
    { key: 'plan'    as const, label: 'Plano',       icon: CreditCard, show: true },
    { key: 'danger'  as const, label: 'Risco',       icon: Shield,     show: can('delete:company') },
  ].filter(t => t.show)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Configurações</h1>
        <p className="text-sm text-stone-500 mt-1">
          Empresa <span className="font-medium text-stone-700">{activeCompany?.name}</span>
        </p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 border-b border-stone-200 -mx-1 px-1 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium -mb-[1px] transition-colors ${
              activeTab === tab.key
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeTab === 'company' && <CompanySection />}
      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'plan'    && <PlanSection />}
      {activeTab === 'danger'  && <DangerSection />}

    </div>
  )
}
