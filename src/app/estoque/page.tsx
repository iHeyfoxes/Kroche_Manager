'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/utils';
import { Material, CategoriaProduto, Produto } from '@/types/database';
import ProductSpreadsheetImport from '@/components/ProductSpreadsheetImport';

export default function EstoquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modo, setModo] = useState<'manual' | 'planilha'>('manual');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [busca, setBusca] = useState('');

  // Form states (Cadastro Novo)
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidade, setUnidade] = useState('unidade');
  const [quantidade, setQuantidade] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState('0');
  const [custoUnitario, setCustoUnitario] = useState('0');
  const [fornecedor, setFornecedor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Form states (Modal de Edição)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editUnidade, setEditUnidade] = useState('unidade');
  const [editQuantidade, setEditQuantidade] = useState('0');
  const [editEstoqueMinimo, setEditEstoqueMinimo] = useState('0');
  const [editCustoUnitario, setEditCustoUnitario] = useState('0');
  const [editFornecedor, setEditFornecedor] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  const loadMateriais = async () => {
    if (!user) return;
    const [matRes, catRes, prodRes] = await Promise.all([
      supabase.from('materiais').select('*').eq('usuario_id', user.id).order('nome'),
      supabase.from('categorias_produtos').select('*').eq('usuario_id', user.id).order('nome'),
      supabase.from('produtos').select('*').eq('usuario_id', user.id).order('nome'),
    ]);

    if (matRes.error) {
      setMsg({ tipo: 'err', texto: matRes.error.message });
    } else {
      setMateriais(matRes.data || []);
    }
    if (catRes.data) setCategorias(catRes.data);
    if (prodRes.data) setProdutos(prodRes.data);
  };

  useEffect(() => {
    if (user) loadMateriais();
  }, [user]);

  const resetMaterialForm = () => {
    setNome('');
    setCategoria('');
    setUnidade('unidade');
    setQuantidade('0');
    setEstoqueMinimo('0');
    setCustoUnitario('0');
    setFornecedor('');
    setObservacoes('');
  };

  const handleEditClick = (m: Material) => {
    setEditingMaterial(m);
    setEditNome(m.nome);
    setEditCategoria(m.categoria || '');
    setEditUnidade(m.unidade || 'unidade');
    setEditQuantidade(String(m.quantidade));
    setEditEstoqueMinimo(String(m.estoque_minimo || 0));
    setEditCustoUnitario(String(m.custo_unitario || 0));
    setEditFornecedor(m.fornecedor || '');
    setEditObservacoes(m.observacoes || '');
    setIsEditModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    const { error } = await supabase.from('materiais').insert({
      usuario_id: user.id,
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      unidade,
      quantidade: Number(quantidade || 0),
      estoque_minimo: Number(estoqueMinimo || 0),
      custo_unitario: Number(custoUnitario || 0),
      fornecedor: fornecedor.trim() || null,
      observacoes: observacoes.trim() || null,
    });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Material cadastrado com sucesso no estoque!' });
      resetMaterialForm();
      loadMateriais();
    }
    setSubmitting(false);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingMaterial) return;

    setEditSubmitting(true);
    setMsg(null);

    try {
      const { error } = await supabase
        .from('materiais')
        .update({
          nome: editNome.trim(),
          categoria: editCategoria.trim() || null,
          unidade: editUnidade,
          quantidade: Number(editQuantidade || 0),
          estoque_minimo: Number(editEstoqueMinimo || 0),
          custo_unitario: Number(editCustoUnitario || 0),
          fornecedor: editFornecedor.trim() || null,
          observacoes: editObservacoes.trim() || null,
        })
        .eq('id', editingMaterial.id)
        .eq('usuario_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Sincroniza com produto vinculado se houver
      try {
        await supabase
          .from('produtos')
          .update({
            nome: editNome.trim(),
            preco: Number(editCustoUnitario || 0),
            quantidade: Number(editQuantidade || 0),
            estoque_minimo: Number(editEstoqueMinimo || 0),
            categoria: editCategoria.trim() || null,
          })
          .eq('usuario_id', user.id)
          .ilike('nome', editingMaterial.nome);
      } catch (syncErr) {
        console.warn('Erro ao sincronizar produto:', syncErr);
      }

      setMsg({ tipo: 'ok', texto: 'Item do estoque atualizado com sucesso!' });
      setIsEditModalOpen(false);
      setEditingMaterial(null);
      loadMateriais();
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao atualizar item do estoque.' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir este material do estoque?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Material excluído com sucesso!' });
      loadMateriais();
    }
  };

  const lowStockCount = materiais.filter(
    (m) => Number(m.quantidade) <= Number(m.estoque_minimo)
  ).length;

  const totalValue = materiais.reduce(
    (acc, m) => acc + Number(m.quantidade || 0) * Number(m.custo_unitario || 0),
    0
  );

  const filtrados = useMemo(() => {
    const term = busca.toLowerCase().trim();
    if (!term) return materiais;
    return materiais.filter(
      (m) =>
        m.nome.toLowerCase().includes(term) ||
        (m.categoria && m.categoria.toLowerCase().includes(term))
    );
  }, [materiais, busca]);

  return (
    <AppShell title="Estoque">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <section className="dashboard-hero">
        <div>
          <span className="page-kicker">CONTROLE DE ESTOQUE & INSUMOS</span>
          <h2>Seus produtos, peças e insumos em um só lugar.</h2>
          <p>Acompanhe quantidades disponíveis, custo unitário, estoque mínimo e alertas de reposição.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setModo('planilha');
              const el = document.getElementById('novo-material');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            📊 Importar Planilha
          </button>
          <a
            className="btn btn-primary"
            href="#novo-material"
            onClick={() => setModo('manual')}
          >
            + Novo item manual
          </a>
        </div>
      </section>

      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div>
            <span className="muted">Total de itens</span>
            <strong>{materiais.length}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: lowStockCount > 0 ? '#b3261e' : 'inherit' }}>
            ⚠️
          </div>
          <div>
            <span className="muted">Abaixo do estoque mínimo</span>
            <strong style={{ color: lowStockCount > 0 ? '#b3261e' : 'inherit' }}>
              {lowStockCount}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div>
            <span className="muted">Capital em estoque</span>
            <strong>{formatMoney(totalValue)}</strong>
          </div>
        </div>
      </div>

      <div className="card" id="novo-material">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INVENTÁRIO</span>
            <h3>
              {modo === 'planilha'
                ? 'Auto-Cadastro de Estoque via Planilha'
                : 'Cadastrar item no estoque'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn btn-sm ${modo === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModo('manual')}
            >
              ✏️ Cadastro Manual
            </button>
            <button
              type="button"
              className={`btn btn-sm ${modo === 'planilha' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModo('planilha')}
            >
              📊 Importar Planilha
            </button>
          </div>
        </div>

        {modo === 'planilha' ? (
          <ProductSpreadsheetImport
            userId={user?.id || ''}
            categoriasExistentes={categorias}
            produtosExistentes={produtos}
            onSuccess={(res) => {
              setMsg({
                tipo: 'ok',
                texto: `Importação realizada com sucesso! ${res.cadastrados} produto(s) cadastrado(s), ${res.atualizados} atualizado(s) e sincronizados no estoque!`,
              });
              setModo('manual');
              loadMateriais();
            }}
            onCancel={() => setModo('manual')}
          />
        ) : (
          <form onSubmit={handleSalvar} className="grid grid-3">
            <div>
              <label className="label">Nome do Item / Insumo *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="Ex.: Armação Acetato, Lente BlueCut, Estojo, Peça"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: Armações, Lentes, Acessórios, Embalagens..."
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Unidade de Medida</label>
              <select
                className="select"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
              >
                <option value="unidade">unidade</option>
                <option value="par">par</option>
                <option value="caixa">caixa</option>
                <option value="pacote">pacote</option>
                <option value="metro">metro</option>
                <option value="grama">grama</option>
                <option value="rolo">rolo</option>
                <option value="litro">litro</option>
              </select>
            </div>

            <div>
              <label className="label">Quantidade Atual</label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="input"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="input"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Custo Unitário (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Fornecedor</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: Distribuidora X"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Observações</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Cor, lote, espessura..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <div className="actions" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end', display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Material'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INVENTÁRIO</span>
            <h3>Materiais e produtos cadastrados</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setModo('planilha');
                const el = document.getElementById('novo-material');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              📥 Subir Planilha de Estoque
            </button>
            <div style={{ width: '240px' }}>
              <input
                type="search"
                className="input"
                placeholder="Buscar material ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Custo Unit.</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? (
                filtrados.map((m) => {
                  const precisaRepor = Number(m.quantidade) <= Number(m.estoque_minimo);
                  return (
                    <tr key={m.id}>
                      <td>
                        <b>{m.nome}</b>
                        {m.fornecedor && (
                          <div>
                            <small className="muted">{m.fornecedor}</small>
                          </div>
                        )}
                      </td>
                      <td>{m.categoria || '—'}</td>
                      <td>
                        <b>
                          {Number(m.quantidade)} {m.unidade}
                        </b>
                      </td>
                      <td>{formatMoney(m.custo_unitario)}</td>
                      <td>
                        <span className={`pill ${precisaRepor ? 'danger' : 'success'}`}>
                          {precisaRepor ? 'Repor' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditClick(m)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleExcluir(m.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    Nenhum material encontrado no estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editingMaterial && (
        <div
          className="orcamento-modal-overlay"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="orcamento-modal-container"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="orcamento-modal-header">
              <div className="orcamento-modal-title">
                <span style={{ fontSize: '20px' }}>✏️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                    Editar Item do Estoque
                  </h3>
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Alterando dados de <b>{editingMaterial.nome}</b>
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} style={{ padding: '24px' }}>
              <div className="grid grid-2" style={{ gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nome do Item / Insumo *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="Ex.: Armação Acetato, Lente BlueCut, Estojo"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Categoria</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex.: Armações, Lentes, Acessórios..."
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Unidade de Medida</label>
                  <select
                    className="select"
                    value={editUnidade}
                    onChange={(e) => setEditUnidade(e.target.value)}
                  >
                    <option value="unidade">unidade</option>
                    <option value="par">par</option>
                    <option value="caixa">caixa</option>
                    <option value="pacote">pacote</option>
                    <option value="metro">metro</option>
                    <option value="grama">grama</option>
                    <option value="rolo">rolo</option>
                    <option value="litro">litro</option>
                  </select>
                </div>

                <div>
                  <label className="label">Quantidade Atual</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="input"
                    value={editQuantidade}
                    onChange={(e) => setEditQuantidade(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="input"
                    value={editEstoqueMinimo}
                    onChange={(e) => setEditEstoqueMinimo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={editCustoUnitario}
                    onChange={(e) => setEditCustoUnitario(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Fornecedor</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex.: Distribuidora X"
                    value={editFornecedor}
                    onChange={(e) => setEditFornecedor(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Observações</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Cor, lote, espessura..."
                    value={editObservacoes}
                    onChange={(e) => setEditObservacoes(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--borda)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
