import { Badge } from "@mantine/core";
import type { Props } from "./types";
import { slaBadgeView } from "./utils";

export function SlaBadge({ sla }: Props) {
  const { label, color, variant } = slaBadgeView(sla);

  return (
    <Badge size="sm" color={color} variant={variant}>
      {label}
    </Badge>
  );
}
