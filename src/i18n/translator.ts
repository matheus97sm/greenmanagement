import { i18next } from "./instance";
import { namespaceOf } from "./namespace";
import type { LocaleTexts, Locales, TextParams, Translate } from "./types";

export function translatorFor<Texts extends LocaleTexts>(
  locales: Locales<Texts>,
): Translate<Texts> {
  const namespace = namespaceOf(locales);
  const translate = (key: string, params?: TextParams): string =>
    i18next.t(key, { ...params, ns: namespace });
  return translate;
}
