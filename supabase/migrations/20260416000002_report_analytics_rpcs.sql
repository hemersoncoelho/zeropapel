-- ============================================================
-- Report Analytics RPCs
-- Alimentam a página /reports com dados agregados no banco.
-- Todas as funções usam security invoker (RLS aplicada
-- automaticamente) mais um guard explícito com is_member_of.
-- ============================================================

-- ── 1. KPIs do período + comparativo vs período anterior ────
create or replace function public.get_report_overview(
  p_company_id uuid,
  p_date_from  date,
  p_date_to    date
)
returns table (
  revenue_total   bigint,
  expense_total   bigint,
  balance_total   bigint,
  tx_count        bigint,
  avg_ticket      bigint,
  revenue_prev    bigint,
  expense_prev    bigint,
  balance_prev    bigint,
  open_count      bigint,
  paid_count      bigint,
  partial_count   bigint,
  overdue_count   bigint
)
language plpgsql
stable
security invoker
as $$
declare
  v_prev_from date;
  v_prev_to   date;
begin
  if not (
    public.is_member_of(p_company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Acesso negado ao relatório desta empresa';
  end if;

  v_prev_to   := p_date_from - 1;
  v_prev_from := p_date_from - (p_date_to - p_date_from + 1);

  return query
    with
    curr as (
      select
        coalesce(sum(amount) filter (where direction = 'receivable' and status <> 'canceled'), 0) as rev,
        coalesce(sum(amount) filter (where direction = 'payable'    and status <> 'canceled'), 0) as exp,
        count(*) filter (where status <> 'canceled')                                              as cnt,
        count(*) filter (where status = 'open')                                                   as n_open,
        count(*) filter (where status = 'paid')                                                   as n_paid,
        count(*) filter (where status = 'partial')                                                as n_partial,
        count(*) filter (where status = 'overdue')                                                as n_overdue
      from public.transactions
      where company_id = p_company_id
        and due_date between p_date_from and p_date_to
    ),
    prev as (
      select
        coalesce(sum(amount) filter (where direction = 'receivable' and status <> 'canceled'), 0) as rev,
        coalesce(sum(amount) filter (where direction = 'payable'    and status <> 'canceled'), 0) as exp
      from public.transactions
      where company_id = p_company_id
        and due_date between v_prev_from and v_prev_to
    )
    select
      c.rev,
      c.exp,
      c.rev - c.exp,
      c.cnt,
      case when c.cnt > 0 then (c.rev + c.exp) / c.cnt else 0 end,
      p.rev,
      p.exp,
      p.rev - p.exp,
      c.n_open,
      c.n_paid,
      c.n_partial,
      c.n_overdue
    from curr c, prev p;
end;
$$;

grant execute on function public.get_report_overview(uuid, date, date) to authenticated;


-- ── 2. Série temporal (dia / semana / mês) ──────────────────
create or replace function public.get_report_timeseries(
  p_company_id uuid,
  p_date_from  date,
  p_date_to    date,
  p_group_by   text default 'month'
)
returns table (
  period   text,
  revenue  bigint,
  expense  bigint,
  balance  bigint
)
language plpgsql
stable
security invoker
as $$
begin
  if not (
    public.is_member_of(p_company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Acesso negado ao relatório desta empresa';
  end if;

  if p_group_by not in ('day', 'week', 'month') then
    raise exception 'Agrupamento inválido. Use: day, week ou month';
  end if;

  return query
    select
      to_char(date_trunc(p_group_by, t.due_date), 'YYYY-MM-DD')                                    as period,
      coalesce(sum(t.amount) filter (where t.direction = 'receivable' and t.status <> 'canceled'), 0)::bigint as revenue,
      coalesce(sum(t.amount) filter (where t.direction = 'payable'    and t.status <> 'canceled'), 0)::bigint as expense,
      (
        coalesce(sum(t.amount) filter (where t.direction = 'receivable' and t.status <> 'canceled'), 0)
        - coalesce(sum(t.amount) filter (where t.direction = 'payable'  and t.status <> 'canceled'), 0)
      )::bigint as balance
    from public.transactions t
    where t.company_id = p_company_id
      and t.due_date between p_date_from and p_date_to
    group by date_trunc(p_group_by, t.due_date)
    order by date_trunc(p_group_by, t.due_date);
end;
$$;

grant execute on function public.get_report_timeseries(uuid, date, date, text) to authenticated;


-- ── 3. Breakdown por grupo operacional ──────────────────────
create or replace function public.get_report_by_group(
  p_company_id uuid,
  p_date_from  date,
  p_date_to    date
)
returns table (
  group_name   text,
  direction    text,
  total_amount bigint,
  tx_count     bigint,
  percentage   numeric
)
language plpgsql
stable
security invoker
as $$
begin
  if not (
    public.is_member_of(p_company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Acesso negado ao relatório desta empresa';
  end if;

  return query
    with
    totals as (
      select
        coalesce(sum(amount) filter (where direction = 'receivable' and status <> 'canceled'), 0) as total_rev,
        coalesce(sum(amount) filter (where direction = 'payable'    and status <> 'canceled'), 0) as total_exp
      from public.transactions
      where company_id = p_company_id
        and due_date between p_date_from and p_date_to
    ),
    grouped as (
      select
        coalesce(t.operational_group, 'Sem grupo')::text                                       as grp,
        t.direction::text                                                                      as dir,
        coalesce(sum(t.amount) filter (where t.status <> 'canceled'), 0)::bigint              as tot,
        count(*) filter (where t.status <> 'canceled')                                        as cnt
      from public.transactions t
      where t.company_id = p_company_id
        and t.due_date between p_date_from and p_date_to
      group by coalesce(t.operational_group, 'Sem grupo'), t.direction
    )
    select
      g.grp,
      g.dir,
      g.tot,
      g.cnt,
      case
        when g.dir = 'receivable' and (select total_rev from totals) > 0
          then round(g.tot::numeric / (select total_rev from totals) * 100, 1)
        when g.dir = 'payable' and (select total_exp from totals) > 0
          then round(g.tot::numeric / (select total_exp from totals) * 100, 1)
        else 0
      end as pct
    from grouped g
    order by g.dir desc, g.tot desc;
end;
$$;

grant execute on function public.get_report_by_group(uuid, date, date) to authenticated;


-- ── 4. Lançamentos recentes do período ──────────────────────
create or replace function public.get_report_recent_transactions(
  p_company_id uuid,
  p_date_from  date,
  p_date_to    date,
  p_limit      int default 20
)
returns table (
  id                uuid,
  tx_date           date,
  description       text,
  direction         text,
  status            text,
  amount            bigint,
  operational_group text
)
language plpgsql
stable
security invoker
as $$
begin
  if not (
    public.is_member_of(p_company_id)
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Acesso negado ao relatório desta empresa';
  end if;

  return query
    select
      t.id,
      t.due_date,
      t.description,
      t.direction::text,
      t.status::text,
      t.amount,
      coalesce(t.operational_group, 'Sem grupo')::text
    from public.transactions t
    where t.company_id = p_company_id
      and t.due_date between p_date_from and p_date_to
      and t.status <> 'canceled'
    order by t.due_date desc, t.created_at desc
    limit p_limit;
end;
$$;

grant execute on function public.get_report_recent_transactions(uuid, date, date, int) to authenticated;
