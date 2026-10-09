# Kroche Manager — Versão Next.js

Este projeto é a migração completa do **Kroche Manager** para **Next.js 16 (App Router)** com **TypeScript**, **React 19** e integração direta com o **Supabase**.

---

## 🚀 Como executar localmente

1. Entre na pasta do projeto:
```bash
cd kroche-next
```

2. Instale as dependências (já instaladas):
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador:
```text
http://localhost:3000
```

---

## 🗂️ Estrutura das Rotas Migradas

| Rota Next.js | Descrição |
|---|---|
| `/` | Redirecionamento inteligente / Apresentação |
| `/login` | Autenticação por e-mail e Google OAuth |
| `/cadastro` | Criação de conta com nicho artesanal e termos |
| `/esqueci-senha` | Solicitação de link para recuperação de senha |
| `/reset-senha` | Redefinição de nova senha |
| `/dashboard` | Painel de controle, KPIs, extrato recente e gráficos |
| `/vendas` | Cadastro de vendas e histórico com soma total |
| `/vendas/[id]/editar` e `/editar-venda?id=...` | Edição de venda |
| `/compras` | Cadastro de compras integradas ao estoque |
| `/encomendas` | Gestão de encomendas manuais e vindas do catálogo |
| `/encomendas/[id]/editar` e `/editar-encomenda?id=...` | Edição e cancelamento com reposição de estoque |
| `/estoque` | Controle de insumos, materiais e alertas de reposição |
| `/receitas` | Biblioteca de receitas de crochê com links de YouTube e PDF |
| `/leads` | Gestão de contatos e pedidos do catálogo público |
| `/minha-loja` | Central administrativa do catálogo (produtos, categorias e configurações) |
| `/minha-loja/editar` e `/minha-loja-editar` | Personalização da loja (cores, banner, WhatsApp, etc.) |
| `/relatorios` | Relatórios financeiros por período com exportação PDF e CSV |
| `/calculadora` | Calculadora de precificação para peças de crochê |
| `/ajuda` | Central de ajuda com guia de cada seção |
| `/perfil` | Alteração de senha e foto de perfil no Supabase Storage |
| `/loja/[slug]` | Catálogo público do ateliê com carrinho e checkout via WhatsApp |
| `/termos-de-uso` | Termos de uso do sistema |
| `/politica-de-privacidade` | Política de privacidade (LGPD) |

---

## ⚙️ Variáveis de Ambiente (`.env.local`)

O arquivo `.env.local` já está configurado com as chaves públicas do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tjmemwlavrsdclvtgtcs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 16 (App Router)**
- **React 19 & TypeScript**
- **Supabase JS Client** (Auth, Database Postgres com RLS e Storage)
- **Vanilla CSS Tokens** (Paleta aconchegante artesanal, suporte a Modo Claro e Modo Escuro)
- **jsPDF & jsPDF-autotable** (Exportação de relatórios financeiros)
