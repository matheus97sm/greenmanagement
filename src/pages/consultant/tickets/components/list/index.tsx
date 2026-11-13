import { useMemo, useRef, useState } from "react";
import {
  Badge,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SlaBadge, StatusBadge } from "@/components/Badges";
import { pausedSince } from "@/domain/rules";
import { slaInfo } from "@/domain/sla";
import { isActive } from "@/domain/status";
import { useNow } from "@/hooks/useNow";
import { unreadCount } from "@/store/ticketsStore";
import { useTickets } from "@/store/useTickets";
import { ROW_HEIGHT, ROW_OVERSCAN } from "./constants";
import { StatusOption, Tab } from "./enums";
import type { Props, StatusFilter } from "./types";
import { selectRows, splitTickets, statusFilterOptions } from "./utils";

export function TicketList({ me, selectedId, onSelect }: Props) {
  const state = useTickets();
  const now = useNow();
  const [tab, setTab] = useState<Tab>(Tab.Mine);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    StatusOption.Active,
  );
  const [search, setSearch] = useState("");

  const myGroupId = state.people[me.id]?.grupo_id;

  const { mine, queue } = useMemo(
    () => splitTickets(Object.values(state.tickets), me.id, myGroupId),
    [state.tickets, me.id, myGroupId],
  );

  const rows = useMemo(
    () =>
      selectRows({
        mine,
        queue,
        tab,
        statusFilter,
        search,
        people: state.people,
        now,
      }),
    [mine, queue, tab, statusFilter, search, state.people, now],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: ROW_OVERSCAN,
  });

  const myActiveCount = mine.filter((t) => isActive(t.status)).length;

  return (
    <Stack gap="xs" p="sm" h="100%" style={{ minHeight: 0 }}>
      <SegmentedControl
        fullWidth
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        data={[
          { value: Tab.Mine, label: `Meus (${myActiveCount})` },
          { value: Tab.Queue, label: `Fila do grupo (${queue.length})` },
        ]}
      />
      <Group gap="xs" wrap="nowrap">
        <TextInput
          flex={1}
          size="xs"
          placeholder="Buscar por nº, título ou cliente"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Select
          size="xs"
          w={150}
          allowDeselect={false}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter((value as StatusFilter) ?? StatusOption.Active)
          }
          data={statusFilterOptions()}
        />
      </Group>

      <div
        ref={parentRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          border: "1px solid var(--mantine-color-default-border)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        {rows.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" p="lg">
            Nenhum chamado por aqui.
          </Text>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((v) => {
              const ticket = rows[v.index];
              const sla = slaInfo(
                ticket,
                now,
                pausedSince(ticket, state.history[ticket.id]),
              );
              const unread = unreadCount(state, ticket.id, me.id);
              const requester = state.people[ticket.solicitante_id];
              return (
                <UnstyledButton
                  key={ticket.id}
                  className="ticket-row"
                  data-selected={ticket.id === selectedId || undefined}
                  onClick={() => onSelect(ticket.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: v.size,
                    transform: `translateY(${v.start}px)`,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm" fw={500} truncate>
                      #{ticket.numero} · {ticket.titulo}
                    </Text>
                    {unread > 0 && (
                      <Badge size="sm" circle color="green">
                        {unread}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" truncate>
                    {requester?.nome}
                    {requester?.empresa ? ` · ${requester.empresa}` : ""}
                  </Text>
                  <Group gap="xs" mt={4}>
                    <StatusBadge status={ticket.status} />
                    <SlaBadge sla={sla} />
                  </Group>
                </UnstyledButton>
              );
            })}
          </div>
        )}
      </div>
    </Stack>
  );
}
