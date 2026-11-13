import { Badge, Group, Paper, Text } from "@mantine/core";
import type { Props } from "./types";

export function MessageBubble({ author, isOwn, internal, text, at }: Props) {
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      maw="80%"
      ml={isOwn ? "auto" : undefined}
      bg={
        internal
          ? "var(--mantine-color-yellow-light)"
          : isOwn
            ? "var(--mantine-color-green-light)"
            : undefined
      }
    >
      <Group gap="xs" mb={2}>
        <Text size="xs" fw={600}>
          {isOwn ? "Você" : author}
        </Text>
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
