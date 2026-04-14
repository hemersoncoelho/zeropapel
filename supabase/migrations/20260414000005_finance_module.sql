-- Create custom types
CREATE TYPE transaction_direction AS ENUM ('payable', 'receivable');
CREATE TYPE transaction_status AS ENUM ('open', 'paid', 'partial', 'overdue', 'canceled');

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  direction transaction_direction NOT NULL,
  status transaction_status NOT NULL DEFAULT 'open',
  amount BIGINT NOT NULL, -- in cents
  due_date DATE NOT NULL,
  contact_id TEXT, -- keeping text for now as placeholder for future contacts table
  category_id TEXT, -- placeholder for categories table
  bank_account_id TEXT, -- placeholder for bank accounts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies For Transactions
-- A non-admin user can view/insert/update/delete transactions IF they belong to the company
CREATE POLICY "Users can manage transactions for their companies"
  ON public.transactions
  FOR ALL
  USING (
    public.is_member_of(company_id)
    OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_member_of(company_id)
    OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Create a View for Dashboard Summaries to optimize performance
CREATE OR REPLACE VIEW public.company_financial_summary AS
SELECT 
  company_id,
  DATE_TRUNC('month', due_date) AS month,
  -- Receitas do mes (entries with direction=receivable) - does not mean paid, just expected revenue
  COALESCE(SUM(amount) FILTER (WHERE direction = 'receivable' AND status != 'canceled'), 0) AS revenue,
  -- Despesas do mes (entries with direction=payable)
  COALESCE(SUM(amount) FILTER (WHERE direction = 'payable' AND status != 'canceled'), 0) AS expenses,
  -- Pendentes (entries not paid/canceled) regardless of direction
  COUNT(*) FILTER (WHERE status IN ('open', 'partial', 'overdue')) AS pending_count,
  -- Saldo Total (Paid receivables - Paid payables) across all time up to this month? 
  -- Or maybe just a simple calc for current month for now.
  -- Let's define Balance as full history of paid/partial receivables minus full history of paid/partial payables
  (
    SELECT COALESCE(SUM(amount) FILTER (WHERE direction = 'receivable'), 0) - COALESCE(SUM(amount) FILTER (WHERE direction = 'payable'), 0)
    FROM public.transactions t2
    WHERE t2.company_id = t.company_id AND t2.status = 'paid'
  ) AS total_balance
FROM public.transactions t
GROUP BY company_id, DATE_TRUNC('month', due_date);
