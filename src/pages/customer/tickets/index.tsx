import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/auth/auth-context";
import { homePath } from "@/paths";
import { markRead } from "@/store/actions";
import { LoadStatus } from "@/store/enums";
import { useTickets } from "@/store/useTickets";
import { Conversation } from "./components/conversation";
import { NewTicketModal } from "./components/new-ticket-modal";
import { TicketList } from "./components/ticket-list";

export function TicketsPage() {
  const me = useCurrentUser();
  const state = useTickets();
  const navigate = useNavigate();
  const { id } = useParams();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const known = id ? Boolean(state.tickets[id]) : false;
  const lastMessageId = id ? state.messages[id]?.at(-1)?.id : undefined;
  useEffect(() => {
    if (id && known) markRead(id);
  }, [id, known, lastMessageId]);

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

  const open = (ticketId: string) =>
    navigate(`${homePath(me.role)}/${ticketId}`);
  const hasTickets = Object.keys(state.tickets).length > 0;

  return (
    <Stack
      gap="md"
      h="calc(100dvh - 60px - 2 * var(--mantine-spacing-md))"
      style={{ minHeight: 0 }}
    >
      <Group justify="space-between">
        <Title order={2}>Meus chamados</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreating(true)}
        >
          Novo chamado
        </Button>
      </Group>

      <Group align="stretch" wrap="nowrap" gap="md" flex={1} mih={0}>
        <Paper withBorder w={420} style={{ flexShrink: 0, minHeight: 0 }}>
          <TicketList me={me} selectedId={id} onSelect={open} />
        </Paper>
        <Paper withBorder flex={1} style={{ minWidth: 0, minHeight: 0 }}>
          {id ? (
            <Conversation
              key={id}
              ticketId={id}
              me={me}
              draft={drafts[id] ?? ""}
              onDraftChange={(value) =>
                setDrafts((current) => ({ ...current, [id]: value }))
              }
            />
          ) : (
            <Box h="100%">
              <Center h="100%">
                <Text c="dimmed" ta="center" maw={320}>
                  {hasTickets
                    ? "Escolha um chamado na lista para ver o andamento."
                    : "Quando algo quebrar, abra um chamado e acompanhe tudo por aqui."}
                </Text>
              </Center>
            </Box>
          )}
        </Paper>
      </Group>

      {creating && (
        <NewTicketModal
          me={me}
          onClose={() => setCreating(false)}
          onOpenTicket={(ticketId) => {
            setCreating(false);
            open(ticketId);
          }}
        />
      )}
    </Stack>
  );
}
