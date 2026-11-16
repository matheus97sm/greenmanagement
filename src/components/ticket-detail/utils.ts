import { Role } from "@/auth/enums";
import { HistoryType, Status } from "@/domain/enums";
import { isReopen, TRANSITIONS } from "@/domain/status";
import type { Person } from "@/domain/types";
import { EventKind, TimelineKind } from "./enums";
import type {
  Actions,
  BuildTimelineInput,
  FooterHintInput,
  Permissions,
  PermissionsInput,
  TimelineItem,
} from "./types";

export function personName(
  people: Record<string, Person>,
  id: string | null,
  unknownPerson: string,
): string {
  return (id && people[id]?.nome) || unknownPerson;
}

export function isClosedStatus(status: Status): boolean {
  return status === Status.Resolved || status === Status.Closed;
}

export function buildTimeline({
  ticket,
  messages,
  history,
  people,
  unknownPerson,
}: BuildTimelineInput): TimelineItem[] {
  const entries = history ?? [];

  const takenAt = new Set(
    entries
      .filter(
        (historyEntry) =>
          historyEntry.tipo === HistoryType.Status &&
          historyEntry.de === Status.Open,
      )
      .map(
        (historyEntry) =>
          `${historyEntry.usuario_id}|${historyEntry.ocorrido_em}`,
      ),
  );

  const items: TimelineItem[] = [
    {
      kind: TimelineKind.Message,
      key: "description",
      at: ticket.aberto_em,
      author: ticket.solicitante_id,
      authorProfile: people[ticket.solicitante_id]?.perfil,
      text: ticket.descricao,
      internal: false,
    },
    ...(messages ?? []).map((message): TimelineItem => ({
      kind: TimelineKind.Message,
      key: message.id,
      at: message.criada_em,
      author: message.autor_id,
      authorProfile: people[message.autor_id]?.perfil,
      text: message.texto,
      internal: message.interna,
    })),
    ...entries.flatMap((historyEntry): TimelineItem[] => {
      const who = personName(people, historyEntry.usuario_id, unknownPerson);
      if (historyEntry.tipo === HistoryType.Assignment) {
        if (
          takenAt.has(`${historyEntry.usuario_id}|${historyEntry.ocorrido_em}`)
        )
          return [];
        return [
          {
            kind: TimelineKind.Event,
            key: historyEntry.id,
            at: historyEntry.ocorrido_em,
            event: EventKind.Assigned,
            who,
            from: null,
            to: null,
            reason: null,
          },
        ];
      }
      if (!historyEntry.de || !historyEntry.para) return [];
      return [
        {
          kind: TimelineKind.Event,
          key: historyEntry.id,
          at: historyEntry.ocorrido_em,
          event: EventKind.StatusChanged,
          who,
          from: historyEntry.de,
          to: historyEntry.para,
          reason: historyEntry.motivo,
        },
      ];
    }),
  ];

  return items.sort((firstTimelineItem, timelineItem) =>
    firstTimelineItem.at.localeCompare(timelineItem.at),
  );
}

export function permissionsFor({
  ticket,
  role,
  userId,
  groupId,
}: PermissionsInput): Permissions {
  const closed = isClosedStatus(ticket.status);
  if (role === Role.Manager) {
    return { canTake: false, canReply: !closed, canChangeStatus: true };
  }
  if (role === Role.Consultant) {
    const mine = ticket.responsavel_id === userId;
    return {
      canTake: !ticket.responsavel_id && ticket.grupo_id === groupId,
      canReply: mine && !closed,
      canChangeStatus: mine,
    };
  }
  return { canTake: false, canReply: false, canChangeStatus: false };
}

export function availableActions(status: Status): Actions {
  return {
    canAdvance: TRANSITIONS[status].some((to) => !isReopen(status, to)),
    canReopen: TRANSITIONS[status].some((to) => isReopen(status, to)),
  };
}

export function footerHint({
  ticket,
  isMine,
  isClosed,
  canTake,
  nameOf,
  translate,
}: FooterHintInput): string {
  if (!ticket.responsavel_id) {
    return canTake ? translate("hintTake") : translate("hintNoOwner");
  }
  if (isClosed) {
    return isMine
      ? translate("hintClosedMine")
      : translate("hintClosedOther", { name: nameOf(ticket.responsavel_id) });
  }
  return translate("hintHandledBy", { name: nameOf(ticket.responsavel_id) });
}
