-- ============================================================
-- Transfers
-- ============================================================
create table if not exists public.transfers (
  id                   uuid        primary key default gen_random_uuid(),
  company_id           uuid        not null references public.companies(id) on delete cascade,
  from_bank_account_id uuid        not null references public.bank_accounts(id) on delete restrict,
  to_bank_account_id   uuid        not null references public.bank_accounts(id) on delete restrict,
  amount               bigint      not null check (amount > 0),
  transfer_date        date        not null default current_date,
  description          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint transfers_accounts_different check (from_bank_account_id <> to_bank_account_id)
);

create index if not exists idx_transfers_company_date
  on public.transfers (company_id, transfer_date desc);

alter table public.transfers enable row level security;

create policy "Members can read company transfers"
  on public.transfers for select
  using (
    public.is_member_of(company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  );

create policy "Members can insert company transfers"
  on public.transfers for insert
  with check (
    public.is_member_of(company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  );

create policy "Members can delete company transfers"
  on public.transfers for delete
  using (
    public.is_member_of(company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  );

drop trigger if exists transfers_updated_at on public.transfers;
create trigger transfers_updated_at
  before update on public.transfers
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- Reports RPC (database-side aggregation)
-- ============================================================
create or replace function public.run_financial_report(
  p_company_id uuid,
  p_start_date date,
  p_end_date date,
  p_group_by text default 'direction'
)
returns table (
  report_key text,
  total_amount bigint,
  transactions_count bigint
)
language plpgsql
stable
security invoker
as $$
begin
  if p_start_date > p_end_date then
    raise exception 'Data inicial nao pode ser maior que a data final';
  end if;

  if not public.is_member_of(p_company_id)
    and not exists (select 1 from public.platform_admins where user_id = auth.uid())
  then
    raise exception 'Acesso negado ao relatorio desta empresa';
  end if;

  if p_group_by = 'status' then
    return query
      select
        coalesce(t.status::text, 'sem_status') as report_key,
        coalesce(sum(t.amount), 0)::bigint as total_amount,
        count(*)::bigint as transactions_count
      from public.transactions t
      where t.company_id = p_company_id
        and t.due_date between p_start_date and p_end_date
        and t.status <> 'canceled'
      group by t.status::text
      order by total_amount desc;
  elsif p_group_by = 'operational_group' then
    return query
      select
        coalesce(t.operational_group, 'Sem grupo') as report_key,
        coalesce(sum(t.amount), 0)::bigint as total_amount,
        count(*)::bigint as transactions_count
      from public.transactions t
      where t.company_id = p_company_id
        and t.due_date between p_start_date and p_end_date
        and t.status <> 'canceled'
      group by coalesce(t.operational_group, 'Sem grupo')
      order by total_amount desc;
  else
    return query
      select
        t.direction::text as report_key,
        coalesce(sum(t.amount), 0)::bigint as total_amount,
        count(*)::bigint as transactions_count
      from public.transactions t
      where t.company_id = p_company_id
        and t.due_date between p_start_date and p_end_date
        and t.status <> 'canceled'
      group by t.direction::text
      order by total_amount desc;
  end if;
end;
$$;

grant execute on function public.run_financial_report(uuid, date, date, text) to authenticated;
