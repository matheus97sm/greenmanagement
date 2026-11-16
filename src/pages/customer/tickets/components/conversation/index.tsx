import { useState } from "react";
import { Box, Stack, Text, Title } from "@mantine/core";
import { Composer } from "@/components/composer";
import { canReopen, stageOf } from "@/domain/customer";
import { formatDateTime } from "@/lib/format";
import { useTickets } from "@/store/useTickets";
import { ReopenBox } from "../reopen-box";
import { StageBadge } from "../stage-badge";
import { TicketSummary } from "../ticket-summary";
import { TicketThread } from "../ticket-thread";
import { REPLY_PLACEHOLDER } from "./constants";
import type { Props } from "./types";

export function Conversation({ ticketId, me, draft, onDraftChange }: Props) {
  const state = useTickets();
  const [since] = useState(() => state.lastRead[ticketId] ?? state.loadedAt);
  const ticket = state.tickets[ticketId];
  const viewer = state.people[me.id];

  if (!ticket) {
    return (
      <Text c="dimmed" p="lg">
        Chamado não encontrado.
      </Text>
    );
  }

  return (
    <Stack gap={0} h="100%" style={{ minHeight: 0 }}>
      <Stack
        gap={4}
        p="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Title order={4}>
          #{ticket.numero} · {ticket.titulo}
        </Title>
        <Text size="sm" c="dimmed">
          Aberto em{" "}
          {formatDateTime(ticket.aberto_em, viewer?.zoneinfo, viewer?.locale)}
        </Text>
        <div>
          <StageBadge stage={stageOf(ticket)} />
        </div>
      </Stack>

      <Box p="md" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Stack gap="lg">
          <TicketSummary ticketId={ticketId} me={me} />
          <TicketThread ticketId={ticketId} me={me} since={since} />
        </Stack>
      </Box>

      {canReopen(ticket) ? (
        <ReopenBox ticketId={ticketId} customerId={me.id} />
      ) : (
        <Composer
          key={ticketId}
          ticketId={ticketId}
          userId={me.id}
          draft={draft}
          onDraftChange={onDraftChange}
          allowNotes={false}
          placeholder={REPLY_PLACEHOLDER}
        />
      )}
    </Stack>
  );
}
