'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Lead } from '@/types/database';

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Form manual de lead
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [interesse, setInteresse] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadLeads = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('usuario_id', user.id)
      .order('data', { ascending: false });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setLeads(data || []);
    }
  };

  useEffect(() => {
    if (user) loadLeads();
  }, [user]);

  const handleSalvarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCadastrando(true);
    setMsg(null);

    const { error } = await supabase.from('leads').insert({
      usuario_id: user.id,
      nome_cliente: nomeCliente.trim(),
      telefone_cliente: telefoneCliente.trim(),
      itens: interesse.trim() ? [{ nome_produto: interesse.trim(), quantidade: 1, subtotal: Number(valorTotal || 0) }] : null,
      valor_total: Number(valorTotal || 0),
      status: 'Novo',
    });

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Cliente / Lead adicionado com sucesso!' });
      setNomeCliente('');
      setTelefoneCliente('');
      setInteresse('');
      setValorTotal('');
      loadLeads();
    }
    setCadastrando(false);
  };

  const handleStatusChange = async (id: number, novoStatus: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('leads')
      .update({ status: novoStatus })
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l))
      );
      setMsg({ tipo: 'ok', texto: 'Status do atendimento atualizado!' });
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir este lead?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Lead excluído com sucesso!' });
      loadLeads();
    }
  };

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        (l.nome_cliente && l.nome_cliente.toLowerCase().includes(q)) ||
        (l.telefone_cliente && l.telefone_cliente.toLowerCase().includes(q)) ||
        (l.status && l.status.toLowerCase().includes(q))
    );
  }, [leads, busca]);

  return (
    <AppShell title="Clientes & Leads">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">CADASTRO MANUAL</span>
            <h3>Adicionar novo cliente / oportunidade</h3>
          </div>
        </div>

        <form onSubmit={handleSalvarManual} className="grid grid-4">
          <div>
            <label className="label">Nome do Cliente *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Lucas Rodrigues"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
            />
          </div>

          <div>
            <label className="label">WhatsApp / Telefone *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="(00) 00000-0000"
              value={telefoneCliente}
              onChange={(e) => setTelefoneCliente(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Produto de Interesse</label>
            <input
              type="text"
              className="input"
              placeholder="Ex.: Armação Ray-Ban, Consulta, Lentes..."
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Valor Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0,00"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={cadastrando}>
              {cadastrando ? 'Salvando...' : 'Adicionar Contato'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">RELACIONAMENTO & CRM</span>
            <h3>Contatos e Oportunidades</h3>
          </div>
          <span className="pill">{leads.length} contato(s)</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="search"
            className="input"
            placeholder="🔍 Buscar por nome, telefone ou status..."
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
                <th>Telefone / WhatsApp</th>
                <th>Interesse / Valor</th>
                <th>Status do Atendimento</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? (
                filtrados.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.data)}</td>
                    <td><b>{l.nome_cliente}</b></td>
                    <td>
                      <a
                        href={`https://wa.me/${l.telefone_cliente?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        💬 {l.telefone_cliente}
                      </a>
                    </td>
                    <td>
                      <b>{formatMoney(l.valor_total)}</b>
                      {Array.isArray(l.itens) && l.itens.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {l.itens.map((it: any, i: number) => it.nome_produto || it.nome).filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: '160px', padding: '6px 10px', minHeight: '34px' }}
                        value={l.status || 'Novo'}
                        onChange={(e) => handleStatusChange(l.id, e.target.value)}
                      >
                        <option value="Novo">Novo</option>
                        <option value="Em Contato">Em Contato</option>
                        <option value="Proposta Enviada">Proposta Enviada</option>
                        <option value="Convertido em Venda">Convertido em Venda</option>
                        <option value="Perdido / Cancelado">Perdido / Cancelado</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExcluir(l.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '30px' }}>
                    {leads.length === 0
                      ? 'Nenhum lead ou cliente registrado ainda.'
                      : 'Nenhum resultado encontrado para esta pesquisa.'}
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
