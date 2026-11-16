import type { User } from "@/auth/users";
import type { Language, Translate } from "@/i18n";
import type { locales } from "./locales";

export interface Props {
  currentUser: User;
  onClose: () => void;
  onOpenTicket: (ticketId: string) => void;
}

export interface TopicOption {
  value: string;
  label: string;
}

export interface ImpactOption {
  value: string;
  label: string;
}

export interface FormState {
  title: string;
  description: string;
  topic: string | null;
}

export type ImpactKey =
  "impactEveryone" | "impactBlocked" | "impactSlows" | "impactCanWait";

export type ModalTranslate = Translate<(typeof locales)[Language.PtBr]>;
