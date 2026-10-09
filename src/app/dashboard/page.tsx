'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/utils';
import { Venda, Compra, Encomenda, Produto, Lead, PedidoCatalogo } from '@/types/database';

interface RecentMovement {
  tipo: string;
  nome: string;
  valor: number;
  data?: string;
  isPositive: boolean;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pedidosCatalogo, setPedidosCatalogo] = useState<PedidoCatalogo[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setFetching(true);
      try {
        const [vRes, cRes, eRes, pRes, lRes, pcRes] = await Promise.allSettled([
          supabase.from('vendas').select('*').eq('user_id', user!.id),
          supabase.from('compras').select('*').eq('user_id', user!.id),
          supabase.from('encomendas').select('*').eq('user_id', user!.id),
          supabase.from('produtos').select('*').eq('usuario_id', user!.id),
          supabase.from('leads').select('*').eq('usuario_id', user!.id),
          supabase.from('pedidos_catalogo').select('*').eq('usuario_id', user!.id),
        ]);

        const getData = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' && r.value?.data ? r.value.data : [];

        setVendas(getData(vRes));
        setCompras(getData(cRes));
        setEncomendas(getData(eRes));
        setProdutos(getData(pRes));
        setLeads(getData(lRes));
        setPedidosCatalogo(getData(pcRes));
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [user]);

  const vendasCatalogo = pedidosCatalogo.filter((x) => x.status !== 'Cancelado');
  const tv =
    vendas.reduce((a, x) => a + Number(x.valor || 0), 0) +
    vendasCatalogo.reduce((a, x) => a + Number(x.total || 0), 0);
  const tc = compras.reduce((a, x) => a + Number(x.valor || 0), 0);

  const totalPedidosQtd = vendas.length + vendasCatalogo.length;
  const ticket = totalPedidosQtd ? tv / totalPedidosQtd : 0;

  const pendentes = encomendas.filter(
    (x) => !['Entregue', 'Concluída', 'Concluido'].includes(x.status || '')
  ).length;

  const maxVal = Math.max(tv, tc, 1);

  const recent: RecentMovement[] = [
    ...vendas.map((x) => ({
      tipo: 'Venda',
      nome: x.cliente || x.produto || 'Venda',
      valor: Number(x.valor || 0),
      data: x.data,
      isPositive: true,
    })),
    ...compras.map((x) => ({
      tipo: 'Compra',
      nome: x.material || 'Compra',
      valor: Number(x.valor || 0),
      data: x.data,
      isPositive: false,
    })),
    ...vendasCatalogo.map((x) => ({
      tipo: 'Venda catálogo',
      nome: 'Pedido #' + x.id,
      valor: Number(x.total || 0),
      data: x.data,
      isPositive: true,
    })),
  ]
    .sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime())
    .slice(0, 5);

  return (
    <AppShell title="Dashboard">
      <section className="dashboard-hero">
        <div>
          <span className="page-kicker">PAINEL DE CONTROLE EMPRESARIAL</span>
          <h2>Seu negócio organizado em um só lugar.</h2>
          <p>Acompanhe faturamento, compras, ordens de serviço, estoque e clientes sem complicação.</p>
        </div>
        <Link className="btn btn-primary hero-action" href="/minha-loja">
          🌐 Catálogo / Loja Online
        </Link>
      </section>

      <div className="dashboard-stats">
        <Link className="metric-card" href="/vendas">
          <span className="metric-icon">💰</span>
          <div>
            <span className="muted">Vendas</span>
            <strong>{formatMoney(tv)}</strong>
            <small>{totalPedidosQtd} registro(s)</small>
          </div>
          <span className="metric-arrow">→</span>
        </Link>

        <Link className="metric-card" href="/compras">
          <span className="metric-icon">🛒</span>
          <div>
            <span className="muted">Compras & Custos</span>
            <strong>{formatMoney(tc)}</strong>
            <small>{compras.length} registro(s)</small>
          </div>
          <span className="metric-arrow">→</span>
        </Link>

        <Link className="metric-card" href="/encomendas">
          <span className="metric-icon">📋</span>
          <div>
            <span className="muted">Ordens & Encomendas</span>
            <strong>{pendentes}</strong>
            <small>em andamento</small>
          </div>
          <span className="metric-arrow">→</span>
        </Link>

        <Link className="metric-card" href="/minha-loja">
          <span className="metric-icon">📦</span>
          <div>
            <span className="muted">Produtos Cadastrados</span>
            <strong>{produtos.length}</strong>
            <small>item(ns) ativos</small>
          </div>
          <span className="metric-arrow">→</span>
        </Link>
      </div>

      <div className="dashboard-columns">
        <section className="card dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">FINANCEIRO</span>
              <h3>Resumo financeiro</h3>
            </div>
            <Link href="/relatorios" style={{ color: 'var(--marrom-principal)', fontWeight: 700, fontSize: '13px' }}>
              Ver relatórios →
            </Link>
          </div>

          <div className="finance-total">
            <div>
              <span className="muted">Resultado</span>
              <strong style={{ color: tv - tc >= 0 ? '#28a96b' : '#b3261e' }}>
                {formatMoney(tv - tc)}
              </strong>
              <small>Vendas menos compras</small>
            </div>
            <div className="mini-stat">
              <span>Ticket médio</span>
              <b>{formatMoney(ticket)}</b>
            </div>
          </div>

          <div className="bar-chart">
            <div className="bar-row">
              <span>Vendas</span>
              <div>
                <i style={{ width: `${Math.max(4, (tv / maxVal) * 100)}%` }}></i>
              </div>
              <b>{formatMoney(tv)}</b>
            </div>
            <div className="bar-row">
              <span>Compras</span>
              <div>
                <i style={{ width: `${Math.max(4, (tc / maxVal) * 100)}%`, background: '#b86f4a' }}></i>
              </div>
              <b>{formatMoney(tc)}</b>
            </div>
          </div>
        </section>

        <section className="card dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">ATIVIDADE</span>
              <h3>Últimos movimentos</h3>
            </div>
            <span className="pill">{recent.length} itens</span>
          </div>

          <div className="activity-list">
            {recent.length > 0 ? (
              recent.map((x, idx) => (
                <div className="activity" key={idx}>
                  <span className={`activity-dot ${x.isPositive ? 'positive' : ''}`}></span>
                  <div>
                    <b>{x.nome}</b>
                    <small>
                      {x.tipo} · {formatDate(x.data)}
                    </small>
                  </div>
                  <strong>
                    {x.isPositive ? '+' : '-'}
                    {formatMoney(x.valor)}
                  </strong>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                <p>Nenhuma movimentação ainda.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="quick-grid">
        <Link className="quick-card" href="/vendas">
          <span>💳</span>
          <div>
            <b>Registrar venda</b>
            <small>Adicione uma nova venda ao histórico.</small>
          </div>
        </Link>

        <Link className="quick-card" href="/encomendas">
          <span>📋</span>
          <div>
            <b>Nova Ordem / Pedido</b>
            <small>Cadastre encomendas, montagens e prazos.</small>
          </div>
        </Link>

        <Link className="quick-card" href="/minha-loja">
          <span>📦</span>
          <div>
            <b>Cadastrar produto</b>
            <small>Adicione itens, armações, lentes ou serviços.</small>
          </div>
        </Link>

        <Link className="quick-card" href="/relatorios">
          <span>📈</span>
          <div>
            <b>Ver relatórios</b>
            <small>Consulte extrato, lucros e exporte em PDF/CSV.</small>
          </div>
        </Link>
      </section>

      <div className="dashboard-footer-note">
        <span>👥 {leads.length} contato(s) / lead(s)</span>
        <span>•</span>
        <span>🛍️ {pedidosCatalogo.length} pedido(s) online</span>
        <span>•</span>
        <span>⚡ Sistema de Gestão Ativo e Operacional</span>
      </div>
    </AppShell>
  );
}
