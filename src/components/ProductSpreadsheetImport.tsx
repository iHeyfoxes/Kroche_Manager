'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMoney, slugify } from '@/lib/utils';
import {
  parseProductsSpreadsheet,
  generateSampleCsv,
  ParsedProductRow,
  ParseResult,
} from '@/lib/spreadsheetParser';
import { CategoriaProduto, Produto } from '@/types/database';

interface ProductSpreadsheetImportProps {
  userId: string;
  categoriasExistentes: CategoriaProduto[];
  produtosExistentes: Produto[];
  onSuccess: (result: { cadastrados: number; atualizados: number; categoriasCriadas: number }) => void;
  onCancel?: () => void;
}

export default function ProductSpreadsheetImport({
  userId,
  categoriasExistentes,
  produtosExistentes,
  onSuccess,
  onCancel,
}: ProductSpreadsheetImportProps) {
  // Estado da aba de entrada: 'arquivo' ou 'texto'
  const [inputTab, setInputTab] = useState<'arquivo' | 'texto'>('arquivo');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de parsing
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Configurações de importação
  const [duplicateAction, setDuplicateAction] = useState<'atualizar' | 'duplicar'>('atualizar');
  const [autoCriarCategorias, setAutoCriarCategorias] = useState(true);
  const [sincronizarEstoque, setSincronizarEstoque] = useState(true);

  // Estados de execução
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processa o arquivo selecionado
  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setFeedback(null);
    setParsing(true);

    try {
      const res = await parseProductsSpreadsheet(file);
      setParseResult(res);
      setRows(res.rows);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo da planilha.');
      setParseResult(null);
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  // Processa o texto colado
  const handleProcessText = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('Cole o conteúdo da planilha no campo antes de processar.');
      return;
    }

    setErrorMsg(null);
    setFeedback(null);
    setParsing(true);

    try {
      const res = await parseProductsSpreadsheet(pastedText);
      setParseResult(res);
      setRows(res.rows);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o texto colado.');
      setParseResult(null);
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  // Download do arquivo modelo CSV
  const handleDownloadSample = () => {
    const csvContent = generateSampleCsv();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_produtos_catalogo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Edição rápida de uma linha
  const handleUpdateRow = (index: number, field: keyof ParsedProductRow, value: any) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i === index) {
          const updated = { ...r, [field]: value };
          if (field === 'nome') {
            updated.valido = Boolean(String(value).trim());
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Remove linha da lista antes de importar
  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Reinicia o fluxo para escolher outro arquivo
  const handleReset = () => {
    setSelectedFile(null);
    setPastedText('');
    setParseResult(null);
    setRows([]);
    setErrorMsg(null);
    setFeedback(null);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Executa o auto-cadastro no banco de dados
  const handleConfirmImport = async () => {
    if (!userId || rows.length === 0) return;

    setImporting(true);
    setFeedback(null);

    const validRows = rows.filter((r) => r.valido && r.nome.trim());
    if (validRows.length === 0) {
      setFeedback({ tipo: 'err', texto: 'Nenhum produto válido para cadastrar. Verifique a lista.' });
      setImporting(false);
      return;
    }

    setProgress({ current: 0, total: validRows.length });

    try {
      // 1. Mapeamento e criação automática de categorias
      const categoryMap = new Map<string, number>();
      categoriasExistentes.forEach((c) => {
        categoryMap.set(c.nome.trim().toLowerCase(), c.id);
      });

      let categoriasCriadasCount = 0;

      if (autoCriarCategorias) {
        // Encontra categorias únicas nos produtos importados
        const categoriasNaPlanilha = Array.from(
          new Set(
            validRows
              .map((r) => r.categoria.trim())
              .filter((c) => Boolean(c))
          )
        );

        for (const catNome of categoriasNaPlanilha) {
          const key = catNome.toLowerCase();
          if (!categoryMap.has(key)) {
            // Cria a categoria no banco
            const slug = slugify(catNome);
            const { data: newCat, error: catErr } = await supabase
              .from('categorias_produtos')
              .insert({
                usuario_id: userId,
                nome: catNome,
                slug,
              })
              .select('id, nome')
              .single();

            if (!catErr && newCat) {
              categoryMap.set(key, newCat.id);
              categoriasCriadasCount++;
            } else {
              // Se já existir por slug ou constraint única, busca existente
              const { data: existingCat } = await supabase
                .from('categorias_produtos')
                .select('id, nome')
                .eq('usuario_id', userId)
                .ilike('nome', catNome)
                .maybeSingle();

              if (existingCat) {
                categoryMap.set(key, existingCat.id);
              }
            }
          }
        }
      }

      // 2. Mapeamento de produtos existentes por nome
      const existingProdMap = new Map<string, Produto>();
      produtosExistentes.forEach((p) => {
        existingProdMap.set(p.nome.trim().toLowerCase(), p);
      });

      // Mapeamento de materiais existentes no estoque
      const existingMatMap = new Map<string, number>();
      if (sincronizarEstoque) {
        const { data: mats } = await supabase
          .from('materiais')
          .select('id, nome')
          .eq('usuario_id', userId);
        if (mats) {
          mats.forEach((m: any) => existingMatMap.set(m.nome.trim().toLowerCase(), m.id));
        }
      }

      let cadastradosCount = 0;
      let atualizadosCount = 0;

      // 3. Inserção ou atualização linha por linha
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setProgress({ current: i + 1, total: validRows.length });

        const catId = row.categoria ? categoryMap.get(row.categoria.trim().toLowerCase()) || null : null;
        const normName = row.nome.trim().toLowerCase();
        const existing = duplicateAction === 'atualizar' ? existingProdMap.get(normName) : null;

        const basePayload: any = {
          nome: row.nome.trim(),
          preco: row.preco,
          quantidade: row.quantidade,
          estoque_minimo: row.estoqueMinimo,
          tempo_producao: row.tempoProducao,
          mostrar_catalogo: row.mostrarCatalogo,
          categoria_id: catId,
        };

        if (row.descricao) {
          basePayload.descricao = row.descricao;
        }

        // Tenta incluir coluna de categoria textual para compatibilidade com catálogo público
        if (row.categoria) {
          basePayload.categoria = row.categoria.trim();
        }

        if (existing) {
          // Atualiza produto existente
          let updateRes = await supabase
            .from('produtos')
            .update(basePayload)
            .eq('id', existing.id)
            .eq('usuario_id', userId);

          // Se a coluna 'categoria' não existir na tabela, tenta sem ela
          if (updateRes.error && updateRes.error.message.includes('categoria')) {
            delete basePayload.categoria;
            updateRes = await supabase
              .from('produtos')
              .update(basePayload)
              .eq('id', existing.id)
              .eq('usuario_id', userId);
          }

          if (updateRes.error) {
            console.error(`Erro ao atualizar produto ${row.nome}:`, updateRes.error);
          } else {
            atualizadosCount++;
          }
        } else {
          // Cadastra novo produto
          basePayload.usuario_id = userId;

          let insertRes = await supabase.from('produtos').insert(basePayload);

          // Se a coluna 'categoria' não existir na tabela, tenta sem ela
          if (insertRes.error && insertRes.error.message.includes('categoria')) {
            delete basePayload.categoria;
            insertRes = await supabase.from('produtos').insert(basePayload);
          }

          if (insertRes.error) {
            console.error(`Erro ao inserir produto ${row.nome}:`, insertRes.error);
          } else {
            cadastradosCount++;
          }
        }

        // Sincronização automática com a tabela de materiais (Controle de Estoque)
        if (sincronizarEstoque) {
          const matId = existingMatMap.get(normName);
          if (matId) {
            await supabase
              .from('materiais')
              .update({
                quantidade: row.quantidade,
                estoque_minimo: row.estoqueMinimo,
                custo_unitario: row.preco,
                categoria: row.categoria ? row.categoria.trim() : null,
              })
              .eq('id', matId)
              .eq('usuario_id', userId);
          } else {
            const { data: newMat } = await supabase
              .from('materiais')
              .insert({
                usuario_id: userId,
                nome: row.nome.trim(),
                categoria: row.categoria ? row.categoria.trim() : null,
                unidade: 'unidade',
                quantidade: row.quantidade,
                estoque_minimo: row.estoqueMinimo,
                custo_unitario: row.preco,
                observacoes: row.tempoProducao ? `Prazo: ${row.tempoProducao} dias` : null,
              })
              .select('id')
              .maybeSingle();

            if (newMat) {
              existingMatMap.set(normName, newMat.id);
            }
          }
        }
      }

      setFeedback({
        tipo: 'ok',
        texto: `Operação concluída! ${cadastradosCount} novos produtos cadastrados, ${atualizadosCount} atualizados${
          sincronizarEstoque ? ' (sincronizados no Catálogo e Estoque)' : ''
        }${categoriasCriadasCount > 0 ? ` e ${categoriasCriadasCount} novas categorias criadas` : ''}.`,
      });

      // Avisa componente pai e atualiza listagens
      setTimeout(() => {
        onSuccess({
          cadastrados: cadastradosCount,
          atualizados: atualizadosCount,
          categoriasCriadas: categoriasCriadasCount,
        });
      }, 1200);
    } catch (err: any) {
      setFeedback({ tipo: 'err', texto: err.message || 'Erro durante a importação dos produtos.' });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const totalCategorias = parseResult?.categoriasEncontradas.length || 0;
  const novasCategorias = parseResult
    ? parseResult.categoriasEncontradas.filter(
        (c) => !categoriasExistentes.some((ce) => ce.nome.trim().toLowerCase() === c.toLowerCase())
      )
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Alertas e mensagens de feedback */}
      {feedback && (
        <div className={`alert ${feedback.tipo}`} style={{ margin: 0 }}>
          {feedback.tipo === 'ok' ? '✅ ' : '⚠️ '}
          {feedback.texto}
        </div>
      )}

      {errorMsg && (
        <div className="alert err" style={{ margin: 0 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ETAPA 1: SELECIONAR OU COLAR PLANILHA */}
      {!parseResult ? (
        <div>
          {/* Barra de modos e download do modelo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${inputTab === 'arquivo' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputTab('arquivo')}
              >
                📁 Enviar Arquivo (.xlsx / .csv)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${inputTab === 'texto' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputTab('texto')}
              >
                📋 Colar Dados / CSV
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadSample}
              title="Baixar planilha modelo com as colunas corretas preenchidas"
            >
              📥 Baixar Planilha Modelo (.csv)
            </button>
          </div>

          {/* Modo Arquivo */}
          {inputTab === 'arquivo' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--marrom-principal)' : 'var(--borda)'}`,
                borderRadius: '14px',
                padding: '40px 20px',
                textAlign: 'center',
                background: dragOver ? 'rgba(37, 99, 235, 0.05)' : 'var(--fundo-claro)',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
              />

              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📊</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>
                {parsing ? 'Lendo dados da planilha...' : 'Arraste sua planilha aqui ou clique para selecionar'}
              </h4>
              <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '13px' }}>
                Formatos aceitos: <b>.xlsx, .xls ou .csv</b> (Excel, LibreOffice, Google Planilhas)
              </p>

              <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="pill">Nome do Produto</span>
                <span className="pill">Preço</span>
                <span className="pill">Quantidade</span>
                <span className="pill">Estoque Mínimo</span>
                <span className="pill">Prazo de Entrega</span>
                <span className="pill">Categoria</span>
                <span className="pill">Exibição no Catálogo</span>
              </div>
            </div>
          )}

          {/* Modo Texto Colado */}
          {inputTab === 'texto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">
                  Cole os dados ou texto CSV da sua planilha abaixo (com ponto e vírgula ou vírgula):
                </label>
                <textarea
                  className="textarea"
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  placeholder={`N;Nome do Produto / Item *;Preço (R$);Quantidade em Estoque *;Estoque Mínimo;Prazo de Entrega / Produção (dias);Categoria;Exibição no Catálogo\n1;L.A CANDY;120;1;1;3;ARMAÇÕES INFANTIL MENINA;VISÍVEL NO CATÁLOGO PÚBLICO\n2;L.A SOPHIE;120;1;1;3;ARMAÇÕES JUVENIL MENINA;VISÍVEL NO CATÁLOGO PÚBLICO`}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleProcessText}
                  disabled={parsing || !pastedText.trim()}
                >
                  {parsing ? 'Processando...' : '🔍 Fazer Leitura e Auto-Cadastrar'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ETAPA 2: PRÉ-VISUALIZAÇÃO, CONFERÊNCIA E CONFIRMAÇÃO */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header de Resumo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '16px',
              background: 'var(--fundo-claro)',
              borderRadius: '12px',
              border: '1px solid var(--borda)',
            }}
          >
            <div>
              <span className="panel-kicker" style={{ color: 'var(--marrom-principal)' }}>
                LEITURA CONCLUÍDA
              </span>
              <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800 }}>
                {rows.length} {rows.length === 1 ? 'produto identificado' : 'produtos identificados'}
              </h3>
              <small className="muted">
                {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Dados importados via texto'}
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
                disabled={importing}
              >
                🔄 Escolher outra planilha
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={importing || rows.length === 0}
              >
                {importing
                  ? `Cadastrando... (${progress?.current || 0}/${progress?.total || rows.length})`
                  : `✨ Confirmar e Cadastrar ${rows.length} Produtos`}
              </button>
            </div>
          </div>

          {/* Cards de Métricas da Importação */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="metric-card" style={{ padding: '12px 16px' }}>
              <div className="metric-icon" style={{ fontSize: '20px' }}>📦</div>
              <div>
                <span className="muted" style={{ fontSize: '12px' }}>Total de itens lidos</span>
                <strong style={{ fontSize: '18px' }}>{rows.length}</strong>
              </div>
            </div>

            <div className="metric-card" style={{ padding: '12px 16px' }}>
              <div className="metric-icon" style={{ fontSize: '20px' }}>🏷️</div>
              <div>
                <span className="muted" style={{ fontSize: '12px' }}>Categorias</span>
                <strong style={{ fontSize: '18px' }}>{totalCategorias}</strong>
                {novasCategorias.length > 0 && (
                  <div>
                    <small style={{ color: 'var(--marrom-principal)', fontWeight: 600 }}>
                      +{novasCategorias.length} nova(s) categoria(s)
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="metric-card" style={{ padding: '12px 16px' }}>
              <div className="metric-icon" style={{ fontSize: '20px' }}>💰</div>
              <div>
                <span className="muted" style={{ fontSize: '12px' }}>Valor total em estoque</span>
                <strong style={{ fontSize: '18px' }}>
                  {formatMoney(rows.reduce((acc, r) => acc + r.preco * r.quantidade, 0))}
                </strong>
              </div>
            </div>
          </div>

          {/* Configurações da Importação */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--borda)',
              background: 'var(--card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>Opções do Auto-Cadastro:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  name="duplicateAction"
                  checked={duplicateAction === 'atualizar'}
                  onChange={() => setDuplicateAction('atualizar')}
                />
                <span>
                  <b>Atualizar produtos existentes</b> (se o nome já estiver cadastrado, atualiza preço e estoque)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="radio"
                  name="duplicateAction"
                  checked={duplicateAction === 'duplicar'}
                  onChange={() => setDuplicateAction('duplicar')}
                />
                <span>
                  <b>Cadastrar como novos</b> (mesmo se já existir com o mesmo nome)
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                id="checkAutoCategorias"
                checked={autoCriarCategorias}
                onChange={(e) => setAutoCriarCategorias(e.target.checked)}
              />
              <label htmlFor="checkAutoCategorias" style={{ cursor: 'pointer' }}>
                <b>Criar categorias automaticamente:</b> Se a planilha tiver uma categoria que ainda não existe no
                sistema, criá-la e vincular ao produto.
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                id="checkSincronizarEstoque"
                checked={sincronizarEstoque}
                onChange={(e) => setSincronizarEstoque(e.target.checked)}
              />
              <label htmlFor="checkSincronizarEstoque" style={{ cursor: 'pointer' }}>
                <b>📦 Sincronizar também no Controle de Estoque:</b> Cadastra e atualiza os produtos automaticamente na
                tabela de <b>Estoque / Insumos</b> (aba Estoque) com quantidade, estoque mínimo e preço.
              </label>
            </div>
          </div>

          {/* Barra de Progresso durante a importação */}
          {importing && progress && (
            <div
              style={{
                background: 'var(--card)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--borda)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px' }}>Salvando produtos no sistema...</strong>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {progress.current} de {progress.total} (
                  {Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--borda)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(progress.current / progress.total) * 100}%`,
                    background: 'var(--marrom-principal)',
                    transition: 'width .2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Tabela de Conferência dos Dados Lidos */}
          <div className="table-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Nome do Produto</th>
                  <th style={{ width: '110px' }}>Preço</th>
                  <th style={{ width: '90px' }}>Estoque</th>
                  <th style={{ width: '90px' }}>Est. Mín.</th>
                  <th style={{ width: '100px' }}>Prazo (dias)</th>
                  <th>Categoria</th>
                  <th style={{ width: '130px' }}>Catálogo</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const isNovaCategoria =
                    r.categoria &&
                    !categoriasExistentes.some(
                      (ce) => ce.nome.trim().toLowerCase() === r.categoria.trim().toLowerCase()
                    );

                  return (
                    <tr key={idx} style={{ opacity: r.valido ? 1 : 0.6 }}>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input"
                          style={{
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            minWidth: '180px',
                          }}
                          value={r.nome}
                          onChange={(e) => handleUpdateRow(idx, 'nome', e.target.value)}
                        />
                        {!r.valido && (
                          <div style={{ color: '#b3261e', fontSize: '11px', marginTop: '2px' }}>
                            Nome obrigatório
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '13px', width: '95px' }}
                          value={r.preco}
                          onChange={(e) => handleUpdateRow(idx, 'preco', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '13px', width: '75px' }}
                          value={r.quantidade}
                          onChange={(e) => handleUpdateRow(idx, 'quantidade', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '13px', width: '75px' }}
                          value={r.estoqueMinimo}
                          onChange={(e) => handleUpdateRow(idx, 'estoqueMinimo', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '13px', width: '80px' }}
                          placeholder="—"
                          value={r.tempoProducao ?? ''}
                          onChange={(e) =>
                            handleUpdateRow(
                              idx,
                              'tempoProducao',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '13px', minWidth: '140px' }}
                            value={r.categoria}
                            onChange={(e) => handleUpdateRow(idx, 'categoria', e.target.value)}
                          />
                          {isNovaCategoria && (
                            <span
                              className="pill"
                              style={{
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: 'var(--marrom-principal)',
                                fontSize: '10px',
                                whiteSpace: 'nowrap',
                              }}
                              title="Categoria nova! Será criada automaticamente"
                            >
                              +Nova
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={r.mostrarCatalogo ? 'true' : 'false'}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'mostrarCatalogo', e.target.value === 'true')
                          }
                        >
                          <option value="true">Visível</option>
                          <option value="false">Oculto</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Remover produto desta importação"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={importing}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botões Finais de Ação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid var(--borda)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={importing}
            >
              Cancelar e Escolher Outra Planilha
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmImport}
              disabled={importing || rows.length === 0}
            >
              {importing ? 'Salvando no banco...' : `✨ Salvar e Cadastrar ${rows.length} Produtos`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
