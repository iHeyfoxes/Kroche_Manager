'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseErrorText } from '@/lib/utils';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [termos, setTermos] = useState(false);
  const [privacidade, setPrivacidade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState<{ tipo: 'erro' | 'sucesso'; msg: string } | null>(null);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (senha !== confirmarSenha) {
      setAlerta({ tipo: 'erro', msg: 'As senhas não coincidem.' });
      return;
    }
    if (senha.length < 8) {
      setAlerta({ tipo: 'erro', msg: 'A senha deve possuir pelo menos 8 caracteres.' });
      return;
    }
    if (!nicho) {
      setAlerta({ tipo: 'erro', msg: 'Selecione o segmento do seu negócio.' });
      return;
    }
    if (!termos || !privacidade) {
      setAlerta({ tipo: 'erro', msg: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          nicho: nicho,
          aceitou_termos: true,
          aceitou_politica: true,
        },
      },
    });

    if (error) {
      setAlerta({ tipo: 'erro', msg: supabaseErrorText(error) });
      setLoading(false);
      return;
    }

    setAlerta({ tipo: 'sucesso', msg: 'Conta criada com sucesso! Redirecionando para o login...' });
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  return (
    <div className="kroche-auth-page">
      <main className="kroche-auth-shell">
        <section className="kroche-auth-form-panel">
          <div className="kroche-auth-brand">
            <span className="kroche-brand-mark">⚡</span>
            <span>Gestor <b>Pro</b></span>
          </div>

          <div className="kroche-auth-form-wrap">
            <span className="kroche-auth-kicker">GESTÃO EMPRESARIAL INTELIGENTE</span>
            <h1>Criar sua conta</h1>
            <p className="kroche-auth-lead">
              Organize vendas, compras, estoque e clientes da sua empresa em um só lugar.
            </p>

            {alerta && (
              <div className={`alerta ${alerta.tipo}`} role="alert">
                {alerta.msg}
              </div>
            )}

            <form onSubmit={handleCadastro} className="kroche-login-form">
              <div className="kroche-field">
                <label className="form-label" htmlFor="nome">Seu nome</label>
                <input
                  type="text"
                  id="nome"
                  className="form-control"
                  placeholder="Como podemos chamar você?"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="kroche-field">
                <label className="form-label" htmlFor="nicho">Qual é o ramo da sua empresa?</label>
                <select
                  id="nicho"
                  className="form-control"
                  required
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                >
                  <option value="" disabled>Selecione o ramo de atuação</option>
                  <option value="Ótica e Acessórios Ópticos">Ótica e Acessórios Ópticos</option>
                  <option value="Comércio & Varejo em Geral">Comércio & Varejo em Geral</option>
                  <option value="Prestação de Serviços">Prestação de Serviços</option>
                  <option value="Saúde, Estética e Beleza">Saúde, Estética e Beleza</option>
                  <option value="Ateliê, Moda e Confecção">Ateliê, Moda e Confecção</option>
                  <option value="Alimentação e Gastronomia">Alimentação e Gastronomia</option>
                  <option value="Papelaria e Presentes">Papelaria e Presentes</option>
                  <option value="Tecnologia e Informática">Tecnologia e Informática</option>
                  <option value="Outro Ramo de Atuação">Outro Ramo de Atuação</option>
                </select>
              </div>

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
                <label className="form-label" htmlFor="senha">Senha</label>
                <input
                  type="password"
                  id="senha"
                  className="form-control"
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <div className="kroche-field">
                <label className="form-label" htmlFor="confirmar_senha">Confirmar senha</label>
                <input
                  type="password"
                  id="confirmar_senha"
                  className="form-control"
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="termos"
                    required
                    checked={termos}
                    onChange={(e) => setTermos(e.target.checked)}
                  />
                  <span>
                    Li e aceito os <Link href="/termos-de-uso" target="_blank" style={{ color: 'var(--marrom-principal)', fontWeight: 700 }}>Termos de Uso</Link>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="privacidade"
                    required
                    checked={privacidade}
                    onChange={(e) => setPrivacidade(e.target.checked)}
                  />
                  <span>
                    Li e aceito a <Link href="/politica-de-privacidade" target="_blank" style={{ color: 'var(--marrom-principal)', fontWeight: 700 }}>Política de Privacidade</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="kroche-primary-button"
                disabled={loading}
              >
                <span>{loading ? 'Criando conta...' : 'Criar minha conta'}</span>
                <span>→</span>
              </button>
            </form>

            <div className="kroche-auth-register">
              Já tem conta? <Link href="/login">Entrar</Link>
            </div>
          </div>
        </section>

        <section className="kroche-auth-visual">
          <div className="kroche-visual-content">
            <span className="kroche-visual-badge">✦ SISTEMA MULTI-RAMOS</span>
            <h2>
              Controle total para fazer sua empresa <em>prosperar.</em>
            </h2>
            <p>
              Tenha produtos, vendas, ordens de serviço, estoque e finanças em um só lugar — ideal para óticas, varejo e serviços.
            </p>
            <div className="kroche-benefit-list">
              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Operação comercial ágil</strong>
                  <small>Registre vendas e ordens com cálculo automático de saldos.</small>
                </div>
              </div>
              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Estoque e compras sob controle</strong>
                  <small>Acompanhe insumos, produtos e alertas de reposição mínima.</small>
                </div>
              </div>
              <div className="kroche-benefit">
                <span>✓</span>
                <div>
                  <strong>Decisões financeiras com clareza</strong>
                  <small>Acompanhe faturamento, custos e lucratividade real.</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
