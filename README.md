# Kroche Manager — versão Supabase + GitHub Pages

## O que já está pronto (Etapa 1: Autenticação)

- `supabase/schema.sql` — schema completo do banco (todas as 7 tabelas do
  `models.py` original), com Row Level Security e os 3 bugs de dados corrigidos:
  1. slug duplicado no cadastro → gerado automaticamente e sempre único
  2. campo errado (`whatsapp` em vez de `telefone`) na edição de encomenda → nem existe mais, só a coluna certa
  3. fotos sobrescrevendo umas às outras → resolvido no upload (nome sempre com uuid)
- Login, cadastro, esqueci senha, redefinir senha e logout, usando o
  Supabase Auth nativo (sem reimplementar hash de senha nem envio de e-mail).
- Painel (`dashboard.html`) ainda é só um placeholder que confirma que o
  login funcionou — os módulos de verdade vêm nas próximas etapas, como combinado.

## Como colocar pra rodar

### 1. Criar o projeto no Supabase
1. Crie uma conta em https://supabase.com e um novo projeto (grátis).
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Vá em **Project Settings > API** e copie a **Project URL** e a **anon public key**.

### 2. Configurar o site
Abra `assets/js/supabaseConfig.js` e cole os dois valores:
```js
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

### 3. Testar localmente
Como é tudo estático, dá pra abrir com qualquer servidor simples, por exemplo:
```
python -m http.server 8000
```
e acessar `http://localhost:8000/login.html`.

### 4. Publicar no GitHub Pages
1. Suba esta pasta inteira para um repositório no GitHub.
2. Em **Settings > Pages**, selecione a branch principal e a raiz (`/`) como origem.
3. Depois, em **Settings > Pages**, configure seu domínio próprio (campo "Custom domain").

## O que falta (próximas etapas, como combinamos)

- Cadastro de produtos + receitas (com upload de imagem pro Storage)
- Vendas, compras e encomendas (CRUD completo)
- Relatórios
- Catálogo público + carrinho (`/loja/<slug>`) — no GitHub Pages isso vira algo
  como `loja/index.html?slug=ateliedamaria`, porque Pages não tem rotas dinâmicas
  de verdade; o JS lê o `slug` da URL e busca os dados no Supabase.

Me chama pra seguir com a próxima parte quando quiser.
