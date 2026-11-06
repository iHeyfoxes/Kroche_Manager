import { supabase } from '@/lib/supabase';
import { ConfiguracaoPix, FaturaSistema, StatusFatura, TipoChavePix } from '@/types/faturas';
import { Usuario } from '@/types/database';

const CONFIG_STORAGE_KEY = 'kroche_config_pix_sistema';
const FATURAS_STORAGE_KEY = 'kroche_faturas_sistema_db';

// Configuração padrão inicial do PIX (valor 99.00 como solicitado)
export const CONFIG_PIX_PADRAO: ConfiguracaoPix = {
  chave: 'financeiro@krochemanager.com.br',
  tipo: 'email',
  beneficiario: 'KROCHE MANAGER',
  cidade: 'SAO PAULO',
  valor_padrao: 99.00,
  dias_vencimento: 5,
  instrucoes: 'Pagar preferencialmente via PIX pelo QR Code abaixo para liberação imediata da sua assinatura Kroche Manager.',
};

/**
 * Calcula CRC16 CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
 * Padrão oficial do Banco Central do Brasil para PIX
 */
function calcularCRC16(str: string): string {
  let crc = 0xFFFF;
  const strlen = str.length;

  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  const hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do EMVCo
 */
function formatarTLV(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

/**
 * Remove acentos e caracteres especiais para compatibilidade com o padrão EMVCo do BACEN
 */
function limparTextoPix(txt: string): string {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

/**
 * Gera a string do Pix Copia e Cola no padrão oficial do Banco Central
 */
export function gerarPixCopiaECola(
  chave: string,
  beneficiario: string,
  cidade: string,
  valor: number,
  txid: string = '***'
): string {
  // Limpeza de campos
  const chaveLimpa = chave.trim();
  const nomeBeneficiario = limparTextoPix(beneficiario).slice(0, 25) || 'KROCHE';
  const cidadeBeneficiario = limparTextoPix(cidade).slice(0, 15) || 'SAO PAULO';
  const valorFormatado = Number(valor || 99).toFixed(2);
  const txidFormatado = limparTextoPix(txid).slice(0, 25) || '***';

  // ID 00: Formato Payload
  let payload = formatarTLV('00', '01');

  // ID 26: Merchant Account Information - PIX
  const gui = formatarTLV('00', 'BR.GOV.BCB.PIX');
  const key = formatarTLV('01', chaveLimpa);
  payload += formatarTLV('26', `${gui}${key}`);

  // ID 52: Merchant Category Code (0000 = Geral)
  payload += formatarTLV('52', '0000');

  // ID 53: Moeda (986 = Real BRL)
  payload += formatarTLV('53', '986');

  // ID 54: Valor da transação
  payload += formatarTLV('54', valorFormatado);

  // ID 58: Código do país
  payload += formatarTLV('58', 'BR');

  // ID 59: Nome do recebedor
  payload += formatarTLV('59', nomeBeneficiario);

  // ID 60: Cidade do recebedor
  payload += formatarTLV('60', cidadeBeneficiario);

  // ID 62: Informações adicionais (TxID)
  const infoAdicional = formatarTLV('05', txidFormatado);
  payload += formatarTLV('62', infoAdicional);

  // ID 63: CRC16 com tamanho '04'
  payload += '6304';

  const crc = calcularCRC16(payload);
  return `${payload}${crc}`;
}

/**
 * Gera a linha digitável e código de barras simulado do boleto bancário
 */
export function gerarDadosBoleto(nossoNumero: string, valor: number): {
  linhaDigitavel: string;
  codigoBarras: string;
} {
  const banco = '033'; // Santander / Banco Fictício Kroche
  const moeda = '9'; // Real
  const fatorVencimento = '9876'; // Fator fixo de demonstração
  const valorSemPonto = Math.round(valor * 100).toString().padStart(10, '0');
  const numLimpo = nossoNumero.replace(/\D/g, '').padEnd(10, '1').slice(0, 10);

  // Formato: AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
  const campo1 = `${banco}${moeda}1.23456`;
  const campo2 = `${numLimpo.slice(0, 5)}.${numLimpo.slice(5, 10)}7`;
  const campo3 = `98765.432108`;
  const dvGeral = '1';
  const campoValor = `${fatorVencimento}${valorSemPonto}`;

  const linhaDigitavel = `${campo1} ${campo2} ${campo3} ${dvGeral} ${campoValor}`;
  const codigoBarras = `${banco}${moeda}${dvGeral}${campoValor}12345${numLimpo}9876543210`;

  return { linhaDigitavel, codigoBarras };
}

/* ==========================================================================
   CONFIGURAÇÃO DO PIX (Alterável pelo Usuário Master)
   ========================================================================== */

export async function carregarConfiguracaoPix(): Promise<ConfiguracaoPix> {
  try {
    // 1. Tenta buscar no Supabase se existir a tabela configuracoes_sistema
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'pix_sistema')
      .maybeSingle();

    if (!error && data?.valor) {
      const parsed = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      return { ...CONFIG_PIX_PADRAO, ...parsed };
    }
  } catch (e) {
    // Falha silenciosa para fallback
  }

  // 2. Fallback no LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (local) {
        return { ...CONFIG_PIX_PADRAO, ...JSON.parse(local) };
      }
    } catch (e) {
      console.warn('Erro ao ler config do localStorage', e);
    }
  }

  return CONFIG_PIX_PADRAO;
}

