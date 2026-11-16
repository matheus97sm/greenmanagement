import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE } from "./constants";
import { setLanguage } from "./instance";
import { isLanguage } from "./storage";

export function useLanguage() {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  return { language, setLanguage };
}
