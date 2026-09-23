-- Corresponde à migration aplicada no Supabase em 20260923181336.
-- Expõe a categoria relacionada no catálogo público.

create or replace function public.obter_catalogo_publico(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
    v_loja public.usuarios%rowtype;
    v_produtos jsonb;
begin
    select * into v_loja from public.usuarios where slug=p_slug limit 1;

    if not found then
        return jsonb_build_object('loja',null,'produtos','[]'::jsonb);
    end if;

    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id',p.id,
            'nome',p.nome,
            'descricao',p.descricao,
            'foto',p.foto,
            'preco',p.preco,
            'quantidade',p.quantidade,
            'tempo_producao',p.tempo_producao,
            'mostrar_catalogo',p.mostrar_catalogo,
            'categoria_id',p.categoria_id,
            'categoria',c.nome
        ) order by p.data desc
    ),'[]'::jsonb)
    into v_produtos
    from public.produtos p
    left join public.categorias_produtos c on c.id=p.categoria_id
    where p.usuario_id=v_loja.id and p.mostrar_catalogo=true;

    return jsonb_build_object(
      'loja',jsonb_build_object(
        'id',v_loja.id,'nome',v_loja.nome,'slug',v_loja.slug,'whatsapp',v_loja.whatsapp,
        'catalogo_nome',v_loja.catalogo_nome,'catalogo_slogan',v_loja.catalogo_slogan,
        'catalogo_banner',v_loja.catalogo_banner,'catalogo_cor',v_loja.catalogo_cor,
        'catalogo_cor_botao',v_loja.catalogo_cor_botao,'catalogo_cor_fundo',v_loja.catalogo_cor_fundo,
        'mostrar_preco',v_loja.mostrar_preco,'mostrar_estoque',v_loja.mostrar_estoque,'mostrar_tempo',v_loja.mostrar_tempo
      ),
      'produtos',v_produtos
    );
end;
$function$;
