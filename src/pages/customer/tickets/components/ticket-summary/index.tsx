import { useMemo } from "react";
import { Alert, SimpleGrid, Stack, Text, Timeline } from "@mantine/core";
import { useNow } from "@/hooks/useNow";
import { formatDateTime } from "@/lib/format";
import { useTickets } from "@/store/useTickets";
import { STAGE_COLOR, STAGE_LABEL } from "../stage-badge/constants";
import type { Props } from "./types";
import { expectationText, progressEvents, summaryOf } from "./utils";

export function TicketSummary({ ticketId, me }: Props) {
  const state = useTickets();
  const now = useNow();
  const ticket = state.tickets[ticketId];
  const viewer = state.people[me.id];
  const history = state.history[ticketId];

  const summary = useMemo(
    () => (ticket ? summaryOf({ ticket, people: state.people, now }) : null),
    [ticket, state.people, now],
  );
  const events = useMemo(
    () =>
      ticket
        ? progressEvents({
            ticket,
            history,
            people: state.people,
            meId: me.id,
          })
        : [],
    [ticket, history, state.people, me.id],
  );

  if (!ticket || !summary) return null;

  const formatDate = (iso: string) =>
    formatDateTime(iso, viewer?.zoneinfo, viewer?.locale);
  const expectation = expectationText(summary.expectation, formatDate);

  return (
    <Stack gap="md">
      <Alert
        variant="light"
        color={STAGE_COLOR[summary.stage]}
        title={STAGE_LABEL[summary.stage]}
      >
        {summary.headline}
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <div>
          <Text size="xs" c="dimmed">
            Quem está cuidando
          </Text>
          <Text size="sm">{summary.handler ?? "Ainda ninguém"}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Previsão
          </Text>
          <Text size="sm">{expectation ?? "Sem previsão no momento"}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Última atualização
          </Text>
          <Text size="sm">{formatDate(ticket.atualizado_em)}</Text>
        </div>
      </SimpleGrid>

      <div>
        <Text size="sm" fw={600} mb="xs">
          O que já aconteceu
        </Text>
        <Timeline active={events.length - 1} bulletSize={14} lineWidth={2}>
          {events.map((event) => (
            <Timeline.Item key={event.key} title={event.text}>
              <Text size="xs" c="dimmed">
                {formatDate(event.at)}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </Stack>
  );
}
