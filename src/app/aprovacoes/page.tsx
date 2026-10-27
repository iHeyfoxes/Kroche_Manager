'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Usuario, UsuarioStatus } from '@/types/database';
import Link from 'next/link';

export default function AprovacoesPage() {
  const { user, profile, loading: authLoading, isMaster } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | UsuarioStatus>('todos');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setUsuarios((data as Usuario[]) || []);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setErro(err.message || 'Erro ao carregar lista de clientes para aprovação.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isMaster) {
      carregarUsuarios();
    }
  }, [authLoading, isMaster, carregarUsuarios]);

  // Ações de alteração de status
  const handleAlterarStatus = async (usuarioId: string, novoStatus: UsuarioStatus) => {
    setAtualizandoId(usuarioId);
    setMsgSucesso(null);
    setErro(null);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ status: novoStatus })
        .eq('id', usuarioId);

      if (error) throw error;

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioId ? { ...u, status: novoStatus } : u))
      );
      setMsgSucesso(`Status alterado com sucesso para "${novoStatus.toUpperCase()}".`);
      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao alterar status do cliente.');
    } finally {
      setAtualizandoId(null);
    }
  };

  // Alteração de ativo/inativo
  const handleToggleAtivo = async (usuarioId: string, atual: boolean | null | undefined) => {
    setAtualizandoId(usuarioId);
    setMsgSucesso(null);
    setErro(null);
    const novoAtivo = atual === false; // se era falso vira true, caso contrário vira false

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: novoAtivo })
        .eq('id', usuarioId);

      if (error) throw error;

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioId ? { ...u, ativo: novoAtivo } : u))
      );
      setMsgSucesso(`Cliente marcado como ${novoAtivo ? 'ATIVO' : 'INATIVO'}.`);
      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao alterar estado de atividade.');
    } finally {
      setAtualizandoId(null);
    }
  };

  // Alternar permissão Master
  const handleToggleMaster = async (usuarioId: string, atual: boolean | null | undefined) => {
    if (usuarioId === user?.id) {
      alert('Por segurança, você não pode remover seu próprio acesso Master.');
      return;
    }

    setAtualizandoId(usuarioId);
    setMsgSucesso(null);
    setErro(null);
    const novoMaster = !Boolean(atual);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ masteracess: novoMaster })
        .eq('id', usuarioId);

      if (error) throw error;

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioId
            ? { ...u, masteracess: novoMaster, masterAcess: novoMaster }
            : u
        )
      );
      setMsgSucesso(`Acesso Master ${novoMaster ? 'CONCEDIDO' : 'REVOGADO'} com sucesso.`);
      setTimeout(() => setMsgSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar permissão Master.');
    } finally {
      setAtualizandoId(null);
    }
  };

  // Métricas
  const kpis = useMemo(() => {
    const total = usuarios.length;
    const pendentes = usuarios.filter((u) => (u.status || 'pendente') === 'pendente').length;
    const aprovados = usuarios.filter((u) => u.status === 'aprovado').length;
    const suspensos = usuarios.filter((u) => u.status === 'suspenso').length;
    const ativos = usuarios.filter((u) => u.ativo !== false).length;
    const inativos = usuarios.filter((u) => u.ativo === false).length;
    return { total, pendentes, aprovados, suspensos, ativos, inativos };
  }, [usuarios]);

  // Lista filtrada
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de busca
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const nome = (u.nome || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const whatsapp = (u.whatsapp || '').toLowerCase();
        const slug = (u.slug || '').toLowerCase();
        const loja = (u.catalogo_nome || '').toLowerCase();
        if (!nome.includes(q) && !email.includes(q) && !whatsapp.includes(q) && !slug.includes(q) && !loja.includes(q)) {
          return false;
        }
      }

      // Filtro de status
      const statusUser: UsuarioStatus = (u.status as UsuarioStatus) || 'pendente';
      if (filtroStatus !== 'todos' && statusUser !== filtroStatus) {
        return false;
      }

      // Filtro de ativo
      const isAtivo = u.ativo !== false;
      if (filtroAtivo === 'ativos' && !isAtivo) return false;
      if (filtroAtivo === 'inativos' && isAtivo) return false;

      return true;
    });
  }, [usuarios, busca, filtroStatus, filtroAtivo]);

  if (!authLoading && !isMaster) {
    return (
      <AppShell title="Acesso Restrito">
        <div style={{
          maxWidth: '560px',
          margin: '60px auto',
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: 'var(--texto, #0F172A)' }}>
            Acesso Restrito — Permissão Master Necessária
          </h2>
          <p style={{ color: 'var(--muted, #64748B)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Esta tela de aprovação de e-mails e controle de clientes é exclusiva para usuários com <b>masterAcess</b> habilitado.
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
            }}
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Aprovação de Clientes & Acessos">
      {/* Hero / Apresentação */}
      <section style={{
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
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--marrom-principal, #2563EB)',
            marginBottom: '6px',
          }}>
            <span>🛡️</span> PAINEL ADMINISTRATIVO MASTER
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--texto, #0F172A)' }}>
            Controle de Acessos & Aprovação de Clientes
          </h2>
          <p style={{ margin: 0, color: 'var(--muted, #64748B)', fontSize: '14px' }}>
            Controle quem pode acessar o sistema: aprove cadastros pendentes, suspenda contas ou gerencie permissões master.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarUsuarios}
          disabled={loading}
          style={{
            background: 'var(--card, #FFFFFF)',
            color: 'var(--texto, #0F172A)',
            border: '1px solid var(--borda, #E2E8F0)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span>🔄</span>
          <span>{loading ? 'Atualizando...' : 'Recarregar Lista'}</span>
        </button>
      </section>

      {/* Alertas */}
      {msgSucesso && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#15803D',
          border: '1px solid #86EFAC',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>✓</span>
          <span>{msgSucesso}</span>
        </div>
      )}

      {erro && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#B91C1C',
          border: '1px solid #FCA5A5',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠️</span>
          <span>{erro}</span>
        </div>
      )}

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '14px',
          padding: '18px 20px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--muted, #64748B)', fontWeight: 600 }}>Total de Cadastros</span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--texto, #0F172A)' }}>
            {kpis.total}
          </div>
          <small style={{ color: 'var(--muted, #64748B)', fontSize: '12px' }}>Clientes no sistema</small>
        </div>

        <div style={{
          background: 'var(--card, #FFFFFF)',
          border: kpis.pendentes > 0 ? '2px solid #F59E0B' : '1px solid var(--borda, #E2E8F0)',
          borderRadius: '14px',
          padding: '18px 20px',
        }}>
          <span style={{ fontSize: '13px', color: '#B45309', fontWeight: 700 }}>⏳ Pendentes de Aprovação</span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#D97706' }}>
            {kpis.pendentes}
          </div>
          <small style={{ color: '#B45309', fontSize: '12px' }}>Aguardando liberação</small>
        </div>

        <div style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '14px',
          padding: '18px 20px',
        }}>
          <span style={{ fontSize: '13px', color: '#15803D', fontWeight: 600 }}>✓ Aprovados</span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#16A34A' }}>
            {kpis.aprovados}
          </div>
          <small style={{ color: 'var(--muted, #64748B)', fontSize: '12px' }}>Acesso autorizado</small>
        </div>

        <div style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '14px',
          padding: '18px 20px',
        }}>
          <span style={{ fontSize: '13px', color: '#B91C1C', fontWeight: 600 }}>⛔ Suspensos</span>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#DC2626' }}>
            {kpis.suspensos}
          </div>
          <small style={{ color: 'var(--muted, #64748B)', fontSize: '12px' }}>Acesso bloqueado</small>
        </div>

        <div style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--borda, #E2E8F0)',
          borderRadius: '14px',
          padding: '18px 20px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--muted, #64748B)', fontWeight: 600 }}>Ativos / Inativos</span>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'var(--texto, #0F172A)' }}>
            <span style={{ color: '#16A34A' }}>{kpis.ativos}</span> / <span style={{ color: '#DC2626' }}>{kpis.inativos}</span>
          </div>
          <small style={{ color: 'var(--muted, #64748B)', fontSize: '12px' }}>Controle de atividade</small>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{
        background: 'var(--card, #FFFFFF)',
        border: '1px solid var(--borda, #E2E8F0)',
        borderRadius: '14px',
        padding: '18px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, whatsapp, catálogo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--borda, #E2E8F0)',
              background: 'var(--input, #FFFFFF)',
              color: 'var(--texto, #0F172A)',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Filtro Status */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['todos', 'pendente', 'aprovado', 'suspenso'] as const).map((st) => {
            const count = st === 'todos' ? kpis.total : kpis[st === 'pendente' ? 'pendentes' : st === 'aprovado' ? 'aprovados' : 'suspensos'];
            const ativoTab = filtroStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: ativoTab ? 'var(--marrom-principal, #2563EB)' : 'var(--borda, #E2E8F0)',
                  background: ativoTab ? 'var(--marrom-principal, #2563EB)' : 'transparent',
                  color: ativoTab ? '#FFFFFF' : 'var(--texto, #0F172A)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{st === 'todos' ? 'Todos' : st === 'pendente' ? 'Pendentes' : st === 'aprovado' ? 'Aprovados' : 'Suspensos'}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  background: ativoTab ? 'rgba(255, 255, 255, 0.25)' : 'var(--creme-suave, #F1F5F9)',
                  color: ativoTab ? '#FFFFFF' : 'var(--muted, #64748B)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtro Ativo */}
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--borda, #E2E8F0)',
            background: 'var(--input, #FFFFFF)',
            color: 'var(--texto, #0F172A)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <option value="todos">Status Atividade: Todos</option>
          <option value="ativos">Apenas Ativos (Sim)</option>
          <option value="inativos">Apenas Inativos (Não)</option>
        </select>
      </div>

      {/* Lista / Tabela de Clientes */}
      <div style={{
        background: 'var(--card, #FFFFFF)',
        border: '1px solid var(--borda, #E2E8F0)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted, #64748B)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Carregando dados dos clientes...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted, #64748B)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--texto, #0F172A)' }}>
              Nenhum cliente encontrado
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Tente alterar os filtros ou o termo de busca pesquisado.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{
                  background: 'var(--creme-suave, #F1F5F9)',
                  borderBottom: '1px solid var(--borda, #E2E8F0)',
                  color: 'var(--muted, #64748B)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  <th style={{ padding: '14px 18px' }}>Cliente / Empresa</th>
                  <th style={{ padding: '14px 18px' }}>E-mail de Acesso</th>
                  <th style={{ padding: '14px 18px' }}>WhatsApp</th>
                  <th style={{ padding: '14px 18px' }}>Data Cadastro</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Ativo?</th>
                  <th style={{ padding: '14px 18px' }}>Master?</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ações de Aprovação</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const statusAtual: UsuarioStatus = (u.status as UsuarioStatus) || 'pendente';
                  const isAtivo = u.ativo !== false;
                  const isUserMaster = Boolean(u.masteracess ?? u.masterAcess);
                  const isSelf = u.id === user?.id;
                  const processando = atualizandoId === u.id;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--borda, #E2E8F0)',
                        opacity: processando ? 0.6 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Cliente */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--creme-suave, #F1F5F9)',
                            border: '1px solid var(--borda, #E2E8F0)',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 700,
                            color: 'var(--marrom-principal, #2563EB)',
                            fontSize: '14px',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}>
                            {u.foto && u.foto !== 'perfil_padrao.png' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.foto} alt={u.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              u.nome?.slice(0, 2).toUpperCase() || 'CL'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--texto, #0F172A)' }}>
                              {u.nome || 'Sem nome'}
                              {isSelf && (
                                <span style={{
                                  marginLeft: '6px',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  background: 'rgba(37, 99, 235, 0.12)',
                                  color: 'var(--marrom-principal, #2563EB)',
                                  fontWeight: 700,
                                }}>
                                  Você
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted, #64748B)' }}>
                              {u.catalogo_nome ? `Empresa: ${u.catalogo_nome}` : `Slug: /loja/${u.slug}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--texto, #0F172A)', fontSize: '13px' }}>
                          {u.email || (isSelf ? user?.email : null) || <span style={{ color: 'var(--muted, #64748B)', fontStyle: 'italic' }}>Não registrado</span>}
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td style={{ padding: '16px 18px' }}>
                        {u.whatsapp ? (
                          <a
                            href={`https://wa.me/55${u.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#16A34A',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                            title="Conversar no WhatsApp"
                          >
                            <span>💬</span>
                            <span>{u.whatsapp}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--muted, #64748B)', fontSize: '13px' }}>—</span>
                        )}
                      </td>

                      {/* Data */}
                      <td style={{ padding: '16px 18px', color: 'var(--muted, #64748B)', fontSize: '13px' }}>
                        {u.data ? new Date(u.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: statusAtual === 'aprovado'
                            ? 'rgba(34, 197, 94, 0.12)'
                            : statusAtual === 'suspenso'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(245, 158, 11, 0.15)',
                          color: statusAtual === 'aprovado'
                            ? '#15803D'
                            : statusAtual === 'suspenso'
                            ? '#B91C1C'
                            : '#B45309',
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: statusAtual === 'aprovado'
                              ? '#16A34A'
                              : statusAtual === 'suspenso'
                              ? '#DC2626'
                              : '#F59E0B',
                          }} />
                          {statusAtual}
                        </span>
                      </td>

                      {/* Ativo */}
                      <td style={{ padding: '16px 18px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(u.id, u.ativo)}
                          disabled={processando}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: 'pointer',
                            background: isAtivo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderColor: isAtivo ? '#86EFAC' : '#FCA5A5',
                            color: isAtivo ? '#15803D' : '#B91C1C',
                          }}
                          title="Clique para alternar entre ativo e inativo"
                        >
                          {isAtivo ? 'Sim (Ativo)' : 'Não (Inativo)'}
                        </button>
                      </td>

                      {/* Master */}
                      <td style={{ padding: '16px 18px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleMaster(u.id, isUserMaster)}
                          disabled={processando || isSelf}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: isSelf ? 'default' : 'pointer',
                            background: isUserMaster ? 'rgba(124, 58, 237, 0.12)' : 'var(--creme-suave, #F1F5F9)',
                            borderColor: isUserMaster ? '#C4B5FD' : 'var(--borda, #E2E8F0)',
                            color: isUserMaster ? '#6D28D9' : 'var(--muted, #64748B)',
                          }}
                          title={isSelf ? 'Você não pode alterar seu próprio master' : 'Clique para alternar permissão Master'}
                        >
                          {isUserMaster ? '🛡️ Master' : 'Padrão'}
                        </button>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {statusAtual !== 'aprovado' && (
                            <button
                              type="button"
                              onClick={() => handleAlterarStatus(u.id, 'aprovado')}
                              disabled={processando}
                              style={{
                                background: '#16A34A',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Aprovar e liberar acesso ao sistema"
                            >
                              ✓ Aprovar
                            </button>
                          )}

                          {statusAtual !== 'suspenso' && (
                            <button
                              type="button"
                              onClick={() => handleAlterarStatus(u.id, 'suspenso')}
                              disabled={processando}
                              style={{
                                background: 'transparent',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Suspender acesso deste cliente"
                            >
                              ⛔ Suspender
                            </button>
                          )}

                          {statusAtual !== 'pendente' && (
                            <button
                              type="button"
                              onClick={() => handleAlterarStatus(u.id, 'pendente')}
                              disabled={processando}
                              style={{
                                background: 'transparent',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Voltar para status pendente"
                            >
                              ⏳ Pendente
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
