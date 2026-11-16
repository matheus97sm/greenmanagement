import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { stageOf } from "@/domain/customer";
import { useTranslate } from "@/i18n";
import { StageBadge } from "../stage-badge";
import { locales } from "./locales";
import type { Props } from "./types";
import { warningKey } from "./utils";

export function SimilarTickets({ hits, onOpen }: Props) {
  const translate = useTranslate(locales);
  if (hits.length === 0) return null;

  return (
    <Alert color="yellow" variant="light" title={translate("title")}>
      <Stack gap="xs">
        <Text size="sm">{translate(warningKey(hits))}</Text>
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
              {translate("openTicket")}
            </Button>
          </Group>
        ))}
      </Stack>
    </Alert>
  );
}
