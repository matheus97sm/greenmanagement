import { useMemo, useState } from "react";
import {
  Badge,
  Group,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { formatDateTime } from "@/lib/format";
import { useTickets } from "@/store/useTickets";
import { StageBadge } from "../stage-badge";
import type { Props } from "./types";
import { handlerLine, listItems, unreadLabel } from "./utils";

export function TicketList({ currentUser, selectedId, onSelect }: Props) {
  const state = useTickets();
  const [search, setSearch] = useState("");
  const viewer = state.people[currentUser.id];

  const items = useMemo(
    () => listItems({ state, meId: currentUser.id, search }),
    [state, currentUser.id, search],
  );

  return (
    <Stack gap="xs" p="sm" h="100%" style={{ minHeight: 0 }}>
      <TextInput
        size="xs"
        aria-label="Buscar chamado"
        placeholder="Buscar por número ou título"
        leftSection={<IconSearch size={14} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          border: "1px solid var(--mantine-color-default-border)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        {items.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" p="lg">
            {search.trim()
              ? "Nenhum chamado encontrado."
              : "Você ainda não abriu nenhum chamado."}
          </Text>
        ) : (
          items.map(({ ticket, stage, handler, unread }) => (
            <UnstyledButton
              key={ticket.id}
              className="ticket-row"
              data-selected={ticket.id === selectedId || undefined}
              onClick={() => onSelect(ticket.id)}
              w="100%"
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text size="sm" fw={500} truncate>
                  #{ticket.numero} · {ticket.titulo}
                </Text>
                {unread > 0 && (
                  <Badge size="sm" color="green" variant="filled">
                    {unreadLabel(unread)}
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {handlerLine(handler)} · atualizado em{" "}
                {formatDateTime(
                  ticket.atualizado_em,
                  viewer?.zoneinfo,
                  viewer?.locale,
                )}
              </Text>
              <Group gap="xs" mt={4}>
                <StageBadge stage={stage} />
              </Group>
            </UnstyledButton>
          ))
        )}
      </div>
    </Stack>
  );
}
