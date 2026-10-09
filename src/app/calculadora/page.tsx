'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { formatMoney } from '@/lib/utils';

export default function CalculadoraPage() {
  const [modo, setModo] = useState<'comercio' | 'servico'>('comercio');

  // Modo Comércio / Varejo / Ótica
  const [custoProduto, setCustoProduto] = useState('80');
  const [custoFrete, setCustoFrete] = useState('5');
  const [taxasImpostos, setTaxasImpostos] = useState('10'); // % de impostos + maquininha
  const [custosFixos, setCustosFixos] = useState('15'); // % operacional rateado
  const [lucroComercio, setLucroComercio] = useState('35'); // % margem líquida desejada

  // Modo Serviços / Produção / Laboratório
  const [materiais, setMateriais] = useState('40');
  const [horas, setHoras] = useState('1.5');
  const [valorHora, setValorHora] = useState('30');
  const [outros, setOutros] = useState('5');
  const [lucroServico, setLucroServico] = useState('30');

  // Resultados Comércio
  const cp = Number(custoProduto) || 0;
  const cf = Number(custoFrete) || 0;
  const ti = Number(taxasImpostos) || 0;
  const cfix = Number(custosFixos) || 0;
  const lc = Number(lucroComercio) || 0;

  const custoBaseComercio = cp + cf;
  const percentualTotalDeducoes = ti + cfix + lc;
  const divisor = Math.max(0.05, (100 - percentualTotalDeducoes) / 100);
  const precoSugeridoComercio = percentualTotalDeducoes < 100
    ? custoBaseComercio / divisor
    : custoBaseComercio * (1 + (lc / 100));
  const markupMultiplicador = custoBaseComercio > 0 ? (precoSugeridoComercio / custoBaseComercio) : 1;
  const valorImpostos = (precoSugeridoComercio * ti) / 100;
  const valorCustosFixos = (precoSugeridoComercio * cfix) / 100;
  const valorLucroLiquido = precoSugeridoComercio - custoBaseComercio - valorImpostos - valorCustosFixos;

  // Resultados Serviço / Mão de Obra
  const m = Number(materiais) || 0;
  const h = Number(horas) || 0;
  const vh = Number(valorHora) || 0;
  const o = Number(outros) || 0;
  const ls = Number(lucroServico) || 0;

  const mo = h * vh;
  const custoTotalServico = m + mo + o;
  const lucroValorServico = (custoTotalServico * ls) / 100;
  const precoSugeridoServico = custoTotalServico + lucroValorServico;

  return (
    <AppShell title="Calculadora de Preços & Markup">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn ${modo === 'comercio' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setModo('comercio')}
          style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <span>🏷️</span>
          <span><b>Comércio & Varejo</b> (Markup / Revenda / Óticas)</span>
        </button>

        <button
          type="button"
          className={`btn ${modo === 'servico' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setModo('servico')}
          style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <span>⏱️</span>
          <span><b>Serviços & Laboratório</b> (Mão de Obra / Horas)</span>
        </button>
      </div>

      {modo === 'comercio' ? (
        <div className="grid grid-2">
          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">FORMAÇÃO DE PREÇO COMERCIAL</span>
                <h3>Parâmetros de Custo e Margem</h3>
              </div>
            </div>

            <div className="grid">
              <div>
                <label className="label">Custo do Produto / Armação / Mercadoria (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={custoProduto}
                  onChange={(e) => setCustoProduto(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Frete / Embalagem por Unidade (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={custoFrete}
                  onChange={(e) => setCustoFrete(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Impostos + Taxas de Cartão (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  className="input"
                  value={taxasImpostos}
                  onChange={(e) => setTaxasImpostos(e.target.value)}
                />
                <small className="muted">Ex.: Simples Nacional + Taxa maquininha crédito (ex: 8% a 12%)</small>
              </div>

              <div>
                <label className="label">Despesas Operacionais / Custos Fixos Rateados (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  className="input"
                  value={custosFixos}
                  onChange={(e) => setCustosFixos(e.target.value)}
                />
                <small className="muted">Aluguel, luz, salários rateados por venda (ex: 10% a 20%)</small>
              </div>

              <div>
                <label className="label">Margem de Lucro Líquida Desejada (%) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="input"
                  value={lucroComercio}
                  onChange={(e) => setLucroComercio(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">DEMONSTRATIVO DE PRECIFICAÇÃO</span>
                <h3>Detalhamento do Preço Sugerido</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Custo de Aquisição (Produto + Frete):</span>
                <b>{formatMoney(custoBaseComercio)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Impostos e Taxas ({taxasImpostos}%):</span>
                <b>{formatMoney(valorImpostos)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Custos Fixos / Operacionais ({custosFixos}%):</span>
                <b>{formatMoney(valorCustosFixos)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Lucro Líquido Real ({lucroComercio}%):</span>
                <b style={{ color: '#16a34a' }}>{formatMoney(valorLucroLiquido)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Índice Markup Multiplicador:</span>
                <b style={{ color: 'var(--marrom-principal)' }}>{markupMultiplicador.toFixed(2)}x</b>
              </div>

              <div style={{ marginTop: '14px', padding: '18px', borderRadius: '12px', background: 'var(--creme-suave)', textAlign: 'center' }}>
                <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  Preço de Venda Sugerido
                </span>
                <h2 style={{ margin: '8px 0 0', fontSize: '36px', color: 'var(--marrom-escuro)', fontWeight: 800 }}>
                  {formatMoney(precoSugeridoComercio)}
                </h2>
                <small className="muted" style={{ display: 'block', marginTop: '6px' }}>
                  Garante cobertura de custos, taxas e entrega a margem de {lucroComercio}% limpa no bolso.
                </small>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          <div className="card">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">MÃO DE OBRA & PRODUÇÃO</span>
                <h3>Parâmetros de Serviço</h3>
              </div>
            </div>

            <div className="grid">
              <div>
                <label className="label">Custo com Materiais / Insumos (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={materiais}
                  onChange={(e) => setMateriais(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Tempo Dedicado (Horas) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Valor da Hora Técnica / Especialista (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={valorHora}
                  onChange={(e) => setValorHora(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Custos Adicionais / Embalagem / Entrega (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={outros}
                  onChange={(e) => setOutros(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Margem de Lucro Desejada (%) *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input"
                  value={lucroServico}
                  onChange={(e) => setLucroServico(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">RESULTADO DO SERVIÇO</span>
                <h3>Detalhamento da Execução</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Materiais / Insumos:</span>
                <b>{formatMoney(m)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Mão de obra ({horas}h x {formatMoney(vh)}/h):</span>
                <b>{formatMoney(mo)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Custos adicionais:</span>
                <b>{formatMoney(o)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Custo total operacional:</span>
                <b>{formatMoney(custoTotalServico)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                <span className="muted">Lucro estimado ({ls}%):</span>
                <b style={{ color: '#16a34a' }}>{formatMoney(lucroValorServico)}</b>
              </div>

              <div style={{ marginTop: '14px', padding: '18px', borderRadius: '12px', background: 'var(--creme-suave)', textAlign: 'center' }}>
                <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  Preço Sugerido do Serviço / Peça
                </span>
                <h2 style={{ margin: '8px 0 0', fontSize: '36px', color: 'var(--marrom-escuro)', fontWeight: 800 }}>
                  {formatMoney(precoSugeridoServico)}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
