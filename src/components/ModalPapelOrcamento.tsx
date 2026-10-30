'use client';

import React, { useEffect } from 'react';
import { DadosOrcamento, gerarPdfOrcamento } from '@/lib/pdfOrcamento';
import { formatMoney, formatDate } from '@/lib/utils';

interface ModalPapelOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  dados: DadosOrcamento | null;
  whatsAppUrl?: string;
}

export default function ModalPapelOrcamento({
  isOpen,
  onClose,
  dados,
  whatsAppUrl,
}: ModalPapelOrcamentoProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dados) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      await gerarPdfOrcamento(dados);
    } catch (err: any) {
      alert('Erro ao gerar PDF: ' + (err.message || 'Tente novamente'));
    }
  };

  const valorNum = Number(dados.valor || 0);
  const sinalNum = Number(dados.sinal || 0);
  const saldoNum = Math.max(0, valorNum - sinalNum);
  const nomeEmpresa = dados.empresa?.nome || 'GestorPro';
  const sloganEmpresa = dados.empresa?.slogan || 'Orçamentos e Gestão de Pedidos';
  const numOrcamento = dados.id ? `#ORC-${String(dados.id).padStart(4, '0')}` : '#ORC-NOVO';

  const opcoesValidas = (dados.opcoes || []).filter(
    (o) => (o.valor && Number(o.valor) > 0) || (o.descricao && o.descricao.trim())
  );

  return (
    <div className="orcamento-modal-overlay" onClick={onClose}>
      <div
        className="orcamento-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Ações Superior (Não sai na impressão) */}
        <div className="orcamento-modal-header no-print">
          <div className="orcamento-modal-title">
            <span style={{ fontSize: '20px' }}>📄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Papel de Orçamento Comercial
              </h3>
              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Pronto para impressão ou download em PDF para o cliente
              </small>
            </div>
          </div>

          <div className="orcamento-modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="Abrir tela de impressão do navegador"
            >
              🖨️ Imprimir Papel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPdf}
              title="Baixar arquivo PDF formatado"
            >
              📥 Baixar em PDF
            </button>
            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                💬 WhatsApp
              </a>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Papel de Orçamento */}
        <div className="orcamento-modal-body">
          <div id="papel-orcamento-imprimir" className="papel-orcamento-folha">
            {/* Faixa decorativa superior */}
            <div className="folha-accent-bar" />

            {/* Cabeçalho */}
            <div className="folha-header">
              <div className="folha-empresa">
                <h1 className="folha-empresa-nome">{nomeEmpresa}</h1>
                <p className="folha-empresa-slogan">{sloganEmpresa}</p>
                <div className="folha-empresa-contatos">
                  {dados.empresa?.whatsapp && (
                    <span>WhatsApp: <b>{dados.empresa.whatsapp}</b></span>
                  )}
                  {dados.empresa?.email && (
                    <span>E-mail: <b>{dados.empresa.email}</b></span>
                  )}
                </div>
              </div>

              <div className="folha-orcamento-badge">
                <span className="folha-badge-titulo">PROPOSTA DE ORÇAMENTO</span>
                <span className="folha-badge-numero">{numOrcamento}</span>
                <span className="folha-badge-data">
                  Emissão: {formatDate(dados.data || new Date().toISOString())}
                </span>
                <span className="folha-badge-validade">
                  Validade: 15 dias corridos
                </span>
              </div>
            </div>

            <div className="folha-divisor" />

            {/* Dados do Cliente e Atendimento */}
            <div className="folha-secao-box">
              <div className="folha-secao-box-title">DADOS DO CLIENTE & ATENDIMENTO</div>
              <div className="folha-grid-dados">
                <div>
                  <span className="folha-rotulo">Cliente:</span>
                  <strong className="folha-valor">{dados.cliente}</strong>
                </div>
                <div>
                  <span className="folha-rotulo">Telefone / WhatsApp:</span>
                  <span className="folha-valor">{dados.telefone || 'Não informado'}</span>
                </div>
                <div>
                  <span className="folha-rotulo">Previsão de Entrega:</span>
                  <span className="folha-valor">
                    {dados.dataEntrega ? formatDate(dados.dataEntrega) : 'A combinar / Imediato'}
                  </span>
                </div>
                <div>
                  <span className="folha-rotulo">Status:</span>
                  <span className="folha-valor">{dados.status || 'Pendente'}</span>
                </div>
              </div>
            </div>

            {/* Item / Serviço Solicitado */}
            <div className="folha-secao">
              <div className="folha-secao-titulo">ITEM / SERVIÇO SOLICITADO</div>
              <table className="folha-tabela">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Descrição do Item / Serviço</th>
                    <th style={{ textAlign: 'center', width: '20%' }}>Quantidade</th>
                    <th style={{ textAlign: 'right', width: '20%' }}>Referência</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{dados.produto}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {dados.quantidade ? `${dados.quantidade} un.` : '1 un.'}
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      Item sob encomenda
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

    
            <div className="folha-secao">
              <div className="folha-secao-titulo">
                OPÇÕES DE VALORES & CONDIÇÕES PARA ESCOLHA DO CLIENTE
              </div>

              {opcoesValidas.length > 0 ? (
                <div className="folha-opcoes-grid">
                  {opcoesValidas.map((op, idx) => (
                    <div key={idx} className="folha-opcao-card">
                      <div className="folha-opcao-tag">OPÇÃO {idx + 1}</div>
                      <h4 className="folha-opcao-titulo">{op.titulo || `Opção ${idx + 1}`}</h4>
                      <p className="folha-opcao-desc">
                        {op.descricao || 'Conforme especificação padrão e medidas acordadas.'}
                      </p>
                      <div className="folha-opcao-preco">
                        {op.valor && Number(op.valor) > 0
                          ? formatMoney(Number(op.valor))
                          : 'Sob consulta'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="folha-tabela">
                  <thead>
                    <tr>
                      <th>Proposta Comercial</th>
                      <th>Forma de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Valor Integral do Pedido / Serviço</td>
                      <td>{dados.formaPagamento || 'Pix'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1d4ed8' }}>
                        {formatMoney(valorNum)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="folha-secao-box" style={{ marginTop: '16px' }}>
              <div className="folha-secao-box-title">CONDIÇÕES FINANCEIRAS & PAGAMENTO</div>
              <div className="folha-grid-dados">
                <div>
                  <span className="folha-rotulo">Forma de Pagamento:</span>
                  <strong className="folha-valor">{dados.formaPagamento || 'Pix'}</strong>
                </div>
                <div>
                  <span className="folha-rotulo">Sinal / Entrada:</span>
                  <span className="folha-valor">
                    {sinalNum > 0 ? formatMoney(sinalNum) : 'Nenhum (R$ 0,00)'}
                  </span>
                </div>
                <div>
                  <span className="folha-rotulo">Valor Principal Selecionado:</span>
                  <strong className="folha-valor" style={{ color: '#1d4ed8' }}>
                    {formatMoney(valorNum)}
                  </strong>
                </div>
                <div>
                  <span className="folha-rotulo">Saldo Restante na Entrega:</span>
                  <strong
                    className="folha-valor"
                    style={{ color: saldoNum > 0 ? '#b45309' : '#16a34a' }}
                  >
                    {saldoNum > 0 ? formatMoney(saldoNum) : 'Quitado integralmente'}
                  </strong>
                </div>
              </div>
            </div>

            {dados.observacoes && (
              <div className="folha-secao" style={{ marginTop: '14px' }}>
                <div className="folha-secao-titulo">OBSERVAÇÕES TÉCNICAS / PRESCRIÇÃO / GRAU</div>
                <div className="folha-observacoes-box">
                  {dados.observacoes}
                </div>
              </div>
            )}

            <div className="folha-termos">
              <p>
                • Este orçamento tem validade de <b>15 dias corridos</b> a partir da emissão.
                Preços e prazos de entrega estão sujeitos a confirmação após esta data.
              </p>
              <p>
                • A produção/reserva de materiais e lentes tem início após a confirmação do pedido
                e do pagamento/sinal combinado.
              </p>
            </div>

            <div className="folha-assinaturas">
              <div className="folha-assinatura-bloco">
                <div className="folha-assinatura-linha" />
                <span className="folha-assinatura-nome">{dados.cliente}</span>
                <span className="folha-assinatura-cargo">Aceite / Assinatura do Cliente</span>
              </div>

              <div className="folha-assinatura-bloco">
                <div className="folha-assinatura-linha" />
                <span className="folha-assinatura-nome">{nomeEmpresa}</span>
                <span className="folha-assinatura-cargo">Atendimento / Responsável</span>
              </div>
            </div>

            {/* Rodapé da folha */}
            <div className="folha-rodape">
              <span>{nomeEmpresa} • Documento de Orçamento Comercial</span>
              <span>
                Gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
