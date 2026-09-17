-- ============================================================
-- KROCHE MANAGER — Schema Supabase (Postgres + RLS)
-- Equivalente ao models.py do projeto Flask original.
-- Rode isto no SQL Editor do seu projeto Supabase, de cima pra baixo.
-- ============================================================

-- Extensão usada para gerar sufixos aleatórios no slug
create extension if not exists pgcrypto;

-- ============================================================
-- USUÁRIOS
-- Observação: e-mail e senha ficam no auth.users nativo do Supabase.
-- Esta tabela guarda só os dados extras do perfil/loja, com o mesmo
-- id do usuário do Auth (1 para 1).
-- ============================================================
create table public.usuarios (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null,
    whatsapp text,
    slug text not null unique,
    tema text not null default 'claro',
    foto text not null default 'perfil_padrao.png',

    -- personalização do catálogo
    catalogo_nome text default '',
    catalogo_slogan text default 'Amigurumis feitos à mão ❤️',
    catalogo_banner text,
    catalogo_cor text default '#6B4E3D',
    catalogo_cor_botao text default '#25D366',
    catalogo_cor_fundo text default '#F7F3EF',
    mostrar_preco boolean default true,
    mostrar_estoque boolean default true,
    mostrar_tempo boolean default true,

    -- LGPD
    aceitou_termos boolean not null default false,
    aceitou_politica boolean not null default false,
    data_aceite_lgpd timestamptz not null default now(),

    data timestamptz not null default now()
);

