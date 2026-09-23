# JavaScript do Kroche Manager

## Estrutura

```text
assets/js/
├── core/                     # infraestrutura compartilhada
│   ├── utils.js
│   ├── theme.js
│   ├── session.js
│   ├── layout.js
│   ├── auth.js
│   └── error-handler.js
├── features/                 # funcionalidades por domínio
│   ├── dashboard/
│   ├── produtos/
│   ├── vendas/
│   ├── compras/
│   ├── receitas/
│   ├── encomendas/
│   ├── leads/
│   ├── relatorios/
│   ├── calculadora/
│   ├── ajuda/
│   ├── minha-loja/
│   ├── perfil/
│   ├── editar-venda/
│   ├── editar-encomenda/
│   ├── clientes/
│   └── materiais/
├── catalogo.js               # catálogo público
├── catalogo-link.js          # link público
├── minha-loja-link.js        # link da loja
├── navigation-enhancements.js
├── supabaseConfig.js
├── auth.js                   # loader de compatibilidade das páginas públicas
├── atelier-modules.js        # compatibilidade temporária
└── app.js                    # entrypoint do painel
```

## Fluxo do painel

As páginas internas carregam `assets/js/app.js`. Ele carrega primeiro o `core/` e depois os módulos de `features/`. Por fim, identifica a página atual e inicializa apenas a funcionalidade correspondente.

## Regra de manutenção

- Funcionalidade nova deve entrar em `features/`.
- Código compartilhado deve entrar em `core/`.
- Catálogo público permanece separado do painel.
- `app.js` deve continuar sendo apenas um entrypoint/orquestrador.
- Não adicionar novas regras de negócio em `features/pages.js`.
- Procurar uma função existente em `core/` antes de criar outra.
- Nunca colocar chaves privadas ou service role no frontend.

## Compatibilidade

Alguns arquivos raiz ainda existem para manter páginas antigas funcionando durante a migração. Eles devem ser removidos somente depois da validação de todas as páginas que os referenciam.
