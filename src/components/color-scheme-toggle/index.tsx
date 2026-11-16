import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslate } from "@/i18n";
import { locales } from "./locales";

export function ColorSchemeToggle() {
  const translate = useTranslate(locales);
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme("light");
  const dark = scheme === "dark";
  const label = translate(dark ? "toLight" : "toDark");

  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={label}
        onClick={() => setColorScheme(dark ? "light" : "dark")}
      >
        {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
