'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--fundo-claro)', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 30px', background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--borda)', boxShadow: 'var(--k-shadow)' }}>
        <div style={{ fontSize: '44px', marginBottom: '16px' }}>⚡</div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 10px', color: 'var(--texto)', letterSpacing: '-0.5px' }}>GestorPro</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
          Sistema completo de gestão comercial e empresarial para óticas, comércios, varejo e prestadores de serviço.
        </p>

        {loading ? (
          <p className="muted">Verificando sessão...</p>
        ) : user ? (
          <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
            Acessar meu Painel de Gestão →
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Entrar na minha conta →
            </Link>
            <Link href="/cadastro" className="btn btn-secondary" style={{ width: '100%' }}>
              Criar conta gratuitamente
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
