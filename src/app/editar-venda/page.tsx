'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

function EditarVendaContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [cliente, setCliente] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;

    async function loadVenda() {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error || !data) {
        setMsg({ tipo: 'err', texto: 'Venda não encontrada.' });
      } else {
        setCliente(data.cliente || '');
        setProduto(data.produto || '');
        setValor(String(data.valor || ''));
      }
    }

    loadVenda();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from('vendas')
      .update({
        cliente: cliente.trim(),
        produto: produto.trim(),
        valor: Number(valor),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
      setSaving(false);
    } else {
      router.push('/vendas');
    }
  };

  return (
    <AppShell title="Editar Venda">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card" style={{ maxWidth: '680px' }}>
        <h3>Dados da Venda #{id}</h3>

        <form onSubmit={handleSubmit} className="grid">
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

          <div className="actions" style={{ marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <Link href="/vendas" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default function EditarVendaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditarVendaContent />
    </Suspense>
  );
}
