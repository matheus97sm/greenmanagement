import type { User } from "@/auth/users";
import type { Language, Translate } from "@/i18n";
import type { CustomerStage } from "@/domain/enums";
import type { NextExpectation } from "@/domain/customer";
import type { HistoryEntry, Person, Ticket } from "@/domain/types";
import type { locales } from "./locales";

export type SummaryTranslate = Translate<(typeof locales)[Language.PtBr]>;

export interface Props {
  ticketId: string;
  currentUser: User;
}

export interface Summary {
  stage: CustomerStage;
  headline: string;
  handler: string | null;
  expectation: NextExpectation;
}

export interface SummaryInput {
  ticket: Ticket;
  people: Record<string, Person>;
  now: number;
  translate: SummaryTranslate;
}

export interface ProgressEvent {
  key: string;
  at: string;
  text: string;
}

export interface ProgressInput {
  ticket: Ticket;
  history: HistoryEntry[] | undefined;
  people: Record<string, Person>;
  meId: string;
  translate: SummaryTranslate;
}
