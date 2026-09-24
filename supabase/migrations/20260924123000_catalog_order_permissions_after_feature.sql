-- Reforça as permissões finais do checkout público após a integração do fluxo de pedidos.
revoke execute on function public.finalizar_pedido_catalogo(text,text,text,jsonb) from public, authenticated;
grant execute on function public.finalizar_pedido_catalogo(text,text,text,jsonb) to anon;

revoke execute on function public.cancelar_pedido_catalogo(bigint) from public, anon;
grant execute on function public.cancelar_pedido_catalogo(bigint) to authenticated;

revoke execute on function public.proteger_produto_com_pedido_ativo() from public, anon, authenticated;
