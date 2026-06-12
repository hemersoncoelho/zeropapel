import { useEffect, useState } from 'react'
import { X, FileText, Trash2, AlertCircle, Loader2, FileX } from 'lucide-react'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import type { StatementImport } from '../../types/finance'

interface ImportHistoryModalProps {
  companyId: string
  onClose: () => void
  onDeleted: () => void
}

export function ImportHistoryModal({ companyId, onClose, onDeleted }: ImportHistoryModalProps) {
  const [imports, setImports] = useState<StatementImport[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchImports = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('statement_imports')
      .select('*')
      .eq('company_id', companyId)
      .order('imported_at', { ascending: false })

    if (err) setError(err.message)
    else setImports((data ?? []) as StatementImport[])
    setLoading(false)
  }

  useEffect(() => { fetchImports() }, [companyId])

  const handleDelete = async (imp: StatementImport) => {
    const confirmed = window.confirm(
      `Excluir o extrato "${imp.file_name}" e os ${imp.transaction_count} lançamento(s) importados com ele? Esta ação não pode ser desfeita.`
    )
    if (!confirmed) return

    setDeletingId(imp.id)
    setError('')

    const { error: txErr } = await supabase
      .from('transactions')
      .delete()
      .eq('import_id', imp.id)

    if (txErr) {
      setError(`Erro ao excluir lançamentos: ${txErr.message}`)
      setDeletingId(null)
      return
    }

    const { error: impErr } = await supabase
      .from('statement_imports')
      .delete()
      .eq('id', imp.id)

    if (impErr) {
      setError(`Erro ao excluir extrato: ${impErr.message}`)
      setDeletingId(null)
      return
    }

    setImports(prev => prev.filter(i => i.id !== imp.id))
    setDeletingId(null)
    onDeleted()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Extratos Importados</h2>
              <p className="text-xs text-stone-500">Gerencie os extratos que foram importados</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Carregando extratos...</span>
            </div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileX size={32} className="text-stone-300" />
              <p className="text-sm text-stone-500">Nenhum extrato importado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {imports.map(imp => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800" title={imp.file_name}>
                      {imp.file_name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {formatDate(imp.imported_at)} · {imp.transaction_count} lançamento{imp.transaction_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(imp)}
                    disabled={deletingId === imp.id}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Excluir extrato e seus lançamentos"
                  >
                    {deletingId === imp.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 px-6 py-4">
          <p className="mb-3 text-xs text-stone-400">
            Excluir um extrato remove permanentemente todos os lançamentos vinculados a ele.
          </p>
          <Button variant="secondary" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
