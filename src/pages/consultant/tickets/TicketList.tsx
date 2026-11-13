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
import { SlaBadge, StatusBadge } from "../../../components/Badges";
import { pausedSince } from "../../../domain/rules";
import { isActive, STATUS_LABEL } from "../../../domain/status";
import { compareBySla, slaInfo } from "../../../domain/sla";
import { STATUSES } from "../../../domain/types";
import type { User } from "../../../auth/users";
import { useNow } from "../../../hooks/useNow";
import { unreadCount } from "../../../store/ticketsStore";
import { useTickets } from "../../../store/useTickets";

const ROW_HEIGHT = 76;

type Tab = "mine" | "queue";
type StatusFilter = "active" | "all" | (typeof STATUSES)[number];

interface Props {
  me: User;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

export function TicketList({ me, selectedId, onSelect }: Props) {
  const state = useTickets();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("mine");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const myGroupId = state.people[me.id]?.grupo_id;

  const { mine, queue } = useMemo(() => {
    const all = Object.values(state.tickets);
    return {
      mine: all.filter((t) => t.responsavel_id === me.id),
      queue: all.filter(
        (t) =>
          !t.responsavel_id &&
          t.status === "aberto" &&
          t.grupo_id === myGroupId,
      ),
    };
  }, [state.tickets, me.id, myGroupId]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (tab === "mine" ? mine : queue)
      .filter((t) => {
        if (statusFilter === "active") return isActive(t.status);
        if (statusFilter !== "all") return t.status === statusFilter;
        return true;
      })
      .filter((t) => {
        if (!term) return true;
        const requester = state.people[t.solicitante_id];
        return (
          String(t.numero).includes(term) ||
          t.titulo.toLowerCase().includes(term) ||
          (requester?.nome ?? "").toLowerCase().includes(term) ||
          (requester?.empresa ?? "").toLowerCase().includes(term)
        );
      })
      .sort(compareBySla);
  }, [tab, mine, queue, statusFilter, search, state.people]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const myActiveCount = mine.filter((t) => isActive(t.status)).length;

  return (
    <Stack gap="xs" p="sm" h="100%" style={{ minHeight: 0 }}>
      <SegmentedControl
        fullWidth
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        data={[
          { value: "mine", label: `Meus (${myActiveCount})` },
          { value: "queue", label: `Fila do grupo (${queue.length})` },
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
          onChange={(v) => setStatusFilter((v as StatusFilter) ?? "active")}
          data={[
            { value: "active", label: "Em andamento" },
            { value: "all", label: "Todos" },
            ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
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
