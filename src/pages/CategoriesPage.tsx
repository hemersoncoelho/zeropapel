import { useState, useEffect, useMemo } from 'react'
import { Plus, Tag, X, Pencil, ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import type { Category, TransactionDirection } from '../types/finance'

// ── Colour palette ────────────────────────────────────────────
const COLOR_OPTIONS = [
  { value: '#ef4444', label: 'Vermelho'  },
  { value: '#f97316', label: 'Laranja'   },
  { value: '#eab308', label: 'Amarelo'   },
  { value: '#22c55e', label: 'Verde'     },
  { value: '#06b6d4', label: 'Ciano'     },
  { value: '#3b82f6', label: 'Azul'      },
  { value: '#8b5cf6', label: 'Violeta'   },
  { value: '#ec4899', label: 'Rosa'      },
  { value: '#6b7280', label: 'Cinza'     },
  { value: '#292524', label: 'Preto'     },
]

const DIRECTION_LABELS: Record<TransactionDirection, string> = {
  receivable: 'Receita',
  payable:    'Despesa',
}

// ── Form types ────────────────────────────────────────────────
type CategoryFormData = {
  id?:       string
  name:      string
  direction: TransactionDirection
  color:     string
}

// ── Modal ─────────────────────────────────────────────────────
function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null
  onClose:  () => void
  onSave:   (data: CategoryFormData) => Promise<void>
}) {
  const isEditing = !!category?.id
  const [form, setForm] = useState<CategoryFormData>({
    name:      category?.name      ?? '',
    direction: category?.direction ?? 'payable',
    color:     category?.color     ?? '#6b7280',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, id: category?.id })
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar categoria.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-semibold text-stone-900">
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        <form id="category-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6">

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Nome *</label>
            <input
              type="text"
              autoFocus
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Aluguel, Salários, Vendas..."
              className="w-full min-h-[44px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-800 focus:outline-none focus:border-stone-400 sm:min-h-0 sm:text-sm"
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['payable', 'receivable'] as TransactionDirection[]).map(dir => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setForm({ ...form, direction: dir })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-all sm:py-2 ${
                    form.direction === dir
                      ? dir === 'payable'
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {dir === 'payable'
                    ? <ArrowDownRight size={15} />
                    : <ArrowUpRight size={15} />
                  }
                  {DIRECTION_LABELS[dir]}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === c.value ? 'border-stone-900 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: form.color }}
              >
                <Tag size={11} />
                {form.name || 'Prévia'}
              </span>
            </div>
          </div>

        </form>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:rounded-b-2xl sm:px-6 sm:py-4">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="category-form" className="w-full sm:w-auto" loading={saving}>
            {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function CategoriesPage() {
  const { activeCompany } = useAuth()
  const { can } = usePermission()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState<Category | null>(null)
  const [feedback,   setFeedback]   = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [filterDir,  setFilterDir]  = useState<TransactionDirection | 'all'>('all')

  const fetchCategories = async () => {
    if (!activeCompany) return
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', activeCompany.id)
      .order('direction', { ascending: true })
      .order('name',      { ascending: true })

    if (!error && data) setCategories(data as Category[])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [activeCompany])

  const filtered = useMemo(() => {
    if (filterDir === 'all') return categories
    return categories.filter(c => c.direction === filterDir)
  }, [categories, filterDir])

  const counts = useMemo(() => ({
    all:        categories.length,
    receivable: categories.filter(c => c.direction === 'receivable').length,
    payable:    categories.filter(c => c.direction === 'payable').length,
  }), [categories])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleSave = async (formData: CategoryFormData) => {
    if (!activeCompany) return

    if (formData.id) {
      // Update
      const { error } = await supabase
        .from('categories')
        .update({ name: formData.name, direction: formData.direction, color: formData.color })
        .eq('id', formData.id)

      if (error) { showFeedback('error', 'Erro ao atualizar: ' + error.message); return }
      setCategories(prev => prev.map(c =>
        c.id === formData.id ? { ...c, name: formData.name, direction: formData.direction, color: formData.color } : c
      ))
      showFeedback('success', 'Categoria atualizada com sucesso.')
    } else {
      // Insert
      const { data: newRow, error } = await supabase
        .from('categories')
        .insert({
          company_id: activeCompany.id,
          name:       formData.name,
          direction:  formData.direction,
          color:      formData.color,
        })
        .select()
        .single()

      if (error) { showFeedback('error', 'Erro ao criar: ' + error.message); return }
      setCategories(prev => [...prev, newRow as Category].sort((a, b) => {
        if (a.direction !== b.direction) return a.direction.localeCompare(b.direction)
        return a.name.localeCompare(b.name, 'pt-BR')
      }))
      showFeedback('success', 'Categoria criada com sucesso.')
    }

    setModalOpen(false)
    setEditing(null)
  }

  const handleToggleActive = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (error) { showFeedback('error', 'Erro ao alterar status: ' + error.message); return }
    setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c))
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) { showFeedback('error', 'Erro ao excluir: ' + error.message); return }
    setCategories(prev => prev.filter(c => c.id !== category.id))
    showFeedback('success', 'Categoria excluída.')
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (c: Category) => { setEditing(c); setModalOpen(true) }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold tracking-tight text-stone-900 sm:text-2xl">Categorias</h1>
          <p className="text-sm text-stone-500 mt-1">Classifique receitas e despesas com etiquetas coloridas.</p>
        </div>
        {can('create:categories') && (
          <Button variant="primary" className="w-full sm:w-auto" icon={<Plus size={15} />} onClick={openCreate}>
            Nova Categoria
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

      {/* FILTER TABS */}
      <div className="flex items-center gap-1 border-b border-stone-200 -mx-1 px-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'all',        label: 'Todas',    count: counts.all        },
          { key: 'receivable', label: 'Receitas',  count: counts.receivable },
          { key: 'payable',    label: 'Despesas',  count: counts.payable    },
        ] as { key: TransactionDirection | 'all'; label: string; count: number }[]).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterDir(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium -mb-[1px] transition-colors ${
              filterDir === tab.key
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
              filterDir === tab.key ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-stone-100 rounded" />
                  <div className="h-2.5 w-20 bg-stone-50 rounded" />
                </div>
                <div className="h-6 w-16 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={filterDir !== 'all' ? 'Nenhuma categoria neste tipo' : 'Nenhuma categoria cadastrada'}
            description="Crie categorias para classificar seus lançamentos financeiros."
            action={can('create:categories') ? { label: 'Nova Categoria', onClick: openCreate } : undefined}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[540px] w-full text-left text-sm">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
                  <th className="px-5 py-2 font-medium w-10" />
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium text-center">Status</th>
                  <th className="px-4 py-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(cat => (
                  <tr
                    key={cat.id}
                    className={`group hover:bg-stone-50/80 transition-colors ${!cat.is_active ? 'opacity-50' : ''}`}
                  >
                    {/* Color dot */}
                    <td className="px-5 py-3.5">
                      <span
                        className="block w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                    </td>
                    {/* Name + tag preview */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">{cat.name}</span>
                        <span
                          className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Tag size={9} />{cat.name}
                        </span>
                      </div>
                    </td>
                    {/* Direction */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                        cat.direction === 'receivable'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {cat.direction === 'receivable'
                          ? <ArrowUpRight size={12} />
                          : <ArrowDownRight size={12} />
                        }
                        {DIRECTION_LABELS[cat.direction]}
                      </span>
                    </td>
                    {/* Status badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                        cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {cat.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {can('edit:categories') && (
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 sm:h-9 sm:w-9"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {can('edit:categories') && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(cat)}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 ${
                              cat.is_active
                                ? 'text-stone-400 hover:bg-red-50 hover:text-red-500'
                                : 'text-stone-400 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                            title={cat.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {cat.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        )}
                        {can('delete:categories') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 sm:h-9 sm:w-9"
                            title="Excluir"
                          >
                            <X size={15} />
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
        <CategoryModal
          category={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
