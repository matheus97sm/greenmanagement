import { memo } from "react";
import { SimpleGrid } from "@mantine/core";
import { Stat } from "@/components/stat";
import type { Props } from "./types";

function SummaryView({ active, breached, atRisk, unassigned, idle }: Props) {
  const tone = (value: number, color: string) =>
    value > 0 ? color : undefined;

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <Stat label="Chamados ativos" value={active} />
      <Stat
        label="Prazo estourado"
        value={breached}
        color={tone(breached, "red")}
      />
      <Stat
        label="Vencem em menos de 4h"
        value={atRisk}
        color={tone(atRisk, "orange")}
      />
      <Stat
        label="Sem responsável"
        value={unassigned}
        color={tone(unassigned, "violet")}
      />
      <Stat
        label="Consultores sem chamados"
        value={idle}
        color={tone(idle, "blue")}
      />
    </SimpleGrid>
  );
}

export const Summary = memo(SummaryView);
