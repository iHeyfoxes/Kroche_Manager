# Arquitetura do Kroche Manager

## 1. Visão geral

O Kroche Manager é atualmente um frontend estático:

- **HTML**: páginas e pontos de entrada.
- **CSS**: estilos compartilhados e estilos específicos.
- **JavaScript**: autenticação, navegação, regras de interface e chamadas ao Supabase.
- **Supabase**: Auth, PostgreSQL, RLS, Storage e funções do catálogo.

Fluxo simplificado:

`HTML → JavaScript → Supabase`

O catálogo público usa:

`loja/*.html → assets/js/catalogo.js → Supabase`

## 2. Estrutura atual

```text
Kroche_Manager/
├── *.html                     # páginas do sistema
├── loja/                      # catálogo público
├── assets/
│   ├── css/                   # estilos
│   └── js/                    # lógica do frontend
├── supabase/                  # SQL/schema relacionado ao projeto
├── README.md
├── CONTRIBUTING.md
└── docs/
    └── ARCHITECTURE.md
```

### Páginas principais

| Arquivo | Responsabilidade |
|---|---|
| `dashboard.html` | visão geral |
| `produtos.html` | produtos |
| `vendas.html` | vendas |
| `compras.html` | compras |
| `receitas.html` | receitas |
| `encomendas.html` | encomendas |
| `leads.html` | clientes/leads |
| `relatorios.html` | relatórios |
| `minha-loja.html` | configuração/resumo da loja |
| `minha-loja-editar.html` | edição da loja |
| `perfil.html` | conta e perfil |
| `ajuda.html` | ajuda |
| `loja/\` | experiência pública do catálogo |

## 3. JavaScript

Hoje existe uma parte importante da aplicação concentrada em:

`assets/js/app.js`

Ele contém código compartilhado e inicialização de várias páginas. Isso funciona, mas dificulta manutenção quando o sistema cresce.

### Estrutura de organização

Novas funcionalidades devem seguir esta separação:

```text
assets/js/
├── core/                 # infraestrutura compartilhada
│   ├── auth.js
│   ├── supabase.js
│   ├── session.js
│   ├── theme.js
│   └── utils.js
│
├── layout/               # shell, menu e navegação
│   ├── layout.js
│   └── navigation.js
│
├── features/             # regras por domínio
│   ├── dashboard/
│   ├── produtos/
│   ├── vendas/
│   ├── compras/
│   ├── receitas/
│   ├── encomendas/
│   ├── leads/
│   ├── loja/
│   └── perfil/
│
└── catalogo/             # experiência pública
    ├── catalogo.js
    ├── produto.js
    └── carrinho.js
```

**Importante:** a estrutura acima representa a organização atual do frontend após a refatoração. Arquivos de compatibilidade devem ser removidos somente após validar todas as referências.

## 4. CSS

Atualmente existem folhas com responsabilidades parcialmente sobrepostas.

Direção recomendada:

```text
assets/css/
├── base.css              # variáveis, reset e elementos básicos
├── layout.css            # sidebar, header e containers
├── components.css        # cards, botões, tabelas, formulários
├── pages/
│   ├── dashboard.css
│   ├── produtos.css
│   ├── vendas.css
│   └── ...
├── catalogo.css          # catálogo público
└── auth.css              # login/cadastro
```

Não crie uma nova folha CSS global para cada pequena alteração. Primeiro procure uma classe/componente existente.

## 5. Supabase

```text
supabase/
├── schema.sql
├── catalogo_pedidos.sql
└── migrations/           # recomendado para próximas alterações versionadas
```

Toda alteração de estrutura do banco deve ser documentada e versionada.

### Segurança

O frontend não é uma camada de segurança.

A proteção real dos dados deve continuar no Supabase:

- RLS;
- permissões de funções;
- políticas de Storage;
- funções `SECURITY DEFINER` quando realmente necessárias.

## 6. Regra de dependências

A direção deve ser:

```text
core
  ↓
layout
  ↓
features
  ↓
pages/catalogo
```

Uma feature pode usar o core. Evite criar dependências circulares entre páginas.

## 7. Convenções de código

### JavaScript

- funções pequenas e com uma responsabilidade;
- nomes descritivos;
- evitar funções gigantes;
- evitar HTML extenso dentro de funções quando um componente reutilizável resolver o problema;
- usar `async/await` para operações assíncronas;
- validar dados antes de enviar ao Supabase;
- escapar dados exibidos no HTML.

### HTML

- uma página = uma responsabilidade principal;
- IDs apenas quando JavaScript realmente precisa deles;
- classes reutilizáveis para aparência;
- evitar estilos inline novos.

### CSS

- preferir classes;
- centralizar cores e espaçamentos em variáveis;
- evitar `!important` como solução padrão;
- evitar duplicar componentes existentes.

## 8. Regra para novos desenvolvedores

Se você precisa descobrir onde alterar algo:

1. descubra qual página apresenta o problema;
2. descubra qual JS inicializa essa página;
3. descubra quais tabelas/funções do Supabase ela usa;
4. altere somente a camada necessária;
5. teste o fluxo completo.

## 9. Catálogo público

O catálogo é uma área especial porque pode ser acessado sem login.

Fluxo:

`slug da loja → usuário → produtos publicados → carrinho → lead → WhatsApp`

Qualquer alteração no catálogo deve ser testada com:

- slug válido;
- slug inválido;
- loja sem produtos;
- produto com foto;
- produto sem foto;
- carrinho;
- envio do pedido;
- WhatsApp configurado e não configurado.

## 10. Objetivo da refatoração

A meta não é simplesmente criar mais pastas.

A meta é fazer com que um desenvolvedor consiga responder rapidamente:

- onde está a tela?
- onde está a regra?
- onde está a consulta ao banco?
- onde está o estilo?
- qual parte posso alterar sem quebrar outra?

Toda nova funcionalidade deve aproximar o projeto dessa organização.
