-- Reaplica as permissões finais do checkout público e do cancelamento administrativo.
-- Esta migration já foi aplicada no projeto de produção em 2026-09-24.
revoke execute on function public.finalizar_pedido_catalogo(text,text,text,jsonb) from public, authenticated;
grant execute on function public.finalizar_pedido_catalogo(text,text,text,jsonb) to anon;

revoke execute on function public.cancelar_pedido_catalogo(bigint) from public, anon;
grant execute on function public.cancelar_pedido_catalogo(bigint) to authenticated;

revoke execute on function public.proteger_produto_com_pedido_ativo() from public, anon, authenticated;
