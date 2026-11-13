import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button, Group, Stack, Switch, Textarea } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { sendMessage } from "@/store/actions";
import type { Props } from "./types";

export function Composer({ ticketId, userId, draft, onDraftChange }: Props) {
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage({
      ticketId,
      authorId: userId,
      text: draft,
      internal,
    });
    setSending(false);
    if (ok) onDraftChange("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
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
          internal
            ? "Nota interna: o cliente não vai ver"
            : "Responder ao cliente (Ctrl+Enter envia)"
        }
        value={draft}
        onChange={(e) => onDraftChange(e.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
      <Group justify="space-between">
        <Switch
          label="Nota interna"
          checked={internal}
          onChange={(e) => setInternal(e.currentTarget.checked)}
        />
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
