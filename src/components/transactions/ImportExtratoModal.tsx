import { useRef, useState } from 'react'
import { Upload, X, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { TransactionDirection } from '../../types/finance'

interface ParsedRow {
  id: string
  date: string
  description: string
  amount: number // in cents, always positive
  direction: TransactionDirection
  selected: boolean
}

interface ImportExtratoModalProps {
  companyId: string
  onClose: () => void
  onImported: () => void
}

function parseBrazilianDate(raw: string): string {
  const s = raw.trim()
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${year}-${m[2]}-${m[1]}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return s
}

function parseAmount(raw: string): number {
  let s = raw.trim().replace(/[R$\s]/g, '')
  const hasDotAndComma = s.includes('.') && s.includes(',')
  if (hasDotAndComma) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) ? 0 : Math.round(Math.abs(n) * 100)
}

function guessDirection(typeHint: string, descHint: string, amountRaw: string): TransactionDirection {
  const s = amountRaw.trim()
  const combined = (typeHint + ' ' + descHint).toLowerCase()
  if (/crédit|credit|entrada|depósito|receb|pix rec|ted rec/.test(combined)) return 'receivable'
  if (/débit|debit|saída|saida|pag|compra|taxa|tarifa|pix env|ted env/.test(combined)) return 'payable'
  return s.startsWith('-') || s.startsWith('(') ? 'payable' : 'receivable'
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) return []

  const delimiters = [';', ',', '\t', '|']
  const counts = delimiters.map(d => lines[0].split(d).length - 1)
  const delimiter = delimiters[counts.indexOf(Math.max(...counts))]

  const split = (line: string) => line.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim())

  const header = split(lines[0]).map(h => h.toLowerCase())

  const idxDate   = header.findIndex(h => /data|date|fecha/.test(h))
  const idxDesc   = header.findIndex(h => /descri|hist|memo|label|lan[çc]amento|movement/.test(h))
  const idxAmt    = header.findIndex(h => /^valor$|^value$|^amount$|^importe$/.test(h))
  const idxDebit  = header.findIndex(h => /débit|debit|sa[íi]da/.test(h))
  const idxCredit = header.findIndex(h => /crédit|credit|entrada/.test(h))
  const idxType   = header.findIndex(h => /tipo|type|natureza/.test(h))

  const results: ParsedRow[] = []
  let uid = 0

  for (const line of lines.slice(1)) {
    const cols = split(line)
    if (cols.every(c => c === '')) continue

    const rawDate = cols[idxDate >= 0 ? idxDate : 0] ?? ''
    const rawDesc = cols[idxDesc >= 0 ? idxDesc : (idxDate >= 0 ? 1 : 0)] ?? ''
    const date = parseBrazilianDate(rawDate)
    if (!date || !/\d{4}-\d{2}-\d{2}/.test(date)) continue

    let amount = 0
    let direction: TransactionDirection = 'payable'

    if (idxDebit >= 0 && idxCredit >= 0) {
      const creditAmt = parseAmount(cols[idxCredit] ?? '')
      const debitAmt  = parseAmount(cols[idxDebit] ?? '')
      if (creditAmt > 0) { amount = creditAmt; direction = 'receivable' }
      else               { amount = debitAmt;  direction = 'payable' }
    } else if (idxAmt >= 0) {
      const rawAmt = cols[idxAmt] ?? ''
      amount = parseAmount(rawAmt)
      direction = guessDirection(idxType >= 0 ? cols[idxType] : '', rawDesc, rawAmt)
    } else {
      const numCols = cols.filter(c => /^-?[\d.,()]+$/.test(c.replace(/[R$\s]/g, '')))
      if (numCols.length > 0) {
        const rawAmt = numCols[numCols.length - 1]
        amount = parseAmount(rawAmt)
        direction = guessDirection('', rawDesc, rawAmt)
      }
    }

    if (amount === 0) continue

    results.push({ id: String(uid++), date, description: rawDesc || `Lançamento ${uid}`, amount, direction, selected: true })
  }

  return results
}

