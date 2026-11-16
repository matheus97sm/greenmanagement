import { Badge, Checkbox, Group, Paper, Stack, Text } from "@mantine/core";
import { SlaBadge, StatusBadge } from "@/components/Badges";
import { pausedSince } from "@/domain/rules";
import { slaInfo } from "@/domain/sla";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/domain/status";
import { useTickets } from "@/store/useTickets";
import type { Props } from "./types";

export function TicketQueue({
  tickets,
  total,
  selected,
  now,
  emptyText,
  onToggle,
  onToggleAll,
}: Props) {
  const state = useTickets();
  const allSelected =
    tickets.length > 0 && tickets.every((t) => selected.has(t.id));
  const someSelected = tickets.some((t) => selected.has(t.id));

  if (tickets.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" p="lg">
        {emptyText}
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      <Group
        px="sm"
        py="xs"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Checkbox
          size="xs"
          label="Selecionar todos"
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={(e) => onToggleAll(e.currentTarget.checked)}
        />
      </Group>
      {tickets.map((ticket) => {
        const sla = slaInfo(
          ticket,
          now,
          pausedSince(ticket, state.history[ticket.id]),
        );
        const requester = state.people[ticket.solicitante_id];
        const owner = ticket.responsavel_id
          ? state.people[ticket.responsavel_id]?.nome
          : undefined;
        return (
          <Paper
            key={ticket.id}
            className="ticket-row"
            data-selected={selected.has(ticket.id) || undefined}
            radius={0}
          >
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Checkbox
                mt={2}
                checked={selected.has(ticket.id)}
                onChange={() => onToggle(ticket.id)}
                aria-label={`Selecionar chamado ${ticket.numero}`}
              />
              <Stack gap={2} style={{ minWidth: 0 }} flex={1}>
                <Text size="sm" fw={500} truncate>
                  #{ticket.numero} · {ticket.titulo}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {requester?.nome}
                  {requester?.empresa ? ` · ${requester.empresa}` : ""}
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
                </Group>
              </Stack>
            </Group>
          </Paper>
        );
      })}
      {total > tickets.length && (
        <Text size="xs" c="dimmed" ta="center" p="sm">
          Mostrando os {tickets.length} mais urgentes de {total}.
        </Text>
      )}
    </Stack>
  );
}
