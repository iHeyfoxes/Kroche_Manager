# Kroche Manager

Sistema de gestão para artesãs, com autenticação Supabase, gestão de clientes, produtos, materiais/estoque, encomendas, vendas, receitas e catálogo público.

## Estado atual

A base do projeto já está integrada ao Supabase e o fluxo de autenticação inclui:

- Cadastro e login com Supabase Auth
- Login com Google
- Recuperação e redefinição de senha
- Logout
- Perfil/loja vinculado ao usuário autenticado
- Row Level Security (RLS) para separar os dados de cada loja
- Catálogo público de produtos
- Estrutura para leads vindos do catálogo
- Storage para fotos de perfil, produtos e banners

O banco também recebeu ajustes de segurança e desempenho, incluindo políticas RLS mais eficientes, permissões mais restritas para operações autenticadas e índices para chaves estrangeiras.

## Estrutura principal

- `supabase/schema.sql` — estrutura inicial do banco e políticas RLS
- `assets/js/` — lógica JavaScript do sistema e integração com Supabase
- páginas HTML — interface do sistema

## Supabase

O projeto usa o Supabase para:

- autenticação;
- banco PostgreSQL;
- Row Level Security;
- armazenamento de imagens;
- operações do catálogo público.

A chave pública do Supabase deve ser configurada no arquivo de configuração do frontend. **Nunca coloque chaves secretas, service role keys ou credenciais privadas no repositório.**

## Desenvolvimento local

Como o frontend é estático, pode ser executado com um servidor local simples:

```bash
python -m http.server 8000
```

Depois, abra:

```text
http://localhost:8000/
```

## Publicação

O projeto pode ser publicado em hospedagem estática, como GitHub Pages, desde que as configurações do Supabase e as URLs de redirecionamento do Auth estejam configuradas corretamente.

## Próximas etapas

Antes de considerar o sistema como versão final, ainda precisamos concluir e validar:

- testes completos de todos os CRUDs;
- validação de login Google e recuperação de senha em produção;
- revisão do catálogo e finalização do fluxo de pedido;
- testes de upload e exclusão de imagens;
- revisão de responsividade;
- relatórios e indicadores, caso ainda existam telas incompletas;
- revisão final das políticas e permissões do Supabase;
- habilitação da proteção contra senhas vazadas no Supabase Auth;
- testes finais de produção e documentação.

## Segurança

O frontend utiliza apenas credenciais públicas apropriadas para aplicações cliente. Operações administrativas e dados privados devem continuar protegidos por RLS e nunca devem depender de segredos expostos no navegador.

## Projeto

Repositório: `iHeyfoxes/Kroche_Manager`

O projeto está sendo desenvolvido de forma incremental, priorizando segurança, funcionamento real dos fluxos e manutenção simples do código.
