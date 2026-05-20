export interface IEntidade {
  _id: string;
  nome: string;
  tipo_entidade: string;
  pais: string;
  nif: string;
  createdAt?: Date;
}

export interface IPeriodo {
  _id: string;
  tipo_periodo: 'Anual' | 'Trimestral' | 'Mensal' | 'Pontual';
  data_inicio: Date | string;
  data_fim: Date | string;
}

export interface IDocumento {
  _id: string;
  id_entidade: IEntidade | string; // Pode vir populado ou apenas ID
  id_periodo: IPeriodo | string;
  tipo_documento: string;
  numero_documento: string;
  data_emissao: Date | string;
  ficheiro_origem: string;
  estado: string;
  fonte_ingestao: string;
  versao_schema: string;
  data_processamento?: Date | string;
}

export interface IUnidadeMedida {
  _id: string;
  nome: string;
  simbolo: string;
  tipo_unidade: string;
}

export interface IMetrica {
  _id: string;
  nome: string;
  descricao?: string;
  pilar: 'E' | 'S' | 'G';
  subcategoria?: string;
  natureza: string;
  id_unidade_base: IUnidadeMedida | string;
  ativo: boolean;
}

export interface IDimensaoDado {
  chave: string;
  valor: string;
}

export interface IDado {
  _id: string;
  id_documento: IDocumento;      // Populado no Dashboard
  id_metrica: IMetrica;          // Populado no Dashboard
  id_entidade: IEntidade | string;
  id_periodo: IPeriodo | string;
  id_unidade_original: IUnidadeMedida;
  valor: number;
  valor_convertido_base: number;
  origem: string;
  estado_validacao: string;
  data_registo: Date | string;
  dimensoes: IDimensaoDado[];
}

// Interface auxiliar para a resposta padrão da API factory do Express
export interface ApiResponse<T> {
  success: boolean;
  sucesso?: boolean; // Compatibilidade com iaController
  data: T;
  logExplicativo?: string[];
}