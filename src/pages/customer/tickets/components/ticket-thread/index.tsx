import { useMemo, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { MessageBubble } from "@/components/message-bubble";
import { formatDateTime } from "@/lib/format";
import { lastItems } from "@/lib/list";
import { useTickets } from "@/store/useTickets";
import { PAGE_SIZE } from "./constants";
import type { Props } from "./types";
import { threadItems } from "./utils";

export function TicketThread({ ticketId, me, since }: Props) {
  const state = useTickets();
  const [shown, setShown] = useState(PAGE_SIZE);
  const ticket = state.tickets[ticketId];
  const messages = state.messages[ticketId];
  const viewer = state.people[me.id];

  const items = useMemo(
    () =>
      ticket
        ? threadItems({
            ticket,
            messages,
            people: state.people,
            meId: me.id,
            since,
          })
        : [],
    [ticket, messages, state.people, me.id, since],
  );

  const { hidden, visible } = lastItems(items, shown);

  return (
    <Stack gap="sm">
      {hidden > 0 && (
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          Mostrar mensagens anteriores ({hidden})
        </Button>
      )}
      {visible.map((item) => (
        <MessageBubble
          key={item.key}
          author={item.author}
          role={item.role}
          isOwn={item.isOwn}
          internal={false}
          text={item.text}
          at={formatDateTime(item.at, viewer?.zoneinfo, viewer?.locale)}
          highlight={item.isNew}
        />
      ))}
    </Stack>
  );
}
