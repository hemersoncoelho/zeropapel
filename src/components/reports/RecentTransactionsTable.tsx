import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import type { RecentTx } from '../../types/reports'

interface RecentTransactionsTableProps {
  data:     RecentTx[]
  loading?: boolean
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  open:    { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Em aberto'   },
  paid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Pago'         },
  partial: { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Parcial'      },
  overdue: { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Vencido'      },
}

function formatShortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function RecentTransactionsTable({ data, loading }: RecentTransactionsTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-stone-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-stone-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-stone-100 rounded" />
              <div className="h-2.5 w-28 bg-stone-50 rounded" />
            </div>
            <div className="h-4 w-24 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-stone-400">
        Nenhum lançamento no período selecionado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-medium h-10">
            <th className="px-5 py-2 font-medium w-10 text-center">Tipo</th>
            <th className="px-5 py-2 font-medium w-28">Data</th>
            <th className="px-5 py-2 font-medium min-w-[200px] text-left">Descrição</th>
            <th className="px-5 py-2 font-medium hidden md:table-cell">Grupo</th>
            <th className="px-5 py-2 font-medium text-center">Situação</th>
            <th className="px-5 py-2 font-medium text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {data.map(tx => {
            const isReceivable = tx.direction === 'receivable'
            const s = STATUS_STYLE[tx.status] ?? STATUS_STYLE.open

            return (
              <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                <td className="px-5 py-3 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${
                      isReceivable ? 'bg-emerald-50' : 'bg-red-50'
                    }`}
                  >
                    {isReceivable
                      ? <ArrowUpRight   size={15} className="text-emerald-500" />
                      : <ArrowDownRight  size={15} className="text-red-400"    />
                    }
                  </div>
                </td>
                <td className="px-5 py-3 text-stone-500 font-mono text-xs">
                  {formatShortDate(tx.tx_date)}
                </td>
                <td className="px-5 py-3 font-medium text-stone-800 max-w-[220px]">
                  <span className="truncate block">{tx.description}</span>
                </td>
                <td className="px-5 py-3 text-stone-500 hidden md:table-cell text-xs">
                  {tx.operational_group}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${s.bg} ${s.text}`}
                  >
                    {s.label}
                  </span>
                </td>
                <td
                  className={`px-5 py-3 text-right font-mono font-medium ${
                    isReceivable ? 'text-emerald-600' : 'text-stone-800'
                  }`}
                >
                  {isReceivable ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
