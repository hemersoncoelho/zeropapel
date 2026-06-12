-- ============================================================
-- RPC: Breakdown de transações por categoria
-- Agrega lançamentos por categoria (com nome e cor),
-- calculando totais e percentuais por direção.
-- ============================================================

create or replace function public.get_report_by_category(
  p_company_id uuid,
  p_date_from  date,
  p_date_to    date
)
returns table (
  category_id    uuid,
  category_name  text,
  category_color text,
  direction      text,
  total_amount   bigint,
  tx_count       bigint,
  percentage     numeric
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
        c.id                                                                               as cat_id,
        coalesce(c.name, 'Sem categoria')::text                                            as cat_name,
        coalesce(c.color, '#6b7280')::text                                                 as cat_color,
        t.direction::text                                                                  as dir,
        coalesce(sum(t.amount) filter (where t.status <> 'canceled'), 0)::bigint          as tot,
        count(*) filter (where t.status <> 'canceled')                                    as cnt
      from public.transactions t
      left join public.categories c on c.id = t.category_id
      where t.company_id = p_company_id
        and t.due_date between p_date_from and p_date_to
      group by c.id, coalesce(c.name, 'Sem categoria'), coalesce(c.color, '#6b7280'), t.direction
    )
    select
      g.cat_id,
      g.cat_name,
      g.cat_color,
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

grant execute on function public.get_report_by_category(uuid, date, date) to authenticated;
