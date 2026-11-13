export interface Props {
  ticketId: string;
  userId: string;
  draft: string;
  onDraftChange: (value: string) => void;
}
