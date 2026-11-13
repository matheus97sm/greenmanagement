import { Badge } from "@mantine/core";
import { STATUS_COLOR, STATUS_LABEL } from "../domain/status";
import type { SlaInfo } from "../domain/sla";
import type { Status } from "../domain/types";
import { formatDuration } from "../lib/format";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function SlaBadge({ sla }: { sla: SlaInfo }) {
  const duration = formatDuration(sla.remainingMs);
  const firstResponse = sla.clock === "primeira_resposta";

  switch (sla.kind) {
    case "breached":
      return (
        <Badge color="red" variant="filled" size="sm">
          {firstResponse
            ? `1ª resposta estourada há ${duration}`
            : `Estourado há ${duration}`}
        </Badge>
      );
    case "critical":
    case "warning":
    case "ok":
      return (
        <Badge
          size="sm"
          color={
            sla.kind === "critical"
              ? "red"
              : sla.kind === "warning"
                ? "orange"
                : "gray"
          }
          variant="light"
        >
          {firstResponse ? `1ª resposta em ${duration}` : duration}
        </Badge>
      );
    case "paused":
      return (
        <Badge color="blue" variant="outline" size="sm">
          Prazo pausado
        </Badge>
      );
    case "finished":
      return (
        <Badge color="gray" variant="outline" size="sm">
          Encerrado
        </Badge>
      );
  }
}
