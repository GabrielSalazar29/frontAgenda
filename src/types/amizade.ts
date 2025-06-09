export enum StatusAmizade {
  PENDENTE = 'PENDENTE',
  ACEITO = 'ACEITO',
  RECUSADO = 'RECUSADO',
  BLOQUEADO = 'BLOQUEADO' 
}

export interface UsuarioSummaryDTO {
  id: number;
  username: string;
}

export interface SolicitacaoAmizadeDTO {
  id: number; 
  solicitante: UsuarioSummaryDTO;
  solicitado: UsuarioSummaryDTO;
  status: StatusAmizade;
  dataSolicitacao: string; 
}