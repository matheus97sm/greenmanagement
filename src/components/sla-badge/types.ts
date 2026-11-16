import type { BadgeProps } from "@mantine/core";
import type { SlaInfo } from "@/domain/sla";

export interface Props {
  sla: SlaInfo;
}

export interface SlaBadgeView {
  label: string;
  color: string;
  variant: BadgeProps["variant"];
}
