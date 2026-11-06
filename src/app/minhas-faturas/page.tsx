'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { FaturaSistema } from '@/types/faturas';
import { listarFaturas } from '@/services/faturasService';
import BoletoVisualModal from '@/components/faturas/BoletoVisualModal';
import { formatMoney, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MinhasFaturasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [faturas, setFaturas] = useState<FaturaSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [faturaSelecionada, setFaturaSelecionada] = useState<FaturaSistema | null>(null);

  const carregarMinhasFaturas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const lista = await listarFaturas(user.id);
      setFaturas(lista);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      carregarMinhasFaturas();
    }
  }, [authLoading, user, carregarMinhasFaturas]);

  const faturasPendentes = faturas.filter((f) => f.status === 'pendente' || f.status === 'vencido');
  const faturaUrgente = faturasPendentes[0] || null;

  return (
    <AppShell title="Minhas Faturas & Assinatura">
      {/* Banner de Apresentação */}
      <section
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, var(--card, #FFFFFF), var(--creme-suave, #F1F5F9))',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#2563EB',
              marginBottom: '6px',
            }}
          >
            <span>💳</span> FATURAS & MENSALIDADE DO SISTEMA
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--texto, #0F172A)' }}>
            Minhas Faturas & Pagamentos
          </h2>
          <p style={{ margin: 0, color: 'var(--muted, #64748B)', fontSize: '14px' }}>
            Acompanhe o status da sua assinatura, visualize boletos e pague com praticidade via PIX.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarMinhasFaturas}
          disabled={loading}
          style={{
            padding: '10px 16px',
            background: 'var(--card, #FFFFFF)',
            color: 'var(--texto, #0F172A)',
            border: '1px solid var(--borda, #CBD5E1)',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🔄 Atualizar Faturas
        </button>
      </section>

      {/* Destaque de Fatura Pendente para Pagamento Rápido */}
      {faturaUrgente && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  background: faturaUrgente.status === 'vencido' ? '#EF4444' : '#F59E0B',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {faturaUrgente.status === 'vencido' ? '⚠️ Fatura Vencida' : '⏳ Fatura Pendente'}
              </span>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
                Ref: <b>{faturaUrgente.mes_referencia}</b>
              </span>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 900, color: '#38BDF8', margin: '4px 0' }}>
              {formatMoney(faturaUrgente.valor)}
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
              Vencimento: <b>{formatDate(faturaUrgente.data_vencimento)}</b>. Pague via PIX para liberação instantânea.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFaturaSelecionada(faturaUrgente)}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>📱</span> Pagar com PIX / Ver Boleto
          </button>
        </div>
      )}

      {/* Se não houver faturas pendentes, mensagem de tudo em dia */}
      {!loading && faturasPendentes.length === 0 && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '28px' }}>🎉</div>
          <div>
            <h4 style={{ margin: 0, color: '#166534', fontSize: '15px', fontWeight: 800 }}>
              Sua assinatura Kroche Manager está 100% em dia!
            </h4>
            <span style={{ fontSize: '13px', color: '#15803D' }}>
              Nenhuma fatura em aberto no momento. Aproveite todos os recursos da sua plataforma.
            </span>
          </div>
        </div>
      )}

      {/* Histórico Completo de Faturas */}
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--borda, #E2E8F0)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--borda, #E2E8F0)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
            Histórico de Boletos e Faturas
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
            Todas as faturas geradas para o seu cadastro
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted, #64748B)' }}>
            Carregando suas faturas...
          </div>
        ) : faturas.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted, #64748B)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧾</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--texto, #0F172A)' }}>
              Nenhuma fatura emitida ainda
            </h4>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Quando a administração emitir a fatura da sua assinatura mensal, ela aparecerá aqui para você pagar via PIX ou boleto.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--creme-suave, #F8FAFC)', borderBottom: '1px solid var(--borda, #E2E8F0)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Número</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Mês de Referência</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Vencimento</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Valor</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--muted, #64748B)', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((fat) => {
                  const statusConfig = {
                    pendente: { bg: '#FEF3C7', color: '#92400E', label: 'Pendente' },
                    pago: { bg: '#DCFCE7', color: '#166534', label: 'Pago ✓' },
                    vencido: { bg: '#FEE2E2', color: '#991B1B', label: 'Vencido' },
                    cancelado: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelado' },
                  }[fat.status] || { bg: '#F1F5F9', color: '#64748B', label: fat.status };

                  return (
                    <tr
                      key={fat.id}
                      style={{
                        borderBottom: '1px solid var(--borda, #F1F5F9)',
                        background: fat.status === 'pendente' ? 'rgba(254, 243, 199, 0.15)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563EB' }}>
                        {fat.id}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--texto, #0F172A)' }}>
                        {fat.mes_referencia}
                      </td>
                      <td style={{ padding: '14px 18px', color: fat.status === 'vencido' ? '#DC2626' : 'var(--texto, #334155)', fontWeight: fat.status === 'vencido' ? 700 : 500 }}>
                        {formatDate(fat.data_vencimento)}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                        {formatMoney(fat.valor)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setFaturaSelecionada(fat)}
                          style={{
                            background: fat.status === 'pago' ? '#F1F5F9' : '#2563EB',
                            color: fat.status === 'pago' ? '#334155' : '#FFFFFF',
                            border: fat.status === 'pago' ? '1px solid #CBD5E1' : 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {fat.status === 'pago' ? '👁️ Ver Recibo' : '📱 Pagar / Ver Boleto'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visual do Boleto com PIX */}
      {faturaSelecionada && (
        <BoletoVisualModal
          fatura={faturaSelecionada}
          onClose={() => setFaturaSelecionada(null)}
          isMaster={false}
        />
      )}
    </AppShell>
  );
}
