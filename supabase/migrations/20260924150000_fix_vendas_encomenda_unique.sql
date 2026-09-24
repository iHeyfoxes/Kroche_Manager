drop index if exists public.vendas_encomenda_id_uidx;
create unique index if not exists vendas_encomenda_id_uidx
on public.vendas(encomenda_id);
