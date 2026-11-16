import { SortKey } from "./enums";

export const WEEKS_BACK = 8;
export const ALL_GROUPS = "all";
export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"];
export const IDLE_WARNING_SHARE = 0.2;
export const IDLE_HIGH_SHARE = 0.5;

export const SORT_LABEL: Record<SortKey, string> = {
  [SortKey.Idle]: "Mais tempo sem chamado",
  [SortKey.Resolved]: "Mais resolvidos",
  [SortKey.Assigned]: "Mais atribuídos",
  [SortKey.Replies]: "Mais respostas",
  [SortKey.Name]: "Nome",
};
