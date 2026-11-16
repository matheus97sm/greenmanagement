import type { User } from "@/auth/users";
import type { Profile } from "@/domain/enums";
import type { Language, Translate } from "@/i18n";
import type { locales } from "./locales";
import type { Message, Person, Ticket } from "@/domain/types";

export interface Props {
  ticketId: string;
  currentUser: User;
  since: string;
}

export interface ThreadItem {
  key: string;
  at: string;
  author: string;
  role: Profile | undefined;
  isOwn: boolean;
  text: string;
  isNew: boolean;
}

export interface ThreadInput {
  ticket: Ticket;
  messages: Message[] | undefined;
  people: Record<string, Person>;
  meId: string;
  since: string;
  translate: Translate<(typeof locales)[Language.PtBr]>;
}
