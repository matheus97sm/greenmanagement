import { Badge } from "@mantine/core";
import { STAGE_COLOR, STAGE_LABEL } from "./constants";
import type { Props } from "./types";

export function StageBadge({ stage }: Props) {
  return (
    <Badge variant="light" color={STAGE_COLOR[stage]} size="sm">
      {STAGE_LABEL[stage]}
    </Badge>
  );
}
