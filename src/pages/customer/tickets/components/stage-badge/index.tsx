import { Badge } from "@mantine/core";
import { useTranslate } from "@/i18n";
import { STAGE_COLOR, STAGE_KEY } from "./constants";
import { locales } from "./locales";
import type { Props } from "./types";

export function StageBadge({ stage }: Props) {
  const translate = useTranslate(locales);
  return (
    <Badge variant="light" color={STAGE_COLOR[stage]} size="sm">
      {translate(STAGE_KEY[stage])}
    </Badge>
  );
}
