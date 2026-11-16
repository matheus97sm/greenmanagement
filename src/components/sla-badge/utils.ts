import { SlaClock, SlaKind } from "@/domain/enums";
import type { SlaInfo } from "@/domain/sla";
import { formatDuration } from "@/lib/format";
import type { SlaBadgeView } from "./types";

const UPCOMING_COLOR: Partial<Record<SlaKind, string>> = {
  [SlaKind.Critical]: "red",
  [SlaKind.Warning]: "orange",
  [SlaKind.Ok]: "gray",
};

export function slaBadgeView(sla: SlaInfo): SlaBadgeView {
  const duration = formatDuration(sla.remainingMs);
  const firstResponse = sla.clock === SlaClock.FirstResponse;

  switch (sla.kind) {
    case SlaKind.Breached:
      return {
        color: "red",
        variant: "filled",
        label: firstResponse
          ? `1ª resposta estourada há ${duration}`
          : `Estourado há ${duration}`,
      };
    case SlaKind.Critical:
    case SlaKind.Warning:
    case SlaKind.Ok:
      return {
        color: UPCOMING_COLOR[sla.kind] ?? "gray",
        variant: "light",
        label: firstResponse ? `1ª resposta em ${duration}` : duration,
      };
    case SlaKind.Paused:
      return { color: "blue", variant: "outline", label: "Prazo pausado" };
    case SlaKind.Finished:
      return { color: "gray", variant: "outline", label: "Encerrado" };
  }
}
