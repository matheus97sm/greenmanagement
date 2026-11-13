import type { DomainEvent, Snapshot, Status } from "../domain/types";
import { ensureDb } from "./db";
import * as ops from "./ops";
import { scopedSnapshot } from "./visibility";

export { ApiError } from "./ops";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = async () => {
  await ensureDb();
  await sleep(120 + Math.random() * 280);
};

export async function fetchSnapshot(userId: string): Promise<Snapshot> {
  const db = await ensureDb();
  await sleep(300 + Math.random() * 300);
  const viewer = db.usuarios.find((u) => u.id === userId);
  if (!viewer) throw new Error("Unknown user.");
  return scopedSnapshot(db, viewer);
}

export async function assumeTicket(
  ticketId: string,
  consultantId: string,
): Promise<DomainEvent[]> {
  await latency();
  return ops.assumeTicket(ticketId, consultantId);
}

export async function sendMessage(input: {
  ticketId: string;
  authorId: string;
  text: string;
  internal: boolean;
}): Promise<DomainEvent[]> {
  await latency();
  return ops.addMessage(input);
}

export async function changeStatus(input: {
  ticketId: string;
  to: Status;
  reason: string;
  userId: string;
}): Promise<DomainEvent[]> {
  await latency();
  return ops.changeStatus(input);
}