export async function salvarConfiguracaoPix(novaConfig: ConfiguracaoPix): Promise<void> {
  const dados = {
    ...novaConfig,
    atualizado_em: new Date().toISOString(),
  };

  // 1. Salva no LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dados));
    } catch (e) {
      console.error('Erro ao salvar config no localStorage:', e);
    }
  }

  // 2. Tenta salvar no Supabase (se a tabela configuracoes_sistema existir)
  try {
    await supabase
      .from('configuracoes_sistema')
      .upsert({
        chave: 'pix_sistema',
        valor: dados,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'chave' });
  } catch (e) {
    console.warn('Supabase configuracoes_sistema não disponível (usando local):', e);
  }
}

/* ==========================================================================
   GESTÃO DE FATURAS DO SISTEMA
   ========================================================================== */

function getFaturasLocal(): FaturaSistema[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FATURAS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFaturasLocal(faturas: FaturaSistema[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FATURAS_STORAGE_KEY, JSON.stringify(faturas));
  } catch (e) {
    console.error('Erro ao salvar faturas no localStorage:', e);
  }
}

/**
 * Verifica se a tabela faturas_sistema já existe no Supabase
 */
export async function verificarTabelaFaturasExiste(): Promise<boolean> {
  try {
    const { error } = await supabase.from('faturas_sistema').select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sincroniza faturas salvas localmente para o Supabase (executado quando a tabela for criada)
 */
export async function sincronizarFaturasComSupabase(): Promise<number> {
  const locais = getFaturasLocal();
  if (locais.length === 0) return 0;

  try {
    const { error } = await supabase.from('faturas_sistema').upsert(locais, { onConflict: 'id' });
    if (!error) {
      return locais.length;
    }
  } catch (e) {
    console.warn('Erro ao sincronizar faturas com Supabase:', e);
  }
  return 0;
}

/**
 * Lista todas as faturas (ou faturas de um usuário específico)
 */
export async function listarFaturas(usuarioId?: string): Promise<FaturaSistema[]> {
  let faturasSupabase: FaturaSistema[] | null = null;

  try {
    let query = supabase.from('faturas_sistema').select('*');
    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId);
    }
    const { data, error } = await query.order('criado_em', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela public.faturas_sistema ainda não existe no Supabase.');
      } else {
        console.error('Erro ao consultar faturas_sistema:', error);
      }
    } else if (data) {
      faturasSupabase = data as FaturaSistema[];
    }
  } catch (e) {
    // Fallback gracioso
  }

  const faturasLocais = getFaturasLocal();
  let faturasCombinadas: FaturaSistema[] = [];

  if (faturasSupabase && faturasSupabase.length > 0) {
    // Mescla faturas supabase e locais (evitando duplicidade por id)
    const map = new Map<string, FaturaSistema>();
    faturasSupabase.forEach(f => map.set(f.id, f));
    faturasLocais.forEach(f => {
      if (!map.has(f.id)) map.set(f.id, f);
    });
    faturasCombinadas = Array.from(map.values());
  } else {
    faturasCombinadas = faturasLocais;
  }

  if (usuarioId) {
    faturasCombinadas = faturasCombinadas.filter(f => f.usuario_id === usuarioId);
  }

  // Verifica status de vencimento automático
  const hoje = new Date().toISOString().split('T')[0];
  faturasCombinadas = faturasCombinadas.map(f => {
    if (f.status === 'pendente' && f.data_vencimento < hoje) {
      return { ...f, status: 'vencido' };
    }
    return f;
  });

  return faturasCombinadas.sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
}

/**
 * Cria uma nova fatura do sistema para um cliente
 */
