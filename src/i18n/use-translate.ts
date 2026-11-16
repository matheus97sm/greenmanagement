import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { namespaceOf } from "./namespace";
import type { LocaleTexts, Locales, TextParams, Translate } from "./types";

export function useTranslate<Texts extends LocaleTexts>(
  locales: Locales<Texts>,
): Translate<Texts> {
  const namespace = namespaceOf(locales);
  const { t: translateInNamespace } = useTranslation(namespace);
  return useMemo(() => {
    const translate = (key: string, params?: TextParams): string =>
      translateInNamespace(key, { ...params, ns: namespace });
    return translate;
  }, [translateInNamespace, namespace]);
}
