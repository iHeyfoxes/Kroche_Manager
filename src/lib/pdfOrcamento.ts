import { formatMoney, formatDate, slugify } from './utils';

export interface OpcaoOrcamentoItem {
  titulo: string;
  descricao: string;
  valor: string;
}

export interface DadosOrcamento {
  id?: number | string;
  data?: string;
  dataEntrega?: string;
  cliente: string;
  telefone?: string | null;
  produto: string;
  quantidade?: string | number;
  valor: number | string;
  sinal?: number | string | null;
  formaPagamento?: string;
  status?: string;
  observacoes?: string | null;
  opcoes?: OpcaoOrcamentoItem[];
  empresa?: {
    nome?: string;
    whatsapp?: string;
    email?: string;
    slogan?: string;
  };
}


export function extrairOpcoesDeObservacoes(obsText?: string | null): {
  observacoesLimpas: string;
  formaPagamento: string;
  opcoes: [OpcaoOrcamentoItem, OpcaoOrcamentoItem, OpcaoOrcamentoItem];
} {
  const defaultOpcoes: [OpcaoOrcamentoItem, OpcaoOrcamentoItem, OpcaoOrcamentoItem] = [
    { titulo: 'Opção 1 - Econômica', descricao: '', valor: '' },
    { titulo: 'Opção 2 - Padrão / Intermediária', descricao: '', valor: '' },
    { titulo: 'Opção 3 - Premium / Completa', descricao: '', valor: '' },
  ];

  if (!obsText) {
    return { observacoesLimpas: '', formaPagamento: 'Pix', opcoes: defaultOpcoes };
  }

  let texto = obsText;
  let formaPag = 'Pix';


  const matchPag =
    texto.match(/\[Pagamento:\s*([^\]]+)\]/i) ||
    texto.match(/Pagamento:\s*([^|;\n]+)/i);
  if (matchPag) {
    formaPag = matchPag[1].trim();
    texto = texto
      .replace(/\[Pagamento:\s*[^\]]+\]\s*/i, '')
      .replace(/Pagamento:\s*[^|;\n]+(\s*\|\s*)?/i, '')
      .trim();
  }

  // Extrai opções
  const matchOpcoes = texto.match(/\[ORCAMENTO_OPCOES:(.+?)\]/);
  if (matchOpcoes) {
    try {
      const parsed = JSON.parse(matchOpcoes[1]);
      texto = texto.replace(matchOpcoes[0], '').trim();
      const op1: OpcaoOrcamentoItem = parsed[0] || defaultOpcoes[0];
      const op2: OpcaoOrcamentoItem = parsed[1] || defaultOpcoes[1];
      const op3: OpcaoOrcamentoItem = parsed[2] || defaultOpcoes[2];
      return {
        observacoesLimpas: texto,
        formaPagamento: formaPag,
        opcoes: [
          {
            titulo: op1.titulo || defaultOpcoes[0].titulo,
            descricao: op1.descricao || '',
            valor: op1.valor !== undefined && op1.valor !== null ? String(op1.valor) : '',
          },
          {
            titulo: op2.titulo || defaultOpcoes[1].titulo,
            descricao: op2.descricao || '',
            valor: op2.valor !== undefined && op2.valor !== null ? String(op2.valor) : '',
          },
          {
            titulo: op3.titulo || defaultOpcoes[2].titulo,
            descricao: op3.descricao || '',
            valor: op3.valor !== undefined && op3.valor !== null ? String(op3.valor) : '',
          },
        ],
      };
    } catch {
      // Falha no parse JSON, segue com as padrões
    }
  }

  return {
    observacoesLimpas: texto,
    formaPagamento: formaPag,
    opcoes: defaultOpcoes,
  };
}

/**
 * Monta o texto de observações final contendo as tags das opções e da forma de pagamento.
 */
export function compilarObservacoesComOpcoes(
  observacoesTexto: string,
  formaPagamento: string,
  opcoes: OpcaoOrcamentoItem[]
): string {
  const obsLimpa = observacoesTexto
    .replace(/\[ORCAMENTO_OPCOES:.+?\]\s*/gi, '')
    .replace(/\[Pagamento:\s*[^\]]+\]\s*/gi, '')
    .replace(/Pagamento:\s*[^|;\n]+(\s*\|\s*)?/gi, '')
    .trim();

  const partes: string[] = [];

  // Salva opções se pelo menos uma tiver valor ou descrição
  const temOpcoes = opcoes.some((o) => (o.valor && Number(o.valor) > 0) || (o.descricao && o.descricao.trim()));
  if (temOpcoes) {
    partes.push(`[ORCAMENTO_OPCOES:${JSON.stringify(opcoes)}]`);
  }

  if (formaPagamento) {
    partes.push(`[Pagamento: ${formaPagamento}]`);
  }

  if (obsLimpa) {
    partes.push(obsLimpa);
  }

  return partes.join(' ');
}

