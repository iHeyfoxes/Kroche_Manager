'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Encomenda, PedidoItem } from '@/types/database';

interface ProdutoItem {
  id: number;
  nome: string;
  preco: number;
  quantidade?: number;
  estoque_minimo?: number;
}

export default function EncomendasPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [pedidoItens, setPedidoItens] = useState<Record<number, PedidoItem[]>>({});
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [editingEncomenda, setEditingEncomenda] = useState<Encomenda | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');

  // Form states
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [produto, setProduto] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [quantidade, setQuantidade] = useState('1');
  const [valor, setValor] = useState('');
  const [sinal, setSinal] = useState('0');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [dataEntrega, setDataEntrega] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [observacoes, setObservacoes] = useState('');
  const [darBaixaEstoque, setDarBaixaEstoque] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    const [encRes, prodRes] = await Promise.all([
      supabase
        .from('encomendas')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false }),
      supabase
        .from('produtos')
        .select('id, nome, preco, quantidade, estoque_minimo')
        .eq('usuario_id', user.id)
        .order('nome'),
    ]);

    if (encRes.error) {
      setMsg({ tipo: 'err', texto: encRes.error.message });
      return;
    }

    setEncomendas(encRes.data || []);

    if (prodRes.data) {
      setProdutos(prodRes.data);
    }

    // Load catalog items for orders that came from the catalog
    const catalogIds = (encRes.data || [])
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
    if (user) loadData();
  }, [user]);

  const resetForm = () => {
    setEditingEncomenda(null);
    setCliente('');
    setTelefone('');
    setSelectedProdId('');
    setProduto('');
    setPrecoUnitario('');
    setQuantidade('1');
    setValor('');
    setSinal('0');
    setFormaPagamento('Pix');
    setDataEntrega('');
    setStatus('Pendente');
    setObservacoes('');
    setDarBaixaEstoque(true);
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

  const selectedProdutoObj = produtos.find(
    (p) => String(p.id) === selectedProdId || (p.nome && p.nome.toLowerCase() === produto.trim().toLowerCase())
  );

  const handleEditClick = (enc: Encomenda) => {
    setEditingEncomenda(enc);
    setCliente(enc.cliente);
    setTelefone(enc.telefone || '');
    setProduto(enc.produto);
    setValor(String(enc.valor));
    setSinal(String(enc.sinal || 0));
    setDataEntrega(enc.data_entrega || '');
    setStatus(enc.status || 'Pendente');

    // Extrai a forma de pagamento das observações se houver
    const obsVal = enc.observacoes || '';
    const matchPag = obsVal.match(/\[Pagamento:\s*([^\]]+)\]/i);
    if (matchPag) {
      setFormaPagamento(matchPag[1].trim());
      setObservacoes(obsVal.replace(/\[Pagamento:\s*[^\]]+\]\s*/i, '').trim());
    } else {
      const matchOld = obsVal.match(/Pagamento:\s*([^|;\n]+)/i);
      if (matchOld) {
        setFormaPagamento(matchOld[1].trim());
        setObservacoes(obsVal.replace(/Pagamento:\s*[^|;\n]+(\s*\|\s*)?/i, '').trim());
      } else {
        setFormaPagamento('Pix');
        setObservacoes(obsVal);
      }
    }

    setSelectedProdId('__manual__');
    setPrecoUnitario('');
    setQuantidade('1');
    setDarBaixaEstoque(false);
    setMsg(null);

    const el = document.getElementById('card-form-encomenda');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWhatsAppUrl = (enc: Encomenda) => {
    if (!enc.telefone) return '#';

    const cleanPhone = enc.telefone.replace(/\D/g, '');
    const zapNum =
      cleanPhone.length <= 11 && !cleanPhone.startsWith('55')
        ? `55${cleanPhone}`
        : cleanPhone;

    const saldoPagar = Math.max(0, Number(enc.valor || 0) - Number(enc.sinal || 0));
    const itens = enc.pedido_catalogo_id ? pedidoItens[enc.pedido_catalogo_id] : null;
    const businessName = profile?.catalogo_nome || 'Nossa Empresa';

    // Extrai forma de pagamento das observações se houver
    let formaPag = '';
    const matchPag =
      enc.observacoes?.match(/\[Pagamento:\s*([^\]]+)\]/i) ||
      enc.observacoes?.match(/Pagamento:\s*([^|;\n]+)/i);
    if (matchPag) {
      formaPag = matchPag[1].trim();
    }

    const linhas: string[] = [
      `👋 Olá, *${enc.cliente.trim()}*! Tudo bem?`,
      `Aqui é da equipe *${businessName}* referente à sua Ordem de Serviço / Encomenda${
        enc.pedido_catalogo_id ? ` *#${enc.pedido_catalogo_id}*` : ''
      }.`,
      '',
      `📋 *Detalhes da Encomenda:*`,
      `• *Cliente:* ${enc.cliente}`,
      `• *Item / Serviço:* ${enc.produto}`,
    ];

    if (itens && itens.length > 0) {
      linhas.push(`• *Itens do Pedido:*`);
      itens.forEach((it) => {
        linhas.push(`   - ${it.nome_produto} x${it.quantidade} (${formatMoney(it.subtotal)})`);
      });
    }

    linhas.push(`• *Valor Total:* ${formatMoney(enc.valor)}`);

    if (Number(enc.sinal) > 0) {
      linhas.push(`• *Sinal / Entrada:* ${formatMoney(enc.sinal)}`);
      if (saldoPagar > 0) {
        linhas.push(`• *Restante a pagar:* ${formatMoney(saldoPagar)}`);
      } else {
        linhas.push(`• *Situação:* Quitado integralmente ✅`);
      }
    } else {
      linhas.push(`• *A acertar na entrega:* ${formatMoney(enc.valor)}`);
    }

    if (formaPag) {
      linhas.push(`• *Forma de Pagamento:* ${formaPag}`);
    }

    if (enc.data_entrega) {
      linhas.push(`• *Previsão de Entrega:* ${formatDate(enc.data_entrega)}`);
    }

    if (enc.status) {
      linhas.push(`• *Status Atual:* ${enc.status}`);
    }

    const obsLimpa = enc.observacoes
      ? enc.observacoes
          .replace(/\[Pagamento:\s*[^\]]+\]\s*/gi, '')
          .replace(/Pagamento:\s*[^|;\n]+(\s*\|\s*)?/gi, '')
          .trim()
      : '';

    if (obsLimpa) {
      linhas.push(`• *Observações:* ${obsLimpa}`);
    }

    linhas.push('');
    linhas.push('Qualquer dúvida estamos à disposição! Muito obrigado(a).');

    return `https://wa.me/${zapNum}?text=${encodeURIComponent(linhas.join('\n'))}`;
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    try {
      const obsTexto = observacoes.trim();
      const obsFinal = formaPagamento
        ? `[Pagamento: ${formaPagamento}]${obsTexto ? ` ${obsTexto}` : ''}`
        : obsTexto;

      if (editingEncomenda) {
        // Atualização de encomenda existente
        const { error } = await supabase
          .from('encomendas')
          .update({
            cliente: cliente.trim(),
            telefone: telefone.trim() || null,
            produto: produto.trim(),
            valor: Number(valor),
            sinal: Number(sinal || 0),
            data_entrega: dataEntrega || null,
            status,
            observacoes: obsFinal || null,
          })
          .eq('id', editingEncomenda.id)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(error.message);
        }

        // Se for pedido do catálogo, atualiza status e dados no pedidos_catalogo também
        if (editingEncomenda.pedido_catalogo_id) {
          await supabase
            .from('pedidos_catalogo')
            .update({
              cliente: cliente.trim(),
              telefone: telefone.trim(),
              total: Number(valor),
              status,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', editingEncomenda.pedido_catalogo_id)
            .eq('usuario_id', user.id);
        }

        setMsg({ tipo: 'ok', texto: 'Ordem / Encomenda alterada com sucesso!' });
        resetForm();
        loadData();
      } else {
        // Nova encomenda
        const qtdNum = Number(quantidade) > 0 ? Number(quantidade) : 1;
        const nomeFinal = produto.trim();
        const descFinal = `${nomeFinal}${qtdNum > 1 ? ` (x${qtdNum})` : ''}`;

        const { error } = await supabase.from('encomendas').insert({
          cliente: cliente.trim(),
          telefone: telefone.trim() || null,
          produto: descFinal,
          valor: Number(valor),
          sinal: Number(sinal || 0),
          data_entrega: dataEntrega || null,
          status,
          observacoes: obsFinal || null,
          user_id: user.id,
        });

        if (error) {
          throw new Error(error.message);
        }

        // Dar baixa no estoque se solicitado
        let baixaRealizada = false;
        if (darBaixaEstoque && selectedProdutoObj) {
          const qtdAtualProd = Number(selectedProdutoObj.quantidade || 0);
          const novaQtdProd = Math.max(0, qtdAtualProd - qtdNum);

          // 1. Baixa em produtos
          await supabase
            .from('produtos')
            .update({ quantidade: novaQtdProd })
            .eq('id', selectedProdutoObj.id)
            .eq('usuario_id', user.id);

          // 2. Baixa em materiais
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
          texto: `Encomenda registrada com sucesso! ${
            baixaRealizada
              ? `Baixa de ${quantidade} un. efetuada no estoque.`
              : ''
          }`,
        });

        resetForm();
        loadData();
      }
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao salvar encomenda.' });
    } finally {
      setSubmitting(false);
    }
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
      loadData();
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
      loadData();
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

      <div className="card" id="card-form-encomenda">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">ORDEM DE SERVIÇO</span>
            <h3>
              {editingEncomenda
                ? `Editar encomenda #${editingEncomenda.id}`
                : 'Nova ordem / encomenda'}
            </h3>
          </div>
          {editingEncomenda && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              Cancelar Edição
            </button>
          )}
        </div>

        {editingEncomenda && (
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
              <strong>Alterando encomenda:</strong> {editingEncomenda.cliente} — {editingEncomenda.produto}
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
              <option value="__manual__">✍️ Outro item / encomenda personalizada...</option>
            </select>
          </div>

          <div>
            <label className="label">Produto / Serviço / Armação *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Armação + Lente Multifocal / Pedido Especial"
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
            {precoUnitario && Number(quantidade) > 1 && (
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                Unitário: {formatMoney(Number(precoUnitario))} x {quantidade}
              </small>
            )}
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
              <option value="A Combinar">A Combinar</option>
            </select>
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

          {!editingEncomenda && selectedProdutoObj && (
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
                  Dar baixa / reservar <b>{quantidade} un.</b> no estoque do produto ({selectedProdutoObj.nome})
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
            {editingEncomenda && (
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
                : editingEncomenda
                ? 'Salvar Alterações'
                : 'Salvar Ordem / Encomenda'}
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
                          <div style={{ marginTop: '4px' }}>
                            <a
                              href={getWhatsAppUrl(enc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                              title="Enviar mensagem com detalhes da encomenda no WhatsApp"
                            >
                              <span>💬</span> Enviar no WhatsApp
                            </a>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                              {enc.telefone}
                            </div>
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
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditClick(enc)}
                          >
                            Editar
                          </button>
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
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