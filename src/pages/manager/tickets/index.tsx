import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Title,
} from "@mantine/core";
import { useCurrentUser } from "@/auth/auth-context";
import { groupIdsOf } from "@/domain/rules";
import {
  activeTicketsOf,
  compareWorkload,
  consultantsOf,
  riskTickets,
  teamSummary,
  unassignedTickets,
  workloadByConsultant,
} from "@/domain/workload";
import { useNow } from "@/hooks/useNow";
import { LoadStatus } from "@/store/enums";
import { useTickets } from "@/store/useTickets";
import { ReassignModal } from "./components/reassign-modal";
import { Summary } from "./components/summary";
import { TeamBoard } from "./components/team-board";
import { TicketQueue } from "./components/ticket-queue";
import { ALL_GROUPS, MAX_ROWS } from "./constants";
import { FocusKind } from "./enums";
import type { Focus } from "./types";
import { filterByGroup } from "./utils";

export function TicketsPage() {
  const me = useCurrentUser();
  const state = useTickets();
  const now = useNow();
  const [focus, setFocus] = useState<Focus>({ kind: FocusKind.Risk });
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [reassigning, setReassigning] = useState(false);

  const viewer = state.people[me.id];
  const groupIds = useMemo(() => (viewer ? groupIdsOf(viewer) : []), [viewer]);
  const tickets = useMemo(() => Object.values(state.tickets), [state.tickets]);

  const groups = useMemo(
    () => Object.values(state.groups).filter((g) => groupIds.includes(g.id)),
    [state.groups, groupIds],
  );

  const workloads = useMemo(
    () =>
      workloadByConsultant(
        tickets,
        consultantsOf(Object.values(state.people), groupIds),
        now,
      ).sort(compareWorkload),
    [tickets, state.people, groupIds, now],
  );

  const summary = useMemo(
    () => teamSummary(tickets, workloads, now),
    [tickets, workloads, now],
  );

  const risk = useMemo(
    () => filterByGroup(riskTickets(tickets, now), groupFilter),
    [tickets, now, groupFilter],
  );
  const unassigned = useMemo(
    () => filterByGroup(unassignedTickets(tickets, now), groupFilter),
    [tickets, now, groupFilter],
  );

  const unassignedByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of unassignedTickets(tickets, now)) {
      counts[t.grupo_id] = (counts[t.grupo_id] ?? 0) + 1;
    }
    return counts;
  }, [tickets, now]);

  const focusedConsultant =
    focus.kind === FocusKind.Consultant
      ? state.people[focus.consultantId]
      : undefined;

  const shown = useMemo(() => {
    if (focus.kind === FocusKind.Consultant) {
      return activeTicketsOf(tickets, focus.consultantId, now);
    }
    return focus.kind === FocusKind.Risk ? risk : unassigned;
  }, [focus, tickets, now, risk, unassigned]);

  const visible = useMemo(() => shown.slice(0, MAX_ROWS), [shown]);

  const effectiveSelection = useMemo(() => {
    const ids = new Set(visible.map((t) => t.id));
    return new Set([...selected].filter((id) => ids.has(id)));
  }, [selected, visible]);

  const changeFocus = (next: Focus) => {
    setFocus(next);
    setSelected(new Set());
  };

  if (state.status === LoadStatus.Error) {
    return <Alert color="red">Não foi possível carregar os chamados.</Alert>;
  }

  if (state.status !== LoadStatus.Ready) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  const toggle = (ticketId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(ticketId)) next.add(ticketId);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(visible.map((t) => t.id)) : new Set());

  const selectedTickets = visible.filter((t) => effectiveSelection.has(t.id));

  const views = [
    { value: FocusKind.Risk, label: `Em risco (${risk.length})` },
    {
      value: FocusKind.Unassigned,
      label: `Sem responsável (${unassigned.length})`,
    },
    ...(focusedConsultant
      ? [
          {
            value: FocusKind.Consultant,
            label: `${focusedConsultant.nome} (${shown.length})`,
          },
        ]
      : []),
  ];

  return (
    <Stack gap="md">
      <Title order={2}>Equipe e chamados</Title>
      <Summary {...summary} />
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <TeamBoard
            groups={groups}
            workloads={workloads}
            unassignedByGroup={unassignedByGroup}
            selectedId={focusedConsultant?.id}
            onSelect={(consultantId) =>
              changeFocus(
                focusedConsultant?.id === consultantId
                  ? { kind: FocusKind.Risk }
                  : { kind: FocusKind.Consultant, consultantId },
              )
            }
            onShowUnassigned={(groupId) => {
              setGroupFilter(groupId);
              changeFocus({ kind: FocusKind.Unassigned });
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder>
            <Stack gap="xs" p="sm">
              <SegmentedControl
                fullWidth
                value={focus.kind}
                onChange={(value) => {
                  if (value !== FocusKind.Consultant) {
                    changeFocus({ kind: value as FocusKind.Risk });
                  }
                }}
                data={views}
              />
              <Group justify="space-between" wrap="nowrap">
                <Select
                  size="xs"
                  w={190}
                  aria-label="Grupo"
                  allowDeselect={false}
                  value={groupFilter}
                  onChange={(value) => {
                    setGroupFilter(value ?? ALL_GROUPS);
                    setSelected(new Set());
                  }}
                  data={[
                    { value: ALL_GROUPS, label: "Todos os grupos" },
                    ...groups.map((g) => ({ value: g.id, label: g.nome })),
                  ]}
                />
                <Button
                  size="xs"
                  disabled={selectedTickets.length === 0}
                  onClick={() => setReassigning(true)}
                >
                  Redistribuir ({selectedTickets.length})
                </Button>
              </Group>
            </Stack>
            <div
              style={{
                maxHeight: "calc(100dvh - 330px)",
                minHeight: 320,
                overflowY: "auto",
                borderTop: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <TicketQueue
                tickets={visible}
                total={shown.length}
                selected={effectiveSelection}
                now={now}
                emptyText="Nenhum chamado por aqui."
                onToggle={toggle}
                onToggleAll={toggleAll}
              />
            </div>
          </Paper>
        </Grid.Col>
      </Grid>
      {reassigning && (
        <ReassignModal
          tickets={selectedTickets}
          workloads={workloads}
          managerId={me.id}
          onClose={() => setReassigning(false)}
          onDone={() => {
            setReassigning(false);
            setSelected(new Set());
          }}
        />
      )}
    </Stack>
  );
}
