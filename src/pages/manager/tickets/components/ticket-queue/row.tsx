import { memo } from "react";
import {
  Badge,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { SlaBadge } from "@/components/sla-badge";
import { StatusBadge } from "@/components/status-badge";
import { PRIORITY_COLOR } from "@/domain/status";
import { useLabels, useTranslate } from "@/i18n";
import { locales } from "./locales";
import type { RowProps } from "./types";

function TicketRowView({ item, selected, locked, onOpen, onToggle }: RowProps) {
  const translate = useTranslate(locales);
  const labels = useLabels();
  const { ticket, sla, requester, owner, group } = item;

  return (
    <Paper
      className="ticket-row"
      data-selected={selected || undefined}
      data-locked={locked || undefined}
      radius={0}
      h="100%"
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Checkbox
          mt={2}
          checked={selected}
          disabled={locked}
          onChange={() => onToggle(ticket.id)}
          aria-label={translate("selectTicket", { number: ticket.numero })}
        />
        <Stack gap={2} style={{ minWidth: 0 }} flex={1}>
          <UnstyledButton
            onClick={() => onOpen(ticket.id)}
            aria-label={translate("openTicket", { number: ticket.numero })}
            style={{ minWidth: 0 }}
          >
            <Text size="sm" fw={500} truncate>
              #{ticket.numero} · {ticket.titulo}
            </Text>
          </UnstyledButton>
          <Text size="xs" c="dimmed" truncate>
            {owner
              ? translate("withOwner", { requester, owner })
              : translate("withoutOwner", { requester })}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge
              size="sm"
              variant="dot"
              color={PRIORITY_COLOR[ticket.prioridade]}
            >
              {labels.priority(ticket.prioridade)}
            </Badge>
            <StatusBadge status={ticket.status} />
            <SlaBadge sla={sla} />
            <Text size="xs" c="dimmed">
              {group}
            </Text>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

export const TicketRow = memo(TicketRowView);
