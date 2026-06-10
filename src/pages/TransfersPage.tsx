import { useEffect, useMemo, useState } from 'react'
import { Repeat2, Plus, Trash2, X, ArrowRightLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { BankAccount, Transfer } from '../types/finance'

type TransferRow = Transfer & {
  from_account: Pick<BankAccount, 'id' | 'name'> | null
  to_account: Pick<BankAccount, 'id' | 'name'> | null
}

type TransferFormData = {
  from_bank_account_id: string
  to_bank_account_id: string
  amount: number
  transfer_date: string
  description: string
}

function TransferModal({
  accounts,
  onClose,
  onSave,
}: {
  accounts: BankAccount[]
  onClose: () => void
  onSave: (payload: TransferFormData) => Promise<void>
}) {
  const [form, setForm] = useState<TransferFormData>({
    from_bank_account_id: '',
    to_bank_account_id: '',
    amount: 0,
    transfer_date: new Date().toISOString().slice(0, 10),
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.from_bank_account_id || !form.to_bank_account_id) {
      setErrorMessage('Selecione conta de origem e conta de destino.')
      return
    }
    if (form.from_bank_account_id === form.to_bank_account_id) {
      setErrorMessage('Conta de origem e destino precisam ser diferentes.')
      return
    }
    if (!form.amount || form.amount <= 0) {
      setErrorMessage('Informe um valor maior que zero, em centavos.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-semibold text-stone-900">Nova Transferencia</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>

        <form id="transfer-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Conta de Origem *</label>
            <select
              value={form.from_bank_account_id}
              onChange={e => setForm(prev => ({ ...prev, from_bank_account_id: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            >
              <option value="">Selecione...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Conta de Destino *</label>
            <select
              value={form.to_bank_account_id}
              onChange={e => setForm(prev => ({ ...prev, to_bank_account_id: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            >
              <option value="">Selecione...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Valor (em centavos) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
            <p className="text-xs text-stone-400 mt-1">{formatCurrency(form.amount || 0)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Data da Transferencia</label>
            <input
              type="date"
              value={form.transfer_date}
              onChange={e => setForm(prev => ({ ...prev, transfer_date: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Descricao</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: ajuste entre contas"
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>
        </form>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl sm:px-6 sm:py-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="transfer-form" className="w-full sm:w-auto" loading={saving}>
            Criar Transferencia
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TransfersPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const canReadTransfers = can('read:transfers')
  const canCreateTransfers = can('create:transfers')
  const canDeleteTransfers = can('delete:transfers')

  const fetchPageData = async () => {
    if (!activeCompany || !canReadTransfers) return

    setLoading(true)
    setFeedback(null)

    const [{ data: accountsData, error: accountsError }, { data: transferData, error: transferError }] =
      await Promise.all([
        supabase
          .from('bank_accounts')
          .select('*')
          .eq('company_id', activeCompany.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('transfers')
          .select(`
            *,
            from_account:bank_accounts!transfers_from_bank_account_id_fkey(id,name),
            to_account:bank_accounts!transfers_to_bank_account_id_fkey(id,name)
          `)
          .eq('company_id', activeCompany.id)
          .order('transfer_date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

    if (accountsError || transferError) {
      setFeedback({
        type: 'error',
        message: `Nao foi possivel carregar transferencias: ${accountsError?.message ?? transferError?.message}`,
      })
      setLoading(false)
      return
    }

    setAccounts((accountsData ?? []) as BankAccount[])
    setTransfers((transferData ?? []) as TransferRow[])
    setLoading(false)
  }

  useEffect(() => {
    fetchPageData()
  }, [activeCompany, canReadTransfers])

  const totalTransferred = useMemo(
    () => transfers.reduce((acc, transfer) => acc + transfer.amount, 0),
    [transfers]
  )

  const handleCreateTransfer = async (payload: TransferFormData) => {
    if (!activeCompany) return

    const { data: created, error } = await supabase
      .from('transfers')
      .insert({
        company_id: activeCompany.id,
        from_bank_account_id: payload.from_bank_account_id,
        to_bank_account_id: payload.to_bank_account_id,
        amount: payload.amount,
        transfer_date: payload.transfer_date,
        description: payload.description || null,
      })
      .select(`
        *,
        from_account:bank_accounts!transfers_from_bank_account_id_fkey(id,name),
        to_account:bank_accounts!transfers_to_bank_account_id_fkey(id,name)
      `)
      .single()

    if (error) {
      setFeedback({ type: 'error', message: `Erro ao criar transferencia: ${error.message}` })
      return
    }

    setTransfers(prev => [created as TransferRow, ...prev])
    setFeedback({ type: 'success', message: 'Transferencia criada com sucesso.' })
    setModalOpen(false)
  }

  const handleDeleteTransfer = async (transfer: TransferRow) => {
    if (!activeCompany) return

    const confirmed = window.confirm(
      `Deseja excluir a transferencia de ${formatCurrency(transfer.amount)}? Esta acao nao pode ser desfeita.`
    )
    if (!confirmed) return

    const { data: deleted, error } = await supabase
      .from('transfers')
      .delete()
      .eq('id', transfer.id)
      .eq('company_id', activeCompany.id)
      .select('id')
      .maybeSingle()

    if (error || !deleted) {
      setFeedback({
        type: 'error',
        message: `Erro ao excluir transferencia: ${error?.message ?? 'Registro nao encontrado ou sem permissao.'}`,
      })
      return
    }

    setTransfers(prev => prev.filter(item => item.id !== transfer.id))
    setFeedback({ type: 'success', message: 'Transferencia excluida com sucesso.' })
  }

  if (!canReadTransfers) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <EmptyState
          icon={Repeat2}
          title="Sem permissao para transferencias"
          description="Seu perfil nao possui acesso para visualizar transferencias."
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Transferencias</h1>
          <p className="text-sm text-stone-500 mt-1">Movimentacoes entre contas bancarias da empresa ativa.</p>
        </div>

        {canCreateTransfers && (
          <Button variant="primary" className="w-full sm:w-auto" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Nova Transferencia
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="inline-flex max-w-full min-w-0 flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:min-w-[220px]">
        <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
          Total Transferido (Periodo exibido)
        </span>
        <span className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
          {formatCurrency(totalTransferred)}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400">Carregando transferencias...</div>
        ) : transfers.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="Nenhuma transferencia registrada"
            description="Registre transferencias internas para rastrear movimentacoes entre contas."
            action={canCreateTransfers ? { label: 'Nova Transferencia', onClick: () => setModalOpen(true) } : undefined}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Origem</th>
                  <th className="px-4 py-2 font-medium">Destino</th>
                  <th className="px-4 py-2 font-medium text-right">Valor</th>
                  <th className="px-4 py-2 font-medium">Descricao</th>
                  <th className="px-4 py-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transfers.map(transfer => (
                  <tr key={transfer.id} className="group hover:bg-stone-50/80 transition-colors">
                    <td className="px-4 py-3 text-stone-600 font-mono text-xs">{transfer.transfer_date}</td>
                    <td className="px-4 py-3 text-stone-800">{transfer.from_account?.name ?? 'Conta removida'}</td>
                    <td className="px-4 py-3 text-stone-800">{transfer.to_account?.name ?? 'Conta removida'}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-stone-900">
                      {formatCurrency(transfer.amount)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-stone-500 sm:max-w-none">{transfer.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {canDeleteTransfers && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTransfer(transfer)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:h-9 sm:w-9"
                            title="Excluir transferencia"
                          >
                            <Trash2 size={16} />
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
        <TransferModal
          accounts={accounts}
          onClose={() => setModalOpen(false)}
          onSave={handleCreateTransfer}
        />
      )}
    </div>
  )
}
