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

export enum LoadLevel {
  Idle = "idle",
  Normal = "normal",
  Overloaded = "overloaded",
}

export enum CustomerStage {
  Received = "received",
  Assigned = "assigned",
  InProgress = "in_progress",
  WaitingYou = "waiting_you",
  Resolved = "resolved",
  Closed = "closed",
}

export enum Expectation {
  FirstResponse = "first_response",
  Resolution = "resolution",
  None = "none",
}

export enum ApiErrorCode {
  UnknownUser = "unknown_user",
  TicketNotFound = "ticket_not_found",
  OnlyCustomersOpenTickets = "only_customers_open_tickets",
  InvalidCategory = "invalid_category",
  InvalidPriority = "invalid_priority",
  TitleAndDescriptionRequired = "title_and_description_required",
  OnlyConsultantsTakeTickets = "only_consultants_take_tickets",
  TicketTakenByPerson = "ticket_taken_by_person",
  TicketTakenBySomeone = "ticket_taken_by_someone",
  TicketOfOtherGroup = "ticket_of_other_group",
  OnlyManagerReassigns = "only_manager_reassigns",
  OnlyConsultantsReceiveTickets = "only_consultants_receive_tickets",
  ConsultantOfOtherGroup = "consultant_of_other_group",
  FinishedTicketsStay = "finished_tickets_stay",
  UnknownAuthor = "unknown_author",
  EmptyMessage = "empty_message",
  NotYourTicket = "not_your_ticket",
  TicketFinishedReopenToWrite = "ticket_finished_reopen_to_write",
  CustomersWriteNoInternalNotes = "customers_write_no_internal_notes",
  OnlyAssigneeRepliesToCustomer = "only_assignee_replies_to_customer",
  TicketStillActive = "ticket_still_active",
  ReopenReasonRequired = "reopen_reason_required",
  CannotChangeStatus = "cannot_change_status",
  OnlyAssigneeChangesStatus = "only_assignee_changes_status",
  StatusReasonRequired = "status_reason_required",
  StatusChangeNotAllowed = "status_change_not_allowed",
}
