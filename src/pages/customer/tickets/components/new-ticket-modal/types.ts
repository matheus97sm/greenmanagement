import type { User } from "@/auth/users";

export interface Props {
  me: User;
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
