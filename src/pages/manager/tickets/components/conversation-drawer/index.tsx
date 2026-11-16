import { useState } from "react";
import { Button, Drawer } from "@mantine/core";
import { TicketDetail } from "@/components/ticket-detail";
import { isActive } from "@/domain/status";
import { useTickets } from "@/store/useTickets";
import type { Props } from "./types";

export function ConversationDrawer({
  ticketId,
  currentUser,
  onClose,
  onReassign,
}: Props) {
  const state = useTickets();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const ticket = ticketId ? state.tickets[ticketId] : undefined;

  return (
    <Drawer
      opened={!!ticketId}
      onClose={onClose}
      position="right"
      size="min(720px, 100vw)"
      padding={0}
      title="Conversa do chamado"
      closeButtonProps={{ "aria-label": "Fechar conversa" }}
      styles={{ body: { height: "calc(100% - 60px)" } }}
    >
      {ticketId && (
        <TicketDetail
          key={ticketId}
          ticketId={ticketId}
          currentUser={currentUser}
          draft={drafts[ticketId] ?? ""}
          onDraftChange={(value) =>
            setDrafts((current) => ({ ...current, [ticketId]: value }))
          }
          extraActions={
            ticket && isActive(ticket.status) ? (
              <Button variant="default" onClick={() => onReassign(ticketId)}>
                Redistribuir
              </Button>
            ) : undefined
          }
        />
      )}
    </Drawer>
  );
}
