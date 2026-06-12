-- Track bank statement import batches
CREATE TABLE statement_imports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  imported_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Link transactions to their import batch (nullable — manual entries have no import)
ALTER TABLE transactions ADD COLUMN import_id UUID REFERENCES statement_imports(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_imports"
  ON statement_imports FOR SELECT
  USING (is_member_of(company_id));

CREATE POLICY "members_create_imports"
  ON statement_imports FOR INSERT
  WITH CHECK (is_member_of(company_id));

CREATE POLICY "members_delete_imports"
  ON statement_imports FOR DELETE
  USING (is_member_of(company_id));
