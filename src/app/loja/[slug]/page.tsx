'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/utils';
import { Usuario, Produto } from '@/types/database';

interface CartItem {
  id: number;
  quantidade: number;
}

export default function LojaSlugPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [loja, setLoja] = useState<Usuario | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [precoMax, setPrecoMax] = useState<number>(500);
  const [apenasEstoque, setApenasEstoque] = useState(false);
  const [ordenacao, setOrdenacao] = useState('recentes');

  // Cart & Favorites state
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Checkout form
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  // Quick view modal
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null);

  const storageKey = (tipo: string) => `km_catalogo_${tipo}_${slug || 'sem-loja'}`;

  // Load cart and favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = JSON.parse(localStorage.getItem(storageKey('carrinho')) || '[]');
        const f = JSON.parse(localStorage.getItem(storageKey('favoritos')) || '[]');
        setCarrinho(c);
        setFavoritos(f);
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  const saveCart = (newCart: CartItem[]) => {
    setCarrinho(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey('carrinho'), JSON.stringify(newCart));
    }
  };

  const saveFavs = (newFavs: number[]) => {
    setFavoritos(newFavs);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey('favoritos'), JSON.stringify(newFavs));
    }
  };

  const showToast = (txt: string) => {
    setToastMsg(txt);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link do catálogo copiado para a área de transferência! 🔗');
    }
  };

  const handleDirectWhatsApp = (prod: Produto) => {
    if (!loja?.whatsapp) {
      showToast('WhatsApp da loja não configurado no momento.');
      return;
    }
    const zapNum = loja.whatsapp.replace(/\D/g, '');
    const storeTitle = loja.catalogo_nome || loja.nome || 'sua loja';
    const msg = `Olá! Vi o produto "${prod.nome}" no catálogo da ${storeTitle} e gostaria de mais informações / fazer o pedido.\n\n` +
      `Código/ID: #${prod.id}\n` +
      `Preço: ${formatMoney(prod.preco)}\n` +
      `Disponibilidade: ${Number(prod.quantidade || 0) > 0 ? 'Em estoque' : 'Sob consulta'}`;
    
    window.open(`https://wa.me/${zapNum}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Fetch store and products
  useEffect(() => {
    if (!slug) return;

    async function fetchLoja() {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Try RPC first
        const r = await supabase.rpc('obter_catalogo_publico', { p_slug: slug });
        if (!r.error && r.data?.loja) {
          setLoja(r.data.loja);
          const prods = Array.isArray(r.data.produtos) ? r.data.produtos : [];
          setProdutos(prods);

          const max = Math.max(200, ...prods.map((p: Produto) => Number(p.preco || 0)));
          setPrecoMax(max);
          setLoading(false);
          return;
        }

        // Fallback: direct query
        const { data: usuario, error: uErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('slug', slug)
          .single();

        if (uErr || !usuario) {
          setErrorMsg('Loja não encontrada. Verifique o link e tente novamente.');
          setLoading(false);
          return;
        }

        setLoja(usuario);

        const { data: prodsData } = await supabase
          .from('produtos')
          .select('*')
          .eq('usuario_id', usuario.id)
          .eq('mostrar_catalogo', true)
          .order('data', { ascending: false });

        const list = prodsData || [];
        setProdutos(list);
        const max = Math.max(200, ...list.map((p) => Number(p.preco || 0)));
        setPrecoMax(max);
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao carregar catálogo.');
      } finally {
        setLoading(false);
      }
    }

    fetchLoja();
  }, [slug]);

  // Dynamic theme properties
  useEffect(() => {
    if (loja) {
      if (loja.catalogo_cor) {
        document.documentElement.style.setProperty('--catalogo-cor', loja.catalogo_cor);
      }
      if (loja.catalogo_cor_botao) {
        document.documentElement.style.setProperty('--catalogo-botao', loja.catalogo_cor_botao);
      }
    }
  }, [loja]);

  // Categories list
  const categoriasList = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria && p.categoria.trim()) {
        set.add(p.categoria.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [produtos]);

  // Filtered & sorted products
  const produtosFiltrados = useMemo(() => {
    let result = produtos.filter((p) => p.mostrar_catalogo !== false);

    if (categoria !== 'todos') {
      result = result.filter((p) => String(p.categoria || '').trim() === categoria);
    }

    if (busca.trim()) {
      const b = busca.toLowerCase();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(b) ||
          (p.descricao && p.descricao.toLowerCase().includes(b)) ||
          (p.categoria && p.categoria.toLowerCase().includes(b))
      );
    }

    if (apenasEstoque) {
      result = result.filter((p) => Number(p.quantidade || 0) > 0);
    }

    if (precoMax > 0) {
      result = result.filter((p) => Number(p.preco || 0) <= precoMax);
    }

    if (ordenacao === 'menor-preco') {
      result.sort((x, y) => Number(x.preco || 0) - Number(y.preco || 0));
    } else if (ordenacao === 'maior-preco') {
      result.sort((x, y) => Number(y.preco || 0) - Number(x.preco || 0));
    } else if (ordenacao === 'nome') {
      result.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
    } else if (ordenacao === 'favoritos') {
      result.sort((x, y) => Number(favoritos.includes(y.id)) - Number(favoritos.includes(x.id)));
    }

    return result;
  }, [produtos, categoria, busca, apenasEstoque, precoMax, ordenacao, favoritos]);

  const totalCarrinhoQtd = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  const handleAddToCart = (prodId: number) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (!prod) return;

    const existing = carrinho.find((i) => i.id === prodId);
    let nextCart: CartItem[];
    if (existing) {
      nextCart = carrinho.map((i) =>
        i.id === prodId
          ? { ...i, quantidade: Math.min(Number(prod.quantidade || 999), i.quantidade + 1) }
          : i
      );
    } else {
      nextCart = [...carrinho, { id: prodId, quantidade: 1 }];
    }

    saveCart(nextCart);
    showToast('Produto adicionado ao carrinho! 🛒');
  };

  const handleUpdateCartQtd = (prodId: number, delta: number) => {
    const prod = produtos.find((p) => p.id === prodId);
    if (!prod) return;

    const existing = carrinho.find((i) => i.id === prodId);
    if (!existing) return;

    const nextQtd = existing.quantidade + delta;
    let nextCart: CartItem[];
    if (nextQtd <= 0) {
      nextCart = carrinho.filter((i) => i.id !== prodId);
    } else {
      nextCart = carrinho.map((i) =>
        i.id === prodId
          ? { ...i, quantidade: Math.min(Number(prod.quantidade || 999), nextQtd) }
          : i
      );
    }
    saveCart(nextCart);
  };

  const handleRemoveFromCart = (prodId: number) => {
    const nextCart = carrinho.filter((i) => i.id !== prodId);
    saveCart(nextCart);
  };

  const handleToggleFavorito = (prodId: number) => {
    let nextFavs: number[];
    if (favoritos.includes(prodId)) {
      nextFavs = favoritos.filter((id) => id !== prodId);
    } else {
      nextFavs = [...favoritos, prodId];
    }
    saveFavs(nextFavs);
  };

  const totalCarrinhoValor = carrinho.reduce((acc, item) => {
    const p = produtos.find((x) => x.id === item.id);
    return acc + (p ? Number(p.preco || 0) * item.quantidade : 0);
  }, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loja || carrinho.length === 0) return;

    setFinalizando(true);

    try {
      // 1. Try RPC `finalizar_pedido_catalogo`
      let pedidoId: number | null = null;
      let zap = loja.whatsapp || '';

      const r = await supabase.rpc('finalizar_pedido_catalogo', {
        p_slug: slug,
        p_cliente: nomeCliente.trim(),
        p_telefone: telefoneCliente.trim(),
        p_itens: carrinho,
      });

      if (!r.error && r.data?.sucesso) {
        pedidoId = r.data.pedido_id;
        zap = r.data.whatsapp || zap;
      } else {
        // Fallback: direct lead insertion
        const itensData = carrinho.map((item) => {
          const prod = produtos.find((x) => x.id === item.id);
          return {
            produto_id: item.id,
            nome: prod?.nome || 'Produto',
            quantidade: item.quantidade,
            valor: prod ? Number(prod.preco || 0) : 0,
            subtotal: prod ? Number(prod.preco || 0) * item.quantidade : 0,
            observacoes: observacoes.trim() || undefined,
          };
        });

        const { data: leadData } = await supabase.from('leads').insert({
          usuario_id: loja.id,
          nome_cliente: nomeCliente.trim(),
          telefone_cliente: telefoneCliente.trim(),
          itens: itensData,
          valor_total: totalCarrinhoValor,
          status: 'Novo',
        }).select('id').single();

        pedidoId = leadData?.id || Math.floor(Math.random() * 10000);
      }

      // Build WhatsApp message
      const linhas = carrinho.map((item) => {
        const prod = produtos.find((x) => x.id === item.id);
        return `• *${prod?.nome || 'Item'}* (x${item.quantidade}) — ${formatMoney((prod?.preco || 0) * item.quantidade)}`;
      }).join('\n');

      const storeNameDisplay = loja.catalogo_nome || loja.nome || 'Loja';
      let texto = `🛍️ *NOVO PEDIDO — ${storeNameDisplay.toUpperCase()}*\n\n` +
        `🔖 *Pedido:* #${pedidoId}\n` +
        `👤 *Cliente:* ${nomeCliente}\n` +
        `📱 *Contato:* ${telefoneCliente}\n`;

      if (observacoes.trim()) {
        texto += `📝 *Observações / Detalhes:* ${observacoes.trim()}\n`;
      }

      texto += `\n🛒 *ITENS DO PEDIDO:*\n${linhas}\n\n` +
        `💰 *VALOR TOTAL:* ${formatMoney(totalCarrinhoValor)}\n` +
        `⏳ *Status:* Aguardando confirmação`;

      saveCart([]);
      setCartOpen(false);

      const zapNum = zap.replace(/\D/g, '');
      if (zapNum) {
        showToast(`Pedido #${pedidoId} registrado! Abrindo WhatsApp...`);
        window.location.href = `https://wa.me/${zapNum}?text=${encodeURIComponent(texto)}`;
      } else {
        showToast(`Pedido #${pedidoId} confirmado com sucesso!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar pedido.');
    } finally {
      setFinalizando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--catalogo-fundo, #f8fafc)' }}>
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '4px solid #cbd5e1',
              borderTopColor: '#2563eb',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Carregando catálogo digital...</h3>
        </div>
      </div>
    );
  }

  if (errorMsg || !loja) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px 30px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🏬</span>
          <h2>Catálogo não encontrado</h2>
          <p className="muted">{errorMsg || 'A loja informada não está disponível.'}</p>
        </div>
      </div>
    );
  }

  const storeName = loja.catalogo_nome || loja.nome || 'Minha Loja';
  const slogan = loja.catalogo_slogan || 'Qualidade, atendimento de excelência e as melhores opções para você.';

  return (
    <div className="catalogo-wrap" style={{ background: loja.catalogo_cor_fundo || 'var(--catalogo-fundo)' }}>
      {/* Topbar */}
      <header className="catalogo-topbar">
        <div className="catalogo-topbar-inner">
          <div className="catalogo-brand">
            <span className="catalogo-brand-icon">🛍️</span>
            <div>
              <strong>{storeName}</strong>
              <small>Catálogo Oficial</small>
            </div>
          </div>

          <div className="catalogo-top-actions">
            <div className="catalogo-busca-top">
              <input
                type="search"
                placeholder="Buscar produtos, marcas, códigos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <span>🔍</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '12.5px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
              onClick={handleCopyLink}
              title="Copiar link da loja"
            >
              🔗 Compartilhar
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{
                borderRadius: '999px',
                padding: '8px 18px',
                background: loja.catalogo_cor_botao || 'var(--catalogo-botao)',
                border: 0,
                fontWeight: 700,
              }}
              onClick={() => setCartOpen(true)}
            >
              <span>🛒 Carrinho</span>
              <span className="catalogo-carrinho-badge" style={{ marginLeft: '6px' }}>
                {totalCarrinhoQtd}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="catalogo-layout">
        {/* Sidebar Filters */}
        <aside className="catalogo-filtros">
          <div className="catalogo-side-title">
            <strong>Categorias</strong>
          </div>

          <button
            type="button"
            className={`catalogo-categoria ${categoria === 'todos' ? 'ativo' : ''}`}
            onClick={() => setCategoria('todos')}
          >
            <span>▦</span>
            <b>Todos os Produtos</b>
            <em>{produtos.length}</em>
          </button>

          {categoriasList.map((cat, i) => (
            <button
              key={i}
              type="button"
              className={`catalogo-categoria ${categoria === cat ? 'ativo' : ''}`}
              onClick={() => setCategoria(cat)}
            >
              <span>🏷️</span>
              <b>{cat}</b>
              <em>{produtos.filter((p) => p.categoria === cat).length}</em>
            </button>
          ))}

          <div className="catalogo-divider"></div>

          <div className="catalogo-filter-block">
            <b>Preço Máximo</b>
            <div className="catalogo-preco-label">
              <span>R$ 0,00</span>
              <span>{formatMoney(precoMax)}</span>
            </div>
            <input
              type="range"
              className="catalogo-range"
              min={0}
              max={Math.max(300, ...produtos.map((p) => Number(p.preco || 0)))}
              step={5}
              value={precoMax}
              onChange={(e) => setPrecoMax(Number(e.target.value))}
            />
          </div>

          <div className="catalogo-filter-block">
            <b>Disponibilidade</b>
            <label className="catalogo-switch">
              <input
                type="checkbox"
                checked={apenasEstoque}
                onChange={(e) => setApenasEstoque(e.target.checked)}
              />
              <span></span>
              <em>Apenas produtos em estoque</em>
            </label>
          </div>

          <div className="catalogo-filter-block">
            <b>Ordenar por</b>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
            >
              <option value="recentes">Mais recentes</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
              <option value="nome">Nome A-Z</option>
              <option value="favoritos">Favoritos primeiro</option>
            </select>
          </div>

          <div className="catalogo-seguro">
            <span>✓</span>
            <div>
              <strong>Compra Segura</strong>
              <small>Pedido direto e seguro via WhatsApp</small>
            </div>
          </div>
        </aside>

        {/* Products Area */}
        <main className="catalogo-main">
          {/* Responsive Category Pills Bar */}
          <div className="catalogo-pills-bar">
            <button
              type="button"
              className={`catalogo-pill-item ${categoria === 'todos' ? 'ativo' : ''}`}
              onClick={() => setCategoria('todos')}
            >
              Todos ({produtos.length})
            </button>
            {categoriasList.map((cat, i) => (
              <button
                key={i}
                type="button"
                className={`catalogo-pill-item ${categoria === cat ? 'ativo' : ''}`}
                onClick={() => setCategoria(cat)}
              >
                {cat} ({produtos.filter((p) => p.categoria === cat).length})
              </button>
            ))}
          </div>

          <section className="catalogo-hero">
            <div className="catalogo-hero-copy">
              <span className="catalogo-hero-label">⚡ CATÁLOGO ONLINE OFICIAL</span>
              <h1>{storeName}</h1>
              <p>{slogan}</p>
            </div>

            <div className="catalogo-hero-image">
              {loja.catalogo_banner ? (
                <img src={loja.catalogo_banner} alt={storeName} />
              ) : (
                <div className="catalogo-hero-placeholder">
                  <span>🛍️</span>
                  <b>{storeName}</b>
                </div>
              )}
            </div>
          </section>

          <div className="catalogo-section-head">
            <h2>★ <span>Vitrine de Produtos</span></h2>
            <span className="muted">{produtosFiltrados.length} produto(s) encontrado(s)</span>
          </div>

          <div className="catalogo-grid">
            {produtosFiltrados.length > 0 ? (
              produtosFiltrados.map((p) => {
                const esgotado = Number(p.quantidade || 0) <= 0;
                const isFav = favoritos.includes(p.id);
                const precoNum = Number(p.preco || 0);

                return (
                  <article key={p.id} className="catalogo-card">
                    <div
                      className="catalogo-card-imagem"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setProdutoModal(p)}
                    >
                      {p.foto ? (
                        <img src={p.foto} alt={p.nome} loading="lazy" />
                      ) : (
                        <div className="catalogo-sem-foto">📦</div>
                      )}

                      <button
                        type="button"
                        className={`catalogo-favorito ${isFav ? 'ativo' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorito(p.id);
                        }}
                        aria-label="Favoritar"
                      >
                        {isFav ? '♥' : '♡'}
                      </button>

                      {loja.mostrar_estoque && (
                        <span className={`catalogo-estoque ${esgotado ? 'esgotado' : ''}`}>
                          {esgotado ? '× Esgotado' : '✓ Em estoque'}
                        </span>
                      )}
                    </div>

                    <div className="catalogo-card-corpo">
                      {p.categoria && (
                        <span className="catalogo-categoria-tag">{p.categoria}</span>
                      )}

                      <h3
                        style={{ cursor: 'pointer' }}
                        onClick={() => setProdutoModal(p)}
                      >
                        {p.nome}
                      </h3>

                      <p>{p.descricao || 'Produto de alta qualidade com garantia e procedência.'}</p>

                      <div className="catalogo-preco-row">
                        {loja.mostrar_preco && (
                          <>
                            <strong>{formatMoney(p.preco)}</strong>
                            {precoNum >= 50 && (
                              <small>ou em até 6x de {formatMoney(precoNum / 6)}</small>
                            )}
                          </>
                        )}
                      </div>

                      <div className="catalogo-card-botoes">
                        <button
                          type="button"
                          className="catalogo-add"
                          disabled={esgotado}
                          onClick={() => handleAddToCart(p.id)}
                        >
                          {esgotado ? 'Indisponível' : '🛒 Carrinho'}
                        </button>

                        {loja.whatsapp && (
                          <button
                            type="button"
                            className="catalogo-btn-zap-direto"
                            onClick={() => handleDirectWhatsApp(p)}
                            title="Pedir direto no WhatsApp"
                          >
                            💬 Pedir
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="catalogo-vazio">
                <span>📦</span>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar a busca ou os filtros de categoria e preço.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Quick View Product Modal */}
      {produtoModal && (
        <div className="catalogo-modal aberto">
          <div className="catalogo-modal-bg" onClick={() => setProdutoModal(null)} />
          <section className="catalogo-modal-box" style={{ maxWidth: '540px' }}>
            <button
              type="button"
              className="catalogo-modal-close"
              onClick={() => setProdutoModal(null)}
            >
              ×
            </button>
            <span className="catalogo-modal-label">DETALHES DO PRODUTO</span>
            <h2 style={{ marginBottom: '12px' }}>{produtoModal.nome}</h2>

            <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', background: 'var(--fundo-claro)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {produtoModal.foto ? (
                <img src={produtoModal.foto} alt={produtoModal.nome} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '64px', opacity: 0.6 }}>📦</span>
              )}
            </div>

            {produtoModal.categoria && (
              <span className="catalogo-categoria-tag" style={{ marginBottom: '10px' }}>
                {produtoModal.categoria}
              </span>
            )}

            <p style={{ color: 'var(--texto)', lineHeight: '1.6', fontSize: '14px', margin: '0 0 16px' }}>
              {produtoModal.descricao || 'Item de alta qualidade, acabamento refinado e garantia total.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--fundo-claro)', borderRadius: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Preço</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--texto)' }}>
                  {formatMoney(produtoModal.preco)}
                </div>
              </div>
              <span className={`pill ${Number(produtoModal.quantidade || 0) > 0 ? 'success' : 'danger'}`}>
                {Number(produtoModal.quantidade || 0) > 0 ? `${produtoModal.quantidade} em estoque` : 'Esgotado'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={Number(produtoModal.quantidade || 0) <= 0}
                onClick={() => {
                  handleAddToCart(produtoModal.id);
                  setProdutoModal(null);
                }}
              >
                🛒 Adicionar ao Carrinho
              </button>

              {loja.whatsapp && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#16a34a', color: '#fff' }}
                  onClick={() => {
                    handleDirectWhatsApp(produtoModal);
                    setProdutoModal(null);
                  }}
                >
                  💬 Pedir no WhatsApp
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Cart Modal / Drawer */}
      {cartOpen && (
        <div className="catalogo-modal aberto">
          <div className="catalogo-modal-bg" onClick={() => setCartOpen(false)} />
          <section className="catalogo-modal-box">
            <button
              type="button"
              className="catalogo-modal-close"
              onClick={() => setCartOpen(false)}
            >
              ×
            </button>
            <span className="catalogo-modal-label">PEDIDO DIRETO</span>
            <h2>Meu Carrinho</h2>

            {carrinho.length > 0 ? (
              <>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {carrinho.map((item) => {
                    const prod = produtos.find((p) => p.id === item.id);
                    if (!prod) return null;
                    const subtotal = Number(prod.preco || 0) * item.quantidade;

                    return (
                      <div key={item.id} className="catalogo-carrinho-item">
                        <div className="catalogo-carrinho-img">
                          {prod.foto ? <img src={prod.foto} alt={prod.nome} /> : <span>📦</span>}
                        </div>
                        <div className="catalogo-carrinho-info">
                          <b>{prod.nome}</b>
                          <small>{formatMoney(prod.preco)} un.</small>
                        </div>
                        <div className="catalogo-qtd">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQtd(prod.id, -1)}
                          >
                            −
                          </button>
                          <span>{item.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQtd(prod.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <strong>{formatMoney(subtotal)}</strong>
                        <button
                          type="button"
                          className="catalogo-remover"
                          onClick={() => handleRemoveFromCart(prod.id)}
                          title="Remover"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="catalogo-total-box">
                  <span>Total do Pedido:</span>
                  <strong>{formatMoney(totalCarrinhoValor)}</strong>
                </div>

                <form onSubmit={handleCheckout} style={{ marginTop: '18px' }}>
                  <label>
                    Seu Nome Completo *
                    <input
                      type="text"
                      required
                      placeholder="Como podemos te chamar?"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                    />
                  </label>

                  <label>
                    WhatsApp com DDD *
                    <input
                      type="tel"
                      required
                      placeholder="(00) 00000-0000"
                      value={telefoneCliente}
                      onChange={(e) => setTelefoneCliente(e.target.value)}
                    />
                  </label>

                  <label>
                    Observações / Grau / Detalhes (Opcional)
                    <textarea
                      rows={2}
                      placeholder="Ex.: Grau OD: -1.50 / OE: -2.00, cor da armação, retirada no balcão..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </label>

                  <button
                    type="submit"
                    className="catalogo-finalizar"
                    disabled={finalizando}
                    style={{ background: loja.catalogo_cor_botao || 'var(--catalogo-botao)' }}
                  >
                    {finalizando ? 'Processando pedido...' : '💬 Enviar Pedido via WhatsApp'}
                  </button>

                  <small style={{ color: 'var(--muted)', textAlign: 'center', display: 'block', marginTop: '6px' }}>
                    Seu pedido será enviado diretamente ao WhatsApp da loja com a relação completa de itens.
                  </small>
                </form>
              </>
            ) : (
              <div className="catalogo-carrinho-vazio">
                <span>🛒</span>
                <h3>Seu carrinho está vazio</h3>
                <p>Nenhum item adicionado ainda. Escolha seus produtos favoritos na vitrine!</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && <div className="catalogo-toast show">{toastMsg}</div>}
    </div>
  );
}
