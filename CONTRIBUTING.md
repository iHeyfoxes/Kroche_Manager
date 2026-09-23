# Contribuindo com o Kroche Manager

## Objetivo

O Kroche Manager é um sistema web de gestão para artesãos. O projeto usa HTML, CSS e JavaScript no frontend e Supabase para autenticação, banco de dados, Storage e operações do catálogo.

## Antes de alterar o código

1. Trabalhe sempre em uma branch própria.
2. Não altere a `main` diretamente para mudanças de funcionalidade.
3. Leia `docs/ARCHITECTURE.md` antes de mexer em uma área que você ainda não conhece.
4. Preserve as regras de segurança do Supabase e as políticas RLS.
5. Teste a tela afetada e os fluxos relacionados antes de abrir uma PR.

## Padrão de branches

Use nomes curtos e descritivos:

- `feature/nome-da-funcionalidade`
- `fix/nome-do-problema`
- `refactor/nome-da-refatoracao`
- `docs/nome-da-documentacao`

## Pull Requests

Uma PR deve explicar:

- o que foi alterado;
- por que foi alterado;
- quais arquivos principais foram modificados;
- como testar;
- se houve alteração no banco/Supabase.

Evite misturar redesign, correção de bug e alteração de banco na mesma PR quando isso não for necessário.

## Frontend

As páginas HTML funcionam como entradas do sistema. A lógica compartilhada fica em `assets/js/` e os estilos em `assets/css/`.

O projeto ainda possui lógica histórica concentrada em `assets/js/app.js`. Não aumente esse arquivo com novas funcionalidades grandes: novas áreas devem ser separadas por responsabilidade, conforme o plano em `docs/ARCHITECTURE.md`.

## Supabase

Nunca coloque:

- service role key;
- senha;
- token privado;
- credencial administrativa

no frontend.

A chave pública usada pelo frontend pode existir em `assets/js/supabaseConfig.js`, mas o acesso aos dados deve continuar protegido por RLS.

## Checklist antes do merge

- [ ] A tela principal funciona.
- [ ] Login/logout continuam funcionando.
- [ ] Nenhuma credencial secreta foi adicionada.
- [ ] RLS não foi enfraquecido.
- [ ] Links internos continuam funcionando.
- [ ] Catálogo público continua funcionando.
- [ ] Testei desktop e uma largura menor.
- [ ] A PR explica como testar.