export async function emitirFatura(
  cliente: Usuario,
  configPix: ConfiguracaoPix,
  opcoes?: {
    valor?: number;
    mesReferencia?: string;
    dataVencimento?: string;
    observacoes?: string;
  }
): Promise<FaturaSistema> {
  const agora = new Date();
  const valor = opcoes?.valor ?? configPix.valor_padrao ?? 99.00;

  // Calcula vencimento
  let vencimento = opcoes?.dataVencimento;
  if (!vencimento) {
    const dataVenc = new Date();
    dataVenc.setDate(dataVenc.getDate() + (configPix.dias_vencimento || 5));
    vencimento = dataVenc.toISOString().split('T')[0];
  }

  // Mês de referência (ex: "Novembro/2026")
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesReferencia = opcoes?.mesReferencia || `${meses[agora.getMonth()]}/${agora.getFullYear()}`;

  // Gera número da fatura e nosso número
  const idUnico = `FAT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const nossoNumero = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`;

  // Gera código Pix Copia e Cola dinâmico e boleto
  const txid = `KRO${idUnico.replace(/[^A-Za-z0-9]/g, '').slice(-15)}`;
  const pixCopiaCola = gerarPixCopiaECola(
    configPix.chave,
    configPix.beneficiario,
    configPix.cidade,
    valor,
    txid
  );

  const { linhaDigitavel, codigoBarras } = gerarDadosBoleto(nossoNumero, valor);

  const novaFatura: FaturaSistema = {
    id: idUnico,
    usuario_id: cliente.id,
    usuario_nome: cliente.nome || cliente.email?.split('@')[0] || 'Cliente Kroche',
    usuario_email: cliente.email || null,
    usuario_documento: null,
    valor,
    mes_referencia: mesReferencia,
    data_emissao: agora.toISOString(),
    data_vencimento: vencimento,
    status: 'pendente',
    pix_chave: configPix.chave,
    pix_tipo: configPix.tipo,
    pix_beneficiario: configPix.beneficiario,
    pix_cidade: configPix.cidade,
    pix_copia_cola: pixCopiaCola,
    nosso_numero: nossoNumero,
    linha_digitavel: linhaDigitavel,
    codigo_barras: codigoBarras,
    observacoes: opcoes?.observacoes || configPix.instrucoes || 'Mensalidade do sistema Kroche Manager',
    criado_em: agora.toISOString(),
  };

  // 1. Salva no LocalStorage
  const faturasLocais = getFaturasLocal();
  setFaturasLocal([novaFatura, ...faturasLocais]);

  // 2. Tenta salvar no Supabase
  try {
    await supabase.from('faturas_sistema').insert(novaFatura);
  } catch (e) {
    console.warn('Erro ao inserir no Supabase faturas_sistema (salvo localmente):', e);
  }

  return novaFatura;
}

/**
 * Emite faturas em lote para todos os clientes ativos
 */
export async function emitirFaturasEmLote(
  clientes: Usuario[],
  configPix: ConfiguracaoPix,
  opcoes?: {
    valor?: number;
    mesReferencia?: string;
    dataVencimento?: string;
    observacoes?: string;
  }
): Promise<{ total: number; emitidas: FaturaSistema[] }> {
  const emitidas: FaturaSistema[] = [];

  for (const cliente of clientes) {
    // Ignora clientes desativados se necessário
    if (cliente.ativo === false) continue;
    try {
      const fatura = await emitirFatura(cliente, configPix, opcoes);
      emitidas.push(fatura);
    } catch (e) {
      console.error(`Erro ao emitir fatura para ${cliente.nome}:`, e);
    }
  }

  return { total: emitidas.length, emitidas };
}

/**
 * Atualiza status da fatura (ex: marcar como pago, cancelar)
 */
export async function atualizarStatusFatura(
  faturaId: string,
  novoStatus: StatusFatura
): Promise<void> {
  const agora = new Date().toISOString();
  const pagoEm = novoStatus === 'pago' ? agora : null;

  // Local
  const faturas = getFaturasLocal();
  const index = faturas.findIndex(f => f.id === faturaId);
  if (index >= 0) {
    faturas[index].status = novoStatus;
    if (pagoEm) faturas[index].pago_em = pagoEm;
    setFaturasLocal(faturas);
  }

  // Supabase
  try {
    await supabase
      .from('faturas_sistema')
      .update({
        status: novoStatus,
        pago_em: pagoEm,
      })
      .eq('id', faturaId);
  } catch (e) {
    console.warn('Falha ao atualizar no Supabase (atualizado local):', e);
  }
}

/**
 * Exclui uma fatura
 */
export async function excluirFatura(faturaId: string): Promise<void> {
  // Local
  const faturas = getFaturasLocal().filter(f => f.id !== faturaId);
  setFaturasLocal(faturas);

  // Supabase
  try {
    await supabase.from('faturas_sistema').delete().eq('id', faturaId);
  } catch (e) {
    console.warn('Falha ao excluir no Supabase:', e);
  }
}
