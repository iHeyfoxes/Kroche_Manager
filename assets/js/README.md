# JavaScript

## Responsabilidades

A pasta contém a lógica do frontend.

### Arquivos atuais

- `app.js`: lógica compartilhada e inicialização de várias telas. É um arquivo legado importante e deve ser reduzido gradualmente.
- `auth.js`: autenticação e operações relacionadas à sessão.
- `supabaseConfig.js`: configuração pública do cliente Supabase.
- `catalogo.js`: lógica específica do catálogo.
- `catalogo-link.js`: construção/abertura do link do catálogo.
- `minha-loja-link.js`: ações relacionadas ao link da loja.
- `navigation-enhancements.js`: melhorias de navegação.
- `atelier-modules.js`: módulos/rotinas auxiliares do sistema.

## Regra

Não coloque uma nova funcionalidade grande em `app.js`.

A organização futura deve separar:

- infraestrutura;
- layout;
- funcionalidades;
- catálogo público.

Consulte `docs/ARCHITECTURE.md`.
