import type { User } from "@/auth/users";

export interface Props {
  ticketId: string;
  me: User;
  draft: string;
  onDraftChange: (value: string) => void;
}
