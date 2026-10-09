'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/utils';

export default function PerfilPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setEmpresaNome(profile.catalogo_nome || '');
      setWhatsapp(profile.whatsapp || '');
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMsg({ tipo: 'err', texto: 'Imagem inválida. Use JPG, PNG ou WEBP de até 5 MB.' });
      return;
    }

    setFotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMsg(null);

    try {
      // 1. Password update if supplied
      if (novaSenha) {
        if (novaSenha !== confirmarSenha) {
          throw new Error('As senhas não coincidem.');
        }
        if (novaSenha.length < 8) {
          throw new Error('A senha deve possuir pelo menos 8 caracteres.');
        }
        const { error: pwdErr } = await supabase.auth.updateUser({ password: novaSenha });
        if (pwdErr) throw pwdErr;
      }

      // 2. Foto update if supplied
      let novaFoto = profile?.foto;
      if (fotoFile) {
        novaFoto = await uploadToStorage('fotos-perfil', fotoFile, user.id);
      }

      // 3. User & Company profile update
      const { error: updateErr } = await supabase
        .from('usuarios')
        .update({
          nome: nome.trim(),
          catalogo_nome: empresaNome.trim() || null,
          whatsapp: whatsapp.trim() || null,
          foto: novaFoto,
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setMsg({ tipo: 'ok', texto: 'Dados da empresa e perfil atualizados com sucesso!' });
      setNovaSenha('');
      setConfirmarSenha('');
      setFotoFile(null);
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = previewUrl || profile?.foto;

  return (
    <AppShell title="Minha Empresa & Perfil">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CADASTRO & SEGURANÇA</span>
              <h3>Dados da Empresa e Acesso</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid">
            <div>
              <label className="label">Nome da Empresa / Loja Fantasia</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: Ótica Visão Cristal / Loja Modelo"
                value={empresaNome}
                onChange={(e) => setEmpresaNome(e.target.value)}
              />
              <small className="muted">Este nome aparecerá no topo do seu painel e no catálogo.</small>
            </div>

            <div>
              <label className="label">Nome do Titular / Responsável *</label>
              <input
                type="text"
                className="input"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="label">WhatsApp Comercial</label>
              <input
                type="text"
                className="input"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div>
              <label className="label">E-mail de Acesso (Login)</label>
              <input
                type="text"
                className="input"
                disabled
                value={user?.email || '—'}
                style={{ opacity: 0.7 }}
              />
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--borda)', margin: '10px 0' }} />

            <div>
              <label className="label">Nova Senha (Opcional)</label>
              <input
                type="password"
                className="input"
                placeholder="Preencha apenas se quiser alterar"
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>

            {novaSenha && (
              <div>
                <label className="label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repita a nova senha"
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label">Logotipo / Foto de Perfil</label>
              <input
                type="file"
                className="input"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
              />
              <small className="muted">JPG, PNG ou WEBP (máx. 5 MB).</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">IDENTIDADE</span>
              <h3>Logo e Visual</h3>
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', margin: '20px 0' }}>
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Foto ou Logo da Empresa"
                className="photo"
                style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: 'var(--creme-suave)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '44px',
                }}
              >
                🏢
              </div>
            )}
          </div>

          <h3 style={{ margin: '8px 0 4px' }}>{empresaNome || profile?.nome || 'Minha Empresa'}</h3>
          <p className="muted" style={{ margin: '0 0 4px', fontSize: '13px' }}>
            Responsável: <b>{nome || profile?.nome}</b>
          </p>
          <p className="muted" style={{ margin: '0 0 18px', fontSize: '13px' }}>
            {user?.email}
          </p>

          <hr style={{ border: '0', borderTop: '1px solid var(--borda)', margin: '20px 0' }} />

          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 6px' }}>Preferências de Aparência</h4>
            <p className="muted" style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Você pode alternar entre o Modo Claro e o Modo Escuro utilizando o botão no topo da barra lateral do sistema.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
