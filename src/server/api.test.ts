import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Profile, Status } from "@/domain/enums";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "@/test-data";
import {
  ApiError,
  assumeTicket,
  changeStatus,
  fetchSnapshot,
  reassignTicket,
  sendMessage,
} from "./api";
import { getDb, initDb } from "./db";

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(1000);
  return promise;
}

const marinasGroup = () =>
  getDb().usuarios.find((u) => u.id === MARINA_ID)!.grupo_id;

const queued = () =>
  getDb().chamados.find(
    (t) =>
      !t.responsavel_id &&
      t.status === Status.Open &&
      t.grupo_id === marinasGroup(),
  )!;

const marinasOpenTicket = () =>
  rawData.chamados.find(
    (t) => t.responsavel_id === MARINA_ID && t.status === Status.InProgress,
  )!;

describe("the simulated API", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    initDb(rawData);
  });

  afterEach(() => vi.useRealTimers());

  describe("fetchSnapshot", () => {
    it("answers only after a delay", async () => {
      let done = false;
      const request = fetchSnapshot(MARINA_ID).then((snapshot) => {
        done = true;
        return snapshot;
      });
      await vi.advanceTimersByTimeAsync(200);
      expect(done).toBe(false);
      await settle(request);
      expect(done).toBe(true);
    });

    it("gives the slice of the data that belongs to the user, with the simulated time", async () => {
      const snapshot = await settle(fetchSnapshot(HELENA_ID));
      expect(snapshot.agora).toBe(rawData.meta.agora);
      expect(snapshot.chamados).toHaveLength(4);
      expect(
        snapshot.chamados.every((t) => t.solicitante_id === HELENA_ID),
      ).toBe(true);
    });

    it("gives the manager every ticket of the groups they manage", async () => {
      const snapshot = await settle(fetchSnapshot(RICARDO_ID));
      expect(snapshot.chamados).toHaveLength(rawData.chamados.length);
    });

    it("refuses someone who does not exist", async () => {
      const rejected = expect(fetchSnapshot("nobody")).rejects.toThrow(
        "Unknown user.",
      );
      await vi.advanceTimersByTimeAsync(1000);
      await rejected;
    });
  });

  describe("the operations", () => {
    it("assumeTicket takes a ticket from the queue after a delay", async () => {
      const ticket = queued();
      const request = assumeTicket(ticket.id, MARINA_ID);
      expect(ticket.responsavel_id).toBeNull();
      const events = await settle(request);
      expect(events.length).toBeGreaterThan(0);
      expect(ticket.responsavel_id).toBe(MARINA_ID);
    });

    it("sendMessage adds a message", async () => {
      const events = await settle(
        sendMessage({
          ticketId: marinasOpenTicket().id,
          authorId: MARINA_ID,
          text: "Olá",
          internal: false,
        }),
      );
      expect(events).toHaveLength(1);
      expect(getDb().mensagens.at(-1)?.texto).toBe("Olá");
    });

    it("changeStatus moves the ticket", async () => {
      const ticket = marinasOpenTicket();
      await settle(
        changeStatus({
          ticketId: ticket.id,
          to: Status.Resolved,
          reason: "Resolvido",
          userId: MARINA_ID,
        }),
      );
      expect(getDb().chamados.find((t) => t.id === ticket.id)?.status).toBe(
        Status.Resolved,
      );
    });

    it("reassignTicket hands a ticket to another consultant", async () => {
      const ticket = marinasOpenTicket();
      const other = rawData.usuarios.find(
        (u) =>
          u.id !== MARINA_ID &&
          u.grupo_id === ticket.grupo_id &&
          u.perfil === Profile.Consultant,
      )!;
      await settle(
        reassignTicket({
          ticketId: ticket.id,
          consultantId: other.id,
          managerId: RICARDO_ID,
        }),
      );
      expect(
        getDb().chamados.find((t) => t.id === ticket.id)?.responsavel_id,
      ).toBe(other.id);
    });

    it("passes the refusal of the server on to the caller", async () => {
      const rejected = expect(
        assumeTicket("no-such-ticket", MARINA_ID),
      ).rejects.toBeInstanceOf(ApiError);
      await vi.advanceTimersByTimeAsync(1000);
      await rejected;
    });
  });
});
