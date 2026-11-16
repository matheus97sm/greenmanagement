import { Badge, Group, Paper, Text } from "@mantine/core";
import { Profile } from "@/domain/enums";
import { ROLE_COLOR, ROLE_LABEL } from "./constants";
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
}: Props) {
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
          {isOwn ? "Você" : author}
        </Text>
        {role && (
          <Badge size="xs" color={color} variant="light">
            {ROLE_LABEL[role]}
          </Badge>
        )}
        {internal && (
          <Badge size="xs" color="yellow" variant="filled">
            Nota interna
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
