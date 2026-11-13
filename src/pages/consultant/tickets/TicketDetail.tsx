import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { SlaBadge, StatusBadge } from "../../../components/Badges";
import { pausedSince } from "../../../domain/rules";
import { isReopen, STATUS_LABEL, TRANSITIONS } from "../../../domain/status";
import { slaInfo } from "../../../domain/sla";
import type { User } from "../../../auth/users";
import type { Person } from "../../../domain/types";
import { useNow } from "../../../hooks/useNow";
import { formatDateTime } from "../../../lib/format";
import { takeTicket } from "../../../store/actions";
import { useTickets } from "../../../store/useTickets";
import { Composer } from "./Composer";
import { StatusModal } from "./StatusModal";

const PAGE_SIZE = 100;

interface Props {
  ticketId: string;
  me: User;
  draft: string;
  onDraftChange: (value: string) => void;
}

type TimelineItem =
  | {
      kind: "msg";
      at: string;
      key: string;
      author: string;
      text: string;
      internal: boolean;
    }
  | { kind: "event"; at: string; key: string; text: string };

function personName(people: Record<string, Person>, id: string | null): string {
  return (id && people[id]?.nome) || "Desconhecido";
}

export function TicketDetail({ ticketId, me, draft, onDraftChange }: Props) {
  const state = useTickets();
  const now = useNow();
  const ticket = state.tickets[ticketId];
  const [modal, setModal] = useState<"status" | "reopen" | null>(null);
  const [taking, setTaking] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const viewer = state.people[me.id];
  const nameOf = (id: string | null) => personName(state.people, id);
  const formatDate = (iso: string) =>
    formatDateTime(iso, viewer?.zoneinfo, viewer?.locale);

  const messages = state.messages[ticketId];
  const history = state.history[ticketId];

  const items = useMemo<TimelineItem[]>(() => {
    if (!ticket) return [];

    const takenAt = new Set(
      (history ?? [])
        .filter((h) => h.tipo === "status" && h.de === "aberto")
        .map((h) => `${h.usuario_id}|${h.ocorrido_em}`),
    );

    const out: TimelineItem[] = [
      {
        kind: "msg",
        key: "description",
        at: ticket.aberto_em,
        author: ticket.solicitante_id,
        text: ticket.descricao,
        internal: false,
      },
      ...(messages ?? []).map((m): TimelineItem => ({
        kind: "msg",
        key: m.id,
        at: m.criada_em,
        author: m.autor_id,
        text: m.texto,
        internal: m.interna,
      })),
      ...(history ?? []).flatMap((h): TimelineItem[] => {
        const who = personName(state.people, h.usuario_id);
        if (h.tipo === "atribuicao") {
          if (takenAt.has(`${h.usuario_id}|${h.ocorrido_em}`)) return [];
          return [
            {
              kind: "event",
              key: h.id,
              at: h.ocorrido_em,
              text: `${who} assumiu o chamado.`,
            },
          ];
        }
        if (!h.de || !h.para) return [];
        return [
          {
            kind: "event",
            key: h.id,
            at: h.ocorrido_em,
            text: `${who} alterou o status de ${STATUS_LABEL[h.de]} para ${STATUS_LABEL[h.para]}. Motivo: ${h.motivo ?? "não informado"}`,
          },
        ];
      }),
    ];
    return out.sort((a, b) => a.at.localeCompare(b.at));
  }, [ticket, messages, history, state.people]);

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
  const isClosed = ticket.status === "resolvido" || ticket.status === "fechado";
  const canAdvance = TRANSITIONS[ticket.status].some(
    (s) => !isReopen(ticket.status, s),
  );
  const canReopen = TRANSITIONS[ticket.status].some((s) =>
    isReopen(ticket.status, s),
  );

  const hidden = Math.max(0, items.length - shown);
  const visibleItems = hidden ? items.slice(-shown) : items;

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
              <Button variant="default" onClick={() => setModal("status")}>
                Alterar status
              </Button>
            )}
            {isMine && canReopen && (
              <Button variant="default" onClick={() => setModal("reopen")}>
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
            el.scrollHeight - el.scrollTop - el.clientHeight < 120;
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
          {visibleItems.map((item) =>
            item.kind === "event" ? (
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
          {!ticket.responsavel_id
            ? canTake
              ? "Pegue o chamado para responder."
              : "Este chamado ainda não tem responsável."
            : isClosed
              ? isMine
                ? "Chamado encerrado. Reabra para voltar a responder."
                : `Chamado encerrado (atendido por ${nameOf(ticket.responsavel_id)}).`
              : `Atendido por ${nameOf(ticket.responsavel_id)}.`}
        </Text>
      )}

      {modal && (
        <StatusModal
          ticket={ticket}
          userId={me.id}
          reopen={modal === "reopen"}
          onClose={() => setModal(null)}
        />
      )}
    </Stack>
  );
}

function MessageBubble(props: {
  author: string;
  isOwn: boolean;
  internal: boolean;
  text: string;

  at: string;
}) {
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      maw="80%"
      ml={props.isOwn ? "auto" : undefined}
      bg={
        props.internal
          ? "var(--mantine-color-yellow-light)"
          : props.isOwn
            ? "var(--mantine-color-green-light)"
            : undefined
      }
    >
      <Group gap="xs" mb={2}>
        <Text size="xs" fw={600}>
          {props.isOwn ? "Você" : props.author}
        </Text>
        {props.internal && (
          <Badge size="xs" color="yellow" variant="filled">
            Nota interna
          </Badge>
        )}
        <Text size="xs" c="dimmed">
          {props.at}
        </Text>
      </Group>
      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
        {props.text}
      </Text>
    </Paper>
  );
}
