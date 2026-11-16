import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { useLanguage, useTranslate } from "@/i18n";
import { FLAG_SIZE, LANGUAGE_NAME_KEY, LANGUAGE_OPTIONS } from "./constants";
import { Flag } from "./flags";
import { locales } from "./locales";

export function LanguageToggle() {
  const translate = useTranslate(locales);
  const { language: activeLanguage, setLanguage } = useLanguage();

  return (
    <Group gap={4} role="group" aria-label={translate("groupLabel")}>
      {LANGUAGE_OPTIONS.map((language) => {
        const name = translate(LANGUAGE_NAME_KEY[language]);
        const active = language === activeLanguage;
        return (
          <Tooltip key={language} label={name}>
            <ActionIcon
              variant={active ? "light" : "subtle"}
              color={active ? "green" : "gray"}
              aria-label={name}
              aria-pressed={active}
              onClick={() => setLanguage(language)}
            >
              <Flag language={language} size={FLAG_SIZE} />
            </ActionIcon>
          </Tooltip>
        );
      })}
    </Group>
  );
}
