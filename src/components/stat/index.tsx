import { Paper, Text } from "@mantine/core";
import type { Props } from "./types";

export function Stat({ label, value, sub, color }: Props) {
  return (
    <Paper withBorder p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fz={26} fw={600} c={color}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed">
          {sub}
        </Text>
      )}
    </Paper>
  );
}
