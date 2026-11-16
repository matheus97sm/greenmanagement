import type { Language } from "./enums";

export type LocaleTexts = Record<string, string>;

export type Locales<Texts extends LocaleTexts> = Record<Language.PtBr, Texts> &
  Record<Language.EnUs, Record<keyof NoInfer<Texts>, string>>;

type PluralSuffix = "zero" | "one" | "two" | "few" | "many" | "other";

export type TextKey<Texts extends LocaleTexts> = keyof Texts extends infer Key
  ? Key extends `${infer Base}_${PluralSuffix}`
    ? Base
    : Key
  : never;

export type TextParams = Record<string, string | number>;

export type Translate<Texts extends LocaleTexts> = (
  key: TextKey<Texts> & string,
  params?: TextParams,
) => string;
