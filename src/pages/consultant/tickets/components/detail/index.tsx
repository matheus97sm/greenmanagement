import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { SlaBadge, StatusBadge } from "@/components/Badges";
import { pausedSince } from "@/domain/rules";
import { slaInfo } from "@/domain/sla";
import { useNow } from "@/hooks/useNow";
import { formatDateTime } from "@/lib/format";
import { takeTicket } from "@/store/actions";
import { useTickets } from "@/store/useTickets";
import { Composer } from "../composer";
import { MessageBubble } from "../message-bubble";
import { StatusModal } from "../status-modal";
import { PAGE_SIZE, STICK_TO_BOTTOM_THRESHOLD } from "./constants";
import { ModalKind, TimelineKind } from "./enums";
import type { Props } from "./types";
import {
  availableActions,
  buildTimeline,
  footerHint,
  isClosedStatus,
  lastItems,
  personName,
} from "./utils";

export function TicketDetail({ ticketId, me, draft, onDraftChange }: Props) {
  const state = useTickets();
  const now = useNow();
  const ticket = state.tickets[ticketId];
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [taking, setTaking] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const viewer = state.people[me.id];
  const nameOf = (id: string | null) => personName(state.people, id);
  const formatDate = (iso: string) =>
    formatDateTime(iso, viewer?.zoneinfo, viewer?.locale);

  const messages = state.messages[ticketId];
  const history = state.history[ticketId];

  const items = useMemo(
    () =>
      ticket
        ? buildTimeline({ ticket, messages, history, people: state.people })
        : [],
    [ticket, messages, history, state.people],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  if (!ticket) {
    return (
      <Text c="dimmed" p="lg">
        Chamado não encontrado.
      </Text>
    );
  }

  const sla = slaInfo(ticket, now, pausedSince(ticket, history));
  const requester = state.people[ticket.solicitante_id];
  const groupName = state.groups[ticket.grupo_id]?.nome;
  const categoryName = state.categories[ticket.categoria_id]?.nome;
  const isMine = ticket.responsavel_id === me.id;
  const canTake =
    !ticket.responsavel_id && ticket.grupo_id === viewer?.grupo_id;
  const isClosed = isClosedStatus(ticket.status);
  const { canAdvance, canReopen } = availableActions(ticket.status);
  const { hidden, visible } = lastItems(items, shown);

  const take = async () => {
    setTaking(true);
    await takeTicket(ticket.id, me.id);
    setTaking(false);
  };

  return (
    <Stack gap={0} h="100%" style={{ minHeight: 0 }}>
      <Stack
        gap="xs"
        p="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Title order={4}>
              #{ticket.numero} · {ticket.titulo}
            </Title>
            <Text size="sm" c="dimmed">
              {requester?.nome}
              {requester?.empresa ? ` · ${requester.empresa}` : ""} ·{" "}
              {groupName} · {categoryName}
            </Text>
          </div>
          <Group gap="xs" wrap="nowrap">
            {canTake && (
              <Button onClick={take} loading={taking}>
                Pegar chamado
              </Button>
            )}
            {isMine && canAdvance && (
              <Button
                variant="default"
                onClick={() => setModal(ModalKind.Status)}
              >
                Alterar status
              </Button>
            )}
            {isMine && canReopen && (
              <Button
                variant="default"
                onClick={() => setModal(ModalKind.Reopen)}
              >
                Reabrir
              </Button>
            )}
          </Group>
        </Group>
        <Group gap="xs">
          <StatusBadge status={ticket.status} />
          <SlaBadge sla={sla} />
          <Badge variant="outline" color="gray" size="sm">
            Prioridade {ticket.prioridade}
          </Badge>
          <Text size="xs" c="dimmed">
            {ticket.primeira_resposta_em
              ? ""
              : `1ª resposta até ${formatDate(ticket.prazo_primeira_resposta)} · `}
            Resolução até {formatDate(ticket.prazo_resolucao)} ·{" "}
            {ticket.responsavel_id
              ? `Atendido por ${isMine ? "você" : nameOf(ticket.responsavel_id)}`
              : "Sem responsável"}
          </Text>
        </Group>
      </Stack>

      <Box
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight <
            STICK_TO_BOTTOM_THRESHOLD;
        }}
        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        p="md"
      >
        <Stack gap="sm">
          {hidden > 0 && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                stickToBottom.current = false;
                setShown((n) => n + PAGE_SIZE);
              }}
            >
              Mostrar mensagens anteriores ({hidden})
            </Button>
          )}
          {visible.map((item) =>
            item.kind === TimelineKind.Event ? (
              <Text key={item.key} size="xs" c="dimmed" ta="center">
                {item.text} · {formatDate(item.at)}
              </Text>
            ) : (
              <MessageBubble
                key={item.key}
                author={nameOf(item.author)}
                isOwn={item.author === me.id}
                internal={item.internal}
                text={item.text}
                at={formatDate(item.at)}
              />
            ),
          )}
        </Stack>
      </Box>

      {isMine && !isClosed ? (
        <Composer
          key={ticket.id}
          ticketId={ticket.id}
          userId={me.id}
          draft={draft}
          onDraftChange={onDraftChange}
        />
      ) : (
        <Text
          size="sm"
          c="dimmed"
          ta="center"
          p="sm"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          {footerHint({ ticket, isMine, isClosed, canTake, nameOf })}
        </Text>
      )}

      {modal && (
        <StatusModal
          ticket={ticket}
          userId={me.id}
          reopen={modal === ModalKind.Reopen}
          onClose={() => setModal(null)}
        />
      )}
    </Stack>
  );
}
