import { LANGUAGES } from "./constants";
import { i18next } from "./instance";
import type { LocaleTexts, Locales } from "./types";

const namespaces = new WeakMap<object, string>();
let registered = 0;

export function namespaceOf<Texts extends LocaleTexts>(
  locales: Locales<Texts>,
): string {
  const known = namespaces.get(locales);
  if (known) return known;
  registered += 1;
  const namespace = `texts-${registered}`;
  namespaces.set(locales, namespace);
  for (const language of LANGUAGES) {
    i18next.addResourceBundle(
      language,
      namespace,
      locales[language],
      true,
      true,
    );
  }
  return namespace;
}
