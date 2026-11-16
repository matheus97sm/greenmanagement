import { useState } from "react";
import { Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { useTranslate } from "@/i18n";
import { reopenTicket } from "@/store/actions";
import { locales } from "./locales";
import type { Props } from "./types";

export function ReopenBox({ ticketId, customerId }: Props) {
  const translate = useTranslate(locales);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim() || saving) return;
    setSaving(true);
    const succeeded = await reopenTicket({ ticketId, customerId, reason });
    setSaving(false);
    if (succeeded) setReason("");
  };

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
    >
      <Text size="sm" fw={500}>
        {translate("question")}
      </Text>
      <Textarea
        label={translate("reasonLabel")}
        description={translate("reasonHint")}
        autosize
        minRows={2}
        maxRows={6}
        value={reason}
        onChange={(event) => setReason(event.currentTarget.value)}
      />
      <Group justify="flex-end">
        <Button onClick={submit} loading={saving} disabled={!reason.trim()}>
          {translate("reopen")}
        </Button>
      </Group>
    </Stack>
  );
}
