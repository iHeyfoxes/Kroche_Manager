'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Receita } from '@/types/database';
import { uploadToStorage } from '@/lib/utils';

interface GrauOlho {
  esferico: string;
  cilindrico: string;
  eixo: string;
  dp: string;
  altura: string;
  adicao: string;
}

export default function ReceitasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);

  // Form states - Dados Principais
  const [nome, setNome] = useState('');
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('Óculos de Grau');
  const [nivel, setNivel] = useState('Visão Simples / Monofocal');
  const [youtube, setYoutube] = useState('');
  const [pdf, setPdf] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [favorito, setFavorito] = useState(false);

  // Dados Ópticos Detalhados
  const [telefone, setTelefone] = useState('');
  const [armacao, setArmacao] = useState('');
  const [tipoLente, setTipoLente] = useState('');
  const [tratamento, setTratamento] = useState('');
  const [valor, setValor] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [adicaoGeral, setAdicaoGeral] = useState('');
  const [dnpGeral, setDnpGeral] = useState('');

  // Grau Olho Direito (OD)
  const [od, setOd] = useState<GrauOlho>({
    esferico: '',
    cilindrico: '',
    eixo: '',
    dp: '',
    altura: '',
    adicao: '',
  });

  // Grau Olho Esquerdo (OE)
  const [oe, setOe] = useState<GrauOlho>({
    esferico: '',
    cilindrico: '',
    eixo: '',
    dp: '',
    altura: '',
    adicao: '',
  });

  // Estado de arquivo anexo e leitura IA
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoPreview, setArquivoPreview] = useState<string | null>(null);
  const [lendoIA, setLendoIA] = useState(false);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);

  // Modal de Chave Gemini
  const [mostrarModalChave, setMostrarModalChave] = useState(false);
  const [chaveGeminiInput, setChaveGeminiInput] = useState('');
  const [chaveConfigurada, setChaveConfigurada] = useState(false);

  // Modal de Visualização de Anexo
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    // Checar se há chave salva no localStorage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setChaveConfigurada(true);
      setChaveGeminiInput(savedKey);
    }
  }, []);

  const loadReceitas = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .eq('user_id', user.id)
      .order('nome');

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setReceitas(data || []);
    }
  };

  useEffect(() => {
    if (user) loadReceitas();
  }, [user]);

  const categoriasUnicas = useMemo(() => {
    const set = new Set<string>();
    receitas.forEach((r) => {
      if (r.categoria && r.categoria.trim()) {
        set.add(r.categoria.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [receitas]);

  // Monta resumo formatado a partir dos campos ópticos
  const gerarResumoOptico = () => {
    const partes: string[] = [];

    const odTexto = [
      od.esferico ? `Esf ${od.esferico}` : '',
      od.cilindrico ? `Cil ${od.cilindrico}` : '',
      od.eixo ? `Eixo ${od.eixo}°` : '',
      od.dp ? `DP ${od.dp}` : '',
      od.altura ? `Alt ${od.altura}` : '',
      od.adicao ? `Adic ${od.adicao}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (odTexto) partes.push(`OD: ${odTexto}`);

    const oeTexto = [
      oe.esferico ? `Esf ${oe.esferico}` : '',
      oe.cilindrico ? `Cil ${oe.cilindrico}` : '',
      oe.eixo ? `Eixo ${oe.eixo}°` : '',
      oe.dp ? `DP ${oe.dp}` : '',
      oe.altura ? `Alt ${oe.altura}` : '',
      oe.adicao ? `Adic ${oe.adicao}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (oeTexto) partes.push(`OE: ${oeTexto}`);

    if (dnpGeral) partes.push(`DNP: ${dnpGeral}`);
    if (adicaoGeral) partes.push(`Adição: ${adicaoGeral}`);
    if (armacao) partes.push(`Armação: ${armacao}`);
    if (tipoLente) partes.push(`Lentes: ${tipoLente}`);
    if (tratamento) partes.push(`Tratamento: ${tratamento}`);
    if (telefone) partes.push(`Tel: ${telefone}`);
    if (valor) partes.push(`Valor: ${valor}`);
    if (dataEntrega) partes.push(`Entrega: ${dataEntrega}`);

    return partes.join(' | ');
  };

  const handleArquivoChange = (file: File | null) => {
    if (!file) {
      setArquivo(null);
      setArquivoPreview(null);
      return;
    }

    setArquivo(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setArquivoPreview(url);
    } else {
      setArquivoPreview(null);
    }
  };

  const salvarChaveGemini = () => {
    const limpa = chaveGeminiInput.trim();
    if (limpa) {
      localStorage.setItem('gemini_api_key', limpa);
      setChaveConfigurada(true);
      setMostrarModalChave(false);
      setMsg({ tipo: 'ok', texto: 'Chave da API do Gemini salva com sucesso!' });
      // Se tiver arquivo pendente, tenta ler novamente
      if (arquivo) {
        processarLeituraComIA(arquivo, limpa);
      }
    } else {
      localStorage.removeItem('gemini_api_key');
      setChaveConfigurada(false);
      setMostrarModalChave(false);
    }
  };

  const processarLeituraComIA = async (fileToRead?: File, chaveOverride?: string) => {
    const file = fileToRead || arquivo;
    if (!file) {
      setMsg({ tipo: 'err', texto: 'Por favor, selecione ou anexe uma imagem ou PDF antes de solicitar a leitura.' });
      return;
    }

    setLendoIA(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiKey = chaveOverride || localStorage.getItem('gemini_api_key') || '';

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const res = await fetch('/api/ler-receita', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.sucesso) {
        if (data.erro === 'CHAVE_NAO_CONFIGURADA') {
          setMostrarModalChave(true);
          setMsg({
            tipo: 'err',
            texto: 'Chave de API do Google Gemini não configurada. Cole sua chave gratuita para ler receitas automaticamente.',
          });
          setLendoIA(false);
          return;
        }
        throw new Error(data.mensagem || 'Falha ao ler dados da receita');
      }

      // Preenchimento automático dos dados recebidos da IA
      if (data.cliente_nome) setNome(data.cliente_nome);
      if (data.cliente_telefone) setTelefone(data.cliente_telefone);

      const medicoOtica = data.medico_ou_otica || '';
      const numPed = data.numero_pedido ? `Pedido ${data.numero_pedido}` : '';
      const autorFinal = [medicoOtica, numPed].filter(Boolean).join(' - ');
      if (autorFinal) setAutor(autorFinal);

      if (data.categoria) setCategoria(data.categoria);
      if (data.tipo_lente) {
        setTipoLente(data.tipo_lente);
        const tipoLower = data.tipo_lente.toLowerCase();
        if (tipoLower.includes('multi')) setNivel('Multifocal / Progressiva');
        else if (tipoLower.includes('bi')) setNivel('Bifocal');
        else if (tipoLower.includes('mono')) setNivel('Visão Simples / Monofocal');
      }
      if (data.armacao) setArmacao(data.armacao);
      if (data.tratamento) setTratamento(data.tratamento);
      if (data.valor) setValor(data.valor);
      if (data.data_entrega) setDataEntrega(data.data_entrega);

      // Grau OD
      if (data.grau?.od) {
        setOd({
          esferico: data.grau.od.esferico || '',
          cilindrico: data.grau.od.cilindrico || '',
          eixo: data.grau.od.eixo || '',
          dp: data.grau.od.dp || '',
          altura: data.grau.od.altura || '',
          adicao: data.grau.od.adicao || '',
        });
      }

      // Grau OE
      if (data.grau?.oe) {
        setOe({
          esferico: data.grau.oe.esferico || '',
          cilindrico: data.grau.oe.cilindrico || '',
          eixo: data.grau.oe.eixo || '',
          dp: data.grau.oe.dp || '',
          altura: data.grau.oe.altura || '',
          adicao: data.grau.oe.adicao || '',
        });
      }

      if (data.grau?.adicao_geral) setAdicaoGeral(data.grau.adicao_geral);
      if (data.grau?.dnp_geral) setDnpGeral(data.grau.dnp_geral);

      // Observações
      const extras = [data.resumo_formatado, data.pagamento, data.observacoes_extras]
        .filter(Boolean)
        .join(' | ');
      if (extras) {
        setObservacoes(extras);
      }

      setMsg({
        tipo: 'ok',
        texto: '✨ Receita lida com sucesso! Os graus e dados do paciente foram preenchidos automaticamente no cadastro.',
      });
    } catch (err: any) {
      console.error(err);
      setMsg({ tipo: 'err', texto: err?.message || 'Erro ao processar imagem da receita.' });
    } finally {
      setLendoIA(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMsg(null);

    try {
      let urlArquivoSalvo = pdf.trim() || null;

      // Se há um arquivo anexo selecionado e ainda não tem link do storage
      if (arquivo) {
        setUploadingArquivo(true);
        try {
          const urlGerada = await uploadToStorage('receitas', arquivo, user.id);
          urlArquivoSalvo = urlGerada;
        } catch (uploadErr: any) {
          console.warn('Falha ao subir arquivo no storage:', uploadErr);
          // Continua o salvamento mesmo se o upload falhar, alertando o usuário
          setMsg({
            tipo: 'err',
            texto: `Aviso: não foi possível anexar o arquivo na nuvem (${uploadErr?.message}), mas salvaremos os dados.`,
          });
        } finally {
          setUploadingArquivo(false);
        }
      }

      // Compilar observações com os graus oftálmicos caso tenham sido preenchidos
      const resumoOptico = gerarResumoOptico();
      let observacoesFinais = observacoes.trim();
      if (resumoOptico) {
        if (!observacoesFinais) {
          observacoesFinais = resumoOptico;
        } else if (!observacoesFinais.includes('OD:') && !observacoesFinais.includes('OE:')) {
          observacoesFinais = `${resumoOptico} | ${observacoesFinais}`;
        }
      }

      const { error } = await supabase.from('receitas').insert({
        nome: nome.trim(),
        autor: autor.trim() || null,
        categoria: categoria.trim() || null,
        nivel,
        youtube: youtube.trim() || null,
        pdf: urlArquivoSalvo,
        observacoes: observacoesFinais || null,
        favorito,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }

      setMsg({ tipo: 'ok', texto: 'Prescrição / Ficha Técnica cadastrada com sucesso!' });

      // Resetar formulário
      setNome('');
      setAutor('');
      setCategoria('Óculos de Grau');
      setNivel('Visão Simples / Monofocal');
      setYoutube('');
      setPdf('');
      setObservacoes('');
      setFavorito(false);
      setTelefone('');
      setArmacao('');
      setTipoLente('');
      setTratamento('');
      setValor('');
      setDataEntrega('');
      setAdicaoGeral('');
      setDnpGeral('');
      setOd({ esferico: '', cilindrico: '', eixo: '', dp: '', altura: '', adicao: '' });
      setOe({ esferico: '', cilindrico: '', eixo: '', dp: '', altura: '', adicao: '' });
      setArquivo(null);
      setArquivoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadReceitas();
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Erro ao salvar registro.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorito = async (r: Receita) => {
    if (!user) return;
    const novoStatus = !r.favorito;

    const { error } = await supabase
      .from('receitas')
      .update({ favorito: novoStatus })
      .eq('id', r.id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setReceitas((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, favorito: novoStatus } : item))
      );
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja excluir este registro?')) return;
    if (!user) return;

    const { error } = await supabase
      .from('receitas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setMsg({ tipo: 'err', texto: error.message });
    } else {
      setMsg({ tipo: 'ok', texto: 'Registro excluído com sucesso!' });
      loadReceitas();
    }
  };

  const copiarDadosGrau = (r: Receita) => {
    const texto = `${r.nome}\n${r.observacoes || ''}\n${r.autor || ''}`;
    navigator.clipboard.writeText(texto.trim());
    alert('Dados do grau copiados para a área de transferência!');
  };

  const aplicarModeloGrau = () => {
    setOd({ esferico: '0.00', cilindrico: '-1.00', eixo: '180', dp: '31', altura: '', adicao: '' });
    setOe({ esferico: '-0.25', cilindrico: '-0.75', eixo: '175', dp: '31', altura: '', adicao: '' });
    setDnpGeral('62');
    setArmacao('Armação Padrão');
    setTipoLente('Monofocal');
    setTratamento('Antirreflexo / Filtro Azul');
    setCategoria('Óculos de Grau');
    setObservacoes('OD: Esf 0.00 Cil -1.00 Eixo 180° | OE: Esf -0.25 Cil -0.75 Eixo 175° | DNP: 62mm');
  };

  const filtradas = useMemo(() => {
    const term = busca.toLowerCase().trim();
    return receitas.filter((r) => {
      const texto = [r.nome, r.autor, r.categoria, r.observacoes].join(' ').toLowerCase();
      const matchBusca = !term || texto.includes(term);
      const matchCat = categoriaFiltro === 'todas' || r.categoria === categoriaFiltro;
      const matchFav = !somenteFavoritas || !!r.favorito;
      return matchBusca && matchCat && matchFav;
    });
  }, [receitas, busca, categoriaFiltro, somenteFavoritas]);

  return (
    <AppShell title="Prescrições & Receitas de Óculos">
      {msg && <div className={`alert ${msg.tipo}`}>{msg.texto}</div>}

      {/* Modal de Configuração da Chave do Gemini */}
      {mostrarModalChave && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--card)',
              border: '1px solid var(--borda)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <h3 style={{ margin: 0 }}>Chave de IA (Google Gemini)</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setMostrarModalChave(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5', marginTop: 0 }}>
              Para realizar a <b>leitura automática e precisa de receitas e pedidos oftálmicos</b>, é utilizada a Inteligência Artificial do Google Gemini (Vision).
            </p>

            <div
              style={{
                background: 'var(--creme-suave)',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <b>Como obter gratuitamente (em 30 segundos):</b>
              <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                <li>
                  Acesse{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--marrom-principal)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Google AI Studio (aistudio.google.com)
                  </a>
                </li>
                <li>Clique em <b>"Create API key"</b></li>
                <li>Copie a chave e cole no campo abaixo:</li>
              </ol>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="label">Cole sua Chave da API do Google Gemini</label>
              <input
                type="password"
                className="input"
                placeholder="AIzaSy..."
                value={chaveGeminiInput}
                onChange={(e) => setChaveGeminiInput(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                A chave ficará salva localmente no seu navegador ou pode ser colocada em <code>.env.local</code> como <code>GEMINI_API_KEY</code>.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMostrarModalChave(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={salvarChaveGemini}
              >
                Salvar Chave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização do Anexo */}
      {previewDocUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setPreviewDocUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              maxHeight: '90vh',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
              }}
            >
              <span style={{ fontWeight: 600 }}>Visualizador de Receita / Documento</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fff', borderColor: '#475569' }}
                >
                  Abrir em nova aba ↗
                </a>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPreviewDocUrl(null)}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            <div style={{ padding: '8px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              {previewDocUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewDocUrl}
                  style={{ width: '800px', height: '75vh', border: 'none' }}
                  title="PDF Receita"
                />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Receita Anexada"
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARD PRINCIPAL: CADASTRO COM ANEXO E LEITURA POR IA */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="panel-kicker">DOCUMENTAÇÃO & RECEITUÁRIO ÓPTICO</span>
            <h3 style={{ margin: '4px 0 0' }}>Cadastrar Prescrição & Ordem de Serviço</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setMostrarModalChave(true)}
              title="Configurar chave de IA Gemini para leitura automática"
            >
              ⚙️ {chaveConfigurada ? 'Chave IA Configurada' : 'Configurar Chave IA'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={aplicarModeloGrau}
              title="Preencher com valores modelo de óculos de grau"
            >
              👓 Modelo de Grau
            </button>
          </div>
        </div>

        {/* SEÇÃO DE ANEXO DE ARQUIVO E SCAN COM IA */}
        <div
          style={{
            border: '2px dashed var(--borda)',
            borderRadius: '14px',
            padding: '18px',
            background: 'var(--creme-suave)',
            marginBottom: '20px',
            transition: 'all .2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>📎</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block' }}>Anexar Arquivo da Receita / Pedido</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Selecione uma foto (JPG, PNG) ou PDF do pedido de ótica ou receita médica para extrair os dados.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleArquivoChange(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 {arquivo ? 'Trocar Arquivo' : 'Escolher Arquivo...'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!arquivo || lendoIA}
                onClick={() => processarLeituraComIA()}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {lendoIA ? (
                  <>⏳ Lendo receita com IA...</>
                ) : (
                  <>✨ Ler Receita com IA (Gemini)</>
                )}
              </button>
            </div>
          </div>

          {/* Pré-visualização do arquivo selecionado */}
          {arquivo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '10px 14px',
                background: 'var(--card)',
                borderRadius: '10px',
                border: '1px solid var(--borda)',
                marginTop: '10px',
              }}
            >
              {arquivoPreview ? (
                <img
                  src={arquivoPreview}
                  alt="Pré-visualização da receita"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--borda)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewDocUrl(arquivoPreview)}
                  title="Clique para ampliar"
                />
              ) : (
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--creme-suave)',
                    borderRadius: '8px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '24px',
                  }}
                >
                  📄
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {arquivo.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {(arquivo.size / 1024).toFixed(1)} KB • {arquivo.type || 'Documento'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {arquivoPreview && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewDocUrl(arquivoPreview)}
                  >
                    🔍 Ampliar
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444' }}
                  onClick={() => handleArquivoChange(null)}
                >
                  ✕ Remover
                </button>
              </div>
            </div>
          )}

          {lendoIA && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #2563eb',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span>A Inteligência Artificial está analisando os dados do paciente, tabela oftálmica (OD / OE) e especificações...</span>
            </div>
          )}
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
        <form onSubmit={handleSalvar}>
          <div className="grid grid-3" style={{ marginBottom: '16px' }}>
            <div>
              <label className="label">Paciente / Cliente *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="Ex.: Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: (00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Médico / Ótica / Pedido</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: L.A SUNGLASSES - Pedido 1000"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: Óculos de Grau"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tipo de Lente / Complexidade</label>
              <select
                className="select"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              >
                <option>Visão Simples / Monofocal</option>
                <option>Multifocal / Progressiva</option>
                <option>Bifocal</option>
                <option>Lente de Contato</option>
                <option>Alta Dioptria / Especial</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Armação</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: OVAL MIU MIU"
                value={armacao}
                onChange={(e) => setArmacao(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tratamento / Filtro</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: BLUE FILTER, Antirreflexo"
                value={tratamento}
                onChange={(e) => setTratamento(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Valor Total</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: R$ 220,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Data / Previsão de Entrega</label>
              <input
                type="text"
                className="input"
                placeholder="Ex.: 29/09/2026 a 30/09/2026"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          </div>

          {/* TABELA OFTÁLMICA DE GRAU (LONGE / PERTO) */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--borda)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>👓</span>
                <strong style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tabela de Grau Óptico (LONGE / DIOPTRIAS)
                </strong>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Valores preenchidos automaticamente pela IA ou editáveis manualmente
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--creme-suave)', borderBottom: '1px solid var(--borda)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '90px' }}>OLHO</th>
                    <th style={{ padding: '8px 8px' }}>ESFÉRICO (ESF)</th>
                    <th style={{ padding: '8px 8px' }}>CILÍNDRICO (CIL)</th>
                    <th style={{ padding: '8px 8px' }}>EIXO</th>
                    <th style={{ padding: '8px 8px' }}>D.P. / DNP</th>
                    <th style={{ padding: '8px 8px' }}>ALTURA</th>
                    <th style={{ padding: '8px 8px' }}>ADIÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {/* LINHA OD */}
                  <tr style={{ borderBottom: '1px solid var(--borda)' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2563eb' }}>
                      OD (Direito)
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-"
                        value={od.esferico}
                        onChange={(e) => setOd({ ...od, esferico: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-1,00"
                        value={od.cilindrico}
                        onChange={(e) => setOd({ ...od, cilindrico: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="0"
                        value={od.eixo}
                        onChange={(e) => setOd({ ...od, eixo: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="0"
                        value={od.dp}
                        onChange={(e) => setOd({ ...od, dp: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-"
                        value={od.altura}
                        onChange={(e) => setOd({ ...od, altura: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-"
                        value={od.adicao}
                        onChange={(e) => setOd({ ...od, adicao: e.target.value })}
                      />
                    </td>
                  </tr>

                  {/* LINHA OE */}
                  <tr>
                    <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2563eb' }}>
                      OE (Esquerdo)
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-0,00"
                        value={oe.esferico}
                        onChange={(e) => setOe({ ...oe, esferico: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-0,00"
                        value={oe.cilindrico}
                        onChange={(e) => setOe({ ...oe, cilindrico: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="0"
                        value={oe.eixo}
                        onChange={(e) => setOe({ ...oe, eixo: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="0"
                        value={oe.dp}
                        onChange={(e) => setOe({ ...oe, dp: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-"
                        value={oe.altura}
                        onChange={(e) => setOe({ ...oe, altura: e.target.value })}
                      />
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ textAlign: 'center', padding: '6px' }}
                        placeholder="-"
                        value={oe.adicao}
                        onChange={(e) => setOe({ ...oe, adicao: e.target.value })}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label className="label">Adição Geral / Perto</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex.: +0.00"
                  value={adicaoGeral}
                  onChange={(e) => setAdicaoGeral(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label className="label">DNP Total (Distância Pupilar Total)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex.: 62 mm"
                  value={dnpGeral}
                  onChange={(e) => setDnpGeral(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* DADOS ADICIONAIS & OBSERVAÇÕES */}
          <div className="grid grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label className="label">Link da Receita ou Documento na Nuvem (Opcional)</label>
              <input
                type="url"
                className="input"
                placeholder="https://drive.google.com/... ou URL do Supabase"
                value={pdf}
                onChange={(e) => setPdf(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                Se você anexou um arquivo acima, o link será gerado automaticamente ao salvar.
              </span>
            </div>

            <div>
              <label className="label">Link de Vídeo / Tutorial (Opcional)</label>
              <input
                type="url"
                className="input"
                placeholder="https://youtube.com/watch?v=..."
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Observações e Especificações da Prescrição</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Ex.: OD: Esf -0.00 Cil -0.00 Eixo 180° | OE: Esf -0.00 Cil -0.00 Eixo 170° | Chave PIX: ..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={favorito}
                onChange={(e) => setFavorito(e.target.checked)}
              />
              <span style={{ fontWeight: 600 }}>⭐ Destacar nos favoritos</span>
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || uploadingArquivo}
              style={{ minWidth: '180px' }}
            >
              {submitting || uploadingArquivo ? 'Salvando...' : 'Salvar Prescrição / Pedido'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTAGEM DE REGISTROS CADASTRADOS */}
      <div className="card">
        <div className="panel-heading" style={{ flexWrap: 'wrap' }}>
          <div>
            <span className="panel-kicker">ARQUIVO DE REGISTROS</span>
            <h3>Prescrições e Pedidos de Óculos Cadastrados</h3>
          </div>
          <span className="pill">{filtradas.length} registro(s)</span>
        </div>

        <div className="grid grid-3" style={{ marginBottom: '18px' }}>
          <div>
            <label className="label">Buscar</label>
            <input
              type="search"
              className="input"
              placeholder="Buscar por paciente, ótica ou especificações..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="select"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="todas">Todas as categorias</option>
              {categoriasUnicas.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={somenteFavoritas}
                onChange={(e) => setSomenteFavoritas(e.target.checked)}
              />
              <span>Somente favoritos</span>
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Paciente / Cliente</th>
                <th>Médico / Ótica / Pedido</th>
                <th>Grau & Ficha Técnica</th>
                <th>Categoria & Tipo</th>
                <th>Documento</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length > 0 ? (
                filtradas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>{r.favorito ? '⭐ ' : ''}{r.nome}</b>
                      {r.data && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          Cadastrado em {new Date(r.data).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td>{r.autor || '—'}</td>
                    <td style={{ maxWidth: '320px' }}>
                      {r.observacoes ? (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--texto)',
                            background: 'var(--creme-suave)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--borda)',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                          }}
                        >
                          {r.observacoes}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Sem especificações</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="pill" style={{ width: 'fit-content' }}>
                          {r.categoria || 'Geral'}
                        </span>
                        {r.nivel && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--muted)',
                              fontWeight: 500,
                            }}
                          >
                            {r.nivel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.pdf && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => setPreviewDocUrl(r.pdf || '')}
                            title="Ver receita ou pedido anexado"
                          >
                            📄 Ver Anexo
                          </button>
                        )}
                        {r.youtube && (
                          <a
                            href={r.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            ▶️ Vídeo
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => copiarDadosGrau(r)}
                        title="Copiar dados do grau para WhatsApp ou área de transferência"
                      >
                        📋 Copiar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleToggleFavorito(r)}
                      >
                        {r.favorito ? 'Desfavoritar' : '⭐ Destacar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExcluir(r.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '24px' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
