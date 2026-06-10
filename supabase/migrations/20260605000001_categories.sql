-- ============================================================
-- Categories
-- Permite que cada empresa crie categorias próprias para
-- classificar lançamentos (receitas e despesas).
-- ============================================================

create table if not exists categories (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references companies(id) on delete cascade,
  name        text        not null,
  direction   text        not null check (direction in ('receivable', 'payable')),
  color       text        not null default '#6b7280',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (company_id, name, direction)
);

alter table categories enable row level security;

create policy "Members can read company categories"
  on categories for select
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can insert company categories"
  on categories for insert
  with check (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can update company categories"
  on categories for update
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can delete company categories"
  on categories for delete
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create trigger categories_updated_at
  before update on categories
  for each row execute function update_updated_at();

-- ── Vincular category_id às transactions ─────────────────────
-- FK nullable: lançamentos antigos sem categoria continuam válidos
alter table transactions
  add column if not exists category_id uuid references categories(id) on delete set null;

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_categories_company_id on categories(company_id);
create index if not exists idx_transactions_category_id on transactions(category_id);
