import * as XLSX from 'xlsx';

export interface ParsedProductRow {
  index: number;
  nome: string;
  preco: number;
  quantidade: number;
  estoqueMinimo: number;
  tempoProducao: number | null;
  categoria: string;
  mostrarCatalogo: boolean;
  descricao?: string;
  valido: boolean;
  erros: string[];
}

export interface ParseResult {
  rows: ParsedProductRow[];
  totalLidos: number;
  validos: number;
  invalidos: number;
  categoriasEncontradas: string[];
  headersOriginais: string[];
  avisos: string[];
}

// Limpa e normaliza cabeçalho para comparação
function normalizeHeader(h: string): string {
  if (!h) return '';
  return String(h)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, ''); // remove pontuação e espaços
}

// Converte valores monetários no padrão brasileiro ou internacional
export function parseCurrency(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  if (!val && val !== 0) return 0;

  let str = String(val).trim();
  // Remove "R$", cifrões e espaços
  str = str.replace(/r\$/gi, '').replace(/\$/g, '').trim();
  if (!str) return 0;

  // Se tiver ponto e vírgula (ex: 1.250,50)
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Ex: 120,50 ou 120,00
    str = str.replace(',', '.');
  }

  // Remove qualquer caractere restante que não seja número ou ponto
  str = str.replace(/[^0-9.]/g, '');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// Converte quantidade
export function parseQuantity(val: any, fallback = 1): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.max(0, val);
  if (!val && val !== 0) return fallback;

  let str = String(val).trim().replace(',', '.');
  str = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : Math.max(0, num);
}

// Converte prazo / dias de produção
export function parseDays(val: any): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : Math.max(0, Math.round(val));
  if (!val && val !== 0) return null;

  const str = String(val).trim();
  const match = str.match(/\d+/);
  if (!match) return null;
  const num = parseInt(match[0], 10);
  return isNaN(num) ? null : Math.max(0, num);
}

// Converte status de exibição no catálogo
export function parseVisibility(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val && val !== 0) return true; // padrão visível

  const str = String(val)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Condições para ser falso (oculto)
  if (
    str.includes('ocult') ||
    str.includes('inativ') ||
    str.includes('privad') ||
    str === 'nao' ||
    str === 'n' ||
    str === '0' ||
    str === 'false'
  ) {
    return false;
  }

  return true;
}

// Corrige caracteres comuns corrompidos por encoding incorreto (ANSI / Windows-1252)
export function sanitizeCorruptedEncoding(str: string): string {
  if (!str) return '';
  return str
    .replace(/ARMAES/gi, 'ARMAÇÕES')
    .replace(/ARMAAO/gi, 'ARMAÇÃO')
    .replace(/PRODUO/gi, 'PRODUÇÃO')
    .replace(/CATLOGO/gi, 'CATÁLOGO')
    .replace(/VISVEL/gi, 'VISÍVEL')
    .replace(/PBLICO/gi, 'PÚBLICO')
    .replace(/MNIMO/gi, 'MÍNIMO')
    .replace(/PREO/gi, 'PREÇO')
    .replace(/CONFECO/gi, 'CONFECÇÃO')
    .replace(/PEA/gi, 'PEÇA')
    .replace(/INFANTO-JUVENIL/gi, 'INFANTOJUVENIL')
    .replace(/\uFFFD/g, ''); // limpa qualquer caractere de substituição restante se houver
}

// Identifica a coluna correta para cada campo do produto
interface ColumnMapping {
  nome: number;
  preco: number;
  quantidade: number;
  estoqueMinimo: number;
  tempoProducao: number;
  categoria: number;
  mostrarCatalogo: number;
  descricao: number;
}

