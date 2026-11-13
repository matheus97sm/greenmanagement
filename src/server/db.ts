import dadosUrl from "../../dados.json?url";
import { isStaff, renewSla } from "../domain/rules";
import type { RawData } from "../domain/types";
import { anchorClock } from "../lib/clock";

export type Db = Omit<RawData, "meta"> & { agora: string };

let current: Db | null = null;
let loading: Promise<Db> | null = null;
let nextNumber = 0;

function renewReopenedTickets(db: Db): void {
  const people = new Map(db.usuarios.map((u) => [u.id, u]));
  for (const ticket of db.chamados) {
    const reopenedAt = db.historico
      .filter(
        (h) =>
          h.chamado_id === ticket.id &&
          h.tipo === "status" &&
          h.de === "fechado" &&
          h.para === "em_atendimento",
      )
      .map((h) => h.ocorrido_em)
      .sort()
      .at(-1);
    if (!reopenedAt) continue;

    const firstReplyAfter =
      db.mensagens
        .filter(
          (m) =>
            m.chamado_id === ticket.id &&
            !m.interna &&
            m.criada_em >= reopenedAt &&
            isStaff(people.get(m.autor_id)),
        )
        .map((m) => m.criada_em)
        .sort()[0] ?? null;
    Object.assign(
      ticket,
      renewSla(ticket, reopenedAt, db.sla, firstReplyAfter),
    );
  }
}

export function initDb(raw: RawData): Db {
  const { meta, ...tables } = structuredClone(raw);
  current = { agora: meta.agora, ...tables };
  renewReopenedTickets(current);
  nextNumber = Math.max(0, ...current.chamados.map((c) => c.numero)) + 1;
  anchorClock(meta.agora);
  return current;
}

export function getDb(): Db {
  if (!current) throw new Error("The database has not been loaded yet.");
  return current;
}

export function nextTicketNumber(): number {
  return nextNumber++;
}

export function ensureDb(): Promise<Db> {
  loading ??= fetch(dadosUrl)
    .then((response) => response.json() as Promise<RawData>)
    .then(initDb);
  return loading;
}
