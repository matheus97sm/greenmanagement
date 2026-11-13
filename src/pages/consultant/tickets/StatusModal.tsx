import { useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea } from "@mantine/core";
import { isReopen, STATUS_LABEL, TRANSITIONS } from "../../../domain/status";
import type { Status, Ticket } from "../../../domain/types";
import { changeStatus } from "../../../store/actions";

interface Props {
  ticket: Ticket;
  userId: string;

  reopen?: boolean;
  onClose: () => void;
}

export function StatusModal({ ticket, userId, reopen, onClose }: Props) {
  const options = TRANSITIONS[ticket.status].filter((s) =>
    reopen ? isReopen(ticket.status, s) : !isReopen(ticket.status, s),
  );
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
            onChange={(v) => setTo(v as Status | null)}
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
