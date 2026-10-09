'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';

export default function AjudaPage() {
  const cards = [
    {
      icon: '🏠',
      title: 'Dashboard Executivo',
      text: 'Tenha uma visão panorâmica em tempo real da sua empresa: faturamento, despesas, ordens em andamento, produtos e resumo financeiro.',
    },
    {
      icon: '👓',
      title: 'Produtos & Mercadorias',
      text: 'Cadastre armações, óculos solares, lentes, peças ou produtos em geral com foto, código, preço de venda e visibilidade no catálogo.',
    },
    {
      icon: '💰',
      title: 'Vendas & Frente de Caixa',
      text: 'Registre vendas à vista, cartão, Pix ou faturadas, selecione produtos cadastrados com preenchimento ágil e acompanhe os recebimentos.',
    },
    {
      icon: '🛒',
      title: 'Compras & Fornecedores',
      text: 'Controle notas, insumos e mercadorias compradas de fornecedores, distribuidores ou laboratórios para apuração exata de custos.',
    },
    {
      icon: '📦',
      title: 'Ordens & Encomendas',
      text: 'Gerencie pedidos sob encomenda, ordens de serviço óptico/laboratório, datas de entrega, sinal recebido, saldo restante e contato WhatsApp.',
    },
    {
      icon: '▤',
      title: 'Estoque & Insumos',
      text: 'Controle unidades em estoque, pares, estojos, caixas e insumos com valor total de capital imobilizado e alertas de reposição.',
    },
    {
      icon: '📋',
      title: 'Prescrições & Fichas Técnicas',
      text: 'Armazene receitas médicas e parâmetros ópticos (esférico, cilíndrico, eixo, DNP, adição) ou especificações técnicas de produção.',
    },
    {
      icon: '👥',
      title: 'Clientes & Leads',
      text: 'Gerencie histórico de contatos, clientes fidelizados e solicitações que chegam pelo catálogo digital ou canais de atendimento.',
    },
    {
      icon: '🏪',
      title: 'Minha Loja & Empresa',
      text: 'Configure o nome comercial da sua empresa, logotipo, contato de WhatsApp, endereço e personalização visual.',
    },
    {
      icon: '📊',
      title: 'Relatórios & Exportação',
      text: 'Emita relatórios completos em PDF e planilhas CSV com DRE resumido, ticket médio e balanço financeiro por período.',
    },
    {
      icon: '🧮',
      title: 'Calculadora de Markup & Preços',
      text: 'Calcule o preço de venda ideal considerando custo de compra, taxas de cartão, impostos, custos fixos e margem de lucro líquido.',
    },
    {
      icon: '🌐',
      title: 'Catálogo Online',
      text: 'Envie seu link exclusivo aos clientes para visualização de vitrine de produtos e fechamento direto de pedidos via WhatsApp.',
    },
  ];

  return (
    <AppShell title="Ajuda">
      <section className="help-hero">
        <div>
          <span className="page-kicker">CENTRAL DE AJUDA</span>
          <h2>Entenda cada funcionalidade do GestorPro</h2>
          <p>
            Guia rápido das ferramentas do sistema. Adaptável para óticas, varejos, prestadores de serviço e comércios em geral.
          </p>
        </div>
      </section>

      <div className="help-grid">
        {cards.map((c, idx) => (
          <article className="help-card" key={idx}>
            <div className="help-icon">{c.icon}</div>
            <div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
            <span className="help-arrow">→</span>
          </article>
        ))}
      </div>

      <section className="card help-tip" style={{ marginTop: '24px' }}>
        <div className="help-tip-icon" style={{ fontSize: '32px' }}>💡</div>
        <div>
          <h3 style={{ margin: '0 0 6px' }}>Dica para o dia a dia</h3>
          <p className="muted" style={{ margin: 0, lineHeight: '1.6' }}>
            Comece configurando o nome e WhatsApp da sua empresa na aba <strong>Minha Loja</strong>. Em seguida, cadastre seus produtos e mercadorias e use a <strong>Calculadora de Markup</strong> para garantir margens saudáveis em cada venda!
          </p>
        </div>
      </section>
    </AppShell>
  );
}
