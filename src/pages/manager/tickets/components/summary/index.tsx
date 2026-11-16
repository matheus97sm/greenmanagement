import { Paper, SimpleGrid, Text } from "@mantine/core";
import type { Props } from "./types";

interface StatProps {
  label: string;
  value: number;
  color?: string;
}

function Stat({ label, value, color }: StatProps) {
  return (
    <Paper withBorder p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fz={26} fw={600} c={value > 0 ? color : undefined}>
        {value}
      </Text>
    </Paper>
  );
}

export function Summary({ active, breached, atRisk, unassigned, idle }: Props) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <Stat label="Chamados ativos" value={active} />
      <Stat label="Prazo estourado" value={breached} color="red" />
      <Stat label="Vencem em menos de 4h" value={atRisk} color="orange" />
      <Stat label="Sem responsável" value={unassigned} color="violet" />
      <Stat label="Consultores sem chamados" value={idle} color="blue" />
    </SimpleGrid>
  );
}
