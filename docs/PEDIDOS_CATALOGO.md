# Pedidos do catálogo

## Fluxo

`Catálogo → Carrinho → RPC → Pedido → Baixa de estoque → Encomenda → WhatsApp`

## Estrutura

- `pedidos_catalogo`: cabeçalho do pedido.
- `pedido_itens`: itens e snapshot de preço/nome.
- `encomendas.pedido_catalogo_id`: vínculo com a encomenda administrativa.

## Segurança

A finalização usa função PostgreSQL `SECURITY DEFINER` com `search_path` vazio e bloqueio `FOR UPDATE` nos produtos. O checkout público usa apenas a função RPC; acesso direto às tabelas de pedidos permanece bloqueado para visitantes.

`finalizar_pedido_catalogo` é executável por `anon` e cria o pedido/itens, baixa o estoque e cria a encomenda em uma transação.

`cancelar_pedido_catalogo` exige usuário autenticado, valida que o pedido pertence à loja logada, devolve as quantidades ao estoque e sincroniza a encomenda como cancelada.

## Histórico

O preço e o nome são copiados para `pedido_itens`, então alterações futuras no cadastro do produto não alteram o histórico do pedido.
