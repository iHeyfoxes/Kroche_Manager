/* Kroche Manager — catálogo público
 * Interface pública: busca, filtros, estoque, carrinho e WhatsApp.
 * A página continua independente do painel administrativo.
 */

const catalogoMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const catalogoEsc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const catalogoParams = new URLSearchParams(window.location.search);
const catalogoSlug = (catalogoParams.get('slug') || '').trim();

let catalogoLoja = null;
let catalogoProdutos = [];
let catalogoCarrinho = [];
let catalogoBusca = '';
let catalogoCategoria = 'todos';
let catalogoOrdenacao = 'destaques';

function catalogoMsg(text, ok = true) {
    const root = document.getElementById('catalogoApp');
    if (!root) return;
    let el = document.getElementById('catalogoMsg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'catalogoMsg';
        root.prepend(el);
    }
    el.className = `catalogo-msg ${ok ? 'ok' : 'erro'}`;
    el.textContent = text;
    el.hidden = false;
}

function catalogoCategorias() {
    return [...new Set(catalogoProdutos
        .filter(p => p.mostrar_catalogo)
        .map(p => String(p.categoria || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function catalogoProdutosVisiveis() {
    let produtos = catalogoProdutos.filter(p => p.mostrar_catalogo);

    if (catalogoCategoria !== 'todos') {
        produtos = produtos.filter(p => String(p.categoria || '').trim() === catalogoCategoria);
    }

    const busca = catalogoBusca.toLowerCase();
    if (busca) {
        produtos = produtos.filter(p =>
            String(p.nome || '').toLowerCase().includes(busca) ||
            String(p.descricao || '').toLowerCase().includes(busca) ||
            String(p.categoria || '').toLowerCase().includes(busca)
        );
    }

    if (catalogoOrdenacao === 'menor-preco') {
        produtos.sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
    } else if (catalogoOrdenacao === 'maior-preco') {
        produtos.sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
    } else if (catalogoOrdenacao === 'nome') {
        produtos.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
    }

    return produtos;
}

function catalogoCardProduto(p) {
    const qtd = Number(p.quantidade || 0);
    const indisponivel = qtd <= 0;
    const categoria = String(p.categoria || '').trim();

    return `
      <article class="catalogo-produto">
        <div class="catalogo-produto-imagem">
          ${p.foto
            ? `<img src="${catalogoEsc(p.foto)}" alt="${catalogoEsc(p.nome)}" loading="lazy">`
            : '<div class="catalogo-sem-foto">🧶</div>'}
          ${categoria ? `<span class="catalogo-tag">${catalogoEsc(categoria)}</span>` : ''}
        </div>
        <div class="catalogo-produto-corpo">
          <div class="catalogo-produto-topo">
            <h3>${catalogoEsc(p.nome)}</h3>
            <button class="catalogo-favorito" type="button" aria-label="Favoritar produto" title="Favoritar">♡</button>
          </div>
          <p>${catalogoEsc(p.descricao || 'Peça artesanal feita com carinho.')}</p>
          ${catalogoLoja.mostrar_preco !== false ? `<strong>${catalogoMoney(p.preco)}</strong>` : ''}
          ${catalogoLoja.mostrar_estoque !== false
            ? `<small class="estoque ${indisponivel ? 'esgotado' : ''}">${indisponivel ? 'Esgotado' : `${qtd} disponível(is)`}</small>`
            : ''}
          <div class="catalogo-comprar">
            ${indisponivel
              ? '<button class="catalogo-btn catalogo-btn-full" disabled>Sem estoque</button>'
              : `<input type="number" min="1" max="${qtd}" value="1" id="qtd-${p.id}" aria-label="Quantidade de ${catalogoEsc(p.nome)}"><button class="catalogo-btn" data-add="${p.id}" type="button">Adicionar</button>`}
          </div>
        </div>
      </article>`;
}

function catalogoRenderProdutos() {
    const grid = document.getElementById('catalogoGrid');
    const total = document.getElementById('catalogoTotal');
    if (!grid) return;

    const produtos = catalogoProdutosVisiveis();
    if (total) total.textContent = `${produtos.length} produto(s)`;

    grid.innerHTML = produtos.length
        ? produtos.map(catalogoCardProduto).join('')
        : '<div class="catalogo-vazio"><span>🧶</span><h3>Nenhum produto encontrado</h3><p>Tente mudar a busca ou o filtro de categoria.</p></div>';

    grid.querySelectorAll('[data-add]').forEach(btn => {
        btn.onclick = () => {
            const id = Number(btn.dataset.add);
            const produto = catalogoProdutos.find(i => Number(i.id) === id);
            const qtdEl = document.getElementById(`qtd-${id}`);
            const quantidade = Math.max(1, Number(qtdEl?.value || 1));

            if (!produto || quantidade > Number(produto.quantidade || 0)) {
                catalogoMsg('Quantidade maior que o estoque disponível.', false);
                return;
            }

            const existente = catalogoCarrinho.find(i => i.id === id);
            if (existente) {
                existente.quantidade = Math.min(Number(produto.quantidade), existente.quantidade + quantidade);
            } else {
                catalogoCarrinho.push({ id, quantidade });
            }

            catalogoAtualizarContador();
            catalogoMsg('Produto adicionado ao carrinho.');
        };
    });
}

function catalogoAtualizarContador() {
    const total = catalogoCarrinho.reduce((s, i) => s + Number(i.quantidade || 0), 0);
    const el = document.getElementById('contadorCarrinho');
    if (el) el.textContent = total;
}

function catalogoRender() {
    const root = document.getElementById('catalogoApp');
    if (!root) return;

    if (!catalogoLoja) {
        root.innerHTML = '<div class="catalogo-erro"><h2>Loja não encontrada</h2><p>Confira o link do catálogo.</p></div>';
        return;
    }

    const cor = catalogoLoja.catalogo_cor || '#6B4E3D';
    const botao = catalogoLoja.catalogo_cor_botao || '#25D366';
    document.documentElement.style.setProperty('--catalogo-cor', cor);
    document.documentElement.style.setProperty('--catalogo-botao', botao);

    const categorias = catalogoCategorias();
    const nomeLoja = catalogoLoja.catalogo_nome || catalogoLoja.nome || 'Minha Loja';
    const slogan = catalogoLoja.catalogo_slogan || 'Peças artesanais feitas com carinho.';
    const banner = catalogoLoja.catalogo_banner || '';

    root.innerHTML = `
      <header class="catalogo-header">
        <div class="catalogo-header-bar">
          <a class="catalogo-logo" href="/loja/index.html?slug=${encodeURIComponent(catalogoSlug)}">
            <span class="catalogo-logo-mark">K</span>
            <span>${catalogoEsc(nomeLoja)}</span>
          </a>
          <nav class="catalogo-header-nav" aria-label="Navegação">
            <a href="#produtos">Produtos</a>
            <a href="#sobre">Sobre a loja</a>
          </nav>
          <button id="abrirCarrinho" class="catalogo-carrinho-btn" type="button">
            🛒 Carrinho <span id="contadorCarrinho">0</span>
          </button>
        </div>

        <div class="catalogo-hero">
          <div class="catalogo-hero-texto">
            <span class="catalogo-eyebrow">ARTESANATO &amp; CARINHO</span>
            <h1>${catalogoEsc(nomeLoja)}</h1>
            <p>${catalogoEsc(slogan)}</p>
            <a class="catalogo-hero-btn" href="#produtos">Ver produtos <span>→</span></a>
          </div>
          <div class="catalogo-hero-visual">
            ${banner
              ? `<img src="${catalogoEsc(banner)}" alt="Banner de ${catalogoEsc(nomeLoja)}">`
              : '<div class="catalogo-hero-placeholder"><span>🧶</span><b>Feito à mão</b><small>Peças únicas para você</small></div>'}
          </div>
        </div>
      </header>

      <main class="catalogo-conteudo" id="produtos">
        <div class="catalogo-mobile-tools">
          <button type="button" id="abrirFiltros">☰ Filtros</button>
          <span id="catalogoTotal">0 produto(s)</span>
        </div>

        <aside class="catalogo-sidebar" id="catalogoSidebar">
          <div class="catalogo-sidebar-titulo"><div><span class="catalogo-eyebrow">ENCONTRE O SEU</span><h2>Produtos</h2></div><button id="fecharFiltros" type="button" aria-label="Fechar filtros">×</button></div>

          <label class="catalogo-busca">
            <span>⌕</span>
            <input id="catalogoBusca" type="search" placeholder="Buscar produto..." autocomplete="off">
          </label>

          <div class="catalogo-filtro">
            <span class="catalogo-filtro-titulo">Categorias</span>
            <button class="catalogo-filtro-opcao ativo" data-categoria="todos" type="button">Todos <b>${catalogoProdutos.filter(p => p.mostrar_catalogo).length}</b></button>
            ${categorias.map(cat => `<button class="catalogo-filtro-opcao" data-categoria="${catalogoEsc(cat)}" type="button">${catalogoEsc(cat)} <b>${catalogoProdutos.filter(p => p.mostrar_catalogo && String(p.categoria || '').trim() === cat).length}</b></button>`).join('')}
          </div>

          <div class="catalogo-filtro">
            <span class="catalogo-filtro-titulo">Ordenar por</span>
            <select id="catalogoOrdenacao">
              <option value="destaques">Destaques</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
              <option value="nome">Nome</option>
            </select>
          </div>

          <div class="catalogo-seguranca">
            <span>✓</span>
            <div><b>Compra segura</b><small>Seu pedido será confirmado pelo WhatsApp da loja.</small></div>
          </div>
        </aside>

        <section class="catalogo-listagem">
          <div class="catalogo-listagem-topo">
            <div><span class="catalogo-eyebrow">COLEÇÃO</span><h2>Feitos especialmente para você</h2><p>Escolha suas peças favoritas e monte seu pedido.</p></div>
            <span id="catalogoTotalDesktop" class="catalogo-total">0 produto(s)</span>
          </div>
          <div id="catalogoMsg" class="catalogo-msg" hidden></div>
          <div id="catalogoGrid" class="catalogo-grid"></div>
        </section>
      </main>

      <section id="catalogoCheckout" class="catalogo-checkout" hidden></section>
      <section id="sobre" class="catalogo-sobre">
        <span class="catalogo-eyebrow">SOBRE A LOJA</span>
        <h2>Artesanato que conta uma história.</h2>
        <p>${catalogoEsc(slogan)}</p>
      </section>

      <footer class="catalogo-footer">© ${new Date().getFullYear()} ${catalogoEsc(nomeLoja)} · Catálogo criado com Kroche Manager</footer>
    `;

    const atualizar = () => {
        catalogoRenderProdutos();
        const total = document.getElementById('catalogoTotalDesktop');
        const mobile = document.getElementById('catalogoTotal');
        const produtos = catalogoProdutosVisiveis().length;
        if (total) total.textContent = `${produtos} produto(s)`;
        if (mobile) mobile.textContent = `${produtos} produto(s)`;
    };

    document.getElementById('catalogoBusca').oninput = e => {
        catalogoBusca = e.target.value.trim();
        atualizar();
    };

    document.getElementById('catalogoOrdenacao').onchange = e => {
        catalogoOrdenacao = e.target.value;
        atualizar();
    };

    root.querySelectorAll('[data-categoria]').forEach(btn => {
        btn.onclick = () => {
            catalogoCategoria = btn.dataset.categoria || 'todos';
            root.querySelectorAll('[data-categoria]').forEach(b => b.classList.toggle('ativo', b === btn));
            atualizar();
            document.getElementById('catalogoSidebar')?.classList.remove('aberto');
        };
    });

    document.getElementById('abrirCarrinho').onclick = catalogoMostrarCheckout;
    document.getElementById('abrirFiltros').onclick = () => document.getElementById('catalogoSidebar')?.classList.add('aberto');
    document.getElementById('fecharFiltros').onclick = () => document.getElementById('catalogoSidebar')?.classList.remove('aberto');

    catalogoAtualizarContador();
    atualizar();
}

function catalogoMostrarCheckout() {
    const el = document.getElementById('catalogoCheckout');
    if (!el) return;

    if (!catalogoCarrinho.length) {
        el.hidden = false;
        el.innerHTML = '<div class="catalogo-checkout-inner"><button class="catalogo-fechar-checkout" type="button">×</button><span class="catalogo-checkout-icon">🛒</span><h2>Seu carrinho está vazio</h2><p>Adicione alguns produtos para continuar.</p></div>';
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.querySelector('.catalogo-fechar-checkout').onclick = () => { el.hidden = true; };
        return;
    }

    const linhas = catalogoCarrinho.map(item => {
        const p = catalogoProdutos.find(x => Number(x.id) === item.id);
        return p ? `<li><span>${catalogoEsc(p.nome)}</span><b>${item.quantidade} × ${catalogoMoney(p.preco)}</b></li>` : '';
    }).join('');

    el.hidden = false;
    el.innerHTML = `
      <div class="catalogo-checkout-inner">
        <button class="catalogo-fechar-checkout" type="button">×</button>
        <span class="catalogo-eyebrow">SEU PEDIDO</span>
        <h2>Finalizar pedido</h2>
        <ul>${linhas}</ul>
        <form id="catalogoForm">
          <label>Seu nome<input name="cliente" required maxlength="120" autocomplete="name"></label>
          <label>Seu WhatsApp<input name="telefone" required maxlength="30" placeholder="(00) 00000-0000" autocomplete="tel"></label>
          <button class="catalogo-btn catalogo-btn-full" type="submit">Confirmar pedido e enviar no WhatsApp</button>
          <p class="catalogo-aviso">O pedido será registrado como <b>Pendente</b>, o estoque será abatido e você será direcionado ao WhatsApp da loja.</p>
        </form>
      </div>`;

    el.querySelector('.catalogo-fechar-checkout').onclick = () => { el.hidden = true; };
    document.getElementById('catalogoForm').onsubmit = catalogoFinalizar;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function catalogoFinalizar(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const cliente = String(form.get('cliente') || '').trim();
    const telefone = String(form.get('telefone') || '').trim();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Processando...';

    const { data, error } = await supabaseClient.rpc('finalizar_pedido_catalogo', {
        p_slug: catalogoSlug,
        p_cliente: cliente,
        p_telefone: telefone,
        p_itens: catalogoCarrinho
    });

    if (error || !data?.sucesso) {
        btn.disabled = false;
        btn.textContent = 'Confirmar pedido e enviar no WhatsApp';
        catalogoMsg(error?.message || 'Não foi possível concluir o pedido. Atualize a página e tente novamente.', false);
        return;
    }

    const linhas = (data.itens || []).map(i => `- ${i.nome} (${i.quantidade} un.)`).join('\n');
    const texto = `Olá! Quero confirmar um pedido na sua loja.\n\nCliente: ${cliente}\nWhatsApp: ${telefone}\n\n${linhas}\n\nTotal: ${catalogoMoney(data.total)}\nStatus: Pendente`;
    const numero = String(data.whatsapp || '').replace(/\D/g, '');

    catalogoCarrinho = [];
    catalogoAtualizarContador();
    catalogoMsg('Pedido registrado! Abrindo o WhatsApp da loja...');

    if (numero) {
        window.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    } else {
        catalogoMsg('Pedido registrado, mas a loja ainda não cadastrou um número de WhatsApp.', false);
    }
}

async function catalogoInicializar() {
    const root = document.getElementById('catalogoApp');
    if (!root) return;

    if (!catalogoSlug || catalogoSlug === 'undefined' || catalogoSlug === 'null') {
        root.innerHTML = '<div class="catalogo-erro"><h2>Link do catálogo inválido</h2><p>O link precisa conter o identificador da loja.</p></div>';
        return;
    }

    if (typeof supabaseClient === 'undefined') {
        root.innerHTML = '<div class="catalogo-erro"><h2>Não foi possível iniciar o catálogo</h2><p>A conexão com o catálogo não foi carregada. Atualize a página.</p></div>';
        return;
    }

    const { data, error } = await supabaseClient.rpc('obter_catalogo_publico', { p_slug: catalogoSlug });

    if (error || !data?.loja) {
        root.innerHTML = `<div class="catalogo-erro"><h2>Não foi possível carregar o catálogo</h2><p>${catalogoEsc(error?.message || 'Loja não encontrada.')}</p><button class="catalogo-btn" onclick="location.reload()">Tentar novamente</button></div>`;
        return;
    }

    catalogoLoja = data.loja;
    catalogoProdutos = Array.isArray(data.produtos) ? data.produtos : [];
    catalogoRender();
}

document.addEventListener('DOMContentLoaded', catalogoInicializar, { once: true });
