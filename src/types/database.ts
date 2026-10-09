export interface Usuario {
  id: string;
  nome: string;
  whatsapp?: string | null;
  slug: string;
  tema: string;
  foto?: string | null;
  catalogo_nome?: string | null;
  catalogo_slogan?: string | null;
  catalogo_banner?: string | null;
  catalogo_cor?: string | null;
  catalogo_cor_botao?: string | null;
  catalogo_cor_fundo?: string | null;
  mostrar_preco: boolean;
  mostrar_estoque: boolean;
  mostrar_tempo: boolean;
  aceitou_termos: boolean;
  aceitou_politica: boolean;
  data_aceite_lgpd?: string;
  data?: string;
}

export interface Venda {
  id: number;
  cliente: string;
  produto: string;
  valor: number;
  data?: string;
  user_id: string;
}

export interface Compra {
  id: number;
  material: string;
  fornecedor: string;
  quantidade: number;
  valor: number;
  data?: string;
  user_id: string;
}

export interface Encomenda {
  id: number;
  cliente: string;
  telefone?: string | null;
  produto: string;
  valor: number;
  sinal?: number | null;
  data_entrega?: string | null;
  status?: string | null;
  observacoes?: string | null;
  data?: string;
  user_id: string;
  pedido_catalogo_id?: number | null;
}

export interface Produto {
  id: number;
  usuario_id: string;
  nome: string;
  descricao?: string | null;
  foto?: string | null;
  preco: number;
  quantidade: number;
  estoque_minimo?: number;
  tempo_producao?: number | null;
  mostrar_catalogo: boolean;
  categoria_id?: number | null;
  categoria?: string | null;
  data?: string;
}

export interface CategoriaProduto {
  id: number;
  usuario_id: string;
  nome: string;
  slug: string;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Material {
  id: number;
  usuario_id: string;
  nome: string;
  categoria?: string | null;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  custo_unitario: number;
  fornecedor?: string | null;
  observacoes?: string | null;
  data?: string;
}

export interface Receita {
  id: number;
  nome: string;
  autor?: string | null;
  categoria?: string | null;
  nivel?: string | null;
  youtube?: string | null;
  pdf?: string | null;
  observacoes?: string | null;
  favorito?: boolean;
  data?: string;
  user_id: string;
}

export interface Lead {
  id: number;
  usuario_id: string;
  nome_cliente: string;
  telefone_cliente: string;
  itens: any;
  valor_total: number;
  status: string;
  data?: string;
}

export interface PedidoCatalogo {
  id: number;
  usuario_id: string;
  cliente: string;
  telefone: string;
  total: number;
  status: string;
  data?: string;
}

export interface PedidoItem {
  id: number;
  pedido_id: number;
  produto_id?: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}
