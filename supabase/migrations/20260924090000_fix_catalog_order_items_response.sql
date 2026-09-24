create or replace function public.finalizar_pedido_catalogo(p_slug text, p_cliente text, p_telefone text, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_loja public.usuarios%rowtype;
  v_produto public.produtos%rowtype;
  v_item record;
  v_pedido_id bigint;
  v_encomenda_id bigint;
  v_total numeric(12,2) := 0;
  v_itens_confirmados pg_catalog.jsonb := '[]'::pg_catalog.jsonb;
  v_produtos_resumo text := '';
begin
  if pg_catalog.btrim(coalesce(p_cliente,'')) = '' then raise exception 'Informe seu nome.'; end if;
  if pg_catalog.btrim(coalesce(p_telefone,'')) = '' then raise exception 'Informe seu telefone.'; end if;
  if pg_catalog.jsonb_typeof(p_itens) <> 'array' or pg_catalog.jsonb_array_length(p_itens) = 0 then raise exception 'O carrinho está vazio.'; end if;

  select * into v_loja from public.usuarios where slug = pg_catalog.btrim(p_slug) limit 1;
  if not found then raise exception 'Loja não encontrada.'; end if;

  insert into public.pedidos_catalogo(usuario_id,cliente,telefone)
  values(v_loja.id,pg_catalog.btrim(p_cliente),pg_catalog.btrim(p_telefone))
  returning id into v_pedido_id;

  for v_item in
    select x.id, sum(x.quantidade)::integer as quantidade
    from pg_catalog.jsonb_to_recordset(p_itens) as x(id bigint, quantidade integer)
    group by x.id order by x.id
  loop
    if v_item.id is null or v_item.quantidade is null or v_item.quantidade < 1 or v_item.quantidade > 1000 then
      raise exception 'Quantidade inválida para um produto.';
    end if;

    select * into v_produto
    from public.produtos
    where id = v_item.id and usuario_id = v_loja.id and mostrar_catalogo = true
    for update;

    if not found then raise exception 'Um produto não está mais disponível.'; end if;

    if coalesce(v_produto.quantidade,0) < v_item.quantidade then
      raise exception 'Estoque insuficiente para: % (disponível: %).',v_produto.nome,v_produto.quantidade;
    end if;

    update public.produtos
    set quantidade = quantidade - v_item.quantidade
    where id = v_produto.id;

    insert into public.pedido_itens(
      pedido_id,produto_id,nome_produto,quantidade,preco_unitario,subtotal
    )
    values(
      v_pedido_id,v_produto.id,v_produto.nome,v_item.quantidade,
      coalesce(v_produto.preco,0),
      coalesce(v_produto.preco,0)*v_item.quantidade
    );

    v_total := v_total + coalesce(v_produto.preco,0)*v_item.quantidade;

    v_produtos_resumo := case
      when v_produtos_resumo=''
      then v_produto.nome||' x'||v_item.quantidade
      else v_produtos_resumo||', '||v_produto.nome||' x'||v_item.quantidade
    end;

    v_itens_confirmados := v_itens_confirmados || pg_catalog.jsonb_build_object(
      'id',v_produto.id,
      'nome',v_produto.nome,
      'quantidade',v_item.quantidade,
      'preco_unitario',coalesce(v_produto.preco,0),
      'valor',coalesce(v_produto.preco,0)*v_item.quantidade
    );
  end loop;

  update public.pedidos_catalogo
  set total=v_total, atualizado_em=pg_catalog.now()
  where id=v_pedido_id;

  insert into public.encomendas(
    cliente,telefone,produto,valor,sinal,status,observacoes,user_id,pedido_catalogo_id
  )
  values(
    pg_catalog.btrim(p_cliente),pg_catalog.btrim(p_telefone),v_produtos_resumo,
    v_total,0,'Pendente',
    'Pedido recebido pelo catálogo público. Pedido #'||v_pedido_id,
    v_loja.id,v_pedido_id
  )
  returning id into v_encomenda_id;

  return pg_catalog.jsonb_build_object(
    'sucesso',true,
    'pedido_id',v_pedido_id,
    'encomenda_id',v_encomenda_id,
    'total',v_total,
    'itens',v_itens_confirmados,
    'whatsapp',coalesce(v_loja.whatsapp,'')
  );
end;
$$;