export enum Status {
  Open = "aberto",
  InProgress = "em_atendimento",
  WaitingCustomer = "aguardando_cliente",
  Resolved = "resolvido",
  Closed = "fechado",
}

export enum Priority {
  Low = "baixa",
  Medium = "media",
  High = "alta",
  Critical = "critica",
}

export enum Profile {
  Manager = "gestor",
  Consultant = "consultor",
  Customer = "cliente",
}

export enum EventType {
  TicketOpened = "chamado.aberto",
  TicketAssigned = "chamado.atribuido",
  MessageAdded = "mensagem.adicionada",
  StatusChanged = "status.alterado",
}

export enum HistoryType {
  Status = "status",
  Assignment = "atribuicao",
}

export enum SlaKind {
  Breached = "breached",
  Critical = "critical",
  Warning = "warning",
  Ok = "ok",
  Paused = "paused",
  Finished = "finished",
}

export enum SlaClock {
  FirstResponse = "primeira_resposta",
  Resolution = "resolucao",
}
