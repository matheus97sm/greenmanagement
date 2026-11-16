import { SimpleGrid } from "@mantine/core";
import { Stat } from "@/components/Stat";
import { idleShare } from "@/domain/activity";
import { formatHours, formatPercent } from "@/lib/format";
import { IDLE_HIGH_SHARE, IDLE_WARNING_SHARE } from "../../constants";
import type { Props } from "./types";

function toneOf(share: number): string | undefined {
  if (share >= IDLE_HIGH_SHARE) return "red";
  if (share >= IDLE_WARNING_SHARE) return "orange";
  return undefined;
}

export function WeekSummary({ team, mostIdle }: Props) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <Stat
        label="Horas sem chamado"
        value={formatHours(team.idleMs)}
        sub={`de ${formatHours(team.businessMs)} de expediente`}
      />
      <Stat
        label="Ociosidade da equipe"
        value={formatPercent(team.idleShare)}
        color={toneOf(team.idleShare)}
      />
      <Stat label="Chamados atribuídos" value={team.assigned} />
      <Stat label="Chamados resolvidos" value={team.resolved} />
      <Stat
        label="Mais tempo sem chamado"
        value={mostIdle ? mostIdle.consultant.nome.split(" ")[0] : "Ninguém"}
        sub={
          mostIdle
            ? `${formatHours(mostIdle.week.idleMs)} · ${formatPercent(idleShare(mostIdle.week))}`
            : "Todos tiveram chamados"
        }
        color={mostIdle ? toneOf(idleShare(mostIdle.week)) : undefined}
      />
    </SimpleGrid>
  );
}
