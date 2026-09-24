# Pedidos do catálogo

O fluxo de pedidos públicos é:

1. O cliente monta o carrinho.
2. O catálogo chama `finalizar_pedido_catalogo`.
3. O banco cria um registro em `pedidos_catalogo` e os itens em `pedido_itens`.
4. O estoque dos produtos é reservado/descontado na mesma transação.
5. Uma encomenda administrativa é criada com `pedido_catalogo_id`.
6. O catálogo monta a mensagem personalizada e abre o WhatsApp da loja.
7. O administrador acompanha o pedido em **Encomendas**.
8. Cancelar um pedido pelo administrativo chama `cancelar_pedido_catalogo`, devolvendo o estoque.
9. Alterar os demais status de um pedido de catálogo também atualiza `pedidos_catalogo`.

A baixa de estoque acontece dentro da função PostgreSQL com bloqueio de linha (`FOR UPDATE`). Assim, duas compras concorrentes não devem conseguir reservar a mesma unidade disponível.

## Estrutura

- `pedidos_catalogo`: cabeçalho do pedido.
- `pedido_itens`: produtos, quantidades e preços congelados no momento da compra.
- `encomendas.pedido_catalogo_id`: vínculo com o atendimento administrativo.

Não colocar lógica de baixa de estoque no JavaScript do catálogo. Essa regra deve permanecer no banco para evitar divergências e overselling.
