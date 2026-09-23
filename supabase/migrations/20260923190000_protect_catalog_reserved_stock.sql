create or replace function public.proteger_produto_com_pedido_ativo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.pedido_itens i
    join public.pedidos_catalogo p on p.id = i.pedido_id
    where i.produto_id = old.id
      and p.usuario_id = old.usuario_id
      and p.status in ('Pendente','Confirmado','Em produção')
  ) then
    if tg_op = 'DELETE' then
      raise exception 'Este produto possui um pedido do catálogo em andamento. Cancele o pedido antes de excluir o produto.';
    end if;
    if new.quantidade is distinct from old.quantidade then
      raise exception 'A quantidade deste produto está reservada por um pedido do catálogo. Cancele o pedido antes de alterar o estoque manualmente.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_proteger_produto_com_pedido_ativo on public.produtos;
create trigger trg_proteger_produto_com_pedido_ativo
before update or delete on public.produtos
for each row execute function public.proteger_produto_com_pedido_ativo();

revoke execute on function public.proteger_produto_com_pedido_ativo() from public, anon, authenticated;