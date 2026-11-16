import type { User } from "@/auth/users";

export interface Props {
  ticketId: string;
  currentUser: User;
  draft: string;
  onDraftChange: (value: string) => void;
}
