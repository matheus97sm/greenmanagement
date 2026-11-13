import { Badge } from "@mantine/core";
import { STATUS_COLOR, STATUS_LABEL } from "@/domain/status";
import type { SlaInfo } from "@/domain/sla";
import { formatDuration } from "@/lib/format";
import { Status, SlaKind, SlaClock } from "@/domain/enums";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function SlaBadge({ sla }: { sla: SlaInfo }) {
  const duration = formatDuration(sla.remainingMs);
  const firstResponse = sla.clock === SlaClock.FirstResponse;

  switch (sla.kind) {
    case SlaKind.Breached:
      return (
        <Badge color="red" variant="filled" size="sm">
          {firstResponse
            ? `1ª resposta estourada há ${duration}`
            : `Estourado há ${duration}`}
        </Badge>
      );
    case SlaKind.Critical:
    case SlaKind.Warning:
    case SlaKind.Ok:
      return (
        <Badge
          size="sm"
          color={
            sla.kind === SlaKind.Critical
              ? "red"
              : sla.kind === SlaKind.Warning
                ? "orange"
                : "gray"
          }
          variant="light"
        >
          {firstResponse ? `1ª resposta em ${duration}` : duration}
        </Badge>
      );
    case SlaKind.Paused:
      return (
        <Badge color="blue" variant="outline" size="sm">
          Prazo pausado
        </Badge>
      );
    case SlaKind.Finished:
      return (
        <Badge color="gray" variant="outline" size="sm">
          Encerrado
        </Badge>
      );
  }
}
