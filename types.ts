
export enum AWBStatus {
  EM_TRANSITO = 'EM TRÂNSITO',
  DISPONIVEL = 'DISPONIVEL',
  ENTREGUE = 'ENTREGUE',
  ATRASADO = 'ATRASADO',
  AGUARDANDO_AWB = 'AGUARDANDO AWB',
  COLETA_ERRADA = 'COLETA ERRADA',
  OK = 'OK'
}

export type ViewType = 'dashboard' | 'reports' | 'chat' | 'settings' | 'follow-up' | 'history';

export interface FilterState {
  statuses: AWBStatus[];
  period: 'hoje' | 'semana' | 'mes' | 'todos';
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  img?: string;
  timestamp: string;
  type: 'text' | 'image';
  edited?: boolean;
}

export interface ChatGroup {
  name: string;
  sheetName: string;
  type: 'group' | 'dm';
  lastMessage?: string;
  unreadCount: number;
  lastReadCount: number;
}

export interface GroupCreatePayload {
  name: string;
  members: string[];
}

export interface AWBRecord {
  id: string;
  ID: string;
  fornecedor: string;
  Fornecedor: string;
  saida: string;
  Saída: string;
  nfs: string;
  "NF's": string;
  awbNumber: string;
  AWB: string;
  status: AWBStatus;
  Status: AWBStatus;
  chegada: string;
  Chegada: string;
  marca: string;
  Marca: string;
  material: string;
  Material: string;
  observacao: string;
  Observação: string;
  rastreio: string;
  Rastreio: string;
  documentos: string;
  Documentos: string;
  // Campos para notificação por e-mail
  send_email?: boolean;
  email_to?: string;
  email_cc?: string;
  email_bcc?: string;
  email_body?: string;
  pdf_links?: string[];
  [key: string]: any;
}

export interface User {
  id: string;
  ID?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'ativo' | 'inativo';
  allowedViews: ViewType[];
  profileImage?: string;
  cargo?: string;
  USUÁRIO?: string;
  "E-MAIL"?: string;
  SENHA?: string;
  senha?: string;
  PAPEL?: string;
  STATUS?: string;
  bio?: string;
  location?: string;
  birthday?: string;
  Bio?: string;
  Location?: string;
  Birthday?: string;
  Cargo?: string;
}
