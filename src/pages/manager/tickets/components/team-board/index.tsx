import { memo } from "react";
import {
  Anchor,
  Badge,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import { UnstyledButton } from "@mantine/core";
import { useTranslate } from "@/i18n";
import { LEVEL_COLOR, LEVEL_LABEL } from "./constants";
import { locales } from "./locales";
import type { Props, RowProps } from "./types";
import { barValue, sectionsOf } from "./utils";

function ConsultantRow({ workload, maxActive, selected, onSelect }: RowProps) {
  const translate = useTranslate(locales);
  const { consultant, active, breached, atRisk, waitingCustomer, level } =
    workload;
  const levelKey = LEVEL_LABEL[level];

  return (
    <UnstyledButton
      className="team-row"
      data-selected={selected || undefined}
      aria-pressed={selected}
      onClick={() => onSelect(consultant.id)}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="sm" fw={500} truncate>
          {consultant.nome}
        </Text>
        <Text size="sm" fw={600}>
          {active}
        </Text>
      </Group>
      <Progress
        mt={4}
        size="sm"
        value={barValue(active, maxActive)}
        color={LEVEL_COLOR[level]}
        aria-label={translate("load", { name: consultant.nome })}
      />
      <Group gap={6} mt={6} mih={20}>
        {levelKey && (
          <Badge size="sm" variant="light" color={LEVEL_COLOR[level]}>
            {translate(levelKey)}
          </Badge>
        )}
        {breached > 0 && (
          <Badge size="sm" color="red" variant="filled">
            {translate("breached", { count: breached })}
          </Badge>
        )}
        {atRisk > 0 && (
          <Badge size="sm" color="orange" variant="light">
            {translate("atRisk", { count: atRisk })}
          </Badge>
        )}
        {waitingCustomer > 0 && (
          <Text size="xs" c="dimmed">
            {translate("waitingCustomer", { count: waitingCustomer })}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
}

function TeamBoardView({
  groups,
  workloads,
  unassignedByGroup,
  selectedId,
  onSelect,
  onShowUnassigned,
}: Props) {
  const translate = useTranslate(locales);
  const maxActive = Math.max(
    0,
    ...workloads.map((workload) => workload.active),
  );
  const sections = sectionsOf(groups, workloads);

  return (
    <Stack gap="md">
      {sections.map(({ group, workloads: members }) => {
        const unassigned = unassignedByGroup[group.id] ?? 0;
        return (
          <Paper key={group.id} withBorder>
            <Group justify="space-between" p="sm" pb="xs">
              <Text fw={600}>{group.nome}</Text>
              {unassigned > 0 ? (
                <Anchor
                  component="button"
                  type="button"
                  size="xs"
                  onClick={() => onShowUnassigned(group.id)}
                >
                  {translate("unassigned", { count: unassigned })}
                </Anchor>
              ) : (
                <Text size="xs" c="dimmed">
                  {translate("emptyQueue")}
                </Text>
              )}
            </Group>
            {members.map((workload) => (
              <ConsultantRow
                key={workload.consultant.id}
                workload={workload}
                maxActive={maxActive}
                selected={workload.consultant.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </Paper>
        );
      })}
    </Stack>
  );
}

export const TeamBoard = memo(TeamBoardView);
