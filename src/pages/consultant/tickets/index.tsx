import { useEffect, useState } from "react";
import { Alert, Box, Center, Group, Loader, Paper, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/auth-context";
import { useTranslate } from "@/i18n";
import { homePath } from "@/paths";
import { LoadStatus } from "@/store/enums";
import { markRead } from "@/store/actions";
import { useTickets } from "@/store/useTickets";
import { TicketDetail } from "@/components/ticket-detail";
import { TicketList } from "./components/list";
import { locales } from "./locales";

export function TicketsPage() {
  const translate = useTranslate(locales);
  const currentUser = useCurrentUser();
  const state = useTickets();
  const navigate = useNavigate();
  const { id } = useParams();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const lastMessageId = id ? state.messages[id]?.at(-1)?.id : undefined;
  useEffect(() => {
    if (id) markRead(id);
  }, [id, lastMessageId]);

  if (state.status === LoadStatus.Error) {
    return <Alert color="red">{translate("loadError")}</Alert>;
  }

  if (state.status !== LoadStatus.Ready) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Group
      align="stretch"
      wrap="nowrap"
      gap="md"
      h="calc(100dvh - 60px - 2 * var(--mantine-spacing-md))"
    >
      <Paper withBorder w={440} style={{ flexShrink: 0, minHeight: 0 }}>
        <TicketList
          currentUser={currentUser}
          selectedId={id}
          onSelect={(ticketId) =>
            navigate(`${homePath(currentUser.role)}/${ticketId}`)
          }
        />
      </Paper>
      <Paper withBorder flex={1} style={{ minWidth: 0, minHeight: 0 }}>
        {id ? (
          <TicketDetail
            key={id}
            ticketId={id}
            currentUser={currentUser}
            draft={drafts[id] ?? ""}
            onDraftChange={(value) =>
              setDrafts((current) => ({ ...current, [id]: value }))
            }
          />
        ) : (
          <Box h="100%">
            <Center h="100%">
              <Text c="dimmed">{translate("selectTicket")}</Text>
            </Center>
          </Box>
        )}
      </Paper>
    </Group>
  );
}
