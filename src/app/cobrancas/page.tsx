'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/types/database';
import {
  ConfiguracaoPix,
  FaturaSistema,
  StatusFatura,
  TipoChavePix,
} from '@/types/faturas';
import {
  carregarConfiguracaoPix,
  salvarConfiguracaoPix,
  listarFaturas,
  emitirFatura,
  emitirFaturasEmLote,
  atualizarStatusFatura,
  excluirFatura,
  gerarPixCopiaECola,
  verificarTabelaFaturasExiste,
  sincronizarFaturasComSupabase,
} from '@/services/faturasService';
import BoletoVisualModal from '@/components/faturas/BoletoVisualModal';
import { formatMoney, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CobrancasMasterPage() {
  const { user, isMaster, loading: authLoading } = useAuth();

  // Estados principais
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [faturas, setFaturas] = useState<FaturaSistema[]>([]);
  const [configPix, setConfigPix] = useState<ConfiguracaoPix>({
    chave: '',
    tipo: 'email',
    beneficiario: 'KROCHE MANAGER',
    cidade: 'SAO PAULO',
    valor_padrao: 99.00,
    dias_vencimento: 5,
    instrucoes: 'Pagar via PIX com o QR Code para liberação imediata.',
  });

  const [loading, setLoading] = useState(true);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [emitindo, setEmitindo] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);

  // Aba ativa: 'faturas' | 'emitir' | 'config-pix' | 'sql'
  const [abaAtiva, setAbaAtiva] = useState<'faturas' | 'emitir' | 'config-pix' | 'sql'>('faturas');

  // Filtros de faturas
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusFatura>('todos');
  const [busca, setBusca] = useState('');

  // Formulário de Emissão Individual
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('');
  const [valorEmissao, setValorEmissao] = useState<string>('99.00');
  const [mesReferencia, setMesReferencia] = useState<string>('');
  const [vencimentoPersonalizado, setVencimentoPersonalizado] = useState<string>('');
  const [obsEmissao, setObsEmissao] = useState<string>('');

  // Modal de Boleto
  const [faturaParaVisualizar, setFaturaParaVisualizar] = useState<FaturaSistema | null>(null);
  const [tabelaExiste, setTabelaExiste] = useState<boolean | null>(null);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setMsgErro(null);
    try {
      // 0. Verifica se a tabela faturas_sistema existe no Supabase
      const existe = await verificarTabelaFaturasExiste();
      setTabelaExiste(existe);
      if (existe) {
        await sincronizarFaturasComSupabase();
      }

      // 1. Carrega usuários
      const { data: usersData, error: usersErr } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (!usersErr && usersData) {
        setUsuarios(usersData as Usuario[]);
      }

      // 2. Carrega configurações do PIX
      const config = await carregarConfiguracaoPix();
      setConfigPix(config);
      setValorEmissao(config.valor_padrao ? config.valor_padrao.toString() : '99.00');

      // 3. Carrega faturas
      const faturasLista = await listarFaturas();
      setFaturas(faturasLista);

      // Define mês atual por padrão
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const hoje = new Date();
      setMesReferencia(`${meses[hoje.getMonth()]}/${hoje.getFullYear()}`);

      // Data de vencimento padrão (+5 dias)
      const dataVenc = new Date();
      dataVenc.setDate(dataVenc.getDate() + (config.dias_vencimento || 5));
      setVencimentoPersonalizado(dataVenc.toISOString().split('T')[0]);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setMsgErro(err.message || 'Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isMaster) {
      carregarDados();
    }
  }, [authLoading, isMaster, carregarDados]);

  // Salvar Configuração do PIX
  const handleSalvarConfigPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setMsgSucesso(null);
    setMsgErro(null);
    try {
      await salvarConfiguracaoPix(configPix);
      setMsgSucesso('Configuração da Chave PIX e dados de faturamento salvos com sucesso!');
      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      setMsgErro(err.message || 'Erro ao salvar configuração.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  // Emitir Fatura para um Cliente Específico
  const handleEmitirIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionadoId) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    const cliente = usuarios.find((u) => u.id === clienteSelecionadoId);
    if (!cliente) {
      alert('Cliente não encontrado.');
      return;
    }

    setEmitindo(true);
    setMsgSucesso(null);
    setMsgErro(null);

    try {
      const valorNum = parseFloat(valorEmissao.replace(',', '.')) || 99.00;
      const novaFatura = await emitirFatura(cliente, configPix, {
        valor: valorNum,
        mesReferencia,
        dataVencimento: vencimentoPersonalizado,
        observacoes: obsEmissao,
      });

      setFaturas((prev) => [novaFatura, ...prev]);
      setMsgSucesso(`Boleto / Fatura emitida com sucesso para ${cliente.nome || cliente.email} no valor de ${formatMoney(valorNum)}!`);
      setAbaAtiva('faturas');
      setFaturaParaVisualizar(novaFatura);
    } catch (err: any) {
      setMsgErro(err.message || 'Erro ao emitir fatura.');
    } finally {
      setEmitindo(false);
    }
  };

  // Emitir em Lote para Todos os Clientes Ativos
  const handleEmitirLote = async () => {
    const clientesAtivos = usuarios.filter((u) => u.ativo !== false && u.status === 'aprovado');
    if (clientesAtivos.length === 0) {
      alert('Nenhum cliente ativo e aprovado encontrado.');
      return;
    }

    const valorNum = parseFloat(valorEmissao.replace(',', '.')) || 99.00;
    const confirmou = window.confirm(
      `Deseja emitir faturas no valor de ${formatMoney(valorNum)} (Ref: ${mesReferencia}) para TODOS os ${clientesAtivos.length} clientes aprovados?`
    );

    if (!confirmou) return;

    setEmitindo(true);
    setMsgSucesso(null);
    setMsgErro(null);

    try {
      const { total, emitidas } = await emitirFaturasEmLote(clientesAtivos, configPix, {
        valor: valorNum,
        mesReferencia,
        dataVencimento: vencimentoPersonalizado,
        observacoes: obsEmissao,
      });

      setFaturas((prev) => [...emitidas, ...prev]);
      setMsgSucesso(`Foram emitidas ${total} faturas de ${formatMoney(valorNum)} com sucesso!`);
      setAbaAtiva('faturas');
    } catch (err: any) {
      setMsgErro(err.message || 'Erro na emissão em lote.');
    } finally {
      setEmitindo(false);
    }
  };

  // Marcar Fatura como Paga
  const handleMarcarPago = async (faturaId: string) => {
    try {
      await atualizarStatusFatura(faturaId, 'pago');
      setFaturas((prev) =>
        prev.map((f) =>
          f.id === faturaId ? { ...f, status: 'pago', pago_em: new Date().toISOString() } : f
        )
      );
      if (faturaParaVisualizar?.id === faturaId) {
        setFaturaParaVisualizar((prev) => (prev ? { ...prev, status: 'pago' } : null));
      }
      setMsgSucesso('Fatura marcada como PAGA! A assinatura do cliente está em dia.');
      setTimeout(() => setMsgSucesso(null), 3500);
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Cancelar Fatura
  const handleCancelarFatura = async (faturaId: string) => {
    if (!window.confirm('Deseja realmente cancelar esta fatura?')) return;
    try {
      await atualizarStatusFatura(faturaId, 'cancelado');
      setFaturas((prev) =>
        prev.map((f) => (f.id === faturaId ? { ...f, status: 'cancelado' } : f))
      );
      setMsgSucesso('Fatura cancelada com sucesso.');
      setTimeout(() => setMsgSucesso(null), 3000);
    } catch (err: any) {
      alert('Erro ao cancelar fatura: ' + err.message);
    }
  };

  // Excluir Fatura
  const handleExcluirFatura = async (faturaId: string) => {
    if (!window.confirm('Deseja excluir permanentemente este registro de fatura?')) return;
    try {
      await excluirFatura(faturaId);
      setFaturas((prev) => prev.filter((f) => f.id !== faturaId));
      if (faturaParaVisualizar?.id === faturaId) setFaturaParaVisualizar(null);
      setMsgSucesso('Fatura excluída.');
      setTimeout(() => setMsgSucesso(null), 3000);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Faturas Filtradas e Estatísticas
  const faturasFiltradas = useMemo(() => {
    return faturas.filter((f) => {
      const matchStatus = filtroStatus === 'todos' || f.status === filtroStatus;
      const matchBusca =
        busca.trim() === '' ||
        f.usuario_nome.toLowerCase().includes(busca.toLowerCase()) ||
        (f.usuario_email && f.usuario_email.toLowerCase().includes(busca.toLowerCase())) ||
        f.id.toLowerCase().includes(busca.toLowerCase()) ||
        f.mes_referencia.toLowerCase().includes(busca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [faturas, filtroStatus, busca]);

  const stats = useMemo(() => {
    const totalGeral = faturas.length;
    const pagas = faturas.filter((f) => f.status === 'pago');
    const pendentes = faturas.filter((f) => f.status === 'pendente');
    const vencidas = faturas.filter((f) => f.status === 'vencido');

    const valorTotalPendente = pendentes.reduce((acc, f) => acc + (f.valor || 0), 0);
    const valorTotalPago = pagas.reduce((acc, f) => acc + (f.valor || 0), 0);

    return {
      totalGeral,
      pagasCount: pagas.length,
      pendentesCount: pendentes.length,
      vencidasCount: vencidas.length,
      valorTotalPendente,
      valorTotalPago,
    };
  }, [faturas]);

  // Se não for master, bloqueia a tela
  if (!authLoading && !isMaster) {
    return (
      <AppShell title="Acesso Negado">
        <div
          style={{
            maxWidth: '540px',
            margin: '60px auto',
            background: 'var(--card, #FFFFFF)',
            border: '1px solid var(--borda, #E2E8F0)',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: 'var(--texto, #0F172A)' }}>
            Acesso Restrito — Permissão Master Necessária
          </h2>
          <p style={{ color: 'var(--muted, #64748B)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Esta tela de emissão de boletos de fatura do sistema e gestão do PIX é exclusiva para usuários com <b>masterAcess</b> habilitado.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--marrom-principal, #2563EB)',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Finanças & Faturas do Sistema">
      {/* Cabeçalho Hero */}
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
              color: '#10B981',
              marginBottom: '6px',
            }}
          >
            <span>💎</span> MÓDULO FINANCEIRO MASTER
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--texto, #0F172A)' }}>
            Emissão de Boletos & Faturas do Sistema
          </h2>
          <p style={{ margin: 0, color: 'var(--muted, #64748B)', fontSize: '14px' }}>
            Emita faturas com valor de <b>R$ 99,00</b> para seus clientes com QR Code PIX configurável e acompanhe pagamentos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('emitir')}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ➕ Emitir Nova Fatura
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('config-pix')}
            style={{
              background: 'var(--card, #FFFFFF)',
              color: 'var(--texto, #0F172A)',
              border: '1px solid var(--borda, #E2E8F0)',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚙️ Configurar PIX
          </button>
        </div>
      </section>

      {/* Alerta caso a tabela no Supabase ainda não exista */}
      {tabelaExiste === false && (
        <div
          style={{
            padding: '18px 22px',
            borderRadius: '12px',
            background: '#FEF2F2',
            border: '2px solid #F87171',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px' }}>🚨</span>
              <strong style={{ fontSize: '15px', color: '#991B1B' }}>
                A tabela de faturas ainda não foi criada no seu Supabase
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', lineHeight: 1.5 }}>
              Para que as faturas emitidas fiquem salvas na nuvem e apareçam nos celulares e computadores dos seus clientes, você precisa rodar o script SQL de criação no Supabase (leva menos de 1 minuto).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAbaAtiva('sql')}
              style={{
                background: '#DC2626',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              📋 Ver Script SQL para Copiar
            </button>
            <a
              href="https://supabase.com/dashboard/project/tjmemwlavrsdclvtgtcs/sql/new"
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#1E293B',
                color: '#FFF',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Abrir SQL Editor do Supabase ↗
            </a>
          </div>
        </div>
      )}

      {/* Alertas de Feedback */}
      {msgSucesso && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '10px',
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#15803D',
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {msgSucesso}</span>
          <button
            type="button"
            onClick={() => setMsgSucesso(null)}
            style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {msgErro && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '10px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          ⚠️ {msgErro}
        </div>
      )}

      {/* Cards de Métricas e Resumo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--card, #FFFFFF)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--borda, #E2E8F0)',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total de Faturas
          </span>
          <div style={{ fontSize: '26px', fontWeight: 900, marginTop: '4px', color: 'var(--texto, #0F172A)' }}>
            {stats.totalGeral}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>Faturas geradas no sistema</span>
        </div>

        <div
          style={{
            background: 'var(--card, #FFFFFF)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--borda, #E2E8F0)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>
            Pendentes de Pagamento
          </span>
          <div style={{ fontSize: '26px', fontWeight: 900, marginTop: '4px', color: '#D97706' }}>
            {stats.pendentesCount}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
            A receber: {formatMoney(stats.valorTotalPendente)}
          </span>
        </div>

        <div
          style={{
            background: 'var(--card, #FFFFFF)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--borda, #E2E8F0)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, textTransform: 'uppercase' }}>
            Faturas Pagas
          </span>
          <div style={{ fontSize: '26px', fontWeight: 900, marginTop: '4px', color: '#16A34A' }}>
            {stats.pagasCount}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
            Total recebido: {formatMoney(stats.valorTotalPago)}
          </span>
        </div>

        <div
          style={{
            background: 'var(--card, #FFFFFF)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--borda, #E2E8F0)',
          }}
        >
          <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
            Chave PIX Ativa
          </span>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 800,
              marginTop: '8px',
              color: 'var(--texto, #0F172A)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={configPix.chave}
          >
            {configPix.chave || 'Não configurada'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
            {configPix.beneficiario} ({configPix.tipo})
          </span>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--borda, #E2E8F0)',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => setAbaAtiva('faturas')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'faturas' ? '3px solid #2563EB' : '3px solid transparent',
            color: abaAtiva === 'faturas' ? '#2563EB' : 'var(--muted, #64748B)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          📋 Faturas Emitidas ({faturas.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('emitir')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'emitir' ? '3px solid #2563EB' : '3px solid transparent',
            color: abaAtiva === 'emitir' ? '#2563EB' : 'var(--muted, #64748B)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ➕ Emitir Fatura (Individual / Lote)
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('config-pix')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'config-pix' ? '3px solid #2563EB' : '3px solid transparent',
            color: abaAtiva === 'config-pix' ? '#2563EB' : 'var(--muted, #64748B)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          🔑 Configuração do PIX (Alterável)
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('sql')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'sql' ? '3px solid #2563EB' : '3px solid transparent',
            color: abaAtiva === 'sql' ? '#2563EB' : 'var(--muted, #64748B)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          🗄️ Tabela Supabase (Opcional)
        </button>
      </div>

      {/* ABA 1: LISTA DE FATURAS EMITIDAS */}
      {abaAtiva === 'faturas' && (
        <div>
          {/* Barra de Filtros e Busca */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '16px',
              background: 'var(--card, #FFFFFF)',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid var(--borda, #E2E8F0)',
            }}
          >
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Buscar por cliente, e-mail ou código da fatura..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--borda, #CBD5E1)',
                  background: 'var(--fundo-input, #FFFFFF)',
                  color: 'var(--texto, #0F172A)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted, #64748B)', fontWeight: 600 }}>Status:</span>
              {(['todos', 'pendente', 'pago', 'vencido', 'cancelado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroStatus(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: filtroStatus === st ? '1px solid #2563EB' : '1px solid var(--borda, #CBD5E1)',
                    background: filtroStatus === st ? '#EFF6FF' : 'var(--card, #FFFFFF)',
                    color: filtroStatus === st ? '#1D4ED8' : 'var(--texto, #334155)',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Faturas */}
          <div
            style={{
              background: 'var(--card, #FFFFFF)',
              borderRadius: '12px',
              border: '1px solid var(--borda, #E2E8F0)',
              overflowX: 'auto',
            }}
          >
            {faturasFiltradas.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted, #64748B)' }}>
                <div style={{ fontSize: '38px', marginBottom: '12px' }}>🧾</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--texto, #0F172A)' }}>
                  Nenhuma fatura encontrada
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
                  {busca || filtroStatus !== 'todos'
                    ? 'Nenhuma fatura corresponde aos filtros aplicados.'
                    : 'Ainda não foram emitidas faturas do sistema. Clique no botão abaixo para emitir a primeira!'}
                </p>
                <button
                  type="button"
                  onClick={() => setAbaAtiva('emitir')}
                  style={{
                    padding: '8px 16px',
                    background: '#2563EB',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Emitir Nova Fatura
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--creme-suave, #F8FAFC)', borderBottom: '1px solid var(--borda, #E2E8F0)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Fatura</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Referência</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Vencimento</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Valor</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted, #64748B)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fat) => {
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
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2563EB' }}>
                          {fat.id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--texto, #0F172A)' }}>{fat.usuario_nome}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted, #64748B)' }}>{fat.usuario_email || 'Sem e-mail'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--texto, #334155)', fontWeight: 600 }}>
                          {fat.mes_referencia}
                        </td>
                        <td style={{ padding: '14px 16px', color: fat.status === 'vencido' ? '#DC2626' : 'var(--texto, #334155)' }}>
                          {formatDate(fat.data_vencimento)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                          {formatMoney(fat.valor)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
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
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setFaturaParaVisualizar(fat)}
                              title="Visualizar Boleto & QR Code PIX"
                              style={{
                                background: '#2563EB',
                                color: '#FFF',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              👁️ Ver Boleto
                            </button>

                            {fat.status !== 'pago' && (
                              <button
                                type="button"
                                onClick={() => handleMarcarPago(fat.id)}
                                title="Marcar como Pago"
                                style={{
                                  background: '#10B981',
                                  color: '#FFF',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ✓ Pago
                              </button>
                            )}

                            {fat.status !== 'cancelado' && fat.status !== 'pago' && (
                              <button
                                type="button"
                                onClick={() => handleCancelarFatura(fat.id)}
                                title="Cancelar Fatura"
                                style={{
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancelar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleExcluirFatura(fat.id)}
                              title="Excluir"
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: EMISSÃO DE FATURAS */}
      {abaAtiva === 'emitir' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Card: Emissão Individual */}
          <div
            style={{
              background: 'var(--card, #FFFFFF)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--borda, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>👤</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                  Emitir para um Cliente Específico
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
                  Gera o boleto com Pix no valor padrão de R$ 99,00
                </span>
              </div>
            </div>

            <form onSubmit={handleEmitirIndividual}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Selecione o Cliente / Artesão *
                </label>
                <select
                  value={clienteSelecionadoId}
                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                  }}
                >
                  <option value="">-- Escolha um cliente ({usuarios.length} disponíveis) --</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome || u.email || 'Sem nome'} ({u.email || u.id.slice(0, 8)}) {u.ativo === false ? '[Inativo]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                    Valor da Fatura (R$) *
                  </label>
                  <input
                    type="text"
                    value={valorEmissao}
                    onChange={(e) => setValorEmissao(e.target.value)}
                    required
                    placeholder="99.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--borda, #CBD5E1)',
                      background: 'var(--fundo-input, #FFFFFF)',
                      color: 'var(--texto, #0F172A)',
                      fontSize: '13px',
                      fontWeight: 800,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--muted, #64748B)' }}>Padrão: 99,00</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                    Mês de Referência *
                  </label>
                  <input
                    type="text"
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    required
                    placeholder="Ex: Novembro/2026"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--borda, #CBD5E1)',
                      background: 'var(--fundo-input, #FFFFFF)',
                      color: 'var(--texto, #0F172A)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={vencimentoPersonalizado}
                  onChange={(e) => setVencimentoPersonalizado(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Observações / Instruções
                </label>
                <textarea
                  rows={2}
                  value={obsEmissao}
                  onChange={(e) => setObsEmissao(e.target.value)}
                  placeholder="Mensalidade Kroche Manager. Pagar preferencialmente via PIX."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={emitindo}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: emitindo ? 'not-allowed' : 'pointer',
                  opacity: emitindo ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {emitindo ? 'Emitindo Fatura...' : `Emitir Fatura de ${formatMoney(parseFloat(valorEmissao) || 99)}`}
              </button>
            </form>
          </div>

          {/* Card: Emissão em Lote */}
          <div
            style={{
              background: 'var(--card, #FFFFFF)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--borda, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                    Emissão Automática em Lote
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
                    Gere faturas de R$ 99 para todos os clientes ativos de uma vez
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1E40AF',
                  lineHeight: 1.5,
                }}
              >
                <b>Como funciona a cobrança em massa:</b>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                  <li>Localiza todos os clientes aprovados e ativos no sistema.</li>
                  <li>Gera o boleto bancário e chave PIX para cada um no valor de <b>{formatMoney(parseFloat(valorEmissao) || 99)}</b>.</li>
                  <li>Aparece instantaneamente no painel do cliente em <b>&quot;Minhas Faturas&quot;</b>.</li>
                  <li>Referência: <b>{mesReferencia}</b> | Vencimento: <b>{formatDate(vencimentoPersonalizado)}</b>.</li>
                </ul>
              </div>

              <div style={{ fontSize: '14px', color: 'var(--texto, #0F172A)', marginBottom: '16px' }}>
                Clientes ativos aptos para faturamento:{' '}
                <b>{usuarios.filter((u) => u.ativo !== false && u.status === 'aprovado').length} clientes</b>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEmitirLote}
              disabled={emitindo}
              style={{
                width: '100%',
                padding: '14px',
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: emitindo ? 'not-allowed' : 'pointer',
                opacity: emitindo ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              ⚡ Gerar Faturas de R$ 99 para Todos os Clientes Ativos
            </button>
          </div>
        </div>
      )}

      {/* ABA 3: CONFIGURAÇÃO DO PIX (ALTERÁVEL) */}
      {abaAtiva === 'config-pix' && (
        <div style={{ maxWidth: '720px', background: 'var(--card, #FFFFFF)', padding: '28px', borderRadius: '16px', border: '1px solid var(--borda, #E2E8F0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '26px' }}>🔑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                Configuração da Chave PIX do Sistema
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted, #64748B)' }}>
                Esta é a Chave PIX e dados que sairão nas faturas e boletos gerados para os clientes. Você pode alterá-la quando quiser!
              </p>
            </div>
          </div>

          <form onSubmit={handleSalvarConfigPix}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Tipo de Chave *
                </label>
                <select
                  value={configPix.tipo}
                  onChange={(e) => setConfigPix({ ...configPix, tipo: e.target.value as TipoChavePix })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Celular / Telefone</option>
                  <option value="chave_aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Chave PIX * (ex: seu e-mail, celular, CPF ou chave aleatória)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: financeiro@krochemanager.com.br ou 11999998888"
                  value={configPix.chave}
                  onChange={(e) => setConfigPix({ ...configPix, chave: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Nome do Titular / Beneficiário (Até 25 letras) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="KROCHE MANAGER"
                  value={configPix.beneficiario}
                  onChange={(e) => setConfigPix({ ...configPix, beneficiario: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Cidade do Titular (Até 15 letras) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="SAO PAULO"
                  value={configPix.cidade}
                  onChange={(e) => setConfigPix({ ...configPix, cidade: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Valor Padrão da Fatura (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={configPix.valor_padrao}
                  onChange={(e) => setConfigPix({ ...configPix, valor_padrao: parseFloat(e.target.value) || 99 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted, #64748B)' }}>Padrão solicitado: 99.00</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                  Prazo de Vencimento Padrão (Dias) *
                </label>
                <input
                  type="number"
                  required
                  value={configPix.dias_vencimento}
                  onChange={(e) => setConfigPix({ ...configPix, dias_vencimento: parseInt(e.target.value, 10) || 5 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--borda, #CBD5E1)',
                    background: 'var(--fundo-input, #FFFFFF)',
                    color: 'var(--texto, #0F172A)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--texto, #0F172A)' }}>
                Mensagem / Instruções no Boleto
              </label>
              <textarea
                rows={2}
                value={configPix.instrucoes || ''}
                onChange={(e) => setConfigPix({ ...configPix, instruções: e.target.value } as any)}
                placeholder="Pagar preferencialmente via PIX..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--borda, #CBD5E1)',
                  background: 'var(--fundo-input, #FFFFFF)',
                  color: 'var(--texto, #0F172A)',
                  fontSize: '12px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={salvandoConfig}
              style={{
                padding: '12px 24px',
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: salvandoConfig ? 'not-allowed' : 'pointer',
              }}
            >
              {salvandoConfig ? 'Salvando...' : '💾 Salvar Alterações do PIX'}
            </button>
          </form>
        </div>
      )}

      {/* ABA 4: SCRIPT SQL PARA SUPABASE */}
      {abaAtiva === 'sql' && (
        <div style={{ maxWidth: '800px', background: 'var(--card, #FFFFFF)', padding: '24px', borderRadius: '16px', border: '1px solid var(--borda, #E2E8F0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--texto, #0F172A)' }}>
                Estrutura das Tabelas no Supabase (Opcional)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted, #64748B)' }}>
                O sistema já funciona imediatamente com armazenamento seguro local. Para sincronizar as faturas entre diferentes computadores ou dispositivos do Master, execute o script SQL abaixo no SQL Editor do painel do seu Supabase:
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const sql = `-- 1. Tabela de faturas do sistema
CREATE TABLE IF NOT EXISTS public.faturas_sistema (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_documento TEXT,
  valor NUMERIC(10,2) NOT NULL DEFAULT 99.00,
  mes_referencia TEXT NOT NULL,
  data_emissao TIMESTAMPTZ DEFAULT NOW(),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  pix_chave TEXT NOT NULL,
  pix_tipo TEXT NOT NULL,
  pix_beneficiario TEXT NOT NULL,
  pix_cidade TEXT NOT NULL,
  pix_copia_cola TEXT NOT NULL,
  nosso_numero TEXT NOT NULL,
  linha_digitavel TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  observacoes TEXT,
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilita RLS e permissões de acesso
ALTER TABLE public.faturas_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao faturas_sistema leitura" ON public.faturas_sistema;
CREATE POLICY "Permissao faturas_sistema leitura" ON public.faturas_sistema
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permissao faturas_sistema geral" ON public.faturas_sistema;
CREATE POLICY "Permissao faturas_sistema geral" ON public.faturas_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela de configurações (para chave PIX alterável)
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao configuracoes_sistema geral" ON public.configuracoes_sistema;
CREATE POLICY "Permissao configuracoes_sistema geral" ON public.configuracoes_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);`;
                navigator.clipboard.writeText(sql);
                alert('Script SQL copiado com sucesso! Agora cole no SQL Editor do Supabase.');
              }}
              style={{
                background: '#2563EB',
                color: '#FFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              📋 Copiar SQL
            </button>
          </div>

          <pre
            style={{
              background: '#0F172A',
              color: '#38BDF8',
              padding: '16px',
              borderRadius: '10px',
              fontSize: '12px',
              overflowX: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.5,
            }}
          >
{`-- 1. Tabela de faturas do sistema
CREATE TABLE IF NOT EXISTS public.faturas_sistema (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  usuario_documento TEXT,
  valor NUMERIC(10,2) NOT NULL DEFAULT 99.00,
  mes_referencia TEXT NOT NULL,
  data_emissao TIMESTAMPTZ DEFAULT NOW(),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  pix_chave TEXT NOT NULL,
  pix_tipo TEXT NOT NULL,
  pix_beneficiario TEXT NOT NULL,
  pix_cidade TEXT NOT NULL,
  pix_copia_cola TEXT NOT NULL,
  nosso_numero TEXT NOT NULL,
  linha_digitavel TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  observacoes TEXT,
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilita RLS e permissões de acesso
ALTER TABLE public.faturas_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao faturas_sistema leitura" ON public.faturas_sistema;
CREATE POLICY "Permissao faturas_sistema leitura" ON public.faturas_sistema
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permissao faturas_sistema geral" ON public.faturas_sistema;
CREATE POLICY "Permissao faturas_sistema geral" ON public.faturas_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela de configurações (para chave PIX alterável)
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao configuracoes_sistema geral" ON public.configuracoes_sistema;
CREATE POLICY "Permissao configuracoes_sistema geral" ON public.configuracoes_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {/* Modal Visual do Boleto com PIX */}
      {faturaParaVisualizar && (
        <BoletoVisualModal
          fatura={faturaParaVisualizar}
          isMaster={isMaster}
          onClose={() => setFaturaParaVisualizar(null)}
          onMarcarPago={handleMarcarPago}
        />
      )}
    </AppShell>
  );
}
