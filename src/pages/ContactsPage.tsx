import { useState, useEffect, useMemo } from 'react'
import { Plus, Users, Search, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDocument, getInitials } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { Contact } from '../types/finance'

type ContactFormData = {
  id?: string
  name: string
  document: string
  email: string
  phone: string
}

function ContactModal({
  contact,
  onClose,
  onSave,
}: {
  contact: Contact | null
  onClose: () => void
  onSave: (data: ContactFormData) => Promise<void>
}) {
  const isEditing = !!contact?.id
  const [form, setForm] = useState<ContactFormData>({
    name:     contact?.name     ?? '',
    document: contact?.document ?? '',
    email:    contact?.email    ?? '',
    phone:    contact?.phone    ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, id: contact?.id })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-semibold text-stone-900">
            {isEditing ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form id="contact-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Nome *</label>
            <input
              type="text"
              autoFocus
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Razão social ou nome completo"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">CNPJ / CPF</label>
            <input
              type="text"
              value={form.document}
              onChange={e => setForm({ ...form, document: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="contato@empresa.com"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>
        </form>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl sm:px-6 sm:py-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="contact-form" className="w-full sm:w-auto" loading={saving}>
            {isEditing ? 'Salvar Alterações' : 'Criar Contato'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ContactsPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)

  const fetchContacts = async () => {
    if (!activeCompany) return
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('name', { ascending: true })
    if (!error && data) setContacts(data as Contact[])
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [activeCompany])

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.document?.includes(q)
    )
  }, [contacts, search])

  const handleSave = async (formData: ContactFormData) => {
    if (!activeCompany) return

    const payload = {
      name:     formData.name,
      document: formData.document || null,
      email:    formData.email    || null,
      phone:    formData.phone    || null,
    }

    if (formData.id) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', formData.id)

      if (error) { alert('Erro ao atualizar contato: ' + error.message); return }
      setContacts(prev => prev.map(c => c.id === formData.id ? { ...c, ...payload } : c))
    } else {
      const { data: newRow, error } = await supabase
        .from('contacts')
        .insert({ company_id: activeCompany.id, ...payload })
        .select()
        .single()

      if (error) { alert('Erro ao criar contato: ' + error.message); return }
      setContacts(prev =>
        [...prev, newRow as Contact].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )
    }

    setModalOpen(false)
    setEditing(null)
  }

  const handleToggleActive = async (contact: Contact) => {
    const { error } = await supabase
      .from('contacts')
      .update({ is_active: !contact.is_active })
      .eq('id', contact.id)

    if (error) { alert('Erro ao alterar status: ' + error.message); return }
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_active: !c.is_active } : c))
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (c: Contact) => { setEditing(c); setModalOpen(true) }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Contatos</h1>
          <p className="text-sm text-stone-500 mt-1">Clientes, fornecedores e parceiros da empresa.</p>
        </div>
        {can('create:contacts') && (
          <Button variant="primary" className="w-full sm:w-auto" icon={<Plus size={15} />} onClick={openCreate}>
            Novo Contato
          </Button>
        )}
      </div>

      {/* BUSCA */}
      <div className="relative w-full max-w-full sm:max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 h-10 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
        />
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400">Carregando contatos...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            description={
              search
                ? 'Tente buscar com outros termos.'
                : 'Cadastre clientes, fornecedores e parceiros para vincular aos lançamentos.'
            }
            action={!search && can('create:contacts') ? { label: 'Novo Contato', onClick: openCreate } : undefined}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[560px] w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">Documento</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">E-mail</th>
                  <th className="px-4 py-2 font-medium hidden lg:table-cell">Telefone</th>
                  <th className="px-4 py-2 font-medium text-center">Status</th>
                  <th className="px-4 py-2 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(contact => (
                  <tr
                    key={contact.id}
                    className={`group hover:bg-stone-50/80 transition-colors ${!contact.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600 sm:h-8 sm:w-8">
                          {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-stone-800">{contact.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-stone-500 md:hidden">
                            {[contact.document ? formatDocument(contact.document) : null, contact.email || null].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell font-mono text-xs">
                      {contact.document ? formatDocument(contact.document) : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                      {contact.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden lg:table-cell font-mono text-xs">
                      {contact.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${contact.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                        {contact.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {can('edit:contacts') && (
                          <button
                            type="button"
                            onClick={() => openEdit(contact)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 sm:h-9 sm:w-9"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {can('edit:contacts') && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(contact)}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 ${contact.is_active ? 'text-stone-400 hover:bg-red-50 hover:text-red-500' : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                            title={contact.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {contact.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          contact={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
