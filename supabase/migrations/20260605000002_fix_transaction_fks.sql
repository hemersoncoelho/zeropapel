-- ============================================================
-- Fix transactions foreign keys
-- contact_id e bank_account_id estavam como TEXT placeholder.
-- Agora são FKs UUID reais para as tabelas corretas.
-- ============================================================

-- Remove old TEXT columns and re-add as UUID FK
-- Usamos DROP + ADD para garantir tipagem correta.
-- Dados TEXT anteriores (se existirem) serão perdidos — OK pois
-- eram placeholders sem dados reais vinculados.

-- contact_id: TEXT → UUID FK → contacts
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS contact_id;

ALTER TABLE public.transactions
  ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- bank_account_id: TEXT → UUID FK → bank_accounts
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS bank_account_id;

ALTER TABLE public.transactions
  ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- category_id: TEXT → UUID FK → categories (complementa a migration anterior)
-- A migration de categorias (20260605000001) já adicionou como UUID FK.
-- Esta linha é segura graças ao IF NOT EXISTS do ADD COLUMN e o DROP anterior.
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS category_id;

ALTER TABLE public.transactions
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Índices para queries de filtro frequentes
CREATE INDEX IF NOT EXISTS idx_transactions_contact_id      ON public.transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date        ON public.transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status          ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_direction       ON public.transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_company_status  ON public.transactions(company_id, status);
