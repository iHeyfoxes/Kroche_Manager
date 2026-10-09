'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/utils';
import { Material } from '@/types/database';

export default function EstoquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [materiais, setMateriais] = useState<Material[]>([]);
  const [busca, setBusca] = useState('');

  // Form states
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

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadMateriais = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nome');

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMateriais(data || []);
    }
  };

  useEffect(() => {
    if (user) loadMateriais();
  }, [user]);

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
      setMsg({ tipo: 'ok', texto: 'Material cadastrado com sucesso!' });
      setNome('');
      setCategoria('');
      setUnidade('unidade');
      setQuantidade('0');
      setEstoqueMinimo('0');
      setCustoUnitario('0');
      setFornecedor('');
      setObservacoes('');
      loadMateriais();
    }
    setSubmitting(false);
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
        <a className="btn btn-primary" href="#novo-material">
          + Novo item / insumo
        </a>
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
            <h3>Cadastrar item no estoque</h3>
          </div>
        </div>

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

          <div className="actions" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Material'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INVENTÁRIO</span>
            <h3>Materiais cadastrados</h3>
          </div>
          <div style={{ width: '260px' }}>
            <input
              type="search"
              className="input"
              placeholder="Buscar material ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
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
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleExcluir(m.id)}
                        >
                          Excluir
                        </button>
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
    </AppShell>
  );
}
