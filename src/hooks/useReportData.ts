import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  ReportOverview,
  TimeseriesPoint,
  GroupBreakdownRow,
  CategoryBreakdownRow,
  RecentTx,
  TimeseriesGroupBy,
} from '../types/reports'

export interface ReportData {
  overview:          ReportOverview | null
  timeseries:        TimeseriesPoint[]
  breakdown:         GroupBreakdownRow[]
  categoryBreakdown: CategoryBreakdownRow[]
  recentTx:          RecentTx[]
  loading:           boolean
  error:             string | null
  refetch:           () => Promise<void>
}

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return Number(v) || 0
  return 0
}

export function useReportData(
  companyId: string | undefined,
  dateFrom:  string,
  dateTo:    string,
  groupBy:   TimeseriesGroupBy,
): ReportData {
  const [overview,          setOverview]          = useState<ReportOverview | null>(null)
  const [timeseries,        setTimeseries]        = useState<TimeseriesPoint[]>([])
  const [breakdown,         setBreakdown]         = useState<GroupBreakdownRow[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownRow[]>([])
  const [recentTx,          setRecentTx]          = useState<RecentTx[]>([])
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!companyId || !dateFrom || !dateTo) return

    setLoading(true)
    setError(null)

    try {
    const [ovRes, tsRes, grRes, rxRes, catRes] = await Promise.all([
      supabase.rpc('get_report_overview', {
        p_company_id: companyId,
        p_date_from:  dateFrom,
        p_date_to:    dateTo,
      }),
      supabase.rpc('get_report_timeseries', {
        p_company_id: companyId,
        p_date_from:  dateFrom,
        p_date_to:    dateTo,
        p_group_by:   groupBy,
      }),
      supabase.rpc('get_report_by_group', {
        p_company_id: companyId,
        p_date_from:  dateFrom,
        p_date_to:    dateTo,
      }),
      supabase.rpc('get_report_recent_transactions', {
        p_company_id: companyId,
        p_date_from:  dateFrom,
        p_date_to:    dateTo,
        p_limit:      20,
      }),
      // best-effort: não bloqueia o dashboard se a função ainda não existe
      supabase.rpc('get_report_by_category', {
        p_company_id: companyId,
        p_date_from:  dateFrom,
        p_date_to:    dateTo,
      }),
    ])

    const firstError = [ovRes.error, tsRes.error, grRes.error, rxRes.error].find(Boolean)
    if (firstError) {
      setError(`Erro ao carregar relatório: ${firstError.message}`)
      setLoading(false)
      return
    }

    const rawOv = ((ovRes.data ?? []) as Record<string, unknown>[])[0]
    setOverview(
      rawOv
        ? {
            revenue_total:  toNum(rawOv.revenue_total),
            expense_total:  toNum(rawOv.expense_total),
            balance_total:  toNum(rawOv.balance_total),
            tx_count:       toNum(rawOv.tx_count),
            avg_ticket:     toNum(rawOv.avg_ticket),
            revenue_prev:   toNum(rawOv.revenue_prev),
            expense_prev:   toNum(rawOv.expense_prev),
            balance_prev:   toNum(rawOv.balance_prev),
            open_count:     toNum(rawOv.open_count),
            paid_count:     toNum(rawOv.paid_count),
            partial_count:  toNum(rawOv.partial_count),
            overdue_count:  toNum(rawOv.overdue_count),
          }
        : null
    )

    setTimeseries(
      ((tsRes.data ?? []) as Record<string, unknown>[]).map(r => ({
        period:  String(r.period ?? ''),
        revenue: toNum(r.revenue),
        expense: toNum(r.expense),
        balance: toNum(r.balance),
      }))
    )

    setBreakdown(
      ((grRes.data ?? []) as Record<string, unknown>[]).map(r => ({
        group_name:   String(r.group_name ?? ''),
        direction:    String(r.direction  ?? ''),
        total_amount: toNum(r.total_amount),
        tx_count:     toNum(r.tx_count),
        percentage:   toNum(r.percentage),
      }))
    )

    setCategoryBreakdown(
      ((catRes.data ?? []) as Record<string, unknown>[]).map(r => ({
        category_id:    r.category_id ? String(r.category_id) : null,
        category_name:  String(r.category_name  ?? 'Sem categoria'),
        category_color: String(r.category_color ?? '#6b7280'),
        direction:      String(r.direction       ?? ''),
        total_amount:   toNum(r.total_amount),
        tx_count:       toNum(r.tx_count),
        percentage:     toNum(r.percentage),
      }))
    )

    setRecentTx(
      ((rxRes.data ?? []) as Record<string, unknown>[]).map(r => ({
        id:                String(r.id          ?? ''),
        tx_date:           String(r.tx_date     ?? ''),
        description:       String(r.description ?? ''),
        direction:         String(r.direction   ?? ''),
        status:            String(r.status      ?? ''),
        amount:            toNum(r.amount),
        operational_group: String(r.operational_group ?? ''),
      }))
    )

    setLoading(false)
    } catch(err) {
      setError(`Erro inesperado: ${String(err)}`)
      setLoading(false)
    }
  }, [companyId, dateFrom, dateTo, groupBy])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { overview, timeseries, breakdown, categoryBreakdown, recentTx, loading, error, refetch: fetchAll }
}
