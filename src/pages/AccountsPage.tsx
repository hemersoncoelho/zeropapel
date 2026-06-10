import { useState, useEffect, useMemo } from 'react'
import { Plus, Building2, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { BankAccount, BankAccountType } from '../types/finance'

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking:   'Conta Corrente',
  savings:    'Poupança',
  cash:       'Caixa',
  credit:     'Cartão de Crédito',
  investment: 'Investimento',
}

type AccountFormData = {
  id?: string
  name: string
  type: BankAccountType
  initial_balance: number
  current_balance: number
}

function AccountModal({
  account,
  onClose,
  onSave,
}: {
  account: BankAccount | null
  onClose: () => void
  onSave: (data: AccountFormData) => Promise<void>
}) {
  const isEditing = !!account?.id
  const [form, setForm] = useState<AccountFormData>({
    name:            account?.name            ?? '',
    type:            account?.type            ?? 'checking',
    initial_balance: account?.initial_balance ?? 0,
    current_balance: account?.current_balance ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, id: account?.id })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-semibold text-stone-900">
            {isEditing ? 'Editar Conta' : 'Nova Conta Bancária'}
          </h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form id="account-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Nome da Conta *</label>
            <input
              type="text"
              autoFocus
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Bradesco Corrente"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Tipo de Conta</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as BankAccountType })}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            >
              {(Object.entries(ACCOUNT_TYPE_LABELS) as [BankAccountType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Saldo Inicial (em centavos)</label>
            <input
              type="number"
              value={form.initial_balance}
              onChange={e => {
                const val = parseInt(e.target.value) || 0
                setForm(prev => ({
                  ...prev,
                  initial_balance: val,
                  current_balance: isEditing ? prev.current_balance : val,
                }))
              }}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
            <p className="text-xs text-stone-400 mt-1">{formatCurrency(form.initial_balance)}</p>
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Saldo Atual (em centavos)</label>
              <input
                type="number"
                value={form.current_balance}
                onChange={e => setForm({ ...form, current_balance: parseInt(e.target.value) || 0 })}
                className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
              />
              <p className="text-xs text-stone-400 mt-1">{formatCurrency(form.current_balance)}</p>
            </div>
          )}
        </form>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl sm:px-6 sm:py-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="account-form" className="w-full sm:w-auto" loading={saving}>
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AccountsPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)

  const fetchAccounts = async () => {
    if (!activeCompany) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('created_at', { ascending: false })
    if (!error && data) setAccounts(data as BankAccount[])
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()
  }, [activeCompany])

  const totalBalance = useMemo(
    () => accounts.filter(a => a.is_active).reduce((sum, a) => sum + a.current_balance, 0),
    [accounts]
  )

  const handleSave = async (formData: AccountFormData) => {
    if (!activeCompany) return

    if (formData.id) {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          name:            formData.name,
          type:            formData.type,
          initial_balance: formData.initial_balance,
          current_balance: formData.current_balance,
        })
        .eq('id', formData.id)

      if (error) { alert('Erro ao atualizar conta: ' + error.message); return }
      setAccounts(prev => prev.map(a => a.id === formData.id ? { ...a, ...formData } : a))
    } else {
      const { data: newRow, error } = await supabase
        .from('bank_accounts')
        .insert({
          company_id:      activeCompany.id,
          name:            formData.name,
          type:            formData.type,
          initial_balance: formData.initial_balance,
          current_balance: formData.initial_balance,
        })
        .select()
        .single()

      if (error) { alert('Erro ao criar conta: ' + error.message); return }
      setAccounts(prev => [newRow as BankAccount, ...prev])
    }

    setModalOpen(false)
    setEditing(null)
  }

  const handleToggleActive = async (account: BankAccount) => {
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: !account.is_active })
      .eq('id', account.id)

    if (error) { alert('Erro ao alterar status: ' + error.message); return }
    setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, is_active: !a.is_active } : a))
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (a: BankAccount) => { setEditing(a); setModalOpen(true) }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Contas Bancárias</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie os saldos e contas da sua empresa.</p>
        </div>
        {can('create:accounts') && (
          <Button variant="primary" className="w-full sm:w-auto" icon={<Plus size={15} />} onClick={openCreate}>
            Nova Conta
          </Button>
        )}
      </div>

      {/* SALDO TOTAL */}
      <div className="inline-flex min-w-0 max-w-full flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:min-w-[220px]">
        <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">Saldo Total (Contas Ativas)</span>
        <span className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
          {formatCurrency(totalBalance)}
        </span>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400">Carregando contas...</div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma conta cadastrada"
            description="Adicione contas bancárias, caixas e cartões para organizar suas movimentações."
            action={can('create:accounts') ? { label: 'Nova Conta', onClick: openCreate } : undefined}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium text-right">Saldo Inicial</th>
                  <th className="px-4 py-2 font-medium text-right">Saldo Atual</th>
                  <th className="px-4 py-2 font-medium text-center">Status</th>
                  <th className="px-4 py-2 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {accounts.map(account => (
                  <tr
                    key={account.id}
                    className={`group hover:bg-stone-50/80 transition-colors ${!account.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">{account.name}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-500">
                      {formatCurrency(account.initial_balance)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-stone-900">
                      {formatCurrency(account.current_balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${account.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                        {account.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {can('edit:accounts') && (
                          <button
                            type="button"
                            onClick={() => openEdit(account)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 sm:h-9 sm:w-9"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {can('edit:accounts') && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(account)}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 ${account.is_active ? 'text-stone-400 hover:bg-red-50 hover:text-red-500' : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                            title={account.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {account.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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
        <AccountModal
          account={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
