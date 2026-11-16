import { LoadLevel } from "@/domain/enums";
import type { Language, TextKey } from "@/i18n";
import type { locales } from "./locales";

export const LEVEL_COLOR: Record<LoadLevel, string> = {
  [LoadLevel.Idle]: "blue",
  [LoadLevel.Normal]: "green",
  [LoadLevel.Overloaded]: "orange",
};

export const LEVEL_LABEL: Record<
  LoadLevel,
  TextKey<(typeof locales)[Language.PtBr]> | null
> = {
  [LoadLevel.Idle]: "levelIdle",
  [LoadLevel.Normal]: null,
  [LoadLevel.Overloaded]: "levelOverloaded",
};
