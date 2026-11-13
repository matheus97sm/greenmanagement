import { HistoryType, Status } from "@/domain/enums";
import { isReopen, STATUS_LABEL, TRANSITIONS } from "@/domain/status";
import type { Person } from "@/domain/types";
import { UNKNOWN_PERSON } from "./constants";
import { TimelineKind } from "./enums";
import type {
  Actions,
  BuildTimelineInput,
  FooterHintInput,
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
      .filter((h) => h.tipo === HistoryType.Status && h.de === Status.Open)
      .map((h) => `${h.usuario_id}|${h.ocorrido_em}`),
  );

  const items: TimelineItem[] = [
    {
      kind: TimelineKind.Message,
      key: "description",
      at: ticket.aberto_em,
      author: ticket.solicitante_id,
      text: ticket.descricao,
      internal: false,
    },
    ...(messages ?? []).map((m): TimelineItem => ({
      kind: TimelineKind.Message,
      key: m.id,
      at: m.criada_em,
      author: m.autor_id,
      text: m.texto,
      internal: m.interna,
    })),
    ...entries.flatMap((h): TimelineItem[] => {
      const who = personName(people, h.usuario_id);
      if (h.tipo === HistoryType.Assignment) {
        if (takenAt.has(`${h.usuario_id}|${h.ocorrido_em}`)) return [];
        return [
          {
            kind: TimelineKind.Event,
            key: h.id,
            at: h.ocorrido_em,
            text: `${who} assumiu o chamado.`,
          },
        ];
      }
      if (!h.de || !h.para) return [];
      return [
        {
          kind: TimelineKind.Event,
          key: h.id,
          at: h.ocorrido_em,
          text: `${who} alterou o status de ${STATUS_LABEL[h.de]} para ${STATUS_LABEL[h.para]}. Motivo: ${h.motivo ?? "não informado"}`,
        },
      ];
    }),
  ];

  return items.sort((a, b) => a.at.localeCompare(b.at));
}

export function lastItems(
  items: TimelineItem[],
  shown: number,
): { hidden: number; visible: TimelineItem[] } {
  const hidden = Math.max(0, items.length - shown);
  return { hidden, visible: hidden ? items.slice(-shown) : items };
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
