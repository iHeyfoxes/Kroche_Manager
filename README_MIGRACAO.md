# Kroche Manager — migração das rotas para Supabase

Esta pasta é uma versão do novo frontend Supabase que recebeu as funcionalidades que existiam no projeto Flask anterior.

## Rotas migradas

| Rota Flask antiga | Arquivo/rota no frontend |
|---|---|
| `/` | `index.html` |
| `/login` | `login.html` |
| `/cadastro` | `cadastro.html` |
| `/esqueci-senha` | `esqueci-senha.html` |
| `/reset-senha/<token>` | `reset-senha.html` |
| `/` dashboard | `dashboard.html` |
| `/produtos` | `produtos.html` |
| `/excluir_produto/<id>` | ação dentro de `produtos.html` |
| `/vendas` | `vendas.html` |
| `/editar_venda/<id>` | `editar-venda.html?id=<id>` |
| `/excluir_venda/<id>` | ação dentro de `vendas.html` |
| `/compras` | `compras.html` |
| `/excluir_compra/<id>` | ação dentro de `compras.html` |
| `/receitas` | `receitas.html` |
| `/excluir_receita/<id>` | ação dentro de `receitas.html` |
| `/encomendas` | `encomendas.html` |
| `/editar_encomenda/<id>` | `editar-encomenda.html?id=<id>` |
| `/excluir_encomenda/<id>` | ação dentro de `encomendas.html` |
| `/leads/` | `leads.html` |
| `/leads/<id>/status` | alteração de status dentro de `leads.html` |
| `/minha-loja/` | `minha-loja.html` |
| `/minha-loja/editar` | `minha-loja-editar.html` |
| `/calculadora` | `calculadora.html` |
| `/relatorios` | `relatorios.html` |
| `/relatorios/exportar` | exportação PDF/CSV dentro de `relatorios.html` |
| `/perfil` | `perfil.html` |
| `/alternar-tema` | preparado para extensão de tema no frontend |
| `/politica-de-privacidade` | `politica-de-privacidade.html` |
| `/termos-de-uso` | `termos-de-uso.html` |
| `/loja/<slug>` | `loja/index.html?slug=<slug>` |
| `/loja/<slug>/produto/<id>` | `loja/produto.html?slug=<slug>&id=<id>` |
| `/loja/<slug>/carrinho` | `loja/carrinho.html?slug=<slug>` |
| carrinho adicionar/remover/atualizar/finalizar | operações no `localStorage` + criação de lead no Supabase |

## Como executar localmente

Dentro da pasta do projeto:

```powershell
python -m http.server 8000
```

Abra:

```text
http://localhost:8000/
```

O catálogo de uma loja é aberto como:

```text
http://localhost:8000/loja/index.html?slug=SEU-SLUG
```

## Supabase

O arquivo `supabase/schema.sql` mantém as tabelas e RLS do projeto novo e acrescenta políticas de Storage para uploads por usuário.

**Antes de usar em produção:** execute o `schema.sql` completo no SQL Editor do projeto Supabase.

## Observações da migração

- Os filtros de dados usam o usuário autenticado.
- Produtos usam `usuario_id`; vendas, compras, receitas e encomendas usam `user_id`.
- O RLS continua sendo a camada de isolamento no banco.
- Uploads usam UUID e pasta do usuário para evitar colisões.
- O catálogo público só mostra produtos marcados para catálogo.
- O checkout público cria um lead e abre o WhatsApp.
- A exclusão da conta do Auth não é feita diretamente pelo navegador; para isso deve ser criada uma Edge Function/admin action no Supabase.
- A rota antiga de categorias **não existia no projeto Flask enviado** e, por isso, não foi inventada nesta migração. Se você quiser cadastro de categorias, precisamos adicionar uma tabela `categorias`, vínculo com produtos e RLS.

## Arquivos principais

- `assets/js/app.js` — funcionalidades das telas migradas.
- `assets/js/auth.js` — autenticação Supabase.
- `assets/js/supabaseConfig.js` — URL/chave pública do projeto.
- `supabase/schema.sql` — banco + RLS + Storage.