function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    nome: -1,
    preco: -1,
    quantidade: -1,
    estoqueMinimo: -1,
    tempoProducao: -1,
    categoria: -1,
    mostrarCatalogo: -1,
    descricao: -1,
  };

  headers.forEach((h, idx) => {
    const raw = String(h || '').trim();
    const norm = normalizeHeader(raw);

    // Ignora coluna de índice (N, #, ID, etc.)
    if (norm === 'n' || norm === 'id' || norm === 'num' || norm === 'item') {
      // Se for apenas o índice da linha, pula a menos que não ache nome
      if (raw.length <= 2 && mapping.nome !== idx) return;
    }

    // Nome do produto
    if (
      mapping.nome === -1 &&
      (norm.includes('nomedoproduto') ||
        norm.includes('nomeitem') ||
        (norm.includes('nome') && !norm.includes('categoria')) ||
        (norm.includes('produto') && !norm.includes('tempo') && !norm.includes('prazo')) ||
        norm === 'item' ||
        norm === 'titulo')
    ) {
      mapping.nome = idx;
      return;
    }

    // Preço
    if (
      mapping.preco === -1 &&
      (norm.includes('prec') ||
        norm.includes('valor') ||
        norm.includes('preco') ||
        norm.includes('custo') ||
        norm.includes('unitario'))
    ) {
      mapping.preco = idx;
      return;
    }

    // Estoque Mínimo (deve ser verificado antes da quantidade geral)
    if (
      mapping.estoqueMinimo === -1 &&
      (norm.includes('minim') ||
        norm.includes('min') ||
        norm.includes('seguranca') ||
        norm.includes('estoquemin'))
    ) {
      mapping.estoqueMinimo = idx;
      return;
    }

    // Quantidade em Estoque
    if (
      mapping.quantidade === -1 &&
      (norm.includes('quant') ||
        norm.includes('qtd') ||
        norm.includes('estoque') ||
        norm.includes('saldo'))
    ) {
      mapping.quantidade = idx;
      return;
    }

    // Prazo de entrega / produção
    if (
      mapping.tempoProducao === -1 &&
      (norm.includes('prazo') ||
        norm.includes('produ') ||
        norm.includes('entrega') ||
        norm.includes('dias') ||
        norm.includes('tempo'))
    ) {
      mapping.tempoProducao = idx;
      return;
    }

    // Categoria
    if (
      mapping.categoria === -1 &&
      (norm.includes('categ') ||
        norm.includes('grupo') ||
        norm.includes('tipo') ||
        norm.includes('depart') ||
        norm.includes('secao'))
    ) {
      mapping.categoria = idx;
      return;
    }

    // Exibição no Catálogo
    if (
      mapping.mostrarCatalogo === -1 &&
      (norm.includes('exib') ||
        norm.includes('catal') ||
        norm.includes('mostr') ||
        norm.includes('visiv') ||
        norm.includes('loja') ||
        norm.includes('public'))
    ) {
      mapping.mostrarCatalogo = idx;
      return;
    }

    // Descrição
    if (
      mapping.descricao === -1 &&
      (norm.includes('desc') || norm.includes('detalh') || norm.includes('observ'))
    ) {
      mapping.descricao = idx;
      return;
    }
  });

  // Fallback se nome ainda não foi mapeado: tenta o primeiro campo de texto útil
  if (mapping.nome === -1 && headers.length > 0) {
    mapping.nome = headers.length > 1 && normalizeHeader(headers[0]) === 'n' ? 1 : 0;
  }

  return mapping;
}

