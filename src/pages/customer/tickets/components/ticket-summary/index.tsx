import { useMemo } from "react";
import { Alert, SimpleGrid, Stack, Text, Timeline } from "@mantine/core";
import { useNow } from "@/hooks/useNow";
import { useTranslate } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { useTickets } from "@/store/useTickets";
import { STAGE_COLOR, STAGE_KEY } from "../stage-badge/constants";
import { locales as stageLocales } from "../stage-badge/locales";
import { locales } from "./locales";
import type { Props } from "./types";
import { expectationText, progressEvents, summaryOf } from "./utils";

export function TicketSummary({ ticketId, currentUser }: Props) {
  const translate = useTranslate(locales);
  const translateStage = useTranslate(stageLocales);
  const state = useTickets();
  const now = useNow();
  const ticket = state.tickets[ticketId];
  const viewer = state.people[currentUser.id];
  const history = state.history[ticketId];

  const summary = useMemo(
    () =>
      ticket
        ? summaryOf({ ticket, people: state.people, now, translate })
        : null,
    [ticket, state.people, now, translate],
  );
  const events = useMemo(
    () =>
      ticket
        ? progressEvents({
            ticket,
            history,
            people: state.people,
            meId: currentUser.id,
            translate,
          })
        : [],
    [ticket, history, state.people, currentUser.id, translate],
  );

  if (!ticket || !summary) return null;

  const formatDate = (iso: string) =>
    formatDateTime(iso, viewer?.zoneinfo, viewer?.locale);
  const expectation = expectationText(
    summary.expectation,
    formatDate,
    translate,
  );

  return (
    <Stack gap="md">
      <Alert
        variant="light"
        color={STAGE_COLOR[summary.stage]}
        title={translateStage(STAGE_KEY[summary.stage])}
      >
        {summary.headline}
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <div>
          <Text size="xs" c="dimmed">
            {translate("handlerLabel")}
          </Text>
          <Text size="sm">{summary.handler ?? translate("handlerNone")}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            {translate("expectationLabel")}
          </Text>
          <Text size="sm">{expectation ?? translate("expectationNone")}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            {translate("updatedLabel")}
          </Text>
          <Text size="sm">{formatDate(ticket.atualizado_em)}</Text>
        </div>
      </SimpleGrid>

      <div>
        <Text size="sm" fw={600} mb="xs">
          {translate("happenedTitle")}
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
