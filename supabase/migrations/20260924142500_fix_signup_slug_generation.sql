-- Corrige o cadastro de novos usuários.
-- A função anterior dependia da extensão unaccent, que não está disponível
-- neste projeto. O slug agora normaliza os principais acentos do português
-- diretamente com translate().
create or replace function public.gerar_slug_unico(p_nome text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  base_slug text;
  slug_final text;
  tentativa integer := 0;
begin
  base_slug := pg_catalog.regexp_replace(
    pg_catalog.translate(
      pg_catalog.lower(coalesce(p_nome, 'loja')),
      'áàãâäéèêëíìîïóòõôöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  );

  base_slug := pg_catalog.btrim(base_slug, '-');

  if base_slug = '' then
    base_slug := 'loja';
  end if;

  slug_final := base_slug;

  while exists (
    select 1
    from public.usuarios
    where slug = slug_final
  ) loop
    tentativa := tentativa + 1;
    slug_final := base_slug || '-' ||
      pg_catalog.substr(pg_catalog.md5(pg_catalog.random()::text), 1, 5);
  end loop;

  return slug_final;
end;
$$;

create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (
    id,
    nome,
    slug,
    aceitou_termos,
    aceitou_politica,
    data_aceite_lgpd
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Ateliê'),
    public.gerar_slug_unico(
      coalesce(new.raw_user_meta_data->>'nome', 'loja')
    ),
    coalesce((new.raw_user_meta_data->>'aceitou_termos')::boolean, false),
    coalesce((new.raw_user_meta_data->>'aceitou_politica')::boolean, false),
    pg_catalog.now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.gerar_slug_unico(text) from public;
revoke execute on function public.criar_perfil_usuario() from public, anon, authenticated;
