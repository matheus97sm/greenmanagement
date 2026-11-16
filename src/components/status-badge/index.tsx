import { Badge } from "@mantine/core";
import { STATUS_COLOR, STATUS_LABEL } from "@/domain/status";
import type { Props } from "./types";

export function StatusBadge({ status }: Props) {
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
