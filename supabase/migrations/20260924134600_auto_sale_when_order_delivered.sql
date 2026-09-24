alter table public.vendas add column if not exists encomenda_id bigint references public.encomendas(id) on delete set null;
create unique index if not exists vendas_encomenda_uidx on public.vendas(encomenda_id) where encomenda_id is not null;

create or replace function public.registrar_venda_encomenda_entregue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'Entregue'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.vendas(cliente, produto, valor, data, user_id, encomenda_id)
    values (
      new.cliente,
      new.produto,
      coalesce(new.valor, 0),
      coalesce(new.data_pagamento, now()),
      new.user_id,
      new.id
    )
    on conflict (encomenda_id) do update
      set cliente = excluded.cliente,
          produto = excluded.produto,
          valor = excluded.valor,
          user_id = excluded.user_id;

    update public.encomendas
      set data_pagamento = coalesce(data_pagamento, now()),
          atualizado_em = now()
      where id = new.id;

    if new.pedido_catalogo_id is not null then
      update public.pedidos_catalogo
        set status = 'Entregue',
            atualizado_em = now()
        where id = new.pedido_catalogo_id
          and usuario_id = new.user_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_encomenda_entregue_venda on public.encomendas;
create trigger trg_encomenda_entregue_venda
after insert or update of status on public.encomendas
for each row execute function public.registrar_venda_encomenda_entregue();

revoke execute on function public.registrar_venda_encomenda_entregue() from public, anon, authenticated;