import type { Group } from "@/domain/types";
import type { Workload } from "@/domain/workload";

export interface Props {
  groups: Group[];
  workloads: Workload[];
  unassignedByGroup: Record<string, number>;
  selectedId: string | undefined;
  onSelect: (consultantId: string) => void;
  onShowUnassigned: (groupId: string) => void;
}

export interface RowProps {
  workload: Workload;
  maxActive: number;
  selected: boolean;
  onSelect: (consultantId: string) => void;
}
