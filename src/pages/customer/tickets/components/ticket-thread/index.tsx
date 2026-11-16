import { useMemo, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { MessageBubble } from "@/components/message-bubble";
import { useTranslate } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { lastItems } from "@/lib/list";
import { useTickets } from "@/store/useTickets";
import { PAGE_SIZE } from "./constants";
import { locales } from "./locales";
import type { Props } from "./types";
import { threadItems } from "./utils";

export function TicketThread({ ticketId, currentUser, since }: Props) {
  const translate = useTranslate(locales);
  const state = useTickets();
  const [shown, setShown] = useState(PAGE_SIZE);
  const ticket = state.tickets[ticketId];
  const messages = state.messages[ticketId];
  const viewer = state.people[currentUser.id];

  const items = useMemo(
    () =>
      ticket
        ? threadItems({
            ticket,
            messages,
            people: state.people,
            meId: currentUser.id,
            since,
            translate,
          })
        : [],
    [ticket, messages, state.people, currentUser.id, since, translate],
  );

  const { hidden, visible } = lastItems(items, shown);

  return (
    <Stack gap="sm">
      {hidden > 0 && (
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShown((current) => current + PAGE_SIZE)}
        >
          {translate("showPrevious", { count: hidden })}
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
