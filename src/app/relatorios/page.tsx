'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';

interface RelatorioItem {
  tipo: 'Venda' | 'Venda catálogo' | 'Compra';
  data?: string;
  descricao: string;
  pessoa: string;
  valor: number;
}

export default function RelatoriosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [rows, setRows] = useState<RelatorioItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const getRange = useCallback(() => {
    if (dia) {
      return {
        start: `${dia}T00:00:00`,
        end: `${dia}T23:59:59`,
        label: dia,
      };
    }
    if (mes) {
      const [y, m] = mes.split('-');
      const nextDate = new Date(Number(y), Number(m), 1);
      return {
        start: `${mes}-01T00:00:00`,
        end: nextDate.toISOString(),
        label: mes,
      };
    }
    return { start: null, end: null, label: 'Geral' };
  }, [dia, mes]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    setMsg(null);

    const r = getRange();

    let vq = supabase
      .from('vendas')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    let cq = supabase
      .from('compras')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    let pq = supabase
      .from('pedidos_catalogo')
      .select('*')
      .eq('usuario_id', user.id)
      .neq('status', 'Cancelado')
      .order('data', { ascending: false });

    if (r.start && r.end) {
      vq = vq.gte('data', r.start).lte('data', r.end);
      cq = cq.gte('data', r.start).lte('data', r.end);
      pq = pq.gte('data', r.start).lte('data', r.end);
    }

    const [vr, cr, pr] = await Promise.all([vq, cq, pq]);

    if (vr.error || cr.error || pr.error) {
      setMsg({
        tipo: 'err',
        texto: vr.error?.message || cr.error?.message || pr.error?.message || 'Erro ao buscar dados.',
      });
      setFetching(false);
      return;
    }

    const vendasItens: RelatorioItem[] = (vr.data || []).map((x) => ({
      tipo: 'Venda',
      data: x.data,
      descricao: x.produto || 'Venda',
      pessoa: x.cliente || '-',
      valor: Number(x.valor || 0),
    }));

    const catalogoItens: RelatorioItem[] = (pr.data || []).map((x) => ({
      tipo: 'Venda catálogo',
      data: x.data,
      descricao: 'Pedido #' + x.id,
      pessoa: x.cliente || '-',
      valor: Number(x.total || 0),
    }));

    const comprasItens: RelatorioItem[] = (cr.data || []).map((x) => ({
      tipo: 'Compra',
      data: x.data,
      descricao: x.material || 'Compra',
      pessoa: x.fornecedor || '-',
      valor: Number(x.valor || 0),
    }));

    const combined = [...vendasItens, ...catalogoItens, ...comprasItens].sort(
      (a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime()
    );

    setRows(combined);
    setFetching(false);
  }, [user, getRange]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const totalVendas = rows
    .filter((x) => x.tipo.startsWith('Venda'))
    .reduce((a, x) => a + x.valor, 0);

  const totalCompras = rows
    .filter((x) => x.tipo === 'Compra')
    .reduce((a, x) => a + x.valor, 0);

  const lucro = totalVendas - totalCompras;

  const handleExportCSV = () => {
    const header = ['Tipo', 'Data', 'Descrição', 'Cliente / Fornecedor', 'Valor (R$)'];
    const lines = [
      header.join(';'),
      ...rows.map((x) =>
        [
          `"${x.tipo}"`,
          `"${formatDate(x.data)}"`,
          `"${x.descricao.replace(/"/g, '""')}"`,
          `"${x.pessoa.replace(/"/g, '""')}"`,
          `"${x.valor.toFixed(2).replace('.', ',')}"`,
        ].join(';')
      ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-gestorpro-${getRange().label || 'geral'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.text('GestorPro — Relatório Financeiro e Comercial', 14, 18);
      doc.text(`Período: ${getRange().label || 'Geral'}`, 14, 26);
      doc.text(
        `Vendas: ${formatMoney(totalVendas)} | Compras: ${formatMoney(totalCompras)} | Saldo Líquido: ${formatMoney(lucro)}`,
        14,
        34
      );

      autoTable(doc, {
        head: [['Tipo', 'Data', 'Descrição', 'Cliente / Fornecedor', 'Valor']],
        body: rows.map((x) => [
          x.tipo,
          formatDate(x.data),
          x.descricao,
          x.pessoa,
          formatMoney(x.valor),
        ]),
        startY: 42,
      });

      doc.save(`relatorio-gestorpro-${getRange().label || 'geral'}.pdf`);
    } catch {
      window.print();
    }
  };

  return (
    <AppShell title="Relatórios Financeiros">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">FILTROS</span>
            <h3>Filtrar período</h3>
          </div>
        </div>

        <div className="grid grid-2">
          <div>
            <label className="label">Por Dia Específico</label>
            <input
              type="date"
              className="input"
              value={dia}
              onChange={(e) => {
                setDia(e.target.value);
                setMes('');
              }}
            />
          </div>

          <div>
            <label className="label">Por Mês</label>
            <input
              type="month"
              className="input"
              value={mes}
              onChange={(e) => {
                setMes(e.target.value);
                setDia('');
              }}
            />
          </div>
        </div>

        <div className="actions" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadData}
            disabled={fetching}
          >
            {fetching ? 'Carregando...' : 'Filtrar'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportPDF}
            disabled={rows.length === 0}
          >
            Exportar PDF
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={rows.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '22px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="muted" style={{ fontSize: '12px' }}>Vendas no período</div>
          <div style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0', color: '#28a96b' }}>
            {formatMoney(totalVendas)}
          </div>
          <small className="muted">
            {rows.filter((x) => x.tipo.startsWith('Venda')).length} venda(s)
          </small>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="muted" style={{ fontSize: '12px' }}>Despesas no período</div>
          <div style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0', color: '#b3261e' }}>
            {formatMoney(totalCompras)}
          </div>
          <small className="muted">
            {rows.filter((x) => x.tipo === 'Compra').length} compra(s)
          </small>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="muted" style={{ fontSize: '12px' }}>Resultado (Saldo)</div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              margin: '6px 0',
              color: lucro >= 0 ? '#28a96b' : '#b3261e',
            }}
          >
            {formatMoney(lucro)}
          </div>
          <small className="muted">Vendas menos compras</small>
        </div>
      </div>

      <div className="card">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">EXTRATO</span>
            <h3>Movimentações do período</h3>
          </div>
          <span className="pill">{rows.length} registro(s)</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Cliente / Fornecedor</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span
                        className={`pill ${r.tipo === 'Compra' ? 'danger' : 'success'}`}
                      >
                        {r.tipo}
                      </span>
                    </td>
                    <td>{formatDate(r.data)}</td>
                    <td><b>{r.descricao}</b></td>
                    <td>{r.pessoa}</td>
                    <td style={{ textAlign: 'right' }}>
                      <b>{formatMoney(r.valor)}</b>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '30px' }}>
                    Nenhuma movimentação registrada para o período selecionado.
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
