import { Badge } from "@mantine/core";
import { useTranslate } from "@/i18n";
import { locales } from "./locales";
import type { Props } from "./types";
import { slaBadgeView } from "./utils";

export function SlaBadge({ sla }: Props) {
  const translate = useTranslate(locales);
  const { label, color, variant } = slaBadgeView(sla, translate);

  return (
    <Badge size="sm" color={color} variant={variant}>
      {label}
    </Badge>
  );
}
