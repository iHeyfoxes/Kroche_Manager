'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EditarEncomendaDynamicPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [sinal, setSinal] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [isCatalogo, setIsCatalogo] = useState(false);
  const [pedidoCatalogoId, setPedidoCatalogoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;

    async function loadEncomenda() {
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error || !data) {
        setMsg({ tipo: 'err', texto: 'Encomenda não encontrada.' });
      } else {
        setCliente(data.cliente || '');
        setTelefone(data.telefone || '');
        setProduto(data.produto || '');
        setValor(String(data.valor || ''));
        setSinal(String(data.sinal || '0'));
        setDataEntrega(data.data_entrega || '');
        setStatus(data.status || 'Pendente');
        setIsCatalogo(!!data.pedido_catalogo_id);
        setPedidoCatalogoId(data.pedido_catalogo_id || null);
      }
    }

    loadEncomenda();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    setMsg(null);

    // If it's a catalog order being cancelled, execute RPC
    if (isCatalogo && status === 'Cancelado' && pedidoCatalogoId) {
      try {
        const r = await supabase.rpc('cancelar_pedido_catalogo', {
          p_pedido_id: Number(pedidoCatalogoId),
        });
        if (r.error || !r.data?.sucesso) {
          setMsg({ tipo: 'err', texto: r.error?.message || 'Não foi possível cancelar o pedido.' });
          setSaving(false);
          return;
        }
        router.push('/encomendas');
        return;
      } catch (err: any) {
        setMsg({ tipo: 'err', texto: err.message });
        setSaving(false);
        return;
      }
    }

    // If it's a catalog order update
    if (isCatalogo && pedidoCatalogoId) {
      await supabase
        .from('pedidos_catalogo')
        .update({
          cliente: cliente.trim(),
          telefone: telefone.trim(),
          total: Number(valor),
          status,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', pedidoCatalogoId)
        .eq('usuario_id', user.id);
    }

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
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
      setSaving(false);
    } else {
      router.push('/encomendas');
    }
  };

  return (
    <AppShell title="Editar Encomenda">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card" style={{ maxWidth: '720px' }}>
        <h3>Dados da Encomenda #{id}</h3>

        <form onSubmit={handleSubmit} className="grid grid-2">
          <div>
            <label className="label">Cliente *</label>
            <input
              type="text"
              className="input"
              required
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input
              type="text"
              className="input"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Produto *</label>
            <input
              type="text"
              className="input"
              required
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Sinal (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={sinal}
              onChange={(e) => setSinal(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Data de Entrega</label>
            <input
              type="date"
              className="input"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Pendente</option>
              <option>Confirmado</option>
              <option>Em produção</option>
              <option>Pronto</option>
              <option>Entregue</option>
              {isCatalogo && <option>Cancelado</option>}
            </select>
          </div>

          <div className="actions" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <Link href="/encomendas" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
