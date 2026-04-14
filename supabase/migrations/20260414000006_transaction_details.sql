-- Add operational fields to transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS operational_group TEXT CHECK (operational_group IN ('Recebíveis', 'Despesas fixas', 'Despesas variáveis', 'Pessoal', 'Impostos', 'Outros')),
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS installments INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notes TEXT;
