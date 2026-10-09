'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseErrorText } from '@/lib/utils';

export default function ResetSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'erro' | 'sucesso'; msg: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionChecked(true);
      if (!session) {
        setAlerta({
          tipo: 'erro',
          msg: 'Este link de recuperação é inválido ou expirou. Solicite um novo link na tela de recuperação.',
        });
      } else {
        setHasSession(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (senha !== confirmar) {
      setAlerta({ tipo: 'erro', msg: 'As senhas não coincidem.' });
      return;
    }
    if (senha.length < 8) {
      setAlerta({ tipo: 'erro', msg: 'A senha deve possuir pelo menos 8 caracteres.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setAlerta({ tipo: 'erro', msg: supabaseErrorText(error) });
      setLoading(false);
      return;
    }

    setAlerta({ tipo: 'sucesso', msg: 'Senha alterada com sucesso! Redirecionando para o login...' });
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--fundo-claro)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--card)', padding: '36px 30px', borderRadius: '18px', border: '1px solid var(--borda)', boxShadow: 'var(--k-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '20px', fontWeight: 800, color: 'var(--marrom-escuro)' }}>
          <span>⚡</span>
          <span>Gestor <b>Pro</b></span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: 'var(--texto)' }}>Crie uma nova senha</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
          Escolha uma senha com pelo menos 8 caracteres para proteger sua conta.
        </p>

        {alerta && (
          <div className={`alerta ${alerta.tipo}`} role="alert" style={{ marginBottom: '16px' }}>
            {alerta.msg}
          </div>
        )}

        {sessionChecked && hasSession && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label className="label" htmlFor="senha">Nova senha</label>
              <input
                type="password"
                id="senha"
                className="input"
                autoComplete="new-password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="confirmar">Confirmar nova senha</label>
              <input
                type="password"
                id="confirmar"
                className="input"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '22px', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--marrom-principal)', fontSize: '13px', fontWeight: 600 }}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
