import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button, Group, Stack, Switch, Textarea } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { sendMessage } from "@/store/actions";
import type { Props } from "./types";

export function Composer({
  ticketId,
  userId,
  draft,
  onDraftChange,
  allowNotes = true,
  placeholder = "Responder ao cliente (Ctrl+Enter envia)",
}: Props) {
  const [wantsNote, setWantsNote] = useState(false);
  const internal = allowNotes && wantsNote;
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const succeeded = await sendMessage({
      ticketId,
      authorId: userId,
      text: draft,
      internal,
    });
    setSending(false);
    if (succeeded) onDraftChange("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{
        borderTop: "1px solid var(--mantine-color-default-border)",
        background: internal ? "var(--mantine-color-yellow-light)" : undefined,
      }}
    >
      <Textarea
        autosize
        minRows={2}
        maxRows={8}
        placeholder={
          internal ? "Nota interna: o cliente não vai ver" : placeholder
        }
        value={draft}
        onChange={(event) => onDraftChange(event.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
      <Group justify={allowNotes ? "space-between" : "flex-end"}>
        {allowNotes && (
          <Switch
            label="Nota interna"
            checked={internal}
            onChange={(event) => setWantsNote(event.currentTarget.checked)}
          />
        )}
        <Button
          leftSection={<IconSend size={16} />}
          onClick={send}
          loading={sending}
          disabled={!draft.trim()}
          color={internal ? "yellow" : undefined}
        >
          {internal ? "Salvar nota" : "Enviar"}
        </Button>
      </Group>
    </Stack>
  );
}
