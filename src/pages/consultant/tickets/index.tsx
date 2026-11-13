import { useEffect, useState } from "react";
import { Alert, Box, Center, Group, Loader, Paper, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/auth-context";
import { homePath } from "@/paths";
import { LoadStatus } from "@/store/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { useTickets } from "@/store/useTickets";
import { TicketDetail } from "./components/detail";
import { TicketList } from "./components/list";

export function TicketsPage() {
  const me = useCurrentUser();
  const state = useTickets();
  const navigate = useNavigate();
  const { id } = useParams();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const lastMessageId = id ? state.messages[id]?.at(-1)?.id : undefined;
  useEffect(() => {
    if (id) ticketsStore.markRead(id);
  }, [id, lastMessageId]);

  if (state.status === LoadStatus.Error) {
    return <Alert color="red">Não foi possível carregar os chamados.</Alert>;
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
          me={me}
          selectedId={id}
          onSelect={(ticketId) => navigate(`${homePath(me.role)}/${ticketId}`)}
        />
      </Paper>
      <Paper withBorder flex={1} style={{ minWidth: 0, minHeight: 0 }}>
        {id ? (
          <TicketDetail
            key={id}
            ticketId={id}
            me={me}
            draft={drafts[id] ?? ""}
            onDraftChange={(value) => setDrafts((d) => ({ ...d, [id]: value }))}
          />
        ) : (
          <Box h="100%">
            <Center h="100%">
              <Text c="dimmed">Selecione um chamado na lista.</Text>
            </Center>
          </Box>
        )}
      </Paper>
    </Group>
  );
}
