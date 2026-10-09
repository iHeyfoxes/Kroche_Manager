'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Compra } from '@/types/database';

export default function ComprasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [material, setMaterial] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadCompras = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setCompras(data || []);
    }
  };

  useEffect(() => {
    if (user) loadCompras();
  }, [user]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    // Try RPC first (to automatically update stock)
    try {
      const r = await supabase.rpc('registrar_compra_estoque', {
        p_material: material.trim(),
        p_fornecedor: fornecedor.trim(),
        p_quantidade: Number(quantidade),
        p_valor: Number(valor),
      });

      if (!r.error && r.data?.sucesso) {
        setMsg({ tipo: 'ok', texto: 'Compra registrada e estoque atualizado com sucesso!' });
        setMaterial('');
        setFornecedor('');
        setQuantidade('1');
        setValor('');
        loadCompras();
        setSubmitting(false);
        return;
      }
    } catch {
      // Fallback to direct table insertion if RPC is not present
    }

    // Direct insertion fallback
    const { error } = await supabase.from('compras').insert({
      material: material.trim(),
      fornecedor: fornecedor.trim(),
      quantidade: Number(quantidade),
      valor: Number(valor),
      user_id: user.id,
    });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Compra registrada com sucesso!' });
      setMaterial('');
      setFornecedor('');
      setQuantidade('1');
      setValor('');
      loadCompras();
    }
    setSubmitting(false);
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir esta compra?')) return;
    if (!user) return;

    // Try RPC deletion first
    try {
      const r = await supabase.rpc('excluir_compra_estoque', { p_compra_id: id });
      if (!r.error && r.data?.sucesso) {
        setMsg({ tipo: 'ok', texto: 'Compra excluída e estoque ajustado!' });
        loadCompras();
        return;
      }
    } catch {
      // Fallback
    }

    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Compra excluída com sucesso!' });
      loadCompras();
    }
  };

  const total = compras.reduce((acc, c) => acc + Number(c.valor || 0), 0);

  const [busca, setBusca] = useState('');

  const comprasFiltradas = compras.filter((c) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (c.material && c.material.toLowerCase().includes(q)) ||
      (c.fornecedor && c.fornecedor.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell title="Compras & Custos">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card">
        <h3>Registrar compra / despesa</h3>
        <form onSubmit={handleSalvar} className="grid grid-4">
          <div>
            <label className="label">Item / Insumo / Mercadoria *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Lote Armações, Lentes, Peças, Embalagens"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Fornecedor</label>
            <input
              type="text"
              className="input"
              placeholder="Ex.: Distribuidora, Fabricante, Luxottica..."
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Quantidade *</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Valor Total (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              required
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              Ao registrar uma compra, os custos são integrados ao financeiro e o estoque pode ser atualizado.
            </p>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Compra'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">HISTÓRICO FINANCEIRO</span>
            <h3>Compras e despesas registradas</h3>
          </div>
          <span className="pill" style={{ fontSize: '14px', fontWeight: 800 }}>
            Total: {formatMoney(total)}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="search"
            className="input"
            placeholder="🔍 Filtrar por item ou fornecedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ maxWidth: '360px' }}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Item / Insumo</th>
                <th>Fornecedor</th>
                <th>Qtd.</th>
                <th>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.length > 0 ? (
                comprasFiltradas.map((c) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.data)}</td>
                    <td><b>{c.material}</b></td>
                    <td>{c.fornecedor || '—'}</td>
                    <td>{c.quantidade}</td>
                    <td><b>{formatMoney(c.valor)}</b></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExcluir(c.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    {compras.length === 0 ? 'Nenhuma compra registrada ainda.' : 'Nenhuma compra encontrada para esta busca.'}
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
