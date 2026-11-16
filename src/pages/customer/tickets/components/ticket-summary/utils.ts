import { nextExpectation } from "@/domain/customer";
import type { NextExpectation } from "@/domain/customer";
import { stageOf } from "@/domain/customer";
import {
  CustomerStage,
  Expectation,
  HistoryType,
  Status,
} from "@/domain/enums";
import type { HistoryEntry } from "@/domain/types";
import type {
  ProgressEvent,
  ProgressInput,
  Summary,
  SummaryInput,
} from "./types";

const TEAM = "A equipe";

function headlineOf(stage: CustomerStage, handler: string | null): string {
  const who = handler ?? TEAM;
  switch (stage) {
    case CustomerStage.Received:
      return "Recebemos o seu chamado. Ainda não foi pego por ninguém da equipe.";
    case CustomerStage.Assigned:
      return `${who} vai atender o seu chamado.`;
    case CustomerStage.InProgress:
      return `${who} está cuidando do seu chamado.`;
    case CustomerStage.WaitingYou:
      return `${who} precisa de uma resposta sua para continuar.`;
    case CustomerStage.Resolved:
      return "A equipe marcou o chamado como resolvido. Se o problema continuar, você pode reabri-lo.";
    case CustomerStage.Closed:
      return "Este chamado foi encerrado. Se o problema voltar, você pode reabri-lo.";
  }
}

export function summaryOf({ ticket, people, now }: SummaryInput): Summary {
  const stage = stageOf(ticket);
  const handler = ticket.responsavel_id
    ? (people[ticket.responsavel_id]?.nome ?? null)
    : null;
  return {
    stage,
    handler,
    headline: headlineOf(stage, handler),
    expectation: nextExpectation(ticket, now),
  };
}

export function expectationText(
  expectation: NextExpectation,
  formatDate: (iso: string) => string,
): string | null {
  if (expectation.kind === Expectation.None || !expectation.at) return null;
  const date = formatDate(expectation.at);
  const text =
    expectation.kind === Expectation.FirstResponse
      ? `Primeira resposta prevista até ${date}`
      : `Solução prevista até ${date}`;
  return expectation.overdue ? `${text} (esse prazo já passou)` : text;
}

function statusText(
  entry: HistoryEntry,
  meId: string,
  nameOf: (id: string) => string,
  takenAt: Set<string>,
): string | null {
  if (!entry.de || !entry.para) return null;
  switch (entry.para) {
    case Status.WaitingCustomer:
      return "Aguardando a sua resposta";
    case Status.Resolved:
      return `${nameOf(entry.usuario_id)} marcou o chamado como resolvido`;
    case Status.Closed:
      return "Chamado encerrado";
    case Status.InProgress:
      if (entry.de === Status.Resolved || entry.de === Status.Closed) {
        return entry.usuario_id === meId
          ? "Você reabriu o chamado"
          : "Chamado reaberto";
      }
      if (entry.de === Status.WaitingCustomer) return "Atendimento retomado";
      return takenAt.has(`${entry.usuario_id}|${entry.ocorrido_em}`)
        ? null
        : "Atendimento iniciado";
    default:
      return null;
  }
}

export function progressEvents({
  ticket,
  history,
  people,
  meId,
}: ProgressInput): ProgressEvent[] {
  const entries = history ?? [];
  const nameOf = (id: string) => people[id]?.nome ?? TEAM;
  const takenAt = new Set(
    entries
      .filter((historyEntry) => historyEntry.tipo === HistoryType.Assignment)
      .map(
        (historyEntry) =>
          `${historyEntry.usuario_id}|${historyEntry.ocorrido_em}`,
      ),
  );

  const events: ProgressEvent[] = [
    { key: "opened", at: ticket.aberto_em, text: "Chamado aberto" },
  ];
  for (const entry of entries) {
    const text =
      entry.tipo === HistoryType.Assignment
        ? `${nameOf(entry.usuario_id)} assumiu o chamado`
        : statusText(entry, meId, nameOf, takenAt);
    if (text) events.push({ key: entry.id, at: entry.ocorrido_em, text });
  }
  return events.sort((firstProgressEvent, progressEvent) =>
    firstProgressEvent.at.localeCompare(progressEvent.at),
  );
}
