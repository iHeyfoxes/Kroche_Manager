# Supabase

Esta pasta contém arquivos SQL versionados do projeto.

## Arquivos

- `schema.sql`: estrutura principal.
- `catalogo_pedidos.sql`: estrutura relacionada ao catálogo/pedidos.

## Regras de segurança

Qualquer alteração no banco precisa considerar:

- RLS;
- permissões de funções;
- Storage;
- acesso público do catálogo;
- isolamento por usuário/loja.

Não coloque credenciais privadas neste diretório ou no frontend.

## Alterações futuras

Sempre que possível, novas mudanças de banco devem ser registradas como migrations versionadas, com nome descritivo.

Exemplo:

`2026_09_23_add_catalogo_theme.sql`
