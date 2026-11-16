import { Badge, Group, Progress, Table, Text } from "@mantine/core";
import { idleShare } from "@/domain/activity";
import { useLanguage, useTranslate } from "@/i18n";
import { formatHours, formatPercent } from "@/lib/format";
import { locales } from "./locales";
import type { Props } from "./types";
import { barColor, dayBackground } from "./utils";

export function WeekTable({ rows, dayHeaders }: Props) {
  const translate = useTranslate(locales);
  const { language } = useLanguage();
  const hours = (ms: number) => formatHours(ms, language);
  return (
    <Table.ScrollContainer minWidth={980}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{translate("consultant")}</Table.Th>
            <Table.Th w={230}>{translate("idleTime")}</Table.Th>
            {dayHeaders.map((header) => (
              <Table.Th key={header} ta="center">
                {header}
              </Table.Th>
            ))}
            <Table.Th ta="right">{translate("assigned")}</Table.Th>
            <Table.Th ta="right">{translate("resolved")}</Table.Th>
            <Table.Th ta="right">{translate("replies")}</Table.Th>
            <Table.Th>{translate("now")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(({ consultant, groupName, week, workload }) => {
            const share = idleShare(week);
            return (
              <Table.Tr key={consultant.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {consultant.nome}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {groupName}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Text size="sm" fw={500}>
                      {hours(week.idleMs)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {translate("ofWorkingTime", {
                        percent: formatPercent(share),
                      })}
                    </Text>
                  </Group>
                  <Progress
                    mt={4}
                    size="sm"
                    value={share * 100}
                    color={barColor(share)}
                    aria-label={translate("idleTimeOf", {
                      name: consultant.nome,
                    })}
                  />
                </Table.Td>
                {week.days.map((day, index) => (
                  <Table.Td
                    key={dayHeaders[index]}
                    ta="center"
                    style={{ background: dayBackground(day) }}
                  >
                    {day.businessMs === 0 ? (
                      <Text size="sm" c="dimmed">
                        –
                      </Text>
                    ) : (
                      <Text size="sm">{hours(day.idleMs)}</Text>
                    )}
                  </Table.Td>
                ))}
                <Table.Td ta="right">{week.assigned}</Table.Td>
                <Table.Td ta="right">{week.resolved}</Table.Td>
                <Table.Td ta="right">{week.replies}</Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {translate("active", { count: workload.active })}
                  </Text>
                  {workload.breached > 0 && (
                    <Badge size="sm" color="red" variant="filled">
                      {translate("breached", { count: workload.breached })}
                    </Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
