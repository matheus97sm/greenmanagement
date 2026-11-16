import type { Ticket } from "@/domain/types";
import type { Workload } from "@/domain/workload";
import type { ReassignResult } from "@/store/actions";

export interface Props {
  tickets: Ticket[];
  workloads: Workload[];
  managerId: string;
  onClose: () => void;
  onDone: (result: ReassignResult) => void;
}

export interface TargetOption {
  value: string;
  label: string;
}
