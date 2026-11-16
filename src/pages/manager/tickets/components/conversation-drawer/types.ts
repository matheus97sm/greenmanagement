import type { User } from "@/auth/users";

export interface Props {
  ticketId: string | undefined;
  me: User;
  onClose: () => void;
  onReassign: (ticketId: string) => void;
}
