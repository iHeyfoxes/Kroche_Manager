'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Venda } from '@/types/database';

interface ProdutoItem {
  id: number;
  nome: string;
  preco: number;
  quantidade?: number;
  estoque_minimo?: number;
}

export default function VendasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);

  // Form states
  const [cliente, setCliente] = useState('');
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [produto, setProduto] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [quantidade, setQuantidade] = useState('1');
  const [valor, setValor] = useState('');
  const [darBaixaEstoque, setDarBaixaEstoque] = useState(true);
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [busca, setBusca] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    const [vendasRes, prodRes] = await Promise.all([
      supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false }),
      supabase
        .from('produtos')
        .select('id, nome, preco, quantidade, estoque_minimo')
        .eq('usuario_id', user.id)
        .order('nome'),
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

  const resetForm = () => {
    setEditingVenda(null);
    setCliente('');
    setSelectedProdId('');
    setProduto('');
    setPrecoUnitario('');
    setQuantidade('1');
    setValor('');
    setDarBaixaEstoque(true);
    setFormaPagamento('Pix');
  };

  const handleSelectProduto = (prodIdStr: string) => {
    setSelectedProdId(prodIdStr);

    if (!prodIdStr) {
      setProduto('');
      setPrecoUnitario('');
      setValor('');
      return;
    }

    if (prodIdStr === '__manual__') {
      setProduto('');
      setPrecoUnitario('');
      return;
    }

    const found = produtos.find((p) => String(p.id) === prodIdStr);
    if (found) {
      setProduto(found.nome);
      setPrecoUnitario(String(found.preco));
      const qtdNum = Number(quantidade) > 0 ? Number(quantidade) : 1;
      setValor((qtdNum * Number(found.preco || 0)).toFixed(2));
    }
  };

  const handleQuantidadeChange = (novaQtd: string) => {
    setQuantidade(novaQtd);
    const qtdNum = Number(novaQtd);
    if (precoUnitario && !isNaN(qtdNum) && qtdNum >= 0) {
      setValor((qtdNum * Number(precoUnitario)).toFixed(2));
    }
  };

  const handleEditClick = (v: Venda) => {
    setEditingVenda(v);
    setCliente(v.cliente);
    setProduto(v.produto);
    setValor(String(v.valor));
    setSelectedProdId('__manual__');
    setPrecoUnitario('');
    setQuantidade('1');
    setDarBaixaEstoque(false); // Não dá baixa dupla ao apenas editar texto/valor
    setMsg(null);

    const el = document.getElementById('card-form-venda');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedProdutoObj = produtos.find(
    (p) => String(p.id) === selectedProdId || (p.nome && p.nome.toLowerCase() === produto.trim().toLowerCase())
  );

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    try {
      if (editingVenda) {
        // Atualização de venda existente
        const { error } = await supabase
          .from('vendas')
          .update({
            cliente: cliente.trim(),
            produto: produto.trim(),
            valor: Number(valor),
          })
          .eq('id', editingVenda.id)
          .eq('user_id', user.id);

        if (error) {
          setMsg({ tipo: 'err', texto: error.message });
        } else {
          setMsg({ tipo: 'ok', texto: 'Venda atualizada com sucesso!' });
          resetForm();
          loadData();
        }
      } else {
        // Nova venda
        const qtdNum = Number(quantidade) > 0 ? Number(quantidade) : 1;
        const nomeFinal = produto.trim();
        const descFinal = `${nomeFinal}${qtdNum > 1 ? ` (x${qtdNum})` : ''}${formaPagamento ? ` - ${formaPagamento}` : ''}`;

        const { error: insertError } = await supabase.from('vendas').insert({
          cliente: cliente.trim(),
          produto: descFinal,
          valor: Number(valor),
          user_id: user.id,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Dar baixa no estoque se solicitado e produto selecionado/encontrado
        let baixaRealizada = false;
        if (darBaixaEstoque && selectedProdutoObj) {
          const qtdAtualProd = Number(selectedProdutoObj.quantidade || 0);
          const novaQtdProd = Math.max(0, qtdAtualProd - qtdNum);

          // 1. Baixa na tabela produtos
          await supabase
            .from('produtos')
            .update({ quantidade: novaQtdProd })
            .eq('id', selectedProdutoObj.id)
            .eq('usuario_id', user.id);

          // 2. Baixa na tabela materiais (Estoque de Insumos/Produtos)
          const { data: mats } = await supabase
            .from('materiais')
            .select('id, quantidade')
            .eq('usuario_id', user.id)
            .ilike('nome', selectedProdutoObj.nome);

          if (mats && mats.length > 0) {
            for (const m of mats) {
              const novaQtdMat = Math.max(0, Number(m.quantidade || 0) - qtdNum);
              await supabase
                .from('materiais')
                .update({ quantidade: novaQtdMat })
                .eq('id', m.id)
                .eq('usuario_id', user.id);
            }
          }

          baixaRealizada = true;
        }

        setMsg({
          tipo: 'ok',
          texto: `Venda registrada com sucesso! ${
            baixaRealizada
              ? `Baixa de ${quantidade} un. efetuada no estoque.`
              : ''
          }`,
        });

        resetForm();
        loadData();
      }
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao registrar venda.' });
    } finally {
      setSubmitting(false);
    }
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
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card" id="card-form-venda">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">FRENTE DE VENDAS</span>
            <h3>{editingVenda ? `Editar venda #${editingVenda.id}` : 'Registrar nova venda'}</h3>
          </div>
          {editingVenda && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              Cancelar Edição
            </button>
          )}
        </div>

        {editingVenda && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>Alterando venda:</strong> {editingVenda.cliente} — {editingVenda.produto}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              Cancelar
            </button>
          </div>
        )}

        <form onSubmit={handleSalvar} className="grid grid-3">
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
            <label className="label">Selecionar Produto Cadastrado</label>
            <select
              className="select"
              value={selectedProdId}
              onChange={(e) => handleSelectProduto(e.target.value)}
            >
              <option value="">-- Selecionar da lista de produtos --</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatMoney(p.preco)} (Estoque: {p.quantidade ?? 0} un.)
                </option>
              ))}
              <option value="__manual__">✍️ Outro produto / serviço avulso...</option>
            </select>
          </div>

          <div>
            <label className="label">Nome do Produto / Descrição *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Armação Acetato, Óculos Solar, Ajuste"
              value={produto}
              onChange={(e) => {
                setProduto(e.target.value);
                if (selectedProdId !== '__manual__' && selectedProdId !== '') {
                  setSelectedProdId('__manual__');
                }
              }}
            />
          </div>

          <div>
            <label className="label">Quantidade (unidades) *</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              required
              value={quantidade}
              onChange={(e) => handleQuantidadeChange(e.target.value)}
            />
            {selectedProdutoObj && (
              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  color:
                    Number(selectedProdutoObj.quantidade || 0) < Number(quantidade)
                      ? '#b3261e'
                      : 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                📦 Estoque atual: {selectedProdutoObj.quantidade ?? 0} un.
                {Number(selectedProdutoObj.quantidade || 0) < Number(quantidade) && (
                  <span> (⚠️ Quantidade maior que estoque!)</span>
                )}
              </small>
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
            <label className="label">Valor Total da Venda (R$) *</label>
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
            {precoUnitario && Number(quantidade) > 1 && (
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                Unitário: {formatMoney(Number(precoUnitario))} x {quantidade}
              </small>
            )}
          </div>

          {!editingVenda && selectedProdutoObj && (
            <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={darBaixaEstoque}
                  onChange={(e) => setDarBaixaEstoque(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <span>
                  Dar baixa automática de <b>{quantidade} un.</b> no estoque do produto ({selectedProdutoObj.nome})
                </span>
              </label>
            </div>
          )}

          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            {editingVenda && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? 'Salvando...'
                : editingVenda
                ? 'Salvar Alterações'
                : 'Salvar Venda'}
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
                    <td>
                      <b>{v.cliente}</b>
                    </td>
                    <td>{v.produto}</td>
                    <td>
                      <b>{formatMoney(v.valor)}</b>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditClick(v)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleExcluir(v.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    {vendas.length === 0
                      ? 'Nenhuma venda registrada ainda.'
                      : 'Nenhuma venda encontrada para esta busca.'}
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

