'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Encomenda, PedidoItem } from '@/types/database';

export default function EncomendasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [pedidoItens, setPedidoItens] = useState<Record<number, PedidoItem[]>>({});
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');

  // Form states
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [sinal, setSinal] = useState('0');
  const [dataEntrega, setDataEntrega] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadEncomendas = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('encomendas')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
      return;
    }

    setEncomendas(data || []);

    // Load catalog items for orders that came from the catalog
    const catalogIds = (data || [])
      .map((x) => x.pedido_catalogo_id)
      .filter((id): id is number => typeof id === 'number');

    if (catalogIds.length > 0) {
      const { data: itens } = await supabase
        .from('pedido_itens')
        .select('*')
        .in('pedido_id', catalogIds)
        .order('id');

      if (itens) {
        const grouped: Record<number, PedidoItem[]> = {};
        itens.forEach((item: PedidoItem) => {
          if (!grouped[item.pedido_id]) grouped[item.pedido_id] = [];
          grouped[item.pedido_id].push(item);
        });
        setPedidoItens(grouped);
      }
    }
  };

  useEffect(() => {
    if (user) loadEncomendas();
  }, [user]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    const { error } = await supabase.from('encomendas').insert({
      cliente: cliente.trim(),
      telefone: telefone.trim() || null,
      produto: produto.trim(),
      valor: Number(valor),
      sinal: Number(sinal || 0),
      data_entrega: dataEntrega || null,
      status,
      observacoes: observacoes.trim() || null,
      user_id: user.id,
    });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Encomenda registrada com sucesso!' });
      setCliente('');
      setTelefone('');
      setProduto('');
      setValor('');
      setSinal('0');
      setDataEntrega('');
      setStatus('Pendente');
      setObservacoes('');
      loadEncomendas();
    }
    setSubmitting(false);
  };

  const handleCancelarPedido = async (pedidoId: number) => {
    if (!confirm('Deseja cancelar este pedido do catálogo? O estoque dos produtos será devolvido.')) return;
    try {
      const r = await supabase.rpc('cancelar_pedido_catalogo', { p_pedido_id: pedidoId });
      if (r.error || !r.data?.sucesso) {
        setMsg({ tipo: 'err', texto: r.error?.message || 'Não foi possível cancelar o pedido.' });
        return;
      }
      setMsg({ tipo: 'ok', texto: 'Pedido cancelado e estoque devolvido com sucesso!' });
      loadEncomendas();
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao cancelar pedido.' });
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir esta encomenda?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('encomendas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Encomenda excluída com sucesso!' });
      loadEncomendas();
    }
  };

  const filtradas = useMemo(() => {
    return encomendas.filter((x) => {
      const texto = [x.cliente, x.telefone, x.produto].join(' ').toLowerCase();
      const matchBusca = !busca || texto.includes(busca.toLowerCase());
      const matchStatus = !filtroStatus || x.status === filtroStatus;
      const isCatalogo = !!x.pedido_catalogo_id;
      const matchOrigem =
        !filtroOrigem ||
        (filtroOrigem === 'catalogo' ? isCatalogo : !isCatalogo);
      return matchBusca && matchStatus && matchOrigem;
    });
  }, [encomendas, busca, filtroStatus, filtroOrigem]);

  return (
    <AppShell title="Ordens de Serviço & Encomendas">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card">
        <h3>Nova ordem / encomenda</h3>
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
            <label className="label">Telefone / WhatsApp</label>
            <input
              type="text"
              className="input"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Produto / Serviço / Armação *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Armação + Lente Multifocal / Pedido Especial"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
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

          <div>
            <label className="label">Sinal / Entrada (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={sinal}
              onChange={(e) => setSinal(e.target.value)}
            />
            {Number(valor) > 0 && Number(sinal) > 0 && (
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                Restante a pagar: <b>{formatMoney(Math.max(0, Number(valor) - Number(sinal)))}</b>
              </small>
            )}
          </div>

          <div>
            <label className="label">Data de Entrega / Previsão</label>
            <input
              type="date"
              className="input"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Pendente</option>
              <option>Confirmado</option>
              <option>Em laboratório / Produção</option>
              <option>Pronto para retirada</option>
              <option>Entregue / Concluído</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Observações Técnicas / Prescrição</label>
            <input
              type="text"
              className="input"
              placeholder="Grau, laboratório parceiro, código da armação, prazo, detalhes da entrega..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Ordem / Encomenda'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="panel-heading" style={{ flexWrap: 'wrap' }}>
          <div>
            <span className="panel-kicker">PEDIDOS</span>
            <h3>Histórico de encomendas</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="search"
              className="input"
              placeholder="Buscar cliente ou produto..."
              style={{ width: '220px' }}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select
              className="select"
              style={{ width: '180px' }}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option>Pendente</option>
              <option>Confirmado</option>
              <option>Em laboratório / Produção</option>
              <option>Pronto para retirada</option>
              <option>Entregue / Concluído</option>
              <option>Cancelado</option>
            </select>
            <select
              className="select"
              style={{ width: '150px' }}
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
            >
              <option value="">Todas origens</option>
              <option value="catalogo">Catálogo</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido / Data</th>
                <th>Cliente</th>
                <th>Produto / Itens</th>
                <th>Valor & Saldo</th>
                <th>Previsão</th>
                <th>Status</th>
                <th>Origem</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length > 0 ? (
                filtradas.map((enc) => {
                  const isCat = !!enc.pedido_catalogo_id;
                  const itensList = isCat && enc.pedido_catalogo_id ? pedidoItens[enc.pedido_catalogo_id] : null;
                  const saldoPagar = Number(enc.valor || 0) - Number(enc.sinal || 0);

                  return (
                    <tr key={enc.id}>
                      <td>
                        {isCat && <strong>#{enc.pedido_catalogo_id} </strong>}
                        <br />
                        <small className="muted">{formatDate(enc.data)}</small>
                      </td>
                      <td>
                        <b>{enc.cliente}</b>
                        {enc.telefone && (
                          <div style={{ marginTop: '2px' }}>
                            <a
                              href={`https://wa.me/${enc.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <span>💬</span> {enc.telefone}
                            </a>
                          </div>
                        )}
                      </td>
                      <td>
                        <b>{enc.produto}</b>
                        {itensList && itensList.length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                            {itensList.map((it, i) => (
                              <div key={i}>
                                {it.nome_produto} x{it.quantidade} — {formatMoney(it.subtotal)}
                              </div>
                            ))}
                          </div>
                        )}
                        {enc.observacoes && (
                          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                            Nota: {enc.observacoes}
                          </div>
                        )}
                      </td>
                      <td>
                        <b>{formatMoney(enc.valor)}</b>
                        {Number(enc.sinal) > 0 ? (
                          <div style={{ fontSize: '12px', marginTop: '2px' }}>
                            <span className="muted">Sinal: {formatMoney(enc.sinal)}</span>
                            {saldoPagar > 0 && (
                              <div style={{ color: '#b45309', fontWeight: 700 }}>
                                Resta: {formatMoney(saldoPagar)}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {enc.data_entrega ? (
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>
                            {formatDate(enc.data_entrega)}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`pill ${enc.status?.includes('Entregue') ? 'success' : enc.status === 'Cancelado' ? 'danger' : ''}`}>
                          {enc.status || 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${isCat ? 'success' : ''}`}>
                          {isCat ? 'Catálogo' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/encomendas/${enc.id}/editar`}
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '6px' }}
                        >
                          Editar
                        </Link>
                        {isCat && enc.status !== 'Cancelado' ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelarPedido(enc.pedido_catalogo_id!)}
                          >
                            Cancelar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleExcluir(enc.id)}
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    Nenhuma encomenda encontrada.
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