// Lê um arquivo (File) ou texto e processa linhas
export async function parseProductsSpreadsheet(
  input: File | string
): Promise<ParseResult> {
  const avisos: string[] = [];
  let matrix: any[][] = [];

  try {
    if (typeof input === 'string') {
      // Texto direto (CSV colado pelo usuário)
      const cleanText = sanitizeCorruptedEncoding(input);
      const workbook = XLSX.read(cleanText, { type: 'string', raw: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
    } else {
      // Arquivo File
      const isExcel = /\.(xlsx|xls|ods)$/i.test(input.name);

      if (isExcel) {
        const buffer = await input.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
      } else {
        // CSV / TXT com detecção de encoding (UTF-8 vs Windows-1252 / ISO-8859-1)
        const buffer = await input.arrayBuffer();
        let decodedText = '';

        try {
          const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
          decodedText = utf8Decoder.decode(buffer);

          // Se tiver o caractere de substituição  (0xFFFD), o arquivo provavelmente foi salvo em Windows-1252
          if (decodedText.includes('\uFFFD')) {
            try {
              const winDecoder = new TextDecoder('windows-1252', { fatal: false });
              const winText = winDecoder.decode(buffer);
              if (!winText.includes('\uFFFD')) {
                decodedText = winText;
              }
            } catch {
              // fallback mantém utf8
            }
          }
        } catch {
          decodedText = await input.text();
        }

        decodedText = sanitizeCorruptedEncoding(decodedText);
        const workbook = XLSX.read(decodedText, { type: 'string', raw: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
      }
    }
  } catch (err: any) {
    throw new Error('Não foi possível ler o arquivo da planilha: ' + (err.message || 'formato inválido.'));
  }

  // Remove linhas totalmente vazias do início
  while (matrix.length > 0 && matrix[0].every((cell: any) => String(cell || '').trim() === '')) {
    matrix.shift();
  }

  if (matrix.length < 2) {
    throw new Error('A planilha está vazia ou contém apenas o cabeçalho sem produtos.');
  }

  // Cabeçalhos (primeira linha válida)
  const headerRow = matrix[0].map((h: any) => String(h || '').trim());
  const mapping = detectColumns(headerRow);

  if (mapping.nome === -1) {
    avisos.push('Não foi encontrada uma coluna de "Nome do Produto". O sistema usará a primeira coluna com texto.');
  }

  const rows: ParsedProductRow[] = [];
  const categoriasSet = new Set<string>();

  for (let r = 1; r < matrix.length; r++) {
    const rawRow = matrix[r];
    // Se a linha toda estiver vazia, pula
    if (!rawRow || rawRow.every((cell: any) => String(cell || '').trim() === '')) {
      continue;
    }

    const erros: string[] = [];

    // Nome
    const rawNome = mapping.nome >= 0 ? rawRow[mapping.nome] : '';
    const nome = sanitizeCorruptedEncoding(String(rawNome || '').trim());

    if (!nome) {
      erros.push('Nome do produto em branco');
    }

    // Preço
    const rawPreco = mapping.preco >= 0 ? rawRow[mapping.preco] : '';
    const preco = parseCurrency(rawPreco);

    // Quantidade
    const rawQtd = mapping.quantidade >= 0 ? rawRow[mapping.quantidade] : '';
    const quantidade = parseQuantity(rawQtd, 1);

    // Estoque Mínimo
    const rawEstoqueMin = mapping.estoqueMinimo >= 0 ? rawRow[mapping.estoqueMinimo] : '';
    const estoqueMinimo = parseQuantity(rawEstoqueMin, 0);

    // Prazo de Entrega / Produção (dias)
    const rawPrazo = mapping.tempoProducao >= 0 ? rawRow[mapping.tempoProducao] : '';
    const tempoProducao = parseDays(rawPrazo);

    // Categoria
    const rawCat = mapping.categoria >= 0 ? rawRow[mapping.categoria] : '';
    const categoria = sanitizeCorruptedEncoding(String(rawCat || '').trim());

    if (categoria) {
      categoriasSet.add(categoria);
    }

    // Exibição no Catálogo
    const rawExib = mapping.mostrarCatalogo >= 0 ? rawRow[mapping.mostrarCatalogo] : '';
    const mostrarCatalogo = parseVisibility(rawExib);

    // Descrição (se houver)
    const rawDesc = mapping.descricao >= 0 ? rawRow[mapping.descricao] : '';
    const descricao = rawDesc ? sanitizeCorruptedEncoding(String(rawDesc).trim()) : undefined;

    rows.push({
      index: rows.length + 1,
      nome,
      preco,
      quantidade,
      estoqueMinimo,
      tempoProducao,
      categoria,
      mostrarCatalogo,
      descricao,
      valido: erros.length === 0,
      erros,
    });
  }

  return {
    rows,
    totalLidos: rows.length,
    validos: rows.filter((r) => r.valido).length,
    invalidos: rows.filter((r) => !r.valido).length,
    categoriasEncontradas: Array.from(categoriasSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    headersOriginais: headerRow,
    avisos,
  };
}

// Gera um arquivo CSV modelo para download
export function generateSampleCsv(): string {
  const headers = [
    'N',
    'Nome do Produto / Item *',
    'Preço (R$)',
    'Quantidade em Estoque *',
    'Estoque Mínimo',
    'Prazo de Entrega / Produção (dias)',
    'Categoria',
    'Exibição no Catálogo',
  ];

  const sampleRows = [
    ['1', 'L.A CANDY', '120.00', '1', '1', '3', 'ARMAÇÕES INFANTIL MENINA', 'VISÍVEL NO CATÁLOGO PÚBLICO'],
    ['2', 'L.A SOPHIE', '120.00', '1', '1', '3', 'ARMAÇÕES JUVENIL MENINA', 'VISÍVEL NO CATÁLOGO PÚBLICO'],
    ['3', 'L.A BELLA', '120.00', '1', '1', '3', 'ARMAÇÕES INFANTIL MENINA', 'VISÍVEL NO CATÁLOGO PÚBLICO'],
    ['4', 'L.A CHLOE', '120.00', '1', '1', '3', 'ARMAÇÕES JUVENIL MENINA', 'VISÍVEL NO CATÁLOGO PÚBLICO'],
    ['5', 'L.A THEO', '120.00', '1', '1', '3', 'ARMAÇÕES INFANTIL MENINO', 'VISÍVEL NO CATÁLOGO PÚBLICO'],
  ];

  const content = [
    headers.join(';'),
    ...sampleRows.map((r) => r.join(';')),
  ].join('\r\n');

  return content;
}
