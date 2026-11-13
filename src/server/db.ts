import dadosUrl from "../../dados.json?url";
import type { RawData } from "../domain/types";
import { anchorClock } from "../lib/clock";

export type Db = Omit<RawData, "meta"> & { agora: string };

let current: Db | null = null;
let loading: Promise<Db> | null = null;
let nextNumber = 0;

export function initDb(raw: RawData): Db {
  const { meta, ...tables } = structuredClone(raw);
  current = { agora: meta.agora, ...tables };
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
