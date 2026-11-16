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
import { useTranslate } from "@/i18n";
import { reassignTickets } from "@/store/actions";
import { locales } from "./locales";
import type { Props } from "./types";
import { groupsOfSelection, targetOptions } from "./utils";

export function ReassignModal({
  tickets,
  workloads,
  managerId,
  onClose,
  onDone,
}: Props) {
  const translate = useTranslate(locales);
  const groupIds = groupsOfSelection(tickets);
  const singleGroup = groupIds.length === 1 ? groupIds[0] : null;
  const options = singleGroup
    ? targetOptions(workloads, singleGroup, translate)
    : [];
  const [target, setTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!target) return;
    setSaving(true);
    const result = await reassignTickets({
      ticketIds: tickets.map((ticket) => ticket.id),
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
      title={translate("title", { count: tickets.length })}
    >
      <Stack>
        {singleGroup ? (
          <>
            <Text size="sm" c="dimmed">
              {translate("hint")}
            </Text>
            <Select
              label={translate("newOwner")}
              placeholder={translate("pickConsultant")}
              searchable
              allowDeselect={false}
              data={options}
              value={target}
              onChange={setTarget}
            />
          </>
        ) : (
          <Alert color="orange">{translate("mixedGroups")}</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {translate("cancel")}
          </Button>
          <Button onClick={submit} loading={saving} disabled={!target}>
            {translate("confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
