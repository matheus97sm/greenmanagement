import dadosUrl from "../../dados.json?url";
import { isStaff, renewSla } from "@/domain/rules";
import type { RawData } from "@/domain/types";
import { anchorClock } from "@/lib/clock";
import { Status, HistoryType } from "@/domain/enums";

export type Database = Omit<RawData, "meta"> & { agora: string };

let current: Database | null = null;
let loading: Promise<Database> | null = null;
let nextNumber = 0;

function renewReopenedTickets(database: Database): void {
  const people = new Map(
    database.usuarios.map((person) => [person.id, person]),
  );
  for (const ticket of database.chamados) {
    const reopenedAt = database.historico
      .filter(
        (historyEntry) =>
          historyEntry.chamado_id === ticket.id &&
          historyEntry.tipo === HistoryType.Status &&
          historyEntry.de === Status.Closed &&
          historyEntry.para === Status.InProgress,
      )
      .map((historyEntry) => historyEntry.ocorrido_em)
      .sort()
      .at(-1);
    if (!reopenedAt) continue;

    const firstReplyAfter =
      database.mensagens
        .filter(
          (message) =>
            message.chamado_id === ticket.id &&
            !message.interna &&
            message.criada_em >= reopenedAt &&
            isStaff(people.get(message.autor_id)),
        )
        .map((message) => message.criada_em)
        .sort()[0] ?? null;
    Object.assign(
      ticket,
      renewSla(ticket, reopenedAt, database.sla, firstReplyAfter),
    );
  }
}

export function initDb(raw: RawData): Database {
  const { meta, ...tables } = structuredClone(raw);
  current = { agora: meta.agora, ...tables };
  renewReopenedTickets(current);
  nextNumber =
    Math.max(0, ...current.chamados.map((ticket) => ticket.numero)) + 1;
  anchorClock(meta.agora);
  return current;
}

export function getDb(): Database {
  if (!current) throw new Error("The database has not been loaded yet.");
  return current;
}

export function nextTicketNumber(): number {
  return nextNumber++;
}

export function ensureDb(): Promise<Database> {
  if (current) return Promise.resolve(current);
  loading ??= fetch(dadosUrl)
    .then((response) => response.json() as Promise<RawData>)
    .then(initDb);
  return loading;
}
