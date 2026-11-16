import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { reassignTickets } from "@/store/actions";
import type { Props } from "./types";
import { groupsOfSelection, targetOptions } from "./utils";

export function ReassignModal({
  tickets,
  workloads,
  managerId,
  onClose,
  onDone,
}: Props) {
  const groupIds = groupsOfSelection(tickets);
  const singleGroup = groupIds.length === 1 ? groupIds[0] : null;
  const options = singleGroup ? targetOptions(workloads, singleGroup) : [];
  const [target, setTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!target) return;
    setSaving(true);
    const result = await reassignTickets({
      ticketIds: tickets.map((t) => t.id),
      consultantId: target,
      managerId,
    });
    setSaving(false);
    onDone(result);
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={
        tickets.length === 1
          ? "Redistribuir chamado"
          : `Redistribuir ${tickets.length} chamados`
      }
    >
      <Stack>
        {singleGroup ? (
          <>
            <Text size="sm" c="dimmed">
              Só aparecem consultores do grupo dos chamados. A lista mostra a
              carga atual de cada um.
            </Text>
            <Select
              label="Novo responsável"
              placeholder="Escolha um consultor"
              searchable
              allowDeselect={false}
              data={options}
              value={target}
              onChange={setTarget}
            />
          </>
        ) : (
          <Alert color="orange">
            Os chamados selecionados são de grupos diferentes. Redistribua um
            grupo de cada vez.
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving} disabled={!target}>
            Redistribuir
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
