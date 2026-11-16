import type { CustomerStage } from "@/domain/enums";
import type { Language } from "@/i18n";
import type { locales } from "./locales";

export interface Props {
  stage: CustomerStage;
}

export type StageKey = keyof (typeof locales)[Language.PtBr];
