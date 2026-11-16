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
  SummaryTranslate,
} from "./types";

function headlineOf(
  stage: CustomerStage,
  handler: string | null,
  translate: SummaryTranslate,
): string {
  const who = handler ?? translate("team");
  switch (stage) {
    case CustomerStage.Received:
      return translate("headlineReceived");
    case CustomerStage.Assigned:
      return translate("headlineAssigned", { who });
    case CustomerStage.InProgress:
      return translate("headlineInProgress", { who });
    case CustomerStage.WaitingYou:
      return translate("headlineWaitingYou", { who });
    case CustomerStage.Resolved:
      return translate("headlineResolved");
    case CustomerStage.Closed:
      return translate("headlineClosed");
  }
}

export function summaryOf({
  ticket,
  people,
  now,
  translate,
}: SummaryInput): Summary {
  const stage = stageOf(ticket);
  const handler = ticket.responsavel_id
    ? (people[ticket.responsavel_id]?.nome ?? null)
    : null;
  return {
    stage,
    handler,
    headline: headlineOf(stage, handler, translate),
    expectation: nextExpectation(ticket, now),
  };
}

export function expectationText(
  expectation: NextExpectation,
  formatDate: (iso: string) => string,
  translate: SummaryTranslate,
): string | null {
  if (expectation.kind === Expectation.None || !expectation.at) return null;
  const date = formatDate(expectation.at);
  if (expectation.kind === Expectation.FirstResponse) {
    return translate(
      expectation.overdue ? "firstResponseOverdue" : "firstResponse",
      { date },
    );
  }
  return translate(expectation.overdue ? "resolutionOverdue" : "resolution", {
    date,
  });
}

function statusText(
  entry: HistoryEntry,
  meId: string,
  nameOf: (id: string) => string,
  takenAt: Set<string>,
  translate: SummaryTranslate,
): string | null {
  if (!entry.de || !entry.para) return null;
  switch (entry.para) {
    case Status.WaitingCustomer:
      return translate("eventWaiting");
    case Status.Resolved:
      return translate("eventResolved", { name: nameOf(entry.usuario_id) });
    case Status.Closed:
      return translate("eventClosed");
    case Status.InProgress:
      if (entry.de === Status.Resolved || entry.de === Status.Closed) {
        return translate(
          entry.usuario_id === meId ? "eventReopenedByYou" : "eventReopened",
        );
      }
      if (entry.de === Status.WaitingCustomer) return translate("eventResumed");
      return takenAt.has(`${entry.usuario_id}|${entry.ocorrido_em}`)
        ? null
        : translate("eventStarted");
    default:
      return null;
  }
}

export function progressEvents({
  ticket,
  history,
  people,
  meId,
  translate,
}: ProgressInput): ProgressEvent[] {
  const entries = history ?? [];
  const nameOf = (id: string) => people[id]?.nome ?? translate("team");
  const takenAt = new Set(
    entries
      .filter((historyEntry) => historyEntry.tipo === HistoryType.Assignment)
      .map(
        (historyEntry) =>
          `${historyEntry.usuario_id}|${historyEntry.ocorrido_em}`,
      ),
  );

  const events: ProgressEvent[] = [
    { key: "opened", at: ticket.aberto_em, text: translate("eventOpened") },
  ];
  for (const entry of entries) {
    const text =
      entry.tipo === HistoryType.Assignment
        ? translate("eventAssigned", { name: nameOf(entry.usuario_id) })
        : statusText(entry, meId, nameOf, takenAt, translate);
    if (text) events.push({ key: entry.id, at: entry.ocorrido_em, text });
  }
  return events.sort((firstProgressEvent, progressEvent) =>
    firstProgressEvent.at.localeCompare(progressEvent.at),
  );
}
