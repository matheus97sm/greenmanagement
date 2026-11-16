import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./constants";
import type { Language } from "./enums";
import { loadLanguage, saveLanguage } from "./storage";

function reflectInDocument(language: Language) {
  document.documentElement.lang = language;
}

const initialLanguage = loadLanguage();
reflectInDocument(initialLanguage);

void i18next.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  resources: {},
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  initAsync: false,
});

export async function setLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language);
  saveLanguage(language);
  reflectInDocument(language);
}

export { i18next };
