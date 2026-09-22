/* ============================================================
   CATÁLOGO PÚBLICO — estoque, carrinho, encomendas e WhatsApp
   URL: /loja/index.html?slug=nome-da-loja
   ============================================================ */

const catalogoMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const catalogoEsc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const catalogoParams = new URLSearchParams(window.location.search);
const catalogoSlug = (catalogoParams.get('slug') || '').trim();
let catalogoLoja = null;
let catalogoProdutos = [];
let catalogoCarrinho = [];

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

function catalogoRender() {
    const root = document.getElementById('catalogoApp');
    if (!root) return;

    if (!catalogoLoja) {
        root.innerHTML = '<div class="card"><h2>Loja não encontrada</h2><p>Confira o link do catálogo.</p></div>';
        return;
    }

    const produtos = catalogoProdutos.filter(p => p.mostrar_catalogo);
    const cor = catalogoLoja.catalogo_cor || '#6B4E3D';
    const botao = catalogoLoja.catalogo_cor_botao || '#25D366';
    document.documentElement.style.setProperty('--catalogo-cor', cor);
    document.documentElement.style.setProperty('--catalogo-botao', botao);

    root.innerHTML = `
      <header class="catalogo-header">
        ${catalogoLoja.catalogo_banner ? `<img class="catalogo-banner" src="${catalogoEsc(catalogoLoja.catalogo_banner)}" alt="Banner da loja">` : ''}
        <h1>${catalogoEsc(catalogoLoja.catalogo_nome || catalogoLoja.nome || 'Minha Loja')}</h1>
        <p>${catalogoEsc(catalogoLoja.catalogo_slogan || '')}</p>
      </header>
      <div class="catalogo-toolbar"><span>${produtos.length} produto(s)</span><button id="abrirCarrinho" class="catalogo-btn">🛒 Carrinho (<span id="contadorCarrinho">0</span>)</button></div>
      <div id="catalogoMsg" class="catalogo-msg" hidden></div>
      <section class="catalogo-grid">
        ${produtos.map(p => {
            const qtd = Number(p.quantidade || 0);
            const indisponivel = qtd <= 0;
            return `<article class="catalogo-produto">
              ${p.foto ? `<img src="${catalogoEsc(p.foto)}" alt="${catalogoEsc(p.nome)}">` : '<div class="catalogo-sem-foto">🧶</div>'}
              <div class="catalogo-produto-corpo">
                <h3>${catalogoEsc(p.nome)}</h3>
                <p>${catalogoEsc(p.descricao || '')}</p>
                ${catalogoLoja.mostrar_preco !== false ? `<strong>${catalogoMoney(p.preco)}</strong>` : ''}
                ${catalogoLoja.mostrar_estoque !== false ? `<small class="estoque ${indisponivel ? 'esgotado' : ''}">${indisponivel ? 'Esgotado' : `${qtd} disponível(is)`}</small>` : ''}
                <div class="catalogo-comprar">${indisponivel ? '<button class="catalogo-btn" disabled>Sem estoque</button>' : `<input type="number" min="1" max="${qtd}" value="1" id="qtd-${p.id}"><button class="catalogo-btn" data-add="${p.id}">Adicionar</button>`}</div>
              </div>
            </article>`;
        }).join('') || '<p>Nenhum produto disponível no momento.</p>'}
      </section>
      <section id="catalogoCheckout" class="catalogo-checkout" hidden></section>`;

    document.getElementById('abrirCarrinho').onclick = catalogoMostrarCheckout;
    root.querySelectorAll('[data-add]').forEach(btn => btn.onclick = () => {
        const id = Number(btn.dataset.add);
        const produto = catalogoProdutos.find(p => Number(p.id) === id);
        const qtdEl = document.getElementById(`qtd-${id}`);
        const quantidade = Math.max(1, Number(qtdEl?.value || 1));
        if (!produto || quantidade > Number(produto.quantidade || 0)) return catalogoMsg('Quantidade maior que o estoque disponível.', false);
        const existente = catalogoCarrinho.find(i => i.id === id);
        if (existente) existente.quantidade = Math.min(Number(produto.quantidade), existente.quantidade + quantidade);
        else catalogoCarrinho.push({ id, quantidade });
        catalogoAtualizarContador();
        catalogoMsg('Produto adicionado ao carrinho.');
    });
}

function catalogoAtualizarContador() {
    const total = catalogoCarrinho.reduce((s, i) => s + i.quantidade, 0);
    const el = document.getElementById('contadorCarrinho');
    if (el) el.textContent = total;
}

function catalogoMostrarCheckout() {
    const el = document.getElementById('catalogoCheckout');
    if (!el) return;
    if (!catalogoCarrinho.length) {
        el.hidden = false;
        el.innerHTML = '<h2>Seu carrinho está vazio</h2>';
        return;
    }
    const linhas = catalogoCarrinho.map(item => {
        const p = catalogoProdutos.find(x => Number(x.id) === item.id);
        return p ? `<li>${catalogoEsc(p.nome)} — ${item.quantidade} × ${catalogoMoney(p.preco)}</li>` : '';
    }).join('');
    el.hidden = false;
    el.innerHTML = `<h2>Finalizar pedido</h2><ul>${linhas}</ul><form id="catalogoForm">
      <label>Seu nome<input name="cliente" required maxlength="120"></label>
      <label>Seu WhatsApp<input name="telefone" required maxlength="30" placeholder="(00) 00000-0000"></label>
      <button class="catalogo-btn" type="submit">Confirmar pedido e enviar no WhatsApp</button>
      <p class="catalogo-aviso">O pedido será registrado como <b>Pendente</b>, o estoque será abatido e você será direcionado ao WhatsApp da loja.</p>
    </form>`;
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
    catalogoMsg('Pedido registrado! Abrindo o WhatsApp da loja...');
    if (numero) window.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    else catalogoMsg('Pedido registrado, mas a loja ainda não cadastrou um número de WhatsApp.', false);
}

async function catalogoInicializar() {
    const root = document.getElementById('catalogoApp');
    if (!root) return;

    if (!catalogoSlug || catalogoSlug === 'undefined' || catalogoSlug === 'null') {
        root.innerHTML = '<div class="card"><h2>Link do catálogo inválido</h2><p>O link precisa conter o identificador da loja.</p></div>';
        return;
    }

    const { data, error } = await supabaseClient.rpc('obter_catalogo_publico', {
        p_slug: catalogoSlug
    });

    if (error || !data?.loja) {
        root.innerHTML = `<div class="card"><h2>Não foi possível carregar o catálogo</h2><p>${catalogoEsc(error?.message || 'Loja não encontrada.')}</p></div>`;
        return;
    }

    catalogoLoja = data.loja;
    catalogoProdutos = data.produtos || [];
    catalogoRender();
}

document.addEventListener('DOMContentLoaded', catalogoInicializar);
