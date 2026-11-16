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
import { SlaBadge, StatusBadge } from "@/components/Badges";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/domain/status";
import type { RowProps } from "./types";

function TicketRowView({ item, selected, locked, onOpen, onToggle }: RowProps) {
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
          aria-label={`Selecionar chamado ${ticket.numero}`}
        />
        <Stack gap={2} style={{ minWidth: 0 }} flex={1}>
          <UnstyledButton
            onClick={() => onOpen(ticket.id)}
            aria-label={`Abrir conversa do chamado ${ticket.numero}`}
            style={{ minWidth: 0 }}
          >
            <Text size="sm" fw={500} truncate>
              #{ticket.numero} · {ticket.titulo}
            </Text>
          </UnstyledButton>
          <Text size="xs" c="dimmed" truncate>
            {requester}
            {" · "}
            {owner ? `com ${owner}` : "sem responsável"}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge
              size="sm"
              variant="dot"
              color={PRIORITY_COLOR[ticket.prioridade]}
            >
              {PRIORITY_LABEL[ticket.prioridade]}
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
