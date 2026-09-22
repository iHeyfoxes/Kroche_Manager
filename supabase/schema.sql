-- ============================================================
-- KROCHE MANAGER — Schema Supabase (Postgres + RLS)
-- Schema versionado do frontend atual.
-- Execute em um projeto Supabase novo de cima para baixo.
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table public.usuarios (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null,
    whatsapp text,
    slug text not null unique,
    tema text not null default 'claro',
    foto text not null default 'perfil_padrao.png',
    catalogo_nome text default '',
    catalogo_slogan text default 'Amigurumis feitos à mão ❤️',
    catalogo_banner text,
    catalogo_cor text default '#6B4E3D',
    catalogo_cor_botao text default '#25D366',
    catalogo_cor_fundo text default '#F7F3EF',
    mostrar_preco boolean not null default true,
    mostrar_estoque boolean not null default true,
    mostrar_tempo boolean not null default true,
    aceitou_termos boolean not null default false,
    aceitou_politica boolean not null default false,
    data_aceite_lgpd timestamptz not null default now(),
    data timestamptz not null default now()
);

create or replace function public.gerar_slug_unico(p_nome text)
returns text language plpgsql set search_path = pg_catalog, public as $$
declare base_slug text; slug_final text; tentativa int := 0;
begin
    base_slug := lower(regexp_replace(public.unaccent(coalesce(p_nome, 'loja')), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'loja'; end if;
    slug_final := base_slug;
    while exists (select 1 from public.usuarios where slug = slug_final) loop
        tentativa := tentativa + 1;
        slug_final := base_slug || '-' || substr(md5(random()::text), 1, 5);
    end loop;
    return slug_final;
end;
$$;

create or replace function public.criar_perfil_usuario()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
    insert into public.usuarios (id, nome, slug, aceitou_termos, aceitou_politica, data_aceite_lgpd)
    values (new.id, coalesce(new.raw_user_meta_data->>'nome', 'Ateliê'),
      public.gerar_slug_unico(coalesce(new.raw_user_meta_data->>'nome', 'loja')),
      coalesce((new.raw_user_meta_data->>'aceitou_termos')::boolean, false),
      coalesce((new.raw_user_meta_data->>'aceitou_politica')::boolean, false), now());
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.criar_perfil_usuario();

create table public.vendas (id bigint generated always as identity primary key, cliente text not null, produto text not null, valor numeric not null, data timestamptz default now(), user_id uuid not null references public.usuarios(id) on delete cascade);
create table public.compras (id bigint generated always as identity primary key, material text not null, fornecedor text not null, quantidade integer not null, valor numeric not null, data timestamptz default now(), user_id uuid not null references public.usuarios(id) on delete cascade);
create table public.receitas (id bigint generated always as identity primary key, nome text not null, autor text, categoria text, nivel text, youtube text, pdf text, observacoes text, favorito boolean default false, data timestamptz default now(), user_id uuid not null references public.usuarios(id) on delete cascade);
create table public.encomendas (id bigint generated always as identity primary key, cliente text not null, telefone text, produto text not null, valor numeric, sinal numeric default 0, data_entrega date, status text default 'Pendente', observacoes text, data timestamptz default now(), user_id uuid not null references public.usuarios(id) on delete cascade);
create table public.produtos (id bigint generated always as identity primary key, usuario_id uuid not null references public.usuarios(id) on delete cascade, nome text not null, descricao text, foto text, preco numeric not null, quantidade integer not null default 0, tempo_producao integer, mostrar_catalogo boolean not null default true, data timestamptz default now());
create table public.clientes (id bigint generated always as identity primary key, usuario_id uuid not null references public.usuarios(id) on delete cascade, nome text not null, telefone text, email text, observacoes text, data timestamptz not null default now());
create table public.materiais (id bigint generated always as identity primary key, usuario_id uuid not null references public.usuarios(id) on delete cascade, nome text not null, categoria text, unidade text not null default 'unidade', quantidade numeric not null default 0, estoque_minimo numeric not null default 0, custo_unitario numeric not null default 0, fornecedor text, observacoes text, data timestamptz not null default now(), constraint materiais_quantidade_nonnegative check (quantidade >= 0), constraint materiais_estoque_minimo_nonnegative check (estoque_minimo >= 0), constraint materiais_custo_nonnegative check (custo_unitario >= 0));
create table public.leads (id bigint generated always as identity primary key, usuario_id uuid not null references public.usuarios(id) on delete cascade, nome_cliente text not null, telefone_cliente text not null, itens jsonb not null, valor_total numeric default 0, status text default 'Novo', data timestamptz default now());

create index if not exists idx_vendas_user_id on public.vendas(user_id);
create index if not exists idx_compras_user_id on public.compras(user_id);
create index if not exists idx_receitas_user_id on public.receitas(user_id);
create index if not exists idx_encomendas_user_id on public.encomendas(user_id);
create index if not exists idx_produtos_usuario_id on public.produtos(usuario_id);
create index if not exists idx_clientes_usuario_id on public.clientes(usuario_id);
create index if not exists idx_materiais_usuario_id on public.materiais(usuario_id);
create index if not exists idx_leads_usuario_id on public.leads(usuario_id);

alter table public.usuarios enable row level security;
alter table public.vendas enable row level security;
alter table public.compras enable row level security;
alter table public.receitas enable row level security;
alter table public.encomendas enable row level security;
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.materiais enable row level security;
alter table public.leads enable row level security;

create policy "usuarios: dono pode ler" on public.usuarios for select to authenticated using ((select auth.uid()) = id);
create policy "usuarios: dono pode atualizar" on public.usuarios for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "vendas: dono" on public.vendas for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "compras: dono" on public.compras for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "receitas: dono" on public.receitas for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "encomendas: dono" on public.encomendas for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "produtos: dono crud" on public.produtos for all to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy "produtos: leitura publica do catalogo" on public.produtos for select to anon using (mostrar_catalogo = true);
create policy "clientes: dono" on public.clientes for all to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy "materiais: dono" on public.materiais for all to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy "leads: criacao publica" on public.leads for insert to anon with check (true);
create policy "leads: dono le" on public.leads for select to authenticated using ((select auth.uid()) = usuario_id);
create policy "leads: dono atualiza" on public.leads for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

create or replace function public.obter_catalogo_publico(p_slug text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_loja public.usuarios%rowtype; v_produtos jsonb;
begin
    select * into v_loja from public.usuarios where slug = p_slug limit 1;
    if not found then return jsonb_build_object('loja', null, 'produtos', '[]'::jsonb); end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'descricao',p.descricao,'foto',p.foto,'preco',p.preco,'quantidade',p.quantidade,'tempo_producao',p.tempo_producao,'mostrar_catalogo',p.mostrar_catalogo) order by p.data desc),'[]'::jsonb) into v_produtos from public.produtos p where p.usuario_id=v_loja.id and p.mostrar_catalogo=true;
    return jsonb_build_object('loja',jsonb_build_object('id',v_loja.id,'nome',v_loja.nome,'slug',v_loja.slug,'whatsapp',v_loja.whatsapp,'catalogo_nome',v_loja.catalogo_nome,'catalogo_slogan',v_loja.catalogo_slogan,'catalogo_banner',v_loja.catalogo_banner,'catalogo_cor',v_loja.catalogo_cor,'catalogo_cor_botao',v_loja.catalogo_cor_botao,'catalogo_cor_fundo',v_loja.catalogo_cor_fundo,'mostrar_preco',v_loja.mostrar_preco,'mostrar_estoque',v_loja.mostrar_estoque,'mostrar_tempo',v_loja.mostrar_tempo),'produtos',v_produtos);