/**
 * Gera e faz o download direto do Papel de Orçamento em formato PDF profissional.
 */
export async function gerarPdfOrcamento(dados: DadosOrcamento): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 14;

  const corPrimaria = [37, 99, 235]; // #2563eb
  const corEscura = [15, 23, 42]; // #0f172a
  const corCinza = [100, 116, 139]; // #64748b
  const corFundoLeve = [248, 250, 252]; // #f8fafc

  // 1. Faixa de destaque superior
  doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // 2. Cabeçalho: Empresa à esquerda / Informações do Orçamento à direita
  const nomeEmpresa = dados.empresa?.nome?.trim() || 'GestorPro';
  const sloganEmpresa = dados.empresa?.slogan?.trim() || 'Gestão Comercial & Atendimento Personalizado';
  const whatsappEmpresa = dados.empresa?.whatsapp?.trim() || '';
  const emailEmpresa = dados.empresa?.email?.trim() || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text(nomeEmpresa, marginX, currentY);

  // Bloco Orçamento à Direita
  const numOrcamento = dados.id ? `#ORC-${String(dados.id).padStart(4, '0')}` : '#ORC-NOVO';
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.text('ORÇAMENTO COMERCIAL', pageWidth - marginX, currentY, { align: 'right' });

  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
  doc.text(sloganEmpresa, marginX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text(numOrcamento, pageWidth - marginX, currentY, { align: 'right' });

  currentY += 5;
  let contatoStr = '';
  if (whatsappEmpresa) contatoStr += `WhatsApp: ${whatsappEmpresa}`;
  if (emailEmpresa) contatoStr += (contatoStr ? ' | ' : '') + `E-mail: ${emailEmpresa}`;
  if (contatoStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(contatoStr, marginX, currentY);
  }

  doc.setFontSize(8.5);
  doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
  doc.text(`Emissão: ${formatDate(dados.data || new Date().toISOString())}`, pageWidth - marginX, currentY, {
    align: 'right',
  });

  currentY += 4;
  doc.text('Validade da Proposta: 15 dias', pageWidth - marginX, currentY, { align: 'right' });

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // 3. Quadro de Dados do Cliente & Pedido
  doc.setFillColor(corFundoLeve[0], corFundoLeve[1], corFundoLeve[2]);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'D');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text('DADOS DO CLIENTE & ATENDIMENTO', marginX + 4, currentY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: `, marginX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.cliente || 'Não informado', marginX + 17, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Telefone: `, marginX + 4, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.telefone || 'Não informado', marginX + 19, currentY + 18);

  const colunaMeio = marginX + contentWidth / 2;
  doc.setFont('helvetica', 'normal');
  doc.text(`Previsão / Prazo: `, colunaMeio, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.dataEntrega ? formatDate(dados.dataEntrega) : 'A combinar / Imediato', colunaMeio + 29, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Status do Orçamento: `, colunaMeio, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.status || 'Pendente de Aprovação', colunaMeio + 35, currentY + 18);

  currentY += 28;

  // 4. Detalhes do Produto / Serviço Solicitado
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text('ITEM / SERVIÇO PRINCIPAL SOLICITADO', marginX, currentY);
  currentY += 3;

  const qtdTexto = dados.quantidade ? `${dados.quantidade} un.` : '1 un.';
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Item / Serviço / Modelo', 'Quantidade', 'Referência / Observação']],
    body: [
      [
        dados.produto || 'Item sob medida',
        qtdTexto,
        dados.observacoes
          ? dados.observacoes.slice(0, 120) + (dados.observacoes.length > 120 ? '...' : '')
          : 'Conforme especificações e medidas acordadas.',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Comparativo das 3 Opções de Orçamento
  const opcoesValidas = (dados.opcoes || []).filter(
    (o) => (o.valor && Number(o.valor) > 0) || (o.descricao && o.descricao.trim())
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text('OPÇÕES DE VALORES & CONDIÇÕES COMERCIAIS', marginX, currentY);
  currentY += 3;

  if (opcoesValidas.length > 0) {
    const tableBody = opcoesValidas.map((op, idx) => {
      const tit = op.titulo.trim() || `Opção ${idx + 1}`;
      const desc = op.descricao.trim() || 'Especificação padrão';
      const vlr = op.valor && Number(op.valor) > 0 ? formatMoney(Number(op.valor)) : 'Sob Consulta';
      return [tit, desc, vlr];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Opção de Orçamento', 'Especificações / Materiais / Diferenciais', 'Valor Proposto']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: corPrimaria as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        textColor: [15, 23, 42],
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 85 },
        2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold', textColor: corPrimaria as [number, number, number] },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Caso o orçamento não use as 3 opções e tenha apenas valor único
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Proposta Comercial', 'Condições', 'Valor Total']],
      body: [
        [
          'Valor Integral do Pedido / Serviço',
          `Pagamento em: ${dados.formaPagamento || 'Pix'}`,
          formatMoney(Number(dados.valor || 0)),
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: corPrimaria as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 70 },
        2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 6. Resumo Financeiro & Condições de Pagamento
  const valorNum = Number(dados.valor || 0);
  const sinalNum = Number(dados.sinal || 0);
  const saldoNum = Math.max(0, valorNum - sinalNum);

  doc.setFillColor(corFundoLeve[0], corFundoLeve[1], corFundoLeve[2]);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text('CONDIÇÕES DE PAGAMENTO & FECHAMENTO', marginX + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Forma de Pagamento: `, marginX + 4, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.formaPagamento || 'Pix', marginX + 40, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.text(`Sinal / Entrada: `, marginX + 4, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.text(sinalNum > 0 ? formatMoney(sinalNum) : 'Nenhum (0,00)', marginX + 28, currentY + 19);

  const colFin = marginX + contentWidth - 65;
  doc.setFont('helvetica', 'normal');
  doc.text(`Valor Principal: `, colFin, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMoney(valorNum), colFin + 25, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.text(`Saldo a Pagar: `, colFin, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(saldoNum > 0 ? 180 : 22, saldoNum > 0 ? 83 : 163, saldoNum > 0 ? 9 : 74);
  doc.text(saldoNum > 0 ? formatMoney(saldoNum) : 'Quitado', colFin + 25, currentY + 19);

  currentY += 30;

  // 7. Observações e Recomendações
  if (dados.observacoes) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
    doc.text('OBSERVAÇÕES TÉCNICAS / PRESCRIÇÃO / TERMOS:', marginX, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    const splitObs = doc.splitTextToSize(dados.observacoes, contentWidth);
    doc.text(splitObs, marginX, currentY);
    currentY += splitObs.length * 4 + 4;
  }

  // 8. Termos de Aceite & Assinaturas
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  currentY += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
  doc.text(
    '• Este orçamento tem validade de 15 dias corridos. Os prazos de entrega contam a partir da aprovação e pagamento acordado.',
    marginX,
    currentY
  );
  currentY += 4;
  doc.text(
    '• A confirmação deste orçamento garante a reserva de materiais, lentes e armações conforme disponibilidade.',
    marginX,
    currentY
  );
  currentY += 16;

  const larguraLinha = 75;
  const colAss1 = marginX + 10;
  const colAss2 = marginX + contentWidth - larguraLinha - 10;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(colAss1, currentY, colAss1 + larguraLinha, currentY);
  doc.line(colAss2, currentY, colAss2 + larguraLinha, currentY);

  currentY += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corEscura[0], corEscura[1], corEscura[2]);
  doc.text(dados.cliente || 'Aceite do Cliente', colAss1 + larguraLinha / 2, currentY, { align: 'center' });
  doc.text(nomeEmpresa, colAss2 + larguraLinha / 2, currentY, { align: 'center' });

  currentY += 3.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
  doc.text('Assinatura do Cliente / De Acordo', colAss1 + larguraLinha / 2, currentY, { align: 'center' });
  doc.text('Assinatura do Responsável', colAss2 + larguraLinha / 2, currentY, { align: 'center' });

  // 9. Rodapé da Página
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — Sistema ${nomeEmpresa}`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  // Download do arquivo
  const nomeArquivo = `orcamento-${dados.id ? `n${dados.id}` : 'novo'}-${slugify(dados.cliente || 'cliente')}.pdf`;
  doc.save(nomeArquivo);
}
