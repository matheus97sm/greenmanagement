import { useState } from "react";
import { Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { reopenTicket } from "@/store/actions";
import type { Props } from "./types";

export function ReopenBox({ ticketId, customerId }: Props) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim() || saving) return;
    setSaving(true);
    const ok = await reopenTicket({ ticketId, customerId, reason });
    setSaving(false);
    if (ok) setReason("");
  };

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
    >
      <Text size="sm" fw={500}>
        O problema continua ou voltou?
      </Text>
      <Textarea
        label="O que está errado agora?"
        description="Vamos reabrir este chamado e avisar quem cuidou dele."
        autosize
        minRows={2}
        maxRows={6}
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
      />
      <Group justify="flex-end">
        <Button onClick={submit} loading={saving} disabled={!reason.trim()}>
          Reabrir chamado
        </Button>
      </Group>
    </Stack>
  );
}
