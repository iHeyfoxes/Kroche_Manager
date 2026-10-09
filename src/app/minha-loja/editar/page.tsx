'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/utils';

export default function EditarLojaPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [slogan, setSlogan] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cor, setCor] = useState('#6B4E3D');
  const [corBotao, setCorBotao] = useState('#25D366');
  const [corFundo, setCorFundo] = useState('#F7F3EF');
  const [mostrarPreco, setMostrarPreco] = useState(true);
  const [mostrarEstoque, setMostrarEstoque] = useState(true);
  const [mostrarTempo, setMostrarTempo] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setNome(profile.catalogo_nome || profile.nome || '');
      setSlogan(profile.catalogo_slogan || '');
      setWhatsapp(profile.whatsapp || '');
      setCor(profile.catalogo_cor || '#6B4E3D');
      setCorBotao(profile.catalogo_cor_botao || '#25D366');
      setCorFundo(profile.catalogo_cor_fundo || '#F7F3EF');
      setMostrarPreco(profile.mostrar_preco !== false);
      setMostrarEstoque(profile.mostrar_estoque !== false);
      setMostrarTempo(profile.mostrar_tempo !== false);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMsg(null);

    try {
      let bannerUrl = profile?.catalogo_banner || null;
      if (bannerFile) {
        bannerUrl = await uploadToStorage('banners', bannerFile, user.id);
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          catalogo_nome: nome.trim(),
          catalogo_slogan: slogan.trim(),
          whatsapp: whatsapp.trim(),
          catalogo_cor: cor,
          catalogo_cor_botao: corBotao,
          catalogo_cor_fundo: corFundo,
          mostrar_preco: mostrarPreco,
          mostrar_estoque: mostrarEstoque,
          mostrar_tempo: mostrarTempo,
          catalogo_banner: bannerUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setMsg({ tipo: 'ok', texto: 'Aparência da loja atualizada com sucesso!' });
      setTimeout(() => {
        router.push('/minha-loja');
      }, 600);
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Aparência da Minha Loja">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      <section className="dashboard-hero">
        <div>
          <span className="page-kicker">IDENTIDADE DA LOJA</span>
          <h2>Deixe seu catálogo com a sua cara.</h2>
          <p>Nome, cores, banner e opções de exibição em um único lugar.</p>
        </div>
        <Link className="btn btn-secondary" href="/minha-loja">
          ← Voltar para Minha Loja
        </Link>
      </section>

      <div className="card">
        <form onSubmit={handleSubmit} className="grid grid-2">
          <div>
            <label className="label">Nome da Loja / Catálogo</label>
            <input
              type="text"
              className="input"
              required
              placeholder="Ex.: Ótica Visão Cristal / Loja Central"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Slogan ou Frase de Boas-vindas</label>
            <input
              type="text"
              className="input"
              placeholder="Ex.: Armações selecionadas, lentes com precisão e atendimento personalizado ❤️"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
            />
          </div>

          <div>
            <label className="label">WhatsApp para Receber Pedidos</label>
            <input
              type="text"
              className="input"
              placeholder="(00) 00000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Banner da Loja (Imagem de topo)</label>
            <input
              type="file"
              className="input"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
            />
            <small className="muted">Recomendado: imagem horizontal de boa resolução.</small>
          </div>

          <div>
            <label className="label">Cor Principal da Loja</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                className="input"
                style={{ width: '60px', height: '44px', padding: '2px' }}
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
              <span className="muted">{cor}</span>
            </div>
          </div>

          <div>
            <label className="label">Cor dos Botões (CTA)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                className="input"
                style={{ width: '60px', height: '44px', padding: '2px' }}
                value={corBotao}
                onChange={(e) => setCorBotao(e.target.value)}
              />
              <span className="muted">{corBotao}</span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Cor de Fundo do Catálogo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                className="input"
                style={{ width: '60px', height: '44px', padding: '2px' }}
                value={corFundo}
                onChange={(e) => setCorFundo(e.target.value)}
              />
              <span className="muted">{corFundo}</span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '10px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={mostrarPreco}
                onChange={(e) => setMostrarPreco(e.target.checked)}
              />
              <span>Mostrar preço nos produtos do catálogo</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={mostrarEstoque}
                onChange={(e) => setMostrarEstoque(e.target.checked)}
              />
              <span>Mostrar indicador de estoque disponível</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={mostrarTempo}
                onChange={(e) => setMostrarTempo(e.target.checked)}
              />
              <span>Mostrar tempo estimado de produção</span>
            </label>
          </div>

          <div className="actions" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Aparência'}
            </button>
            <Link href="/minha-loja" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
