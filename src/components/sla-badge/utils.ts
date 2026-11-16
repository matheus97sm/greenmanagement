import { SlaClock, SlaKind } from "@/domain/enums";
import type { SlaInfo } from "@/domain/sla";
import type { Language, Translate } from "@/i18n";
import { formatDuration } from "@/lib/format";
import type { locales } from "./locales";
import type { SlaBadgeView } from "./types";

const UPCOMING_COLOR: Partial<Record<SlaKind, string>> = {
  [SlaKind.Critical]: "red",
  [SlaKind.Warning]: "orange",
  [SlaKind.Ok]: "gray",
};

export function slaBadgeView(
  sla: SlaInfo,
  translate: Translate<(typeof locales)[Language.PtBr]>,
): SlaBadgeView {
  const duration = formatDuration(sla.remainingMs);
  const firstResponse = sla.clock === SlaClock.FirstResponse;

  switch (sla.kind) {
    case SlaKind.Breached:
      return {
        color: "red",
        variant: "filled",
        label: translate(firstResponse ? "breachedFirstResponse" : "breached", {
          duration,
        }),
      };
    case SlaKind.Critical:
    case SlaKind.Warning:
    case SlaKind.Ok:
      return {
        color: UPCOMING_COLOR[sla.kind] ?? "gray",
        variant: "light",
        label: firstResponse
          ? translate("dueFirstResponse", { duration })
          : duration,
      };
    case SlaKind.Paused:
      return { color: "blue", variant: "outline", label: translate("paused") };
    case SlaKind.Finished:
      return {
        color: "gray",
        variant: "outline",
        label: translate("finished"),
      };
  }
}
