create or replace function public.registrar_compra_estoque(
  p_material text,
  p_fornecedor text,
  p_quantidade numeric,
  p_valor numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_material public.materiais%rowtype;
  v_compra public.compras%rowtype;
  v_unit numeric(12,4);
begin
  if v_user is null then raise exception 'Sessão necessária.'; end if;
  if pg_catalog.btrim(coalesce(p_material,'')) = '' then raise exception 'Informe o material.'; end if;
  if p_quantidade is null or p_quantidade <= 0 or p_quantidade <> pg_catalog.trunc(p_quantidade) then raise exception 'A quantidade deve ser um número inteiro maior que zero.'; end if;
  if p_valor is null or p_valor < 0 then raise exception 'O valor da compra é inválido.'; end if;
  v_unit := round((p_valor / p_quantidade)::numeric,4);
  select * into v_material from public.materiais where usuario_id=v_user and lower(pg_catalog.btrim(nome))=lower(pg_catalog.btrim(p_material)) for update;
  if not found then
    insert into public.materiais(usuario_id,nome,unidade,quantidade,custo_unitario,fornecedor,criado_em,atualizado_em)
    values(v_user,pg_catalog.btrim(p_material),'un',p_quantidade,v_unit,pg_catalog.btrim(p_fornecedor),now(),now())
    returning * into v_material;
  else
    update public.materiais
    set quantidade=coalesce(quantidade,0)+p_quantidade,
        custo_unitario=case when coalesce(quantidade,0)+p_quantidade>0 then round(((coalesce(quantidade,0)*coalesce(custo_unitario,0)) + p_valor) / (coalesce(quantidade,0)+p_quantidade),4) else v_unit end,
        fornecedor=case when pg_catalog.btrim(coalesce(p_fornecedor,''))<>'' then pg_catalog.btrim(p_fornecedor) else fornecedor end,
        atualizado_em=now()
    where id=v_material.id
    returning * into v_material;
  end if;
  insert into public.compras(material,fornecedor,quantidade,valor,user_id,material_id)
  values(pg_catalog.btrim(p_material),pg_catalog.btrim(p_fornecedor),p_quantidade::integer,p_valor,v_user,v_material.id)
  returning * into v_compra;
  return pg_catalog.jsonb_build_object('sucesso',true,'compra_id',v_compra.id,'material_id',v_material.id,'quantidade_estoque',v_material.quantidade);
end;
$$;