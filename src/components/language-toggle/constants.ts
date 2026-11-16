import { Language, LANGUAGES } from "@/i18n";
import type { LanguageNameKey } from "./types";

export const LANGUAGE_NAME_KEY: Record<Language, LanguageNameKey> = {
  [Language.PtBr]: "ptBr",
  [Language.EnUs]: "enUs",
};

export const FLAG_SIZE = 20;

export const LANGUAGE_OPTIONS = LANGUAGES;
