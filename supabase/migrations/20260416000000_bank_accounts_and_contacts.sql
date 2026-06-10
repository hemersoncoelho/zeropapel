-- ============================================================
-- Helper: updated_at trigger function (idempotent)
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Bank Accounts
-- ============================================================
create table if not exists bank_accounts (
  id               uuid        primary key default gen_random_uuid(),
  company_id       uuid        not null references companies(id) on delete cascade,
  name             text        not null,
  type             text        not null default 'checking',
  initial_balance  bigint      not null default 0,
  current_balance  bigint      not null default 0,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table bank_accounts enable row level security;

create policy "Members can read company bank accounts"
  on bank_accounts for select
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can insert company bank accounts"
  on bank_accounts for insert
  with check (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can update company bank accounts"
  on bank_accounts for update
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can delete company bank accounts"
  on bank_accounts for delete
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create trigger bank_accounts_updated_at
  before update on bank_accounts
  for each row execute function update_updated_at();

-- ============================================================
-- Contacts
-- ============================================================
create table if not exists contacts (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references companies(id) on delete cascade,
  name        text        not null,
  document    text,
  email       text,
  phone       text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table contacts enable row level security;

create policy "Members can read company contacts"
  on contacts for select
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can insert company contacts"
  on contacts for insert
  with check (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can update company contacts"
  on contacts for update
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "Members can delete company contacts"
  on contacts for delete
  using (
    is_member_of(company_id)
    or exists (select 1 from platform_admins where user_id = auth.uid())
  );

create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();
