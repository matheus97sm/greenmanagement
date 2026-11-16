import { useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea } from "@mantine/core";
import type { Status } from "@/domain/enums";
import { useLabels, useTranslate } from "@/i18n";
import { changeStatus } from "@/store/actions";
import { locales } from "./locales";
import type { Props } from "./types";
import { targetOptions } from "./utils";

export function StatusModal({ ticket, userId, reopen, onClose }: Props) {
  const translate = useTranslate(locales);
  const labels = useLabels();
  const options = targetOptions(ticket.status, reopen);
  const [to, setTo] = useState<Status | null>(options[0] ?? null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!to || !reason.trim()) return;
    setSaving(true);
    const succeeded = await changeStatus({
      ticketId: ticket.id,
      to,
      reason,
      userId,
    });
    setSaving(false);
    if (succeeded) onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={translate(reopen ? "reopenTitle" : "changeTitle")}
    >
      <Stack>
        {!reopen && (
          <Select
            label={translate("newStatus")}
            allowDeselect={false}
            value={to}
            onChange={(value) => setTo(value as Status | null)}
            data={options.map((status) => ({
              value: status,
              label: labels.status(status),
            }))}
          />
        )}
        <Textarea
          label={translate("reason")}
          description={translate("reasonHint")}
          required
          autosize
          minRows={3}
          data-autofocus
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {translate("cancel")}
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!to || !reason.trim()}
          >
            {translate(reopen ? "reopen" : "confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
