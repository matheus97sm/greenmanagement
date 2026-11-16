import { useState } from "react";
import { Box, Stack, Text, Title } from "@mantine/core";
import { Composer } from "@/components/composer";
import { canReopen, stageOf } from "@/domain/customer";
import { useTranslate } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { useTickets } from "@/store/useTickets";
import { ReopenBox } from "../reopen-box";
import { StageBadge } from "../stage-badge";
import { TicketSummary } from "../ticket-summary";
import { TicketThread } from "../ticket-thread";
import { locales } from "./locales";
import type { Props } from "./types";

export function Conversation({
  ticketId,
  currentUser,
  draft,
  onDraftChange,
}: Props) {
  const translate = useTranslate(locales);
  const state = useTickets();
  const [since] = useState(() => state.lastRead[ticketId] ?? state.loadedAt);
  const ticket = state.tickets[ticketId];
  const viewer = state.people[currentUser.id];

  if (!ticket) {
    return (
      <Text c="dimmed" p="lg">
        {translate("notFound")}
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
          {translate("openedAt", {
            date: formatDateTime(
              ticket.aberto_em,
              viewer?.zoneinfo,
              viewer?.locale,
            ),
          })}
        </Text>
        <div>
          <StageBadge stage={stageOf(ticket)} />
        </div>
      </Stack>

      <Box p="md" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Stack gap="lg">
          <TicketSummary ticketId={ticketId} currentUser={currentUser} />
          <TicketThread
            ticketId={ticketId}
            currentUser={currentUser}
            since={since}
          />
        </Stack>
      </Box>

      {canReopen(ticket) ? (
        <ReopenBox ticketId={ticketId} customerId={currentUser.id} />
      ) : (
        <Composer
          key={ticketId}
          ticketId={ticketId}
          userId={currentUser.id}
          draft={draft}
          onDraftChange={onDraftChange}
          allowNotes={false}
          placeholder={translate("replyPlaceholder")}
        />
      )}
    </Stack>
  );
}
