export type TipoChavePix = 'chave_aleatoria' | 'cpf' | 'cnpj' | 'email' | 'telefone';

export interface ConfiguracaoPix {
  chave: string;
  tipo: TipoChavePix;
  beneficiario: string;
  cidade: string;
  valor_padrao: number; // padrão 99.00
  dias_vencimento: number; // padrão 5 dias
  instrucoes?: string;
  atualizado_em?: string;
}

export type StatusFatura = 'pendente' | 'pago' | 'vencido' | 'cancelado';

export interface FaturaSistema {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email?: string | null;
  usuario_documento?: string | null;
  valor: number; // Ex: 99.00
  mes_referencia: string; // Ex: "Novembro/2026"
  data_emissao: string; // ISO String
  data_vencimento: string; // YYYY-MM-DD
  status: StatusFatura;
  // Dados do PIX
  pix_chave: string;
  pix_tipo: TipoChavePix;
  pix_beneficiario: string;
  pix_cidade: string;
  pix_copia_cola: string;
  // Dados do Boleto
  nosso_numero: string;
  linha_digitavel: string;
  codigo_barras: string;
  observacoes?: string | null;
  pago_em?: string | null;
  criado_em?: string;
}

