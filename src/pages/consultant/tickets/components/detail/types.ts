import type { User } from "@/auth/users";
import type { HistoryEntry, Message, Person, Ticket } from "@/domain/types";
import type { TimelineKind } from "./enums";

export interface Props {
  ticketId: string;
  me: User;
  draft: string;
  onDraftChange: (value: string) => void;
}

export interface MessageItem {
  kind: TimelineKind.Message;
  at: string;
  key: string;
  author: string;
  text: string;
  internal: boolean;
}

export interface EventItem {
  kind: TimelineKind.Event;
  at: string;
  key: string;
  text: string;
}

export type TimelineItem = MessageItem | EventItem;

export interface BuildTimelineInput {
  ticket: Ticket;
  messages: Message[] | undefined;
  history: HistoryEntry[] | undefined;
  people: Record<string, Person>;
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
}
