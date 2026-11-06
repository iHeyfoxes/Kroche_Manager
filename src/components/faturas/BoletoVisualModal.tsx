'use client';

import React, { useState } from 'react';
import { FaturaSistema } from '@/types/faturas';
import { formatMoney, formatDate } from '@/lib/utils';

interface BoletoVisualModalProps {
  fatura: FaturaSistema;
  onClose: () => void;
  onMarcarPago?: (id: string) => void;
  isMaster?: boolean;
}

export default function BoletoVisualModal({
  fatura,
  onClose,
  onMarcarPago,
  isMaster,
}: BoletoVisualModalProps) {
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [copiadoLinha, setCopiadoLinha] = useState(false);

  const handleCopiarPix = () => {
    if (!fatura.pix_copia_cola) return;
    navigator.clipboard.writeText(fatura.pix_copia_cola);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  const handleCopiarLinha = () => {
    if (!fatura.linha_digitavel) return;
    navigator.clipboard.writeText(fatura.linha_digitavel);
    setCopiadoLinha(true);
    setTimeout(() => setCopiadoLinha(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // URL do QR Code gerado dinamicamente
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    fatura.pix_copia_cola || fatura.pix_chave
  )}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          color: '#1E293B',
          borderRadius: '16px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de ações (não impressa) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🧾</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                Fatura & Boleto do Sistema — {fatura.id}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Referência: {fatura.mes_referencia} | Valor: {formatMoney(fatura.valor)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isMaster && fatura.status !== 'pago' && onMarcarPago && (
              <button
                type="button"
                onClick={() => onMarcarPago(fatura.id)}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✓ Confirmar Pagamento
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#E2E8F0',
                color: '#334155',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Fechar ✕
            </button>
          </div>
        </div>

        {/* ÁREA IMPRIMÍVEL DO BOLETO */}
        <div
          id="area-boleto-print"
          style={{
            padding: '28px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            lineHeight: 1.4,
            color: '#1E293B',
            background: '#FFFFFF',
          }}
        >
          {/* Se estiver pago, selo d'água */}
          {fatura.status === 'pago' && (
            <div
              style={{
                background: '#DCFCE7',
                border: '2px dashed #16A34A',
                color: '#15803D',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '16px',
                textAlign: 'center',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>✅</span> FATURA LIQUIDADA E PAGA — ASSINATURA EM DIA!
              {fatura.pago_em && (
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  (Pago em: {formatDate(fatura.pago_em)})
                </span>
              )}
            </div>
          )}

          {/* ÁREA DE DESTAQUE PIX (QR Code e Copia e Cola) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 15px rgba(6, 95, 70, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#10B981', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  PAGAMENTO RÁPIDO
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800 }}>
                  Pagar via PIX (Liberação Imediata)
                </span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#6EE7B7' }}>
                {formatMoney(fatura.valor)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* QR Code */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '150px',
                }}
              >
                {/* Imagem do QR Code */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="QR Code Pix"
                  style={{ width: '136px', height: '136px', display: 'block' }}
                />
              </div>

              {/* Dados e Botão Copiar */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#D1FAE5' }}>
                  Abra o aplicativo do seu banco, escolha <b>Pagar com Pix</b> e aponte a câmera para o QR Code ou copie o código abaixo:
                </p>

                <div style={{ fontSize: '12px', marginBottom: '10px', color: '#E2E8F0' }}>
                  <div><b>Beneficiário:</b> {fatura.pix_beneficiario}</div>
                  <div><b>Chave Pix configurada:</b> {fatura.pix_chave} ({fatura.pix_tipo})</div>
                  <div><b>Vencimento:</b> {formatDate(fatura.data_vencimento)}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCopiarPix}
                    style={{
                      background: copiadoPix ? '#059669' : '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {copiadoPix ? '✓ Código PIX Copiado!' : '📋 Copiar Pix Copia e Cola'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(fatura.pix_chave);
                      alert(`Chave Pix copiada: ${fatura.pix_chave}`);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Copiar Apenas Chave
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BOLETO BANCÁRIO TRADICIONAL */}
          <div
            style={{
              border: '2px solid #0F172A',
              padding: '16px',
              borderRadius: '8px',
              background: '#FFFFFF',
            }}
          >
            {/* Linha 1: Banco, Código e Linha Digitável */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '2px solid #0F172A',
                paddingBottom: '10px',
                marginBottom: '10px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#0F172A' }}>
                KROCHE MANAGER
              </div>
              <div
                style={{
                  borderLeft: '2px solid #0F172A',
                  borderRight: '2px solid #0F172A',
                  padding: '0 12px',
                  fontWeight: 900,
                  fontSize: '18px',
                }}
              >
                033-7
              </div>
              <div
                style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'right',
                  color: '#0F172A',
                  wordBreak: 'break-all',
                }}
              >
                {fatura.linha_digitavel}
              </div>
            </div>

            {/* Botão para copiar linha digitável (não impresso) */}
            <div className="no-print" style={{ textAlign: 'right', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={handleCopiarLinha}
                style={{
                  background: 'none',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#2563EB',
                }}
              >
                {copiadoLinha ? '✓ Linha Copiada!' : 'Copiar Linha Digitável'}
              </button>
            </div>

            {/* Grid de Informações do Boleto */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
                marginBottom: '12px',
              }}
            >
              <tbody>
                <tr style={{ borderBottom: '1px solid #94A3B8' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #94A3B8', width: '70%' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>Local de Pagamento</div>
                    <div style={{ fontWeight: 600 }}>PAGÁVEL EM QUALQUER BANCO OU VIA PIX ATÉ O VENCIMENTO</div>
                  </td>
                  <td style={{ padding: '6px', background: '#F8FAFC' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>Vencimento</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#B91C1C' }}>
                      {formatDate(fatura.data_vencimento)}
                    </div>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #94A3B8' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #94A3B8' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>Beneficiário / Cedente</div>
                    <div style={{ fontWeight: 700 }}>{fatura.pix_beneficiario} — Kroche Manager Sistemas</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Chave Pix: {fatura.pix_chave} | {fatura.pix_cidade}</div>
                  </td>
                  <td style={{ padding: '6px', background: '#F8FAFC' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>Agência / Código Beneficiário</div>
                    <div style={{ fontWeight: 600 }}>0001 / 998822-1</div>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #94A3B8' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #94A3B8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>DATA DO DOC.</div>
                        <div style={{ fontWeight: 600 }}>{formatDate(fatura.data_emissao)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>NÚMERO DO DOC.</div>
                        <div style={{ fontWeight: 600 }}>{fatura.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>ESPÉCIE DOC.</div>
                        <div style={{ fontWeight: 600 }}>DM</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>ACEITE</div>
                        <div style={{ fontWeight: 600 }}>N</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '6px', background: '#F8FAFC' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase' }}>Nosso Número</div>
                    <div style={{ fontWeight: 700 }}>{fatura.nosso_numero}</div>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #94A3B8' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #94A3B8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>USO DO BANCO</div>
                        <div style={{ fontWeight: 600 }}>KM-01</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>CIP</div>
                        <div style={{ fontWeight: 600 }}>000</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>MOEDA</div>
                        <div style={{ fontWeight: 600 }}>R$</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#64748B' }}>QUANTIDADE</div>
                        <div style={{ fontWeight: 600 }}>1</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '6px', background: '#EFF6FF' }}>
                    <div style={{ fontSize: '9px', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 800 }}>(=) Valor do Documento</div>
                    <div style={{ fontWeight: 900, fontSize: '14px', color: '#1E40AF' }}>
                      {formatMoney(fatura.valor)}
                    </div>
                  </td>
                </tr>

                {/* Instruções */}
                <tr style={{ borderBottom: '1px solid #94A3B8' }}>
                  <td colSpan={2} style={{ padding: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Instruções (Todas as informações deste boleto são de exclusiva responsabilidade do beneficiário)
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#334155' }}>
                      • Mensalidade referente ao plano Kroche Manager: <b>{fatura.mes_referencia}</b>.<br />
                      • {fatura.observacoes || 'Acesso completo às ferramentas de gestão, catálogo e encomendas.'}<br />
                      • Em caso de dúvidas ou necessidade de 2ª via, contate o administrador Master do sistema.
                    </div>
                  </td>
                </tr>

                {/* Pagador */}
                <tr>
                  <td colSpan={2} style={{ padding: '8px', background: '#F8FAFC' }}>
                    <div style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Pagador / Cliente
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                      {fatura.usuario_nome}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      E-mail: {fatura.usuario_email || 'Não informado'} | Código do Usuário: {fatura.usuario_id}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Código de barras ilustrativo */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '10px',
                borderTop: '1px dashed #94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              {/* Código de barras renderizado em SVG */}
              <div style={{ display: 'inline-block' }}>
                <svg width="340" height="48" viewBox="0 0 340 48" style={{ display: 'block' }}>
                  {Array.from({ length: 65 }).map((_, i) => {
                    const width = (i % 3 === 0 || i % 7 === 0) ? 3 : 1.5;
                    const x = i * 5;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={0}
                        width={width}
                        height={48}
                        fill="#0F172A"
                      />
                    );
                  })}
                </svg>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748B', letterSpacing: '2px', marginTop: '4px' }}>
                  {fatura.codigo_barras.slice(0, 44)}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'right' }}>
                Autenticação Mecânica — Ficha de Compensação
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #area-boleto-print, #area-boleto-print * {
            visibility: visible;
          }
          #area-boleto-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

