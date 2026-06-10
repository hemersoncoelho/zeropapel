-- ============================================================
-- Trigger: recalcula current_balance da bank_account
-- sempre que uma transaction vinculada é criada/alterada/excluída.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_bank_account_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_account_id := OLD.bank_account_id;
  ELSE
    v_account_id := NEW.bank_account_id;
  END IF;

  -- Se bank_account_id mudou, atualiza a conta antiga também
  IF TG_OP = 'UPDATE'
     AND OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id
     AND OLD.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
    SET current_balance = initial_balance + COALESCE((
      SELECT SUM(CASE WHEN direction = 'receivable' THEN amount ELSE -amount END)
      FROM public.transactions
      WHERE bank_account_id = OLD.bank_account_id AND status <> 'canceled'
    ), 0)
    WHERE id = OLD.bank_account_id;
  END IF;

  -- Atualiza conta nova (ou única)
  IF v_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
    SET current_balance = initial_balance + COALESCE((
      SELECT SUM(CASE WHEN direction = 'receivable' THEN amount ELSE -amount END)
      FROM public.transactions
      WHERE bank_account_id = v_account_id AND status <> 'canceled'
    ), 0)
    WHERE id = v_account_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS transactions_sync_bank_balance ON public.transactions;
CREATE TRIGGER transactions_sync_bank_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_bank_account_balance();
