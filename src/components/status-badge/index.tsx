import { Badge } from "@mantine/core";
import { STATUS_COLOR } from "@/domain/status";
import { useLabels } from "@/i18n";
import type { Props } from "./types";

export function StatusBadge({ status }: Props) {
  const labels = useLabels();
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm">
      {labels.status(status)}
    </Badge>
  );
}
