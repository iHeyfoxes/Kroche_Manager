create or replace function public.cancelar_pedido_catalogo(p_pedido_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos_catalogo%rowtype;
  v_item record;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão necessária.';
  end if;

  select * into v_pedido
  from public.pedidos_catalogo
  where id = p_pedido_id
    and usuario_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_pedido.status = 'Cancelado' then
    return pg_catalog.jsonb_build_object('sucesso',true,'ja_cancelado',true,'pedido_id',v_pedido.id);
  end if;

  if v_pedido.status in ('Entregue','Pronto') then
    raise exception 'Não é possível cancelar um pedido já finalizado.';
  end if;

  update public.pedidos_catalogo
  set status = 'Cancelado', atualizado_em = now()
  where id = v_pedido.id;

  for v_item in
    select produto_id, quantidade
    from public.pedido_itens
    where pedido_id = v_pedido.id
      and produto_id is not null
  loop
    update public.produtos
    set quantidade = coalesce(quantidade,0) + v_item.quantidade
    where id = v_item.produto_id
      and usuario_id = v_pedido.usuario_id;
  end loop;

  update public.encomendas
  set status = 'Cancelado', atualizado_em = now()
  where pedido_catalogo_id = v_pedido.id
    and user_id = v_pedido.usuario_id;

  return pg_catalog.jsonb_build_object('sucesso',true,'pedido_id',v_pedido.id);
end;
$$;