export function ImportExtratoModal({ companyId, onClose, onImported }: ImportExtratoModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'preview'>('upload')

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('Não foi possível identificar lançamentos no arquivo. Verifique se é um CSV com colunas de data, descrição e valor.')
        return
      }
      setError('')
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'windows-1252')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleRow = (id: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r))

  const toggleDirection = (id: string) =>
    setRows(prev => prev.map(r => r.id === id
      ? { ...r, direction: r.direction === 'receivable' ? 'payable' : 'receivable' }
      : r))

  const toggleAll = () => {
    const allSelected = rows.every(r => r.selected)
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })))
  }

  const selectedRows = rows.filter(r => r.selected)
  const totalIn  = selectedRows.filter(r => r.direction === 'receivable').reduce((s, r) => s + r.amount, 0)
  const totalOut = selectedRows.filter(r => r.direction === 'payable').reduce((s, r) => s + r.amount, 0)

  const handleImport = async () => {
    if (selectedRows.length === 0) return
    setImporting(true)
    setError('')
    const payload = selectedRows.map(r => ({
      company_id: companyId,
      description: r.description,
      direction: r.direction,
      amount: r.amount,
      due_date: r.date,
      status: 'paid' as const,
    }))
    const { error: err } = await supabase.from('transactions').insert(payload)
    if (err) {
      setError(`Erro ao importar: ${err.message}`)
      setImporting(false)
      return
    }
    setImportedCount(selectedRows.length)
    setDone(true)
    setImporting(false)
    onImported()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Importar Extrato</h2>
              <p className="text-xs text-stone-500">CSV exportado do seu banco</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {done ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">
                  {importedCount} lançamento{importedCount !== 1 ? 's' : ''} importado{importedCount !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  Os lançamentos foram adicionados com status <span className="font-medium text-stone-700">Pago</span>.
                </p>
              </div>
              <Button variant="primary" onClick={onClose}>Fechar</Button>
            </div>

          ) : step === 'upload' ? (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-12 cursor-pointer hover:border-stone-400 hover:bg-stone-100 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-stone-200 shadow-sm">
                  <Upload size={22} className="text-stone-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-700">Arraste o arquivo ou clique para selecionar</p>
                  <p className="text-xs text-stone-400 mt-1">Formato CSV exportado do seu banco</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4 text-xs text-stone-500 space-y-1">
                <p className="font-medium text-stone-600">Como exportar o extrato:</p>
                <p>• <span className="font-medium">Itaú / Bradesco / Santander:</span> Internet Banking → Extrato → Exportar CSV</p>
                <p>• <span className="font-medium">Nubank:</span> App → Meu perfil → Extrato → Exportar</p>
                <p>• <span className="font-medium">Inter / C6:</span> App → Extrato → Gerar arquivo CSV</p>
              </div>
            </div>

          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-600">
                  <span className="font-medium text-stone-900">{rows.length}</span> lançamentos em <span className="font-medium text-stone-900">{fileName}</span>
                </p>
                <button type="button" onClick={() => { setStep('upload'); setRows([]); setFileName('') }} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                  Trocar arquivo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-600 font-medium mb-0.5">Entradas selecionadas</p>
                  <p className="text-lg font-semibold text-emerald-700">{formatCurrency(totalIn)}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-xs text-red-600 font-medium mb-0.5">Saídas selecionadas</p>
                  <p className="text-lg font-semibold text-red-700">{formatCurrency(totalOut)}</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500">
                      <th className="px-3 py-2 w-8">
                        <input type="checkbox" checked={rows.every(r => r.selected)} onChange={toggleAll} className="rounded" />
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Data</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Descrição</th>
                      <th className="px-3 py-2 text-right font-medium text-xs">Valor</th>
                      <th className="px-3 py-2 text-center font-medium text-xs w-24">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map(row => (
                      <tr key={row.id} className={`transition-colors ${row.selected ? 'bg-white hover:bg-stone-50' : 'bg-stone-50/50 opacity-50'}`}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.id)} className="rounded" />
                        </td>
                        <td className="px-3 py-2 text-stone-500 text-xs whitespace-nowrap">
                          {new Date(row.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 text-stone-700 max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium tabular-nums text-xs ${row.direction === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.direction === 'receivable' ? '+' : '-'}{formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleDirection(row.id)}
                            title="Clique para inverter"
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                              row.direction === 'receivable'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {row.direction === 'receivable'
                              ? <><ArrowUpRight size={11}/> Entrada</>
                              : <><ArrowDownRight size={11}/> Saída</>
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-stone-400">
                Clique no tipo para inverter. Lançamentos serão importados como <span className="font-medium">Pago</span>.
              </p>
            </div>
          )}
        </div>

        {!done && step === 'preview' && (
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 py-4">
            <span className="text-sm text-stone-500">
              {selectedRows.length} de {rows.length} selecionados
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={importing}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={selectedRows.length === 0 || importing}
                icon={importing ? <Loader2 size={14} className="animate-spin" /> : undefined}
              >
                {importing ? 'Importando...' : `Importar ${selectedRows.length} lançamento${selectedRows.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
