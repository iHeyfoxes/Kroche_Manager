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
  const { user, profile, loading, theme, toggleTheme, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setSidebarOpen(false);

  const navLinks: Array<{
    section?: string;
    href?: string;
    label?: string;
    icon?: React.ComponentType;
  }> = [
    { section: 'Visão Geral' },
    { href: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { section: 'Operação do Ateliê' },
    { href: '/vendas', label: 'Vendas & Pedidos', icon: Icons.Vendas },
    { href: '/encomendas', label: 'Encomendas', icon: Icons.Encomendas },
    { href: '/compras', label: 'Compras & Custos', icon: Icons.Compras },
    { href: '/estoque', label: 'Estoque de Fios', icon: Icons.Estoque },
    { href: '/receitas', label: 'Receitas & Fichas', icon: Icons.Receitas },
    { section: 'Clientes & Catálogo' },
    { href: '/leads', label: 'Clientes & Contatos', icon: Icons.Leads },
    { href: '/minha-loja', label: 'Catálogo / Loja Online', icon: Icons.Loja },
    { section: 'Gestão Financeira' },
    { href: '/relatorios', label: 'Relatórios Financeiros', icon: Icons.Relatorios },
    { href: '/calculadora', label: 'Calculadora de Preço', icon: Icons.Calculadora },
    { section: 'Configurações' },
    { href: '/perfil', label: 'Meu Perfil & Ateliê', icon: Icons.Perfil },
    { href: '/ajuda', label: 'Central de Ajuda', icon: Icons.Ajuda },
  ];

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>🧶</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: 'var(--texto)' }}>Carregando seu ateliê...</h2>
          <p className="muted" style={{ margin: 0, fontSize: '14px' }}>Preparando Kroche Manager</p>
        </div>
      </div>
    );
  }

  const businessName = profile?.catalogo_nome?.trim() || '';
  const userName = profile?.nome?.trim() || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Artesã';
  const userSubtitle = businessName || user?.email || 'Ateliê Kroche';

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
                <span className="brand-icon">🧶</span>
              </div>
              <div className="brand-text">
                <span className="brand-name" title={businessName || 'Kroche Manager'}>
                  {businessName ? businessName : <>Kroche <b>Manager</b></>}
                </span>
                <span className="brand-sub">Gestão do Ateliê</span>
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
              <div className="page-kicker">PAINEL DO ATELIÊ</div>
              <h1 id="pageTitle">{title}</h1>
              <span className="muted">
                Olá, <b>{userName}</b>
              </span>
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
