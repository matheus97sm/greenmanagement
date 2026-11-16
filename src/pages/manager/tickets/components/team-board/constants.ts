import { LoadLevel } from "@/domain/enums";

export const LEVEL_COLOR: Record<LoadLevel, string> = {
  [LoadLevel.Idle]: "blue",
  [LoadLevel.Normal]: "green",
  [LoadLevel.Overloaded]: "orange",
};

export const LEVEL_LABEL: Record<LoadLevel, string | null> = {
  [LoadLevel.Idle]: "Sem chamados",
  [LoadLevel.Normal]: null,
  [LoadLevel.Overloaded]: "Sobrecarregado",
};
