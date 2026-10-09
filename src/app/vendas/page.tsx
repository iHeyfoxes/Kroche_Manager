'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Venda } from '@/types/database';

export default function VendasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<{ id: number; nome: string; preco: number }[]>([]);
  const [cliente, setCliente] = useState('');
  const [produto, setProduto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [valor, setValor] = useState('');
  const [busca, setBusca] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    const [vendasRes, prodRes] = await Promise.all([
      supabase.from('vendas').select('*').eq('user_id', user.id).order('data', { ascending: false }),
      supabase.from('produtos').select('id, nome, preco').eq('usuario_id', user.id).order('nome'),
    ]);

    if (vendasRes.error) {
      setMsg({ tipo: 'err', texto: vendasRes.error.message });
    } else {
      setVendas(vendasRes.data || []);
    }

    if (prodRes.data) {
      setProdutos(prodRes.data);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleSelectProduto = (prodNome: string) => {
    setProduto(prodNome);
    const found = produtos.find((p) => p.nome.toLowerCase() === prodNome.toLowerCase());
    if (found && !valor) {
      setValor(String(found.preco));
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    const descFinal = formaPagamento ? `${produto.trim()} (${formaPagamento})` : produto.trim();

    const { error } = await supabase.from('vendas').insert({
      cliente: cliente.trim(),
      produto: descFinal,
      valor: Number(valor),
      user_id: user.id,
    });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Venda registrada com sucesso!' });
      setCliente('');
      setProduto('');
      setValor('');
      loadData();
    }
    setSubmitting(false);
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir esta venda?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Venda excluída com sucesso!' });
      loadData();
    }
  };

  const total = vendas.reduce((acc, v) => acc + Number(v.valor || 0), 0);

  const vendasFiltradas = vendas.filter((v) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (v.cliente && v.cliente.toLowerCase().includes(q)) ||
      (v.produto && v.produto.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell title="Vendas">
      {msg && (
        <div className={`alert ${msg.tipo}`}>
          {msg.texto}
        </div>
      )}

      <div className="card">
        <h3>Registrar venda</h3>
        <form onSubmit={handleSalvar} className="grid grid-4">
          <div>
            <label className="label">Cliente *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Nome do cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Produto ou Serviço *</label>
            <input
              type="text"
              className="input"
              required
              list="produtos-cadastrados"
              placeholder="Ex.: Armação, Lentes, Produto ou Serviço"
              value={produto}
              onChange={(e) => handleSelectProduto(e.target.value)}
            />
            {produtos.length > 0 && (
              <datalist id="produtos-cadastrados">
                {produtos.map((p) => (
                  <option key={p.id} value={p.nome}>
                    {formatMoney(p.preco)}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="label">Forma de Pagamento</label>
            <select
              className="select"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="A Prazo / Boleto">A Prazo / Boleto</option>
            </select>
          </div>

          <div>
            <label className="label">Valor (R$) *</label>
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

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Venda'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">HISTÓRICO COMERCIAL</span>
            <h3>Vendas registradas</h3>
          </div>
          <span className="pill" style={{ fontSize: '14px', fontWeight: 800 }}>
            Total: {formatMoney(total)}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="search"
            className="input"
            placeholder="🔍 Filtrar por cliente ou produto..."
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
                <th>Cliente</th>
                <th>Produto / Descrição</th>
                <th>Valor</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.length > 0 ? (
                vendasFiltradas.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDate(v.data)}</td>
                    <td><b>{v.cliente}</b></td>
                    <td>{v.produto}</td>
                    <td><b>{formatMoney(v.valor)}</b></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/vendas/${v.id}/editar`}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExcluir(v.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    {vendas.length === 0 ? 'Nenhuma venda registrada ainda.' : 'Nenhuma venda encontrada para esta busca.'}
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
