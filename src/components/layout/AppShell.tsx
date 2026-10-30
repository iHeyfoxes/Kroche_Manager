'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Ícones SVG minimalistas e elegantes
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  ),
  Vendas: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Encomendas: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  ),
  Compras: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  ),
  Estoque: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  Receitas: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  ),
  Leads: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Loja: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
  Relatorios: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  Calculadora: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  ),
  Perfil: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Ajuda: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  UsersCheck: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m17 11 2 2 4-4" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

function getInitials(name: string): string {
  if (!name) return 'KM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'KM';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const {
    user,
    profile,
    loading,
    theme,
    toggleTheme,
    logout,
    refreshProfile,
    canAccessSystem,
    isMaster,
    isApproved,
    isPending,
    isSuspended,
    isActive,
    status,
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [checkMsg, setCheckMsg] = useState<{ tipo: 'info' | 'sucesso' | 'erro'; texto: string } | null>(null);
  const pathname = usePathname();

  const closeMenu = () => setSidebarOpen(false);

  const handleCheckApproval = async () => {
    setCheckingApproval(true);
    setCheckMsg(null);
    try {
      const refreshed = await refreshProfile();
      if (refreshed?.status === 'aprovado' && refreshed?.ativo !== false) {
        setCheckMsg({ tipo: 'sucesso', texto: 'Parabéns! Sua conta foi aprovada! Liberando acesso...' });
      } else if (refreshed?.status === 'suspenso') {
        setCheckMsg({ tipo: 'erro', texto: 'Sua conta consta como suspensa. Fale com a administração.' });
      } else if (refreshed?.ativo === false) {
        setCheckMsg({ tipo: 'erro', texto: 'Sua conta está desativada no momento.' });
      } else {
        setCheckMsg({ tipo: 'info', texto: 'Seu cadastro ainda está em análise pendente. Aguarde a aprovação.' });
      }
    } catch {
      setCheckMsg({ tipo: 'erro', texto: 'Não foi possível verificar no momento. Tente novamente.' });
    } finally {
      setCheckingApproval(false);
    }
  };

  const navLinks: Array<{
    section?: string;
    href?: string;
    label?: string;
    icon?: React.ComponentType;
  }> = [
      { section: 'Visão Geral' },
      { href: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
      ...(isMaster
        ? [
          { section: 'Administração Master' },
          { href: '/aprovacoes', label: 'Aprovação de Clientes', icon: Icons.ShieldCheck },
        ]
        : []),
      { section: 'Operação Comercial' },
      { href: '/vendas', label: 'Vendas & Pedidos', icon: Icons.Vendas },
      { href: '/encomendas', label: 'Orçamentos', icon: Icons.Encomendas },
      { href: '/compras', label: 'Compras & Custos', icon: Icons.Compras },
      { href: '/estoque', label: 'Estoque', icon: Icons.Estoque },
      { href: '/receitas', label: 'Receitas & Fichas', icon: Icons.Receitas },
      { section: 'Clientes & Catálogo' },
      { href: '/leads', label: 'Clientes & Contatos', icon: Icons.Leads },
      { href: '/minha-loja', label: 'Catálogo / Loja Online', icon: Icons.Loja },
      { section: 'Gestão Financeira' },
      { href: '/relatorios', label: 'Relatórios Financeiros', icon: Icons.Relatorios },
      { href: '/calculadora', label: 'Calculadora de Preço', icon: Icons.Calculadora },
      { section: 'Configurações' },
      { href: '/perfil', label: 'Meu Perfil & Empresa', icon: Icons.Perfil },
      { href: '/ajuda', label: 'Central de Ajuda', icon: Icons.Ajuda },
    ];


  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>💼</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: 'var(--texto)' }}>Carregando seu negócio...</h2>
          <p className="muted" style={{ margin: 0, fontSize: '14px' }}>Preparando Kroche Manager</p>
        </div>
      </div>
    );
  }

  const businessName = profile?.catalogo_nome?.trim() || '';
  const userName = profile?.nome?.trim() || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Gestor(a)';
  const userSubtitle = businessName || user?.email || 'Sua Empresa';

  if (user && !canAccessSystem) {
    const isSuspendedUser = status === 'suspenso';
    const isInactiveUser = !isActive;
    const isPendingUser = isPending || (!isSuspendedUser && !isInactiveUser);

    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--fundo-claro, #F8FAFC)',
        color: 'var(--texto, #0F172A)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Barra Superior */}
        <header style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--borda, #E2E8F0)',
          background: 'var(--card, #FFFFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.3px' }}>
                Gestor <b>Pro</b>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Controle de Acesso
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: 'var(--creme-suave, #F1F5F9)',
                border: '1px solid var(--borda, #E2E8F0)',
                color: 'var(--texto, #0F172A)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Alternar Tema"
            >
              {theme === 'claro' ? <Icons.Moon /> : <Icons.Sun />}
              <span>{theme === 'claro' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid var(--borda, #E2E8F0)',
                color: 'var(--muted, #64748B)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Sair da conta"
            >
              <Icons.Logout />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Central */}
        <main style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: '40px 20px',
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--card, #FFFFFF)',
            border: '1px solid var(--borda, #E2E8F0)',
            borderRadius: '18px',
            padding: '36px 32px',
            boxShadow: 'var(--k-shadow, 0 10px 25px -5px rgba(15, 23, 42, .06))',
            textAlign: 'center',
          }}>
            {/* Ícone de Destaque */}
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '32px',
              background: isSuspendedUser
                ? 'rgba(239, 68, 68, 0.12)'
                : isInactiveUser
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(37, 99, 235, 0.12)',
            }}>
              {isSuspendedUser ? '⛔' : isInactiveUser ? '⏸️' : '⏳'}
            </div>

            {/* Badge de Status */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
              background: isSuspendedUser
                ? 'rgba(239, 68, 68, 0.12)'
                : isInactiveUser
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(217, 119, 6, 0.12)',
              color: isSuspendedUser
                ? '#DC2626'
                : isInactiveUser
                  ? '#D97706'
                  : '#B45309',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isSuspendedUser ? '#DC2626' : isInactiveUser ? '#D97706' : '#F59E0B',
              }} />
              {isSuspendedUser ? 'Acesso Suspenso' : isInactiveUser ? 'Conta Inativa' : 'Aguardando Aprovação'}
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 12px',
              color: 'var(--texto, #0F172A)',
              letterSpacing: '-0.4px',
            }}>
              {isSuspendedUser
                ? 'Sua conta está suspensa'
                : isInactiveUser
                  ? 'Seu acesso está inativo no momento'
                  : 'Seu cadastro está aguardando aprovação'}
            </h2>

            <p style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--muted, #64748B)',
              margin: '0 0 24px',
            }}>
              {isSuspendedUser
                ? 'O acesso a este painel foi temporariamente bloqueado pela administração do sistema. Entre em contato com nossa equipe para regularizar sua situação.'
                : isInactiveUser
                  ? 'A sua conta de cliente está desativada no momento. Para reativar o seu acesso às ferramentas, fale com a administração.'
                  : `Olá, ${userName}! Seu cadastro foi registrado com sucesso. Para manter o controle de clientes e segurança das informações, sua conta está em análise e será liberada por um administrador em breve.`}
            </p>

            {/* Timeline explicativa caso esteja pendente */}
            {isPendingUser && (
              <div style={{
                background: 'var(--creme-suave, #F1F5F9)',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '26px',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted, #64748B)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Etapas do seu Acesso
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                    <span><strong>1. Cadastro criado:</strong> Informações recebidas no sistema</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <span style={{ color: '#F59E0B', fontWeight: 800 }}>⏳</span>
                    <span><strong>2. Análise administrativa:</strong> Aprovação do seu e-mail e perfil</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--muted, #64748B)' }}>
                    <span>🔒</span>
                    <span><strong>3. Acesso liberado:</strong> Vendas, estoque, catálogo e finanças</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem de Feedback da verificação */}
            {checkMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                marginBottom: '20px',
                background: checkMsg.tipo === 'sucesso'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : checkMsg.tipo === 'erro'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(59, 130, 246, 0.12)',
                color: checkMsg.tipo === 'sucesso'
                  ? '#15803D'
                  : checkMsg.tipo === 'erro'
                    ? '#B91C1C'
                    : '#1D4ED8',
                border: '1px solid currentColor',
              }}>
                {checkMsg.texto}
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCheckApproval}
                disabled={checkingApproval}
                style={{
                  background: 'var(--marrom-principal, #2563EB)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: checkingApproval ? 'not-allowed' : 'pointer',
                  opacity: checkingApproval ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <span>{checkingApproval ? 'Verificando status no banco...' : '🔄 Verificar aprovação agora'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'transparent',
                  color: 'var(--muted, #64748B)',
                  border: '1px solid var(--borda, #E2E8F0)',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sair da conta
              </button>
            </div>

            <div style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--borda, #E2E8F0)',
              fontSize: '13px',
              color: 'var(--muted, #64748B)',
            }}>
              Precisa de ajuda ou deseja agilizar sua liberação? Entre em contato com o administrador do sistema.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div
        className={`overlay-menu ${sidebarOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div className="app">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          {/* Header da Sidebar */}
          <div className="sidebar-header">
            <Link href="/dashboard" className="brand" onClick={closeMenu}>
              <div className="brand-icon-wrapper">
                <span className="brand-icon">⚡</span>
              </div>
              <div className="brand-text">
                <span className="brand-name" title={businessName || 'Kroche Manager'}>
                  {businessName ? businessName : <>Kroche <b>Manager</b></>}
                </span>
                <span className="brand-sub">Gestão Empresarial</span>
              </div>
            </Link>

            {/* Alternador de Tema Elegante */}
            <div className="sidebar-tools">
              <div className="sidebar-theme-toggle" role="group" aria-label="Seleção de tema">
                <button
                  type="button"
                  className={`theme-pill-item ${theme === 'claro' ? 'active' : ''}`}
                  onClick={() => theme !== 'claro' && toggleTheme()}
                  title="Modo Claro"
                >
                  <Icons.Sun />
                  <span>Claro</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill-item ${theme === 'escuro' ? 'active' : ''}`}
                  onClick={() => theme !== 'escuro' && toggleTheme()}
                  title="Modo Escuro"
                >
                  <Icons.Moon />
                  <span>Escuro</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navegação Scrollável */}
          <nav className="sidebar-nav-container" id="appnav">
            {navLinks.map((item, idx) => {
              if (item.section) {
                return (
                  <div key={idx} className="nav-section-title">
                    {item.section}
                  </div>
                );
              }
              const isActive = item.href
                ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                : false;
              const IconComp = item.icon;

              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  {IconComp && (
                    <span className="nav-icon">
                      <IconComp />
                    </span>
                  )}
                  <span className="sidebar-nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Rodapé com Card de Perfil & Logout */}
          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              <Link href="/perfil" className="sidebar-user-link" onClick={closeMenu} title="Meu Perfil">
                <div className="sidebar-user-avatar">
                  {profile?.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.foto} alt={userName} className="sidebar-avatar-img" />
                  ) : (
                    <span className="sidebar-avatar-initials">{getInitials(userName)}</span>
                  )}
                  <span className="sidebar-status-dot" title="Online" />
                </div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name" title={userName}>{userName}</span>
                  <span className="sidebar-user-role" title={userSubtitle}>{userSubtitle}</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="sidebar-logout-btn"
                title="Sair da conta"
                aria-label="Sair da conta"
              >
                <Icons.Logout />
              </button>
            </div>
            <div className="sidebar-system-badge">
              <span>Kroche Manager</span>
              <span className="badge-bullet">·</span>
              <span>2026</span>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="top">
            <div>
              <div className="page-kicker">PAINEL EMPRESARIAL</div>
              <h1 id="pageTitle">{title}</h1>
              {/* <span className="muted">
                Olá, <b>{userName}</b>
              </span> */}
            </div>
            <button
              className="btn btn-secondary mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
              aria-label="Menu"
            >
              {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>

          <div id="content">{children}</div>
        </main>
      </div>
    </>
  );
}
