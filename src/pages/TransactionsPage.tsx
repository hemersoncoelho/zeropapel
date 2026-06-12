import { useState, useMemo, useEffect } from 'react'
import {
  ArrowDownRight, ArrowUpRight, Plus, Filter, MoreVertical,
  CheckCircle2, Clock, AlertCircle, PiggyBank, Save, X, Info, Expand,
  Trash2, ChevronLeft, ChevronRight, Search, Upload, ChevronDown, History,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { Title, TransactionDirection, TransactionStatus, OperationalGroup, Category } from '../types/finance'
import { ImportExtratoModal } from '../components/transactions/ImportExtratoModal'
import { ImportHistoryModal } from '../components/transactions/ImportHistoryModal'

const PAGE_SIZE = 30

const STATUS_STYLES: Record<TransactionStatus, { label: string; dot: string; bg: string; text: string; icon: any }> = {
  open: { label: 'Em aberto', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  paid: { label: 'Pago', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  partial: { label: 'Parcial', dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', icon: PiggyBank },
  overdue: { label: 'Vencido', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
  canceled: { label: 'Cancelado', dot: 'bg-stone-300', bg: 'bg-stone-50', text: 'text-stone-500', icon: X },
}

const TABS: OperationalGroup[] = ['Todos', 'Recebíveis', 'Despesas fixas', 'Despesas variáveis', 'Pessoal', 'Impostos']

const formatShortDate = (isoString: string) => {
  if (!isoString) return ''
  const d = new Date(isoString + 'T12:00:00Z')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function TransactionDetailsModal({
  transaction,
  categories,
  onClose,
  onSave
}: {
  transaction: Partial<Title>
  categories:  Category[]
  onClose: () => void
  onSave: (updated: Partial<Title>) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<Title>>(transaction)
  const [saving, setSaving] = useState(false)

  const isDraft = form.id === 'draft'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(92dvh,100%)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:max-h-[90vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.direction === 'receivable' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
               {form.direction === 'receivable' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              {isDraft ? 'Novo Lançamento (Rascunho)' : 'Detalhes do Lançamento'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <form id="tx-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Descrição</label>
                <input type="text" autoFocus value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Valor Bruto (Centavos)</label>
                <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 font-mono focus:outline-none focus:border-stone-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
               <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Data de {form.direction === 'receivable' ? 'Recebimento/Vencimento' : 'Vencimento/Pagamento'}</label>
                <input type="date" value={form.due_date || ''} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Direção do Lançamento</label>
                <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value as TransactionDirection, category_id: null})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400">
                  <option value="payable">Saída (Despesa)</option>
                  <option value="receivable">Entrada (Receita)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Grupo Operacional</label>
                <select value={form.operational_group || 'Outros'} onChange={e => setForm({...form, operational_group: e.target.value as OperationalGroup})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400">
                  {TABS.filter(t => t !== 'Todos').map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Outros">Outros</option>
                  {!form.operational_group && <option value="" disabled hidden>Selecione...</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Categoria</label>
              {(() => {
                const filteredCats = categories.filter(c => c.is_active && c.direction === form.direction)
                const selected = filteredCats.find(c => c.id === form.category_id)
                return (
                  <div className="flex items-center gap-2">
                    {selected && (
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
                    )}
                    <select
                      value={form.category_id || ''}
                      onChange={e => setForm({ ...form, category_id: e.target.value || null })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400"
                    >
                      <option value="">Sem categoria</option>
                      {filteredCats.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })()}
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <h3 className="flex flex-col gap-2 text-sm font-medium text-stone-800 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2"><Info size={16} className="text-stone-400" /> Detalhes Estratégicos</span>
                
                {/* Permite alterar situação dentro do modal também! */}
                <select 
                  value={form.status || 'open'}
                  onChange={e => setForm({...form, status: e.target.value as TransactionStatus})}
                  className="min-h-[44px] w-full rounded border border-stone-200 bg-white px-2 py-2 text-xs text-stone-700 outline-none sm:min-h-0 sm:w-auto sm:py-1"
                >
                  <option value="open">Em aberto</option>
                  <option value="paid">{form.direction === 'receivable' ? 'Recebido' : 'Pago'}</option>
                  <option value="partial">Parcial</option>
                  <option value="overdue">Vencido</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="recorrente" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                  <div>
                    <label htmlFor="recorrente" className="text-sm font-medium text-stone-800 block cursor-pointer">Lançamento Recorrente</label>
                    <span className="text-xs text-stone-500">Irá repetir na mesma data</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Dividir valor (Parcelas)</label>
                  <input type="number" min={1} value={form.installments || 1} onChange={e => setForm({...form, installments: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Observações Adicionais</label>
              <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Fornecedor, CNPJ, Links, Motivos..." className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:border-stone-400"></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-b-2xl sm:p-6">
          <span className="order-2 text-center text-xs text-stone-400 sm:order-1 sm:text-left">{isDraft ? 'Salvando criará o item.' : 'Atualização imediata.'}</span>
          <div className="order-1 flex w-full flex-col gap-2 sm:order-2 sm:w-auto sm:flex-row">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" form="tx-form" className="w-full sm:w-auto" disabled={saving}>
               {saving ? 'Salvando...' : (isDraft ? 'Salvar Lançamento' : 'Salvar Alterações')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


export function TransactionsPage() {
  const { activeCompany, user } = useAuth()
  
  const [data, setData] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  // Controls inline creation draft
  const [isCreating, setIsCreating] = useState(false)
  const [draftTx, setDraftTx] = useState<Partial<Title> | null>(null)
  const [savingInline, setSavingInline] = useState(false)
  
  const [activeTab, setActiveTab] = useState<OperationalGroup>('Todos')
  const [showImport, setShowImport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)

  // Selected Tx for Modal (can be a real one OR the draft one)
  const [selectedTx, setSelectedTx] = useState<Partial<Title> | null>(null)

  const fetchTransactions = async () => {
    if (!activeCompany) return
    setLoading(true)
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('due_date', { ascending: false })

    if (!error && txs) setData(txs as Title[])
    setLoading(false)
  }

  const fetchCategories = async () => {
    if (!activeCompany) return
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('name')
    if (cats) setCategories(cats as Category[])
  }

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [activeCompany])
  
  const filteredData = useMemo(() => {
    if (activeTab === 'Todos') return data
    return data.filter(t => t.operational_group === activeTab)
  }, [data, activeTab])

  // Contextualize creation draft based on selected tab and trigger
  useEffect(() => {
    if (isCreating && !draftTx) {
      setDraftTx({
        id: 'draft',
        direction: activeTab === 'Recebíveis' ? 'receivable' : 'payable',
        amount: 0,
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        status: 'open',
        operational_group: activeTab === 'Todos' ? undefined : activeTab, // Empty to force user to choose if 'Todos'
        is_recurring: false,
        installments: 1,
        notes: ''
      })
    } else if (!isCreating) {
      setDraftTx(null)
    }
  }, [isCreating, activeTab])

  const updateDraft = (patch: Partial<Title>) => {
    setDraftTx(prev => prev ? { ...prev, ...patch } : null)
  }

  const handleSaveDraftToDB = async (payload: Partial<Title>) => {
    if (!activeCompany) return
    if ((!payload.description || payload.description.trim() === '') || !payload.amount || payload.amount <= 0 || !payload.due_date) {
      alert("Para salvar, preencha Vencimento, Descrição e um Valor maior que zero.")
      return
    }
    if (!payload.operational_group) {
      alert("É obrigatório selecionar o Grupo Operacional.")
      return
    }
    
    setSavingInline(true)
    
    const { data: newRow, error } = await supabase
      .from('transactions')
      .insert({
        company_id: activeCompany.id,
        description: payload.description,
        direction: payload.direction,
        status: payload.status || 'open',
        amount: payload.amount,
        due_date: payload.due_date,
        category_id: payload.category_id ?? null,
        operational_group: payload.operational_group,
        is_recurring: payload.is_recurring,
        installments: payload.installments,
        notes: payload.notes
      })
      .select()
      .single()
      
    setSavingInline(false)
    if (error) {
      alert('Erro ao salvar no banco: ' + error.message)
      return
    }

    setData([newRow as Title, ...data])
    setIsCreating(false)
    setDraftTx(null)
    setSelectedTx(null) // Ensures modal closes if save was triggered from modal
  }

  const handleModalSave = async (updated: Partial<Title>) => {
    if (updated.id === 'draft') {
      // It's saving the DRAFT mode from the opened modal
      // Sync it locally to draft in case they cancel later? No, they clicked save.
      await handleSaveDraftToDB(updated)
    } else {
      // It's a real existing transaction
      if (!updated.id) return
      const { error } = await supabase
        .from('transactions')
        .update({
           description: updated.description,
           amount: updated.amount,
           due_date: updated.due_date,
           direction: updated.direction,
           category_id: updated.category_id ?? null,
           operational_group: updated.operational_group,
           status: updated.status,
           is_recurring: updated.is_recurring,
           installments: updated.installments,
           notes: updated.notes
        })
        .eq('id', updated.id)

      if (error) {
        alert('Erro ao atualizar: ' + error.message)
        return
      }
      
      setData(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
      setSelectedTx(null)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: TransactionStatus) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) { alert('Erro ao alterar status: ' + error.message); return }
    setData(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const handleDelete = async (id: string, description: string) => {
    if (!window.confirm(`Excluir "${description}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    setData(prev => prev.filter(t => t.id !== id))
  }

  // ── Filter state ──────────────────────────────────────────
  const [showFilters,  setShowFilters]  = useState(false)
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | ''>('')
  const [filterDir,    setFilterDir]    = useState<TransactionDirection | ''>('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')
  const [page, setPage] = useState(1)

  const { can } = usePermission()

  const filteredAndSearched = useMemo(() => {
    let rows = filteredData
    if (filterStatus) rows = rows.filter(t => t.status === filterStatus)
    if (filterDir)    rows = rows.filter(t => t.direction === filterDir)
    if (filterFrom)   rows = rows.filter(t => t.due_date >= filterFrom)
    if (filterTo)     rows = rows.filter(t => t.due_date <= filterTo)
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      rows = rows.filter(t => t.description.toLowerCase().includes(q))
    }
    return rows
  }, [filteredData, filterStatus, filterDir, filterFrom, filterTo, filterSearch])

  const totalPages = Math.max(1, Math.ceil(filteredAndSearched.length / PAGE_SIZE))
  const pagedData  = filteredAndSearched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // reset page when filters change
  useEffect(() => setPage(1), [activeTab, filterStatus, filterDir, filterFrom, filterTo, filterSearch])

  const hasFilters = !!(filterStatus || filterDir || filterFrom || filterTo || filterSearch)

  const summary = useMemo(() => {
    let payable = 0, receivable = 0, overdue = 0
    filteredData.forEach(t => {
      if (t.status === 'canceled') return
      if (t.direction === 'payable') {
        if (t.status === 'open' || t.status === 'overdue') payable += t.amount
        if (t.status === 'overdue') overdue += t.amount
      } else {
        if (t.status === 'open' || t.status === 'overdue') receivable += t.amount
      }
    })
    return { payable, receivable, overdue }
  }, [filteredData])

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Lançamentos</h1>
          <p className="mt-1 text-sm text-stone-500">Gerencie suas movimentações financeiras de forma categorizada.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            variant={showFilters || hasFilters ? 'primary' : 'secondary'}
            className="w-full sm:w-auto"
            icon={<Filter size={15}/>}
            onClick={() => setShowFilters(p => !p)}
          >
            {hasFilters ? 'Filtros ativos' : 'Filtros'}
          </Button>
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowImportMenu(p => !p)}
              onBlur={() => setTimeout(() => setShowImportMenu(false), 150)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:w-auto"
            >
              <Upload size={15} />
              Extrato
              <ChevronDown size={14} className={`transition-transform ${showImportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showImportMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onMouseDown={() => { setShowImportMenu(false); setShowImport(true) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <Upload size={14} className="text-stone-400" />
                  Importar extrato
                </button>
                <button
                  type="button"
                  onMouseDown={() => { setShowImportMenu(false); setShowHistory(true) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <History size={14} className="text-stone-400" />
                  Ver extratos importados
                </button>
              </div>
            )}
          </div>
          <Button variant="primary" className="w-full sm:w-auto" icon={<Plus size={15}/>} onClick={() => { setIsCreating(true); setSelectedTx(null); }}>
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* OPERATIONAL TABS */}
      <div className="-mx-1 flex touch-pan-x items-center gap-2 overflow-x-auto border-b border-stone-200 px-1 pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setIsCreating(false); }}
            className={`flex min-h-[44px] shrink-0 items-center whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-[1px] sm:min-h-0 sm:px-4 ${
              activeTab === tab 
                ? 'border-stone-900 text-stone-900' 
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3 animate-fade-in">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" placeholder="Buscar descrição..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-9 rounded-lg border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TransactionStatus | '')}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:border-stone-400">
              <option value="">Todos os status</option>
              <option value="open">Em aberto</option>
              <option value="paid">Pago</option>
              <option value="partial">Parcial</option>
              <option value="overdue">Vencido</option>
              <option value="canceled">Cancelado</option>
            </select>
            <select value={filterDir} onChange={e => setFilterDir(e.target.value as TransactionDirection | '')}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:border-stone-400">
              <option value="">Entrada e saída</option>
              <option value="receivable">Só receitas</option>
              <option value="payable">Só despesas</option>
            </select>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:border-stone-400" />
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:border-stone-400" />
            {hasFilters && (
              <button type="button" onClick={() => { setFilterStatus(''); setFilterDir(''); setFilterSearch(''); setFilterFrom(''); setFilterTo('') }}
                className="flex items-center gap-1 h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                <X size={12} /> Limpar
              </button>
            )}
          </div>
          <p className="text-xs text-stone-400">{filteredAndSearched.length} lançamento(s) encontrado(s)</p>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">A Pagar</span>
          <span className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
            {formatCurrency(summary.payable)}
          </span>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600/70 mb-2">A Receber</span>
          <span className="text-2xl font-display font-semibold text-emerald-600 tracking-tight">
            {formatCurrency(summary.receivable)}
          </span>
        </div>
         <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-red-500/80 mb-2">Vencido</span>
          <span className="text-2xl font-display font-semibold text-red-600 tracking-tight">
            {formatCurrency(summary.overdue)}
          </span>
        </div>
      </div>

      {/* "SPREADSHEET" LIST */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 pl-4 text-center text-stone-400">Carregando dados operacionais...</div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
                  <th className="px-4 py-2 font-medium w-10 text-center">Tipo</th>
                  <th className="px-4 py-2 font-medium w-32">Vencimento</th>
                  <th className="px-4 py-2 font-medium min-w-[200px]">Descrição (Click p/ detalhes)</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">Grupo Operacional</th>
                  <th className="px-4 py-2 font-medium text-right">Valor</th>
                  <th className="px-4 py-2 font-medium text-center">Situação</th>
                  <th className="px-4 py-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                
                {/* DRAFT INLINE ROW */}
                {isCreating && draftTx && (
                  <tr className="bg-stone-50 focus-within:bg-stone-100/50 transition-colors animate-fade-in group">
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => updateDraft({ direction: draftTx.direction === 'payable' ? 'receivable' : 'payable' })}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                          draftTx.direction === 'payable' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}
                        title="Alternar tipo"
                      >
                        {draftTx.direction === 'payable' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="date" 
                        value={draftTx.due_date || ''}
                        onChange={e => updateDraft({ due_date: e.target.value })}
                        className="w-full max-w-[130px] bg-transparent border-b border-transparent focus:border-stone-400 outline-none px-1 py-1 text-sm text-stone-800"
                      />
                    </td>
                    <td className="px-4 py-3 relative">
                      <div className="flex items-center gap-1 group/desc border-b border-transparent focus-within:border-stone-400">
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Descrição rápida..." 
                          value={draftTx.description || ''}
                          onChange={e => updateDraft({ description: e.target.value })}
                          className="w-full bg-transparent outline-none px-1 py-1 text-sm text-stone-800"
                        />
                        <button 
                          onClick={() => setSelectedTx(draftTx)}
                          className="p-1 rounded text-stone-400 hover:bg-stone-200 hover:text-stone-700 bg-stone-100 transition-colors z-10"
                          title="Abrir Detalhamento Rico"
                        >
                          <Expand size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {activeTab === 'Todos' ? (
                        <select 
                          value={draftTx.operational_group || ''}
                          onChange={e => updateDraft({ operational_group: e.target.value as OperationalGroup })}
                          className="bg-white border border-stone-200 text-xs px-2 py-1 rounded text-stone-700 outline-none w-32"
                        >
                          <option value="" disabled hidden>Selecione...</option>
                          {TABS.filter(t => t !== 'Todos').map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="Outros">Outros</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 bg-stone-100 text-stone-500 rounded text-xs">
                          {activeTab}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="text" 
                        placeholder="0,00" 
                        value={draftTx.amount ? draftTx.amount.toString() : ''}
                        onChange={e => updateDraft({ amount: parseInt(e.target.value) || 0 })}
                        onKeyDown={e => e.key === 'Enter' && handleSaveDraftToDB(draftTx)}
                        className="w-24 text-right bg-transparent border-b border-transparent focus:border-stone-400 outline-none px-1 py-1 text-sm font-mono font-medium text-stone-800"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-200 text-stone-600">
                        {draftTx.status === 'paid' ? 'Pago/Recebido' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setIsCreating(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
                          <X size={18} />
                        </button>
                        <button type="button" onClick={() => handleSaveDraftToDB(draftTx)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-50" disabled={savingInline}>
                          <Save size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
  
                {/* DATA ROWS */}
                 {pagedData.map((row) => {
                  const s = STATUS_STYLES[row.status]
                  const isReceivable = row.direction === 'receivable'
                  return (
                    <tr key={row.id} className="group hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-stone-50 group-hover:bg-white border border-stone-100">
                          {isReceivable 
                            ? <ArrowUpRight size={16} className="text-emerald-500" />
                            : <ArrowDownRight size={16} className="text-red-400" />
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`text-stone-600 ${row.status === 'overdue' ? 'text-red-600 font-semibold' : ''}`}>
                           {formatShortDate(row.due_date)}
                         </span>
                      </td>
                      <td
                        className="px-4 py-3 font-medium text-stone-800 cursor-pointer hover:bg-stone-100 rounded transition-colors group/desc"
                        title="Clique p/ editar detalhes ricos"
                        onClick={() => setSelectedTx(row)}
                      >
                         <div className="flex w-full min-w-0 items-center justify-between gap-2">
                           <div className="min-w-0">
                             <span className="block truncate sm:max-w-[220px]">{row.description}</span>
                             {row.category_id && (() => {
                               const cat = categories.find(c => c.id === row.category_id)
                               return cat ? (
                                 <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-white rounded-full px-1.5 py-0.5" style={{ backgroundColor: cat.color }}>
                                   <span className="w-1 h-1 rounded-full bg-white/70" />
                                   {cat.name}
                                 </span>
                               ) : null
                             })()}
                           </div>
                           <Expand size={14} className="shrink-0 text-stone-400 opacity-60 transition-opacity group-hover/desc:opacity-100 sm:opacity-0 sm:group-hover/desc:opacity-100" />
                         </div>
                      </td>
                      <td className="px-4 py-3 text-stone-500 hidden md:table-cell truncate max-w-[150px]">
                        {row.operational_group || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-medium ${isReceivable ? 'text-stone-900' : 'text-stone-900'}`}>
                          {formatCurrency(row.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center relative group/status">
                           {/* Status Editor Inline */}
                           <div className="relative">
                            <select 
                              title="Alterar Situação"
                              value={row.status}
                              onChange={e => handleUpdateStatus(row.id, e.target.value as TransactionStatus)}
                              className={`inline-flex min-h-[40px] cursor-pointer appearance-none items-center gap-1.5 rounded-md py-1.5 pl-6 pr-4 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 sm:min-h-0 sm:py-0.5 ${s.bg} ${s.text}`}
                            >
                              <option value="open">Em aberto</option>
                              <option value="paid">{isReceivable ? 'Recebido' : 'Pago'}</option>
                              <option value="partial">Parcial</option>
                              <option value="overdue">Vencido</option>
                              <option value="canceled">Cancelado</option>
                            </select>
                            <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${s.dot}`} />
                           </div>
                        </div>
                      </td>
                       <td className="px-4 py-3 text-right">
                         <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                           <button type="button" onClick={() => setSelectedTx(row)} className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 sm:h-8 sm:w-8">
                             <MoreVertical size={16} />
                           </button>
                           {can('delete:transactions') && (
                             <button type="button" onClick={() => handleDelete(row.id, row.description)} className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8">
                               <Trash2 size={15} />
                             </button>
                           )}
                         </div>
                       </td>
                    </tr>
                  )
                })}
                                {filteredAndSearched.length === 0 && !isCreating && !loading && (
                   <tr>
                     <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                       <p>{hasFilters ? 'Nenhum lançamento com esses filtros.' : 'Nenhum lançamento neste grupo.'}</p>
                       {!hasFilters && <Button variant="primary" className="mt-4" onClick={() => setIsCreating(true)}>Criar Lançamento</Button>}
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-xs text-stone-400">
            Página {page} de {totalPages} · {filteredAndSearched.length} lançamentos
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 disabled:opacity-40 hover:bg-stone-50 transition-colors">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const n = start + i
              return (
                <button key={n} type="button" onClick={() => setPage(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    n === page ? 'bg-stone-900 text-white' : 'border border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}>{n}</button>
              )
            })}
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 disabled:opacity-40 hover:bg-stone-50 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES CLICÁVEIS */}
      {selectedTx && (
        <TransactionDetailsModal
          transaction={selectedTx}
          categories={categories}
          onClose={() => setSelectedTx(null)}
          onSave={handleModalSave}
        />
      )}

      {/* MODAL DE IMPORTAÇÃO DE EXTRATO */}
      {showImport && activeCompany && user && (
        <ImportExtratoModal
          companyId={activeCompany.id}
          userId={user.id}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); fetchTransactions() }}
        />
      )}

      {/* MODAL DE HISTÓRICO DE EXTRATOS */}
      {showHistory && activeCompany && (
        <ImportHistoryModal
          companyId={activeCompany.id}
          onClose={() => setShowHistory(false)}
          onDeleted={() => fetchTransactions()}
        />
      )}

    </div>
  )
}
