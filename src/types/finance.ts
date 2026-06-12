export type TransactionDirection = 'payable' | 'receivable'
export type TransactionStatus = 'open' | 'partial' | 'paid' | 'overdue' | 'canceled'

export type BankAccountType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment'

export interface BankAccount {
  id: string
  company_id: string
  name: string
  type: BankAccountType
  initial_balance: number
  current_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  company_id: string
  name: string
  direction: TransactionDirection
  color: string
  is_active: boolean
  created_at: string
}

export interface Contact {
  id: string
  company_id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transfer {
  id: string
  company_id: string
  from_bank_account_id: string
  to_bank_account_id: string
  amount: number
  transfer_date: string
  description: string | null
  created_at: string
  updated_at: string
}

export type OperationalGroup = 'Recebíveis' | 'Despesas fixas' | 'Despesas variáveis' | 'Pessoal' | 'Impostos' | 'Outros' | 'Todos'

export interface Title {
  id: string
  company_id: string
  description: string
  direction: TransactionDirection
  status: TransactionStatus
  amount: number // in cents
  due_date: string
  contact_id?: string | null
  category_id?: string | null
  bank_account_id?: string | null
  import_id?: string | null
  installments_count?: number
  current_installment?: number
  parent_id?: string | null // For installments grouping
  notes?: string | null
  operational_group?: OperationalGroup | null
  is_recurring?: boolean
  installments?: number
  created_at: string
  updated_at: string
}

export interface StatementImport {
  id: string
  company_id: string
  file_name: string
  imported_at: string
  transaction_count: number
  created_by: string | null
}
