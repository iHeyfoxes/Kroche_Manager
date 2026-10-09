'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'info'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-senha`
      : 'https://krochemanager.com.br/reset-senha';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) console.warn(error);

    setMsg({
      tipo: 'info',
      texto: 'Se o e-mail existir no sistema, enviamos um link de recuperação para sua caixa de entrada.',
    });
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--fundo-claro)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--card)', padding: '36px 30px', borderRadius: '18px', border: '1px solid var(--borda)', boxShadow: 'var(--k-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '20px', fontWeight: 800, color: 'var(--marrom-escuro)' }}>
          <span>⚡</span>
          <span>Gestor <b>Pro</b></span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: 'var(--texto)' }}>Recupere seu acesso</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
          Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.
        </p>

        {msg && (
          <div className={`alerta ${msg.tipo}`} role="alert" style={{ marginBottom: '16px' }}>
            {msg.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              className="input"
              placeholder="voce@exemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <div style={{ marginTop: '22px', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--marrom-principal)', fontSize: '13px', fontWeight: 600 }}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
