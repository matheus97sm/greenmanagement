import { Badge, Group, Progress, Table, Text } from "@mantine/core";
import { idleShare } from "@/domain/activity";
import { formatHours, formatPercent } from "@/lib/format";
import type { Props } from "./types";
import { barColor, dayBackground } from "./utils";

export function WeekTable({ rows, dayHeaders }: Props) {
  return (
    <Table.ScrollContainer minWidth={980}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Consultor</Table.Th>
            <Table.Th w={230}>Tempo sem chamado</Table.Th>
            {dayHeaders.map((header) => (
              <Table.Th key={header} ta="center">
                {header}
              </Table.Th>
            ))}
            <Table.Th ta="right">Atribuídos</Table.Th>
            <Table.Th ta="right">Resolvidos</Table.Th>
            <Table.Th ta="right">Respostas</Table.Th>
            <Table.Th>Agora</Table.Th>
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
                      {formatHours(week.idleMs)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatPercent(share)} do expediente
                    </Text>
                  </Group>
                  <Progress
                    mt={4}
                    size="sm"
                    value={share * 100}
                    color={barColor(share)}
                    aria-label={`Tempo sem chamado de ${consultant.nome}`}
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
                      <Text size="sm">{formatHours(day.idleMs)}</Text>
                    )}
                  </Table.Td>
                ))}
                <Table.Td ta="right">{week.assigned}</Table.Td>
                <Table.Td ta="right">{week.resolved}</Table.Td>
                <Table.Td ta="right">{week.replies}</Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {workload.active}{" "}
                    {workload.active === 1 ? "chamado" : "chamados"}
                  </Text>
                  {workload.breached > 0 && (
                    <Badge size="sm" color="red" variant="filled">
                      {workload.breached}{" "}
                      {workload.breached === 1 ? "estourado" : "estourados"}
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
