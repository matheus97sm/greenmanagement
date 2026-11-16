import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { SlaBadge } from "@/components/sla-badge";
import { StatusBadge } from "@/components/status-badge";
import { pausedSince } from "@/domain/rules";
import { slaInfo } from "@/domain/sla";
import { useLabels, useTranslate } from "@/i18n";
import { useNow } from "@/hooks/useNow";
import { formatDateTime } from "@/lib/format";
import { lastItems } from "@/lib/list";
import { takeTicket } from "@/store/actions";
import { useTickets } from "@/store/useTickets";
import { Composer } from "../composer";
import { MessageBubble } from "../message-bubble";
import { StatusModal } from "../status-modal";
import {
  DETAIL_SEPARATOR,
  PAGE_SIZE,
  STICK_TO_BOTTOM_THRESHOLD,
} from "./constants";
import { EventKind, ModalKind, TimelineKind } from "./enums";
import { locales } from "./locales";
import type { EventItem, Props } from "./types";
import {
  availableActions,
  buildTimeline,
  footerHint,
  isClosedStatus,
  permissionsFor,
  personName,
} from "./utils";

export function TicketDetail({
  ticketId,
  currentUser,
  draft,
  onDraftChange,
  extraActions,
}: Props) {
  const translate = useTranslate(locales);
  const labels = useLabels();
  const state = useTickets();
  const now = useNow();
  const ticket = state.tickets[ticketId];
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [taking, setTaking] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const viewer = state.people[currentUser.id];
  const unknownPerson = translate("unknownPerson");
  const nameOf = (id: string | null) =>
    personName(state.people, id, unknownPerson);
  const formatDate = (iso: string) =>
    formatDateTime(iso, viewer?.zoneinfo, viewer?.locale);

  const messages = state.messages[ticketId];
  const history = state.history[ticketId];

  const items = useMemo(
    () =>
      ticket
        ? buildTimeline({
            ticket,
            messages,
            history,
            people: state.people,
            unknownPerson: translate("unknownPerson"),
          })
        : [],
    [ticket, messages, history, state.people, translate],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element && stickToBottom.current)
      element.scrollTop = element.scrollHeight;
  }, [items.length]);

  if (!ticket) {
    return (
      <Text c="dimmed" p="lg">
        {translate("notFound")}
      </Text>
    );
  }

  const sla = slaInfo(ticket, now, pausedSince(ticket, history));
  const requester = state.people[ticket.solicitante_id];
  const groupName = state.groups[ticket.grupo_id]?.nome;
  const categoryName = state.categories[ticket.categoria_id]?.nome;
  const isMine = ticket.responsavel_id === currentUser.id;
  const { canTake, canReply, canChangeStatus } = permissionsFor({
    ticket,
    role: currentUser.role,
    userId: currentUser.id,
    groupId: viewer?.grupo_id,
  });
  const isClosed = isClosedStatus(ticket.status);
  const { canAdvance, canReopen } = availableActions(ticket.status);
  const { hidden, visible } = lastItems(items, shown);

  const eventText = (item: EventItem) =>
    item.event === EventKind.Assigned
      ? translate("eventAssigned", { who: item.who })
      : translate("eventStatusChanged", {
          who: item.who,
          from: item.from ? labels.status(item.from) : "",
          to: item.to ? labels.status(item.to) : "",
          reason: item.reason ?? translate("noReason"),
        });

  const take = async () => {
    setTaking(true);
    await takeTicket(ticket.id, currentUser.id);
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
                {translate("take")}
              </Button>
            )}
            {canChangeStatus && canAdvance && (
              <Button
                variant="default"
                onClick={() => setModal(ModalKind.Status)}
              >
                {translate("changeStatus")}
              </Button>
            )}
            {canChangeStatus && canReopen && (
              <Button
                variant="default"
                onClick={() => setModal(ModalKind.Reopen)}
              >
                {translate("reopen")}
              </Button>
            )}
            {extraActions}
          </Group>
        </Group>
        <Group gap="xs">
          <StatusBadge status={ticket.status} />
          <SlaBadge sla={sla} />
          <Badge variant="outline" color="gray" size="sm">
            {translate("priority", {
              priority: labels.priority(ticket.prioridade),
            })}
          </Badge>
          <Text size="xs" c="dimmed">
            {[
              ticket.primeira_resposta_em
                ? null
                : translate("firstResponseDue", {
                    date: formatDate(ticket.prazo_primeira_resposta),
                  }),
              translate("resolutionDue", {
                date: formatDate(ticket.prazo_resolucao),
              }),
              ticket.responsavel_id
                ? isMine
                  ? translate("handledByYou")
                  : translate("handledBy", {
                      name: nameOf(ticket.responsavel_id),
                    })
                : translate("unassigned"),
            ]
              .filter(Boolean)
              .join(DETAIL_SEPARATOR)}
          </Text>
        </Group>
      </Stack>

      <Box
        ref={scrollRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
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
                setShown((current) => current + PAGE_SIZE);
              }}
            >
              {translate("showPrevious", { count: hidden })}
            </Button>
          )}
          {visible.map((item) =>
            item.kind === TimelineKind.Event ? (
              <Text key={item.key} size="xs" c="dimmed" ta="center">
                {eventText(item)}
                {DETAIL_SEPARATOR}
                {formatDate(item.at)}
              </Text>
            ) : (
              <MessageBubble
                key={item.key}
                author={nameOf(item.author)}
                role={item.authorProfile}
                isOwn={item.author === currentUser.id}
                internal={item.internal}
                text={item.text}
                at={formatDate(item.at)}
              />
            ),
          )}
        </Stack>
      </Box>

      {canReply ? (
        <Composer
          key={ticket.id}
          ticketId={ticket.id}
          userId={currentUser.id}
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
          {footerHint({
            ticket,
            isMine,
            isClosed,
            canTake,
            nameOf,
            translate,
          })}
        </Text>
      )}

      {modal && (
        <StatusModal
          ticket={ticket}
          userId={currentUser.id}
          reopen={modal === ModalKind.Reopen}
          onClose={() => setModal(null)}
        />
      )}
    </Stack>
  );
}
