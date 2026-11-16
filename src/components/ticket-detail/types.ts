import type { ReactNode } from "react";
import type { Role } from "@/auth/enums";
import type { User } from "@/auth/users";
import type { Profile, Status } from "@/domain/enums";
import type { Language, Translate } from "@/i18n";
import type { HistoryEntry, Message, Person, Ticket } from "@/domain/types";
import type { EventKind, TimelineKind } from "./enums";
import type { locales } from "./locales";

export interface Props {
  ticketId: string;
  currentUser: User;
  draft: string;
  onDraftChange: (value: string) => void;
  extraActions?: ReactNode;
}

export interface MessageItem {
  kind: TimelineKind.Message;
  at: string;
  key: string;
  author: string;
  authorProfile: Profile | undefined;
  text: string;
  internal: boolean;
}

export interface EventItem {
  kind: TimelineKind.Event;
  at: string;
  key: string;
  event: EventKind;
  who: string;
  from: Status | null;
  to: Status | null;
  reason: string | null;
}

export type TimelineItem = MessageItem | EventItem;

export interface BuildTimelineInput {
  ticket: Ticket;
  messages: Message[] | undefined;
  history: HistoryEntry[] | undefined;
  people: Record<string, Person>;
  unknownPerson: string;
}

export interface Actions {
  canAdvance: boolean;
  canReopen: boolean;
}

export interface FooterHintInput {
  ticket: Ticket;
  isMine: boolean;
  isClosed: boolean;
  canTake: boolean;
  nameOf: (id: string | null) => string;
  translate: Translate<(typeof locales)[Language.PtBr]>;
}

export interface PermissionsInput {
  ticket: Ticket;
  role: Role;
  userId: string;
  groupId: string | undefined;
}

export interface Permissions {
  canTake: boolean;
  canReply: boolean;
  canChangeStatus: boolean;
}
