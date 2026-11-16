import { useMemo, useState } from "react";
import {
  Alert,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useCurrentUser } from "@/auth/auth-context";
import { teamWeek } from "@/domain/activity";
import { groupIdsOf } from "@/domain/rules";
import { weekRange } from "@/domain/week";
import { consultantsOf } from "@/domain/workload";
import { useLanguage, useTranslate } from "@/i18n";
import { useNow } from "@/hooks/useNow";
import { LoadStatus } from "@/store/enums";
import { useTickets } from "@/store/useTickets";
import { WeekSummary } from "./components/week-summary";
import { WeekTable } from "./components/week-table";
import { ALL_GROUPS, SORT_LABEL_KEY } from "./constants";
import { SortKey } from "./enums";
import { locales } from "./locales";
import {
  buildRows,
  dayHeaders,
  mostIdle,
  sortRows,
  weekOptions,
} from "./utils";

export function DashboardPage() {
  const translate = useTranslate(locales);
  const { language } = useLanguage();
  const currentUser = useCurrentUser();
  const state = useTickets();
  const now = useNow();
  const [weeksAgo, setWeeksAgo] = useState("0");
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);
  const [sortKey, setSortKey] = useState<SortKey>(SortKey.Idle);

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

  const consultants = useMemo(
    () =>
      consultantsOf(
        Object.values(state.people),
        groupFilter === ALL_GROUPS ? groupIds : [groupFilter],
      ),
    [state.people, groupIds, groupFilter],
  );

  const range = useMemo(
    () => weekRange(now, Number(weeksAgo)),
    [now, weeksAgo],
  );

  const rows = useMemo(
    () =>
      buildRows({
        consultants,
        tickets,
        history: state.history,
        messages: state.messages,
        groups: state.groups,
        range,
        now,
      }),
    [
      consultants,
      tickets,
      state.history,
      state.messages,
      state.groups,
      range,
      now,
    ],
  );

  const sorted = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);
  const team = useMemo(() => teamWeek(rows.map((row) => row.week)), [rows]);

  if (state.status === LoadStatus.Error) {
    return <Alert color="red">{translate("loadError")}</Alert>;
  }

  if (state.status !== LoadStatus.Ready) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{translate("title")}</Title>
          <Text size="sm" c="dimmed" maw={680}>
            {translate("description")}
          </Text>
        </div>
        <Group gap="sm">
          <Select
            size="sm"
            w={260}
            label={translate("weekLabel")}
            allowDeselect={false}
            value={weeksAgo}
            onChange={(value) => setWeeksAgo(value ?? "0")}
            data={weekOptions(now, translate, language)}
          />
          <Select
            size="sm"
            w={180}
            label={translate("groupLabel")}
            allowDeselect={false}
            value={groupFilter}
            onChange={(value) => setGroupFilter(value ?? ALL_GROUPS)}
            data={[
              { value: ALL_GROUPS, label: translate("allGroups") },
              ...groups.map((group) => ({
                value: group.id,
                label: group.nome,
              })),
            ]}
          />
          <Select
            size="sm"
            w={210}
            label={translate("sortLabel")}
            allowDeselect={false}
            value={sortKey}
            onChange={(value) => setSortKey((value as SortKey) ?? SortKey.Idle)}
            data={Object.values(SortKey).map((key) => ({
              value: key,
              label: translate(SORT_LABEL_KEY[key]),
            }))}
          />
        </Group>
      </Group>

      <WeekSummary team={team} mostIdle={mostIdle(rows)} />
      <WeekTable
        rows={sorted}
        dayHeaders={dayHeaders(range.start, translate, language)}
      />
    </Stack>
  );
}
