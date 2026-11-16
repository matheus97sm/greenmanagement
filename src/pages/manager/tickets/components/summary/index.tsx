import { memo } from "react";
import { SimpleGrid } from "@mantine/core";
import { Stat } from "@/components/stat";
import { useTranslate } from "@/i18n";
import { locales } from "./locales";
import type { Props } from "./types";

function SummaryView({ active, breached, atRisk, unassigned, idle }: Props) {
  const translate = useTranslate(locales);
  const tone = (value: number, color: string) =>
    value > 0 ? color : undefined;

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <Stat label={translate("active")} value={active} />
      <Stat
        label={translate("breached")}
        value={breached}
        color={tone(breached, "red")}
      />
      <Stat
        label={translate("atRisk")}
        value={atRisk}
        color={tone(atRisk, "orange")}
      />
      <Stat
        label={translate("unassigned")}
        value={unassigned}
        color={tone(unassigned, "violet")}
      />
      <Stat label={translate("idle")} value={idle} color={tone(idle, "blue")} />
    </SimpleGrid>
  );
}

export const Summary = memo(SummaryView);
