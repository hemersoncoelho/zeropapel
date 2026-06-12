export interface ReportOverview {
  revenue_total:  number
  expense_total:  number
  balance_total:  number
  tx_count:       number
  avg_ticket:     number
  revenue_prev:   number
  expense_prev:   number
  balance_prev:   number
  open_count:     number
  paid_count:     number
  partial_count:  number
  overdue_count:  number
}

export interface TimeseriesPoint {
  period:  string   // 'YYYY-MM-DD' (primeiro dia do período truncado)
  revenue: number
  expense: number
  balance: number
}

export interface GroupBreakdownRow {
  group_name:   string
  direction:    string   // 'receivable' | 'payable'
  total_amount: number
  tx_count:     number
  percentage:   number
}

export interface RecentTx {
  id:                string
  tx_date:           string
  description:       string
  direction:         string
  status:            string
  amount:            number
  operational_group: string
}

export interface CategoryBreakdownRow {
  category_id:    string | null
  category_name:  string
  category_color: string
  direction:      string
  total_amount:   number
  tx_count:       number
  percentage:     number
}

export type TimeseriesGroupBy = 'day' | 'week' | 'month'

export type ReportDateRange = {
  from: string  // YYYY-MM-DD
  to:   string
}
