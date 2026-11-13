import { useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea } from "@mantine/core";
import type { Status } from "@/domain/enums";
import { STATUS_LABEL } from "@/domain/status";
import { changeStatus } from "@/store/actions";
import type { Props } from "./types";
import { targetOptions } from "./utils";

export function StatusModal({ ticket, userId, reopen, onClose }: Props) {
  const options = targetOptions(ticket.status, reopen);
  const [to, setTo] = useState<Status | null>(options[0] ?? null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!to || !reason.trim()) return;
    setSaving(true);
    const ok = await changeStatus({
      ticketId: ticket.id,
      to,
      reason,
      userId,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={reopen ? "Reabrir chamado" : "Alterar status"}
    >
      <Stack>
        {!reopen && (
          <Select
            label="Novo status"
            allowDeselect={false}
            value={to}
            onChange={(value) => setTo(value as Status | null)}
            data={options.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
        )}
        <Textarea
          label="Motivo"
          description="Registrado no histórico do chamado."
          required
          autosize
          minRows={3}
          data-autofocus
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!to || !reason.trim()}
          >
            {reopen ? "Reabrir" : "Confirmar"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