end;
$$;
revoke all on function public.obter_catalogo_publico(text) from public;
grant execute on function public.obter_catalogo_publico(text) to anon;
revoke execute on function public.obter_catalogo_publico(text) from authenticated;

insert into storage.buckets (id,name,public) values ('fotos-perfil','fotos-perfil',true) on conflict(id) do nothing;
insert into storage.buckets (id,name,public) values ('produtos','produtos',true) on conflict(id) do nothing;
insert into storage.buckets (id,name,public) values ('banners','banners',true) on conflict(id) do nothing;
create policy "fotos-perfil: leitura publica" on storage.objects for select using (bucket_id='fotos-perfil');
create policy "fotos-perfil: dono pode inserir" on storage.objects for insert to authenticated with check (bucket_id='fotos-perfil' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "fotos-perfil: dono pode atualizar" on storage.objects for update to authenticated using (bucket_id='fotos-perfil' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='fotos-perfil' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "produtos: leitura publica storage" on storage.objects for select using (bucket_id='produtos');
create policy "produtos: dono pode inserir storage" on storage.objects for insert to authenticated with check (bucket_id='produtos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "produtos: dono pode atualizar storage" on storage.objects for update to authenticated using (bucket_id='produtos' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='produtos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "banners: leitura publica storage" on storage.objects for select using (bucket_id='banners');
create policy "banners: dono pode inserir storage" on storage.objects for insert to authenticated with check (bucket_id='banners' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "banners: dono pode atualizar storage" on storage.objects for update to authenticated using (bucket_id='banners' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='banners' and (storage.foldername(name))[1]=(select auth.uid())::text);
