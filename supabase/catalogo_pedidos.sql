-- ============================================================
-- PEDIDOS DO CATÁLOGO: estoque atômico + encomendas pendentes
-- Execute este arquivo uma única vez no SQL Editor do Supabase.
-- ============================================================

create or replace function public.finalizar_pedido_catalogo(
    p_slug text,
    p_cliente text,
    p_telefone text,
    p_itens jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_loja public.usuarios%rowtype;
    v_item jsonb;
    v_produto public.produtos%rowtype;
    v_qtd integer;
    v_total numeric := 0;
    v_pedido_id bigint;
    v_telefone_loja text;
    v_itens_confirmados jsonb := '[]'::jsonb;
begin
    if coalesce(trim(p_cliente), '') = '' then
        raise exception 'Informe seu nome.';
    end if;

    if coalesce(trim(p_telefone), '') = '' then
        raise exception 'Informe seu telefone.';
    end if;

    if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
        raise exception 'O carrinho está vazio.';
    end if;

    select * into v_loja
    from public.usuarios
    where slug = p_slug
    limit 1;

    if not found then
        raise exception 'Loja não encontrada.';
    end if;

    -- FOR UPDATE evita que dois clientes comprem o último item ao mesmo tempo.
    for v_item in select * from jsonb_array_elements(p_itens) loop
        v_qtd := greatest(0, coalesce((v_item->>'quantidade')::integer, 0));

        if v_qtd < 1 then
            raise exception 'Quantidade inválida para um produto.';
        end if;

        select * into v_produto
        from public.produtos
        where id = (v_item->>'id')::bigint
          and usuario_id = v_loja.id
          and mostrar_catalogo = true
        for update;

        if not found then
            raise exception 'Um produto não está mais disponível.';
        end if;

        if v_produto.quantidade < v_qtd then
            raise exception 'Estoque insuficiente para: % (disponível: %).', v_produto.nome, v_produto.quantidade;
        end if;

        update public.produtos
        set quantidade = quantidade - v_qtd
        where id = v_produto.id;

        insert into public.encomendas (
            cliente, telefone, produto, valor, sinal, status, observacoes, user_id
        ) values (
            trim(p_cliente),
            trim(p_telefone),
            v_produto.nome,
            v_produto.preco * v_qtd,
            0,
            'Pendente',
            'Pedido pelo catálogo. Quantidade: ' || v_qtd,
            v_loja.id
        ) returning id into v_pedido_id;

        v_total := v_total + (v_produto.preco * v_qtd);
        v_itens_confirmados := v_itens_confirmados || jsonb_build_array(
            jsonb_build_object('nome', v_produto.nome, 'quantidade', v_qtd, 'valor', v_produto.preco * v_qtd)
        );
    end loop;

    return jsonb_build_object(
        'sucesso', true,
        'total', v_total,
        'itens', v_itens_confirmados,
        'whatsapp', coalesce(v_loja.whatsapp, '')
    );
end;
$$;

grant execute on function public.finalizar_pedido_catalogo(text, text, text, jsonb) to anon, authenticated;
