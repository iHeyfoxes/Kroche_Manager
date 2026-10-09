'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseErrorText } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'erro' | 'sucesso' | 'info'; msg: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlerta(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setAlerta({ tipo: 'erro', msg: supabaseErrorText(error) });
      setLoading(false);
      return;
    }

    setAlerta({ tipo: 'sucesso', msg: 'Login efetuado com sucesso! Redirecionando...' });
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      setAlerta({ tipo: 'erro', msg: supabaseErrorText(error) });
      setLoading(false);
    }
  };

  return (
    <div className="kroche-auth-page">
      <main className="kroche-auth-shell">
        <section className="kroche-auth-form-panel" aria-label="Acesso ao GestorPro">
          <div className="kroche-auth-brand">
            <span className="kroche-brand-mark" aria-hidden="true">⚡</span>
            <span>Gestor <b>Pro</b></span>
          </div>

          <div className="kroche-auth-form-wrap">
            <span className="kroche-auth-kicker">GESTÃO EMPRESARIAL MODERNA</span>
            <h1>Bem-vindo de volta.</h1>
            <p className="kroche-auth-lead">
              Acompanhe suas vendas, controle seu estoque e gerencie seu negócio em um só lugar.
            </p>

            {alerta && (
              <div className={`alerta ${alerta.tipo}`} role="alert">
                {alerta.msg}
              </div>
            )}

            <form onSubmit={handleLogin} className="kroche-login-form">
              <div className="kroche-field">
                <label className="form-label" htmlFor="email">E-mail</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="kroche-field">
                <div className="kroche-label-row">
                  <label className="form-label" htmlFor="senha">Senha</label>
                  <Link href="/esqueci-senha">Esqueci minha senha</Link>
                </div>
                <input
                  type="password"
                  id="senha"
                  className="form-control"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="kroche-primary-button"
                disabled={loading}
              >
                <span>{loading ? 'Entrando...' : 'Entrar na minha conta'}</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="kroche-auth-divider" aria-hidden="true">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="kroche-google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continuar com Google
            </button>

            <p className="kroche-auth-register">
              Ainda não tem uma conta? <Link href="/cadastro">Crie sua conta gratuitamente</Link>
            </p>
          </div>

          <p className="kroche-auth-footer">
            © 2026 GestorPro · Sistema Integrado de Gestão Comercial e Empresarial.
          </p>
        </section>

        <section className="kroche-auth-visual" aria-label="Benefícios do GestorPro">
          <div className="kroche-visual-content">
            <span className="kroche-visual-badge">✦ MULTI-RAMOS & EFICIENTE</span>
            <h2>
              Mais produtividade.<br />
              <em>Menos tempo organizando.</em>
            </h2>
            <p>
              Tenha clareza sobre cada venda, cliente, ordem e movimentação financeira da sua empresa.
            </p>

            <div className="kroche-benefit-list">
              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Vendas e Ordens sob controle</strong>
                  <small>Acompanhe pedidos, orçamentos e prazos de entrega com precisão.</small>
                </div>
              </div>

              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Finanças & Lucro real</strong>
                  <small>Veja receitas, custos operacionais e margem líquida com facilidade.</small>
                </div>
              </div>

              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Catálogo online integrado</strong>
                  <small>Exiba seus produtos e receba pedidos organizados via WhatsApp.</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
