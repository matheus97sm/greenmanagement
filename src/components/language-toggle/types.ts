import type { Language } from "@/i18n";

export type FlagProps = {
  size: number;
};

export type LanguageNameKey = "ptBr" | "enUs";

export type LanguageFlagProps = FlagProps & {
  language: Language;
};
