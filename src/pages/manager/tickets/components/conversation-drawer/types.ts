import type { User } from "@/auth/users";

export interface Props {
  ticketId: string | undefined;
  currentUser: User;
  onClose: () => void;
  onReassign: (ticketId: string) => void;
}
