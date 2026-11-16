import { ApiErrorCode } from "@/domain/enums";
import type { locales } from "./locales";

type ErrorKey = keyof (typeof locales)["pt-BR"];

export const ERROR_KEY: Record<ApiErrorCode, ErrorKey> = {
  [ApiErrorCode.UnknownUser]: "unknownUser",
  [ApiErrorCode.TicketNotFound]: "ticketNotFound",
  [ApiErrorCode.OnlyCustomersOpenTickets]: "onlyCustomersOpenTickets",
  [ApiErrorCode.InvalidCategory]: "invalidCategory",
  [ApiErrorCode.InvalidPriority]: "invalidPriority",
  [ApiErrorCode.TitleAndDescriptionRequired]: "titleAndDescriptionRequired",
  [ApiErrorCode.OnlyConsultantsTakeTickets]: "onlyConsultantsTakeTickets",
  [ApiErrorCode.TicketTakenByPerson]: "ticketTakenByPerson",
  [ApiErrorCode.TicketTakenBySomeone]: "ticketTakenBySomeone",
  [ApiErrorCode.TicketOfOtherGroup]: "ticketOfOtherGroup",
  [ApiErrorCode.OnlyManagerReassigns]: "onlyManagerReassigns",
  [ApiErrorCode.OnlyConsultantsReceiveTickets]: "onlyConsultantsReceiveTickets",
  [ApiErrorCode.ConsultantOfOtherGroup]: "consultantOfOtherGroup",
  [ApiErrorCode.FinishedTicketsStay]: "finishedTicketsStay",
  [ApiErrorCode.UnknownAuthor]: "unknownAuthor",
  [ApiErrorCode.EmptyMessage]: "emptyMessage",
  [ApiErrorCode.NotYourTicket]: "notYourTicket",
  [ApiErrorCode.TicketFinishedReopenToWrite]: "ticketFinishedReopenToWrite",
  [ApiErrorCode.CustomersWriteNoInternalNotes]: "customersWriteNoInternalNotes",
  [ApiErrorCode.OnlyAssigneeRepliesToCustomer]: "onlyAssigneeRepliesToCustomer",
  [ApiErrorCode.TicketStillActive]: "ticketStillActive",
  [ApiErrorCode.ReopenReasonRequired]: "reopenReasonRequired",
  [ApiErrorCode.CannotChangeStatus]: "cannotChangeStatus",
  [ApiErrorCode.OnlyAssigneeChangesStatus]: "onlyAssigneeChangesStatus",
  [ApiErrorCode.StatusReasonRequired]: "statusReasonRequired",
  [ApiErrorCode.StatusChangeNotAllowed]: "statusChangeNotAllowed",
};