-- ------------------------------------------------------------
-- BUG CORRIGIDO (#2 do diagnóstico): slug duplicado.
-- Esta função gera o slug a partir do nome e, se já existir,
-- acrescenta um sufixo aleatório até ficar único — em vez de
-- deixar o INSERT simplesmente quebrar.
-- ------------------------------------------------------------
create or replace function public.gerar_slug_unico(p_nome text)
returns text
language plpgsql
as $$
declare
    base_slug text;
    slug_final text;
    tentativa int := 0;
begin
    base_slug := lower(regexp_replace(unaccent(p_nome), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
        base_slug := 'loja';
    end if;

    slug_final := base_slug;

    while exists (select 1 from public.usuarios where slug = slug_final) loop
        tentativa := tentativa + 1;
        slug_final := base_slug || '-' || substr(md5(random()::text), 1, 5);
    end loop;

    return slug_final;
end;
$$;

-- unaccent é necessário para a função acima (remove acentos do nome)
create extension if not exists unaccent;

-- ------------------------------------------------------------
-- Trigger: quando um novo usuário se cadastra pelo Supabase Auth,
-- cria automaticamente a linha correspondente em public.usuarios,
-- já com slug único gerado a partir do nome informado no cadastro
-- (esperamos o nome em raw_user_meta_data->>'nome').
-- ------------------------------------------------------------
create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.usuarios (id, nome, slug, aceitou_termos, aceitou_politica, data_aceite_lgpd)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'nome', 'Ateliê'),
        public.gerar_slug_unico(coalesce(new.raw_user_meta_data->>'nome', 'loja')),
        coalesce((new.raw_user_meta_data->>'aceitou_termos')::boolean, false),
        coalesce((new.raw_user_meta_data->>'aceitou_politica')::boolean, false),
        now()
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.criar_perfil_usuario();

-- ============================================================
-- VENDAS
-- ============================================================
create table public.vendas (
    id bigint generated always as identity primary key,
    cliente text not null,
    produto text not null,
    valor numeric not null,
    data timestamptz default now(),
    user_id uuid not null references public.usuarios(id) on delete cascade
);

-- ============================================================
-- COMPRAS
-- ============================================================
create table public.compras (
    id bigint generated always as identity primary key,
    material text not null,
    fornecedor text not null,
    quantidade integer not null,
    valor numeric not null,
    data timestamptz default now(),
    user_id uuid not null references public.usuarios(id) on delete cascade
);

-- ============================================================
-- RECEITAS
-- ============================================================
create table public.receitas (
    id bigint generated always as identity primary key,
    nome text not null,
    autor text,
    categoria text,
    nivel text,
    youtube text,
    pdf text,
    observacoes text,
    favorito boolean default false,
    data timestamptz default now(),
    user_id uuid not null references public.usuarios(id) on delete cascade
);

-- ============================================================
-- ENCOMENDAS
-- (bug #1 do diagnóstico era o app salvar em "whatsapp" em vez de
-- "telefone" — aqui só existe a coluna certa, então o bug não pode
-- se repetir)
-- ============================================================
create table public.encomendas (
    id bigint generated always as identity primary key,
    cliente text not null,
    telefone text,
    produto text not null,
    valor numeric,
    sinal numeric default 0,
    data_entrega date,
    status text default 'Pendente',
    observacoes text,
    data timestamptz default now(),
    user_id uuid not null references public.usuarios(id) on delete cascade
);

-- ============================================================
-- PRODUTOS / CATÁLOGO
-- ============================================================
create table public.produtos (
    id bigint generated always as identity primary key,
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    nome text not null,
    descricao text,
    foto text,
    preco numeric not null,
    quantidade integer not null default 0,
    tempo_producao integer,
    mostrar_catalogo boolean default true,
    data timestamptz default now()
);

-- ============================================================
-- LEADS (interesses vindos do carrinho da loja pública)
-- ============================================================
create table public.leads (
    id bigint generated always as identity primary key,
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    nome_cliente text not null,
    telefone_cliente text not null,
    itens jsonb not null,
    valor_total numeric default 0,
    status text default 'Novo',
    data timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Regra geral: cada artesã só enxerga/edita os próprios dados.
-- O catálogo (produtos com mostrar_catalogo = true) e a criação
-- de leads ficam públicos, porque a loja é vista por visitantes
-- sem login.
-- ============================================================

alter table public.usuarios enable row level security;
alter table public.vendas enable row level security;
alter table public.compras enable row level security;
alter table public.receitas enable row level security;
alter table public.encomendas enable row level security;
alter table public.produtos enable row level security;
alter table public.leads enable row level security;

-- USUARIOS: qualquer pessoa pode ler o perfil (necessário para a loja
-- pública mostrar nome/cores/whatsapp da artesã); só a própria dona
-- pode alterar seus dados.
create policy "usuarios: leitura publica" on public.usuarios
    for select using (true);

create policy "usuarios: dono pode atualizar" on public.usuarios
    for update using (auth.uid() = id);

-- VENDAS / COMPRAS / RECEITAS / ENCOMENDAS: 100% privado, CRUD completo
-- só para o dono.
create policy "vendas: dono" on public.vendas
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "compras: dono" on public.compras
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "receitas: dono" on public.receitas
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "encomendas: dono" on public.encomendas
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PRODUTOS: a dona faz CRUD completo dos próprios produtos; qualquer
-- visitante pode ler os que estão marcados para aparecer no catálogo.
create policy "produtos: dono crud" on public.produtos
    for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "produtos: leitura publica do catalogo" on public.produtos
    for select using (mostrar_catalogo = true);

-- LEADS: qualquer visitante da loja pode CRIAR um lead (finalizar
-- carrinho); só a dona pode ler/atualizar os leads dela.
create policy "leads: criacao publica" on public.leads
    for insert with check (true);

create policy "leads: dono le e atualiza" on public.leads
    for select using (auth.uid() = usuario_id);

create policy "leads: dono atualiza" on public.leads
    for update using (auth.uid() = usuario_id);

-- ============================================================
-- STORAGE (fotos de perfil, produtos e banners)
-- Rode isto também — cria os buckets. As policies de storage ficam
-- na aba Storage > Policies do painel, ou você pode usar as mesmas
-- daqui (o painel do Supabase já sugere o modelo "dono pode escrever,
-- todo mundo pode ler" para bucket público).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Observação sobre o bug #3 do diagnóstico (fotos sobrescrevendo
-- umas às outras): no upload feito pelo JS do site (assets/js/*.js),
-- sempre geramos o nome do arquivo com um uuid antes de subir pro
-- Storage — nunca usamos o nome original do arquivo. Isso resolve
-- o bug de vez, para os três tipos de upload (perfil, produto e banner).


-- ============================================================
-- STORAGE — políticas mínimas para uploads do frontend
-- O site grava os arquivos dentro de uma pasta com o UUID do
-- usuário: <user_id>/<uuid>.<ext>. Isso evita colisões.
-- ============================================================

create policy "fotos-perfil: leitura publica"
on storage.objects for select
using (bucket_id = 'fotos-perfil');

create policy "fotos-perfil: dono pode inserir"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'fotos-perfil'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "fotos-perfil: dono pode atualizar"
on storage.objects for update to authenticated
using (
  bucket_id = 'fotos-perfil'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'fotos-perfil'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "produtos: leitura publica storage"
on storage.objects for select
using (bucket_id = 'produtos');

create policy "produtos: dono pode inserir storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'produtos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "produtos: dono pode atualizar storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'produtos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'produtos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "banners: leitura publica storage"
on storage.objects for select
using (bucket_id = 'banners');

create policy "banners: dono pode inserir storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'banners'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "banners: dono pode atualizar storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'banners'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'banners'
  and (storage.foldername(name))[1] = auth.uid()::text
);
