import { Badge, Group, Paper, Text } from "@mantine/core";
import { Profile } from "@/domain/enums";
import { useLabels, useTranslate } from "@/i18n";
import { ROLE_COLOR } from "./constants";
import { locales } from "./locales";
import type { Props } from "./types";

function backgroundOf(
  internal: boolean,
  isOwn: boolean,
  role: Profile | undefined,
): string | undefined {
  if (internal) return "var(--mantine-color-yellow-light)";
  if (role === Profile.Customer) return "var(--mantine-color-blue-light)";
  return isOwn ? "var(--mantine-color-green-light)" : undefined;
}

export function MessageBubble({
  author,
  role,
  isOwn,
  internal,
  text,
  at,
  highlight = false,
}: Props) {
  const translate = useTranslate(locales);
  const labels = useLabels();
  const color = role ? ROLE_COLOR[role] : "gray";

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      maw="80%"
      ml={isOwn ? "auto" : undefined}
      bg={backgroundOf(internal, isOwn, role)}
      data-role={role}
      style={{ borderLeft: `4px solid var(--mantine-color-${color}-6)` }}
    >
      <Group gap="xs" mb={2}>
        <Text size="xs" fw={600}>
          {isOwn ? translate("you") : author}
        </Text>
        {role && (
          <Badge size="xs" color={color} variant="light">
            {labels.profile(role)}
          </Badge>
        )}
        {internal && (
          <Badge size="xs" color="yellow" variant="filled">
            {translate("internalNote")}
          </Badge>
        )}
        {highlight && (
          <Badge size="xs" color="green" variant="filled">
            {translate("new")}
          </Badge>
        )}
        <Text size="xs" c="dimmed">
          {at}
        </Text>
      </Group>
      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
        {text}
      </Text>
    </Paper>
  );
}
