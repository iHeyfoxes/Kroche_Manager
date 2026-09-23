# JavaScript do Kroche Manager

## Estrutura

```text
assets/js/
├── core/                 # infraestrutura compartilhada
├── features/             # funcionalidades do sistema
│   ├── dashboard/
│   ├── produtos/
│   ├── vendas/
│   ├── compras/
│   ├── receitas/
│   ├── encomendas/
│   ├── leads/
│   ├── relatorios/
│   ├── calculadora/
│   ├── minha-loja/
│   └── perfil/
├── catalogo.js           # catálogo público
├── catalogo-link.js      # correção do link público
├── minha-loja-link.js    # link da loja
├── auth.js               # autenticação atual
├── atelier-modules.js    # módulos auxiliares históricos
├── navigation-enhancements.js
├── supabaseConfig.js
└── app.js                # entrypoint/compatibilidade
```

## Regra de manutenção

- Funcionalidade nova deve entrar no módulo correspondente em `features/`.
- Código compartilhado deve ir para `core/`.
- Código exclusivo do catálogo público deve ficar separado do painel.
- Evite aumentar `app.js` ou `features/pages.js`.
- Não duplique funções utilitárias; primeiro procure em `core/`.
- Não coloque credenciais privadas no frontend.

## Migração do legado

`features/pages.js` permanece temporariamente como camada de compatibilidade. Os módulos são extraídos gradualmente e só depois o legado será removido.

Isso permite refatorar sem alterar o comportamento do sistema em uma única mudança grande.
