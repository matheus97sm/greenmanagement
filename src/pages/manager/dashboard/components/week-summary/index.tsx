import { SimpleGrid } from "@mantine/core";
import { Stat } from "@/components/stat";
import { idleShare } from "@/domain/activity";
import { useLanguage, useTranslate } from "@/i18n";
import { formatHours, formatPercent } from "@/lib/format";
import { IDLE_HIGH_SHARE, IDLE_WARNING_SHARE } from "../../constants";
import { locales } from "./locales";
import type { Props } from "./types";

function toneOf(share: number): string | undefined {
  if (share >= IDLE_HIGH_SHARE) return "red";
  if (share >= IDLE_WARNING_SHARE) return "orange";
  return undefined;
}

export function WeekSummary({ team, mostIdle }: Props) {
  const translate = useTranslate(locales);
  const { language } = useLanguage();
  const hours = (ms: number) => formatHours(ms, language);
  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <Stat
        label={translate("idleHours")}
        value={hours(team.idleMs)}
        sub={translate("idleOf", { hours: hours(team.businessMs) })}
      />
      <Stat
        label={translate("teamIdleness")}
        value={formatPercent(team.idleShare)}
        color={toneOf(team.idleShare)}
      />
      <Stat label={translate("assigned")} value={team.assigned} />
      <Stat label={translate("resolved")} value={team.resolved} />
      <Stat
        label={translate("mostIdle")}
        value={
          mostIdle
            ? mostIdle.consultant.nome.split(" ")[0]
            : translate("nobody")
        }
        sub={
          mostIdle
            ? `${hours(mostIdle.week.idleMs)} · ${formatPercent(idleShare(mostIdle.week))}`
            : translate("everyoneHadTickets")
        }
        color={mostIdle ? toneOf(idleShare(mostIdle.week)) : undefined}
      />
    </SimpleGrid>
  );
}
