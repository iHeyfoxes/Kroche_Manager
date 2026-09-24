grant execute on function public.finalizar_pedido_catalogo(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.cancelar_pedido_catalogo(bigint) to authenticated;