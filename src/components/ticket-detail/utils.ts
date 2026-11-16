import { Role } from "@/auth/enums";
import { HistoryType, Status } from "@/domain/enums";
import { isReopen, STATUS_LABEL, TRANSITIONS } from "@/domain/status";
import type { Person } from "@/domain/types";
import { UNKNOWN_PERSON } from "./constants";
import { TimelineKind } from "./enums";
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
): string {
  return (id && people[id]?.nome) || UNKNOWN_PERSON;
}

export function isClosedStatus(status: Status): boolean {
  return status === Status.Resolved || status === Status.Closed;
}

export function buildTimeline({
  ticket,
  messages,
  history,
  people,
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
      const who = personName(people, historyEntry.usuario_id);
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
            text: `${who} assumiu o chamado.`,
          },
        ];
      }
      if (!historyEntry.de || !historyEntry.para) return [];
      return [
        {
          kind: TimelineKind.Event,
          key: historyEntry.id,
          at: historyEntry.ocorrido_em,
          text: `${who} alterou o status de ${STATUS_LABEL[historyEntry.de]} para ${STATUS_LABEL[historyEntry.para]}. Motivo: ${historyEntry.motivo ?? "não informado"}`,
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
}: FooterHintInput): string {
  if (!ticket.responsavel_id) {
    return canTake
      ? "Pegue o chamado para responder."
      : "Este chamado ainda não tem responsável.";
  }
  if (isClosed) {
    return isMine
      ? "Chamado encerrado. Reabra para voltar a responder."
      : `Chamado encerrado (atendido por ${nameOf(ticket.responsavel_id)}).`;
  }
  return `Atendido por ${nameOf(ticket.responsavel_id)}.`;
}
