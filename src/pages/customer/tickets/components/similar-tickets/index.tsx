import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { stageOf } from "@/domain/customer";
import { StageBadge } from "../stage-badge";
import type { Props } from "./types";
import { warningText } from "./utils";

export function SimilarTickets({ hits, onOpen }: Props) {
  if (hits.length === 0) return null;

  return (
    <Alert color="yellow" variant="light" title="Você já abriu algo parecido">
      <Stack gap="xs">
        <Text size="sm">{warningText(hits)}</Text>
        {hits.map(({ ticket }) => (
          <Group key={ticket.id} justify="space-between" wrap="nowrap">
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                #{ticket.numero} · {ticket.titulo}
              </Text>
              <StageBadge stage={stageOf(ticket)} />
            </div>
            <Button
              size="xs"
              variant="default"
              onClick={() => onOpen(ticket.id)}
            >
              Abrir esse chamado
            </Button>
          </Group>
        ))}
      </Stack>
    </Alert>
  );
}
