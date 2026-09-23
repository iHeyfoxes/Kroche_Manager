# Arquitetura do Kroche Manager

## 1. Visão geral

O Kroche Manager é um frontend estático organizado por camadas:

- **HTML**: pontos de entrada das telas.
- **CSS**: identidade visual e componentes compartilhados.
- **JavaScript**: core + features por domínio.
- **Supabase**: Auth, PostgreSQL, RLS, Storage e funções do catálogo.

Fluxo: HTML → app.js → core/features → Supabase

O catálogo público continua separado: loja/*.html → assets/js/catalogo.js → Supabase

## 2. Navegação atual

O painel principal é organizado por domínio:

- Dashboard
- Vendas
- Compras
- Encomendas
- Estoque
- Receitas
- Leads
- Minha Loja
- Relatórios
- Calculadora
- Ajuda
- Meu Perfil

**Produtos não é mais uma área de primeiro nível.** Produtos e categorias são administrados dentro de **Minha Loja**.

A antiga tela de Clientes foi removida da navegação. Os dados da tabela "clientes" permanecem no banco para evitar perda de dados.

A antiga tela de Materiais e Estoque foi substituída por **Estoque**. A tabela "materiais" permanece como base de dados do inventário.

## 3. Estrutura JavaScript

```text
assets/js/
├── app.js                       # entrypoint/orquestrador
├── core/
│   ├── auth.js
│   ├── supabase.js
│   ├── session.js
│   ├── theme.js
│   ├── utils.js
│   ├── layout.js
│   └── error-handler.js
│
├── features/
│   ├── dashboard/
│   ├── vendas/
│   ├── compras/
│   ├── receitas/
│   ├── encomendas/
│   ├── leads/
│   ├── relatorios/
│   ├── calculadora/
│   ├── ajuda/
│   ├── perfil/
│   ├── editar-venda/
│   ├── editar-encomenda/
│   ├── estoque/
│   │   └── estoque.js
│   └── minha-loja/
│       ├── minha-loja.js
│       ├── produtos.js
│       └── categorias.js
│
└── catalogo.js                 # catálogo público
```

### Regra de responsabilidade

- "core/": infraestrutura reutilizável.
- "features/": regras de negócio da área.
- "minha-loja/": tudo relacionado à administração do catálogo.
- "catalogo.js": somente experiência pública do cliente.

Evite colocar regra de produtos dentro de "app.js". O "app.js" apenas carrega módulos e escolhe a tela inicial.

## 4. Minha Loja

Minha Loja é o centro administrativo do catálogo.

### Produtos

"features/minha-loja/produtos.js" é responsável por cadastrar, editar, excluir, preço, quantidade, foto, categoria, visibilidade no catálogo e tempo de produção.

### Categorias

"features/minha-loja/categorias.js" é responsável por criar, listar e excluir categorias e relacionar produtos através de "categoria_id".

### Aparência

"features/minha-loja/minha-loja.js" é responsável por nome, slogan, WhatsApp, banner, cores e opções de exibição.

## 5. Estoque

"features/estoque/estoque.js" usa a tabela "materiais" e concentra cadastro, quantidade, estoque mínimo, custo unitário, fornecedor, busca, alertas de reposição e valor estimado.

A exclusão da tela antiga **não exclui a tabela nem os dados**.

## 6. CSS e design

A identidade visual atual é centralizada principalmente em:

- "assets/css/app.css"
- "assets/css/professional.css"
- "assets/css/catalogo.css"

A direção visual usa interface moderna, estética artesanal premium, tons creme/marrom/caramelo, cards suaves, sombras discretas, hierarquia tipográfica clara, responsividade e modo claro/escuro.

## 7. Banco de dados

A estrutura de categorias foi versionada em "supabase/migrations/20260923181007_create_product_categories.sql".

Ela cria "categorias_produtos" e adiciona "produtos.categoria_id".

O campo textual antigo "produtos.categoria" permanece por compatibilidade durante a migração gradual.

## 8. Segurança

A segurança continua no Supabase: RLS por usuário, permissões de função, políticas de Storage, funções SECURITY DEFINER somente quando necessárias e nenhuma chave service_role no frontend.

A função pública do catálogo deve continuar sendo acessada pelo RPC controlado, e não por leitura direta irrestrita das tabelas.

## 9. Regra para novos desenvolvedores

Para alterar uma funcionalidade:

1. encontre a tela;
2. encontre o módulo em "features/";
3. identifique as consultas Supabase;
4. reutilize "core/" quando possível;
5. altere somente a camada necessária;
6. valide o fluxo completo;
7. documente alterações estruturais do banco.

O objetivo é que outro desenvolvedor consiga entender onde está a tela, onde está a regra, onde está o banco e onde está o estilo sem precisar procurar lógica espalhada pelo projeto.
