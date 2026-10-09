'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, uploadToStorage, slugify } from '@/lib/utils';
import { Produto, CategoriaProduto } from '@/types/database';

export default function MinhaLojaPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'produtos' | 'categorias' | 'config'>('produtos');

  // Products state
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  // Product form states
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [estoqueMinimo, setEstoqueMinimo] = useState('0');
  const [tempoProducao, setTempoProducao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category form states
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadAll = async () => {
    if (!user) return;

    const [prodRes, catRes] = await Promise.all([
      supabase.from('produtos').select('*').eq('usuario_id', user.id).order('nome'),
      supabase.from('categorias_produtos').select('*').eq('usuario_id', user.id).order('nome'),
    ]);

    if (prodRes.data) setProdutos(prodRes.data);
    if (catRes.data) setCategorias(catRes.data);
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const resetProductForm = () => {
    setEditingProduct(null);
    setNome('');
    setPreco('');
    setQuantidade('1');
    setEstoqueMinimo('0');
    setTempoProducao('');
    setCategoriaId('');
    setMostrarCatalogo(true);
    setDescricao('');
    setFotoFile(null);
  };

  const handleEditClick = (p: Produto) => {
    setEditingProduct(p);
    setNome(p.nome);
    setPreco(String(p.preco));
    setQuantidade(String(p.quantidade));
    setEstoqueMinimo(String(p.estoque_minimo || 0));
    setTempoProducao(p.tempo_producao ? String(p.tempo_producao) : '');
    setCategoriaId(p.categoria_id ? String(p.categoria_id) : '');
    setMostrarCatalogo(p.mostrar_catalogo !== false);
    setDescricao(p.descricao || '');
    setFotoFile(null);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProduct(true);
    setMsg(null);

    try {
      let fotoUrl = editingProduct?.foto || null;
      if (fotoFile) {
        fotoUrl = await uploadToStorage('produtos', fotoFile, user.id);
      }

      const payload = {
        nome: nome.trim(),
        preco: Number(preco),
        quantidade: Number(quantidade),
        estoque_minimo: Number(estoqueMinimo || 0),
        tempo_producao: tempoProducao ? Number(tempoProducao) : null,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        mostrar_catalogo: mostrarCatalogo,
        descricao: descricao.trim() || null,
        foto: fotoUrl,
        usuario_id: user.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', editingProduct.id)
          .eq('usuario_id', user.id);

        if (error) throw error;
        setMsg({ tipo: 'ok', texto: 'Produto atualizado com sucesso!' });
      } else {
        const { error } = await supabase.from('produtos').insert(payload);
        if (error) throw error;
        setMsg({ tipo: 'ok', texto: 'Produto cadastrado com sucesso!' });
      }

      resetProductForm();
      loadAll();
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao salvar produto.' });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleExcluirProduto = async (id: number) => {
    if (!confirm('Deseja excluir este produto?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Produto excluído com sucesso!' });
      loadAll();
    }
  };

  const handleSalvarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nomeCategoria.trim()) return;

    setSavingCategory(true);
    setMsg(null);

    const slug = slugify(nomeCategoria);

    const { error } = await supabase.from('categorias_produtos').insert({
      usuario_id: user.id,
      nome: nomeCategoria.trim(),
      slug,
    });

    if (error) {
      setMsg({
        tipo: 'err',
        texto: error.code === '23505' ? 'Essa categoria já existe.' : error.message,
      });
    } else {
      setMsg({ tipo: 'ok', texto: 'Categoria criada com sucesso!' });
      setNomeCategoria('');
      loadAll();
    }
    setSavingCategory(false);
  };

  const handleExcluirCategoria = async (catId: number) => {
    if (!confirm('Deseja excluir esta categoria? Os produtos continuarão salvos.')) return;
    if (!user) return;

    await supabase
      .from('produtos')
      .update({ categoria_id: null })
      .eq('categoria_id', catId)
      .eq('usuario_id', user.id);

    const { error } = await supabase
      .from('categorias_produtos')
      .delete()
      .eq('id', catId)
      .eq('usuario_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Categoria excluída com sucesso!' });
      loadAll();
    }
  };

  const lojaSlug = profile?.slug || 'loja';

  return (
    <AppShell title="Minha Loja">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <section className="store-overview-hero">
        <div className="store-overview-copy">
          <span className="page-kicker">CATÁLOGO ONLINE</span>
          <h2>{profile?.catalogo_nome || profile?.nome || 'Minha Loja'}</h2>
          <p>{profile?.catalogo_slogan || 'Configure seu catálogo público e gerencie seus produtos.'}</p>
          <div className="store-overview-actions">
            <Link
              className="btn btn-primary"
              href={`/loja/${encodeURIComponent(lojaSlug)}`}
              target="_blank"
            >
              Abrir catálogo público ↗
            </Link>
            <Link className="btn btn-secondary" href="/minha-loja/editar">
              Personalizar aparência
            </Link>
          </div>
        </div>

        <div className="store-overview-preview">
          {profile?.catalogo_banner ? (
            <img src={profile.catalogo_banner} alt="Banner da loja" />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--marrom-principal)' }}>
              <span style={{ fontSize: '32px' }}>🛍️</span>
              <br />
              <small><b>Seu catálogo online</b></small>
            </div>
          )}
        </div>
      </section>

      <div className="store-tabs">
        <button
          type="button"
          className={`store-tab ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => setActiveTab('produtos')}
        >
          Produtos
        </button>
        <button
          type="button"
          className={`store-tab ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          Categorias
        </button>
        <button
          type="button"
          className={`store-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Configurações
        </button>
      </div>

      {activeTab === 'produtos' && (
        <div>
          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">CATÁLOGO</span>
                <h3>{editingProduct ? 'Editar produto' : 'Novo produto'}</h3>
              </div>
              <span className="pill">Minha Loja</span>
            </div>

            <form onSubmit={handleSalvarProduto} className="grid grid-3">
              <div>
                <label className="label">Nome do Produto / Item *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="Ex.: Armação Ray-Ban, Óculos Solar, Lentes, Produto"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  required
                  placeholder="0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Quantidade em Estoque *</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Estoque Mínimo</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Prazo de Entrega / Produção (dias)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  placeholder="Ex.: 3"
                  value={tempoProducao}
                  onChange={(e) => setTempoProducao(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Categoria</label>
                <select
                  className="select"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Foto do Produto</label>
                <input
                  type="file"
                  className="input"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="label">Exibição no Catálogo</label>
                <select
                  className="select"
                  value={mostrarCatalogo ? 'true' : 'false'}
                  onChange={(e) => setMostrarCatalogo(e.target.value === 'true')}
                >
                  <option value="true">Visível no catálogo público</option>
                  <option value="false">Oculto</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Descrição do Produto</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Detalhes, tamanho aproximado, material..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="actions" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
                {editingProduct && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetProductForm}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                  {savingProduct ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">PRODUTOS</span>
                <h3>Produtos cadastrados</h3>
              </div>
              <span className="pill">{produtos.length} itens</span>
            </div>

            <div>
              {produtos.length > 0 ? (
                produtos.map((p) => {
                  const cat = categorias.find((c) => c.id === p.categoria_id);
                  return (
                    <div key={p.id} className="store-product-row">
                      <div className="store-product-thumb">
                        {p.foto ? <img src={p.foto} alt={p.nome} /> : <span>🧶</span>}
                      </div>
                      <div className="store-product-main">
                        <b>{p.nome}</b>
                        <small>
                          {cat?.nome || 'Sem categoria'} · {formatMoney(p.preco)}
                        </small>
                      </div>
                      <span className={`pill ${p.mostrar_catalogo ? 'success' : 'muted'}`}>
                        {p.mostrar_catalogo ? 'No catálogo' : 'Oculto'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {p.quantidade} un.
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditClick(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleExcluirProduto(p.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  Cadastre o primeiro produto da sua loja para iniciar seu catálogo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">ORGANIZAÇÃO</span>
                <h3>Nova categoria</h3>
              </div>
            </div>

            <form onSubmit={handleSalvarCategoria}>
              <div>
                <label className="label">Nome da categoria</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="Ex.: Armações de Grau, Óculos de Sol, Acessórios..."
                  value={nomeCategoria}
                  onChange={(e) => setNomeCategoria(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                disabled={savingCategory}
              >
                {savingCategory ? 'Criando...' : 'Criar Categoria'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">CATÁLOGO</span>
                <h3>Categorias cadastradas</h3>
              </div>
              <span className="pill">{categorias.length}</span>
            </div>

            <div>
              {categorias.length > 0 ? (
                categorias.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--borda)',
                    }}
                  >
                    <div>
                      <b>{c.nome}</b>
                      <br />
                      <small className="muted">slug: /{c.slug}</small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleExcluirCategoria(c.id)}
                    >
                      Excluir
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  Nenhuma categoria criada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CONFIGURAÇÕES</span>
              <h3>Dados da loja</h3>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: '20px' }}>
            <div>
              <span className="muted" style={{ fontSize: '12px' }}>Nome público</span>
              <p style={{ margin: '4px 0', fontWeight: 700 }}>
                {profile?.catalogo_nome || profile?.nome || 'Minha Loja'}
              </p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: '12px' }}>Slug público</span>
              <p style={{ margin: '4px 0', fontWeight: 700 }}>
                /{profile?.slug}
              </p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: '12px' }}>WhatsApp configurado</span>
              <p style={{ margin: '4px 0', fontWeight: 700 }}>
                {profile?.whatsapp || 'Não configurado'}
              </p>
            </div>
          </div>

          <div className="actions">
            <Link className="btn btn-secondary" href="/minha-loja/editar">
              Editar aparência, banner e WhatsApp
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
