import { useCallback, useMemo, useState } from "react";
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
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/auth-context";
import { groupIdsOf } from "@/domain/rules";
import {
  compareWorkload,
  consultantsOf,
  riskTickets,
  teamSummary,
  unassignedTickets,
  workloadByConsultant,
} from "@/domain/workload";
import { useNow } from "@/hooks/useNow";
import { homePath } from "@/paths";
import { LoadStatus } from "@/store/enums";
import { useTickets } from "@/store/useTickets";
import { ConversationDrawer } from "./components/conversation-drawer";
import { ReassignModal } from "./components/reassign-modal";
import { Summary } from "./components/summary";
import { TeamBoard } from "./components/team-board";
import { TicketQueue } from "./components/ticket-queue";
import { ALL_GROUPS, MAX_ROWS } from "./constants";
import { FocusKind } from "./enums";
import type { Focus } from "./types";
import {
  filterByGroup,
  findTickets,
  focusAfterPicking,
  keepVisible,
  ticketsInFocus,
  toggled,
  unassignedCountByGroup,
  viewOptions,
} from "./utils";

export function TicketsPage() {
  const currentUser = useCurrentUser();
  const state = useTickets();
  const now = useNow();
  const [focus, setFocus] = useState<Focus>({ kind: FocusKind.Risk });
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [reassignIds, setReassignIds] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { id: openId } = useParams();

  const viewer = state.people[currentUser.id];
  const groupIds = useMemo(() => (viewer ? groupIdsOf(viewer) : []), [viewer]);
  const tickets = useMemo(() => Object.values(state.tickets), [state.tickets]);

  const groups = useMemo(
    () =>
      Object.values(state.groups).filter((group) =>
        groupIds.includes(group.id),
      ),
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

  const unassignedByGroup = useMemo(
    () => unassignedCountByGroup(tickets, now),
    [tickets, now],
  );

  const focusedConsultant =
    focus.kind === FocusKind.Consultant
      ? state.people[focus.consultantId]
      : undefined;

  const searching = search.trim().length > 0;

  const found = useMemo(
    () =>
      findTickets({
        tickets,
        term: search,
        people: state.people,
        now,
        groupId: groupFilter,
      }),
    [tickets, search, state.people, now, groupFilter],
  );

  const shown = useMemo(
    () =>
      searching
        ? found
        : ticketsInFocus({ focus, tickets, now, risk, unassigned }),
    [searching, found, focus, tickets, now, risk, unassigned],
  );

  const visible = useMemo(() => shown.slice(0, MAX_ROWS), [shown]);

  const effectiveSelection = useMemo(
    () => keepVisible(selected, visible),
    [selected, visible],
  );

  const changeFocus = useCallback((next: Focus) => {
    setFocus(next);
    setSelected(new Set());
  }, []);

  const role = currentUser.role;
  const toggle = useCallback(
    (ticketId: string) => setSelected((current) => toggled(current, ticketId)),
    [],
  );
  const openTicket = useCallback(
    (ticketId: string) => navigate(`${homePath(role)}/${ticketId}`),
    [navigate, role],
  );
  const pickConsultant = useCallback((consultantId: string) => {
    setFocus((current) => focusAfterPicking(current, consultantId));
    setSelected(new Set());
  }, []);
  const showUnassigned = useCallback(
    (groupId: string) => {
      setGroupFilter(groupId);
      changeFocus({ kind: FocusKind.Unassigned });
    },
    [changeFocus],
  );

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

  const toggleAll = (ticketIds: string[], checked: boolean) =>
    setSelected(checked ? new Set(ticketIds) : new Set());

  const selectedTickets = visible.filter((ticket) =>
    effectiveSelection.has(ticket.id),
  );

  const views = viewOptions({
    riskCount: risk.length,
    unassignedCount: unassigned.length,
    consultant: focusedConsultant,
    consultantCount: shown.length,
  });

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
            onSelect={pickConsultant}
            onShowUnassigned={showUnassigned}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder>
            <Stack gap="xs" p="sm">
              <TextInput
                size="xs"
                aria-label="Buscar chamado"
                placeholder="Buscar em todos os chamados por nº, título ou cliente"
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(event) => {
                  setSearch(event.currentTarget.value);
                  setSelected(new Set());
                }}
              />
              <SegmentedControl
                fullWidth
                disabled={searching}
                value={focus.kind}
                onChange={(value) => {
                  if (value !== FocusKind.Consultant) {
                    changeFocus({ kind: value as FocusKind.Risk });
                  }
                }}
                data={views}
              />
              {searching && (
                <Text size="xs" c="dimmed">
                  {shown.length === 1
                    ? "1 chamado encontrado"
                    : `${shown.length} chamados encontrados`}
                </Text>
              )}
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
                    ...groups.map((group) => ({
                      value: group.id,
                      label: group.nome,
                    })),
                  ]}
                />
                <Button
                  size="xs"
                  disabled={selectedTickets.length === 0}
                  onClick={() =>
                    setReassignIds(selectedTickets.map((ticket) => ticket.id))
                  }
                >
                  Redistribuir ({selectedTickets.length})
                </Button>
              </Group>
            </Stack>
            <div
              style={{
                borderTop: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <TicketQueue
                tickets={visible}
                total={shown.length}
                selected={effectiveSelection}
                lockedGroupId={selectedTickets[0]?.grupo_id}
                now={now}
                emptyText={
                  searching
                    ? "Nenhum chamado encontrado."
                    : "Nenhum chamado por aqui."
                }
                onOpen={openTicket}
                onToggle={toggle}
                onToggleAll={toggleAll}
              />
            </div>
          </Paper>
        </Grid.Col>
      </Grid>
      <ConversationDrawer
        ticketId={openId}
        currentUser={currentUser}
        onClose={() => navigate(homePath(currentUser.role))}
        onReassign={(ticketId) => setReassignIds([ticketId])}
      />
      {reassignIds && (
        <ReassignModal
          tickets={reassignIds.flatMap((id) => state.tickets[id] ?? [])}
          workloads={workloads}
          managerId={currentUser.id}
          onClose={() => setReassignIds(null)}
          onDone={() => {
            setReassignIds(null);
            setSelected(new Set());
          }}
        />
      )}
    </Stack>
  );
}
