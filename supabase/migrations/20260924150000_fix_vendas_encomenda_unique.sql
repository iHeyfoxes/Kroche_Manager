create unique index if not exists vendas_encomenda_id_uidx
on public.vendas(encomenda_id)
where encomenda_id is not null;