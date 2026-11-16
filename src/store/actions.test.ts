import { notifications } from "@mantine/notifications";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventType, Priority, Status } from "@/domain/enums";
import type { DomainEvent, Ticket } from "@/domain/types";
import * as api from "@/server/api";
import { rawData } from "@/test-data";
import {
  changeStatus,
  createTicket,
  markRead,
  reassignTickets,
  reopenTicket,
  sendMessage,
  takeTicket,
} from "./actions";
import { ticketsStore } from "./ticketsStore";

vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }));

vi.mock("@/server/api", () => ({
  assumeTicket: vi.fn(),
  openTicket: vi.fn(),
  reopenTicket: vi.fn(),
  reassignTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

const event = (id: string): DomainEvent => ({
  id,
  tipo: EventType.TicketAssigned,
  ocorrido_em: "2026-11-03T13:00:00Z",
  payload: { chamado_id: id, consultor_id: "c" },
});

const shown = () =>
  vi.mocked(notifications.show).mock.calls.map((call) => call[0]);

describe("store actions", () => {
  beforeEach(() => {
    vi.mocked(notifications.show).mockReset();
    for (const mock of Object.values(vi.mocked(api))) {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    }
    vi.spyOn(ticketsStore, "applyEvent").mockReturnValue(true);
  });

  describe("takeTicket, sendMessage and changeStatus", () => {
    it("apply the events the server answers with and report success", async () => {
      vi.mocked(api.assumeTicket).mockResolvedValue([event("a"), event("b")]);
      expect(await takeTicket("t1", "c1")).toBe(true);
      expect(api.assumeTicket).toHaveBeenCalledWith("t1", "c1");
      expect(ticketsStore.applyEvent).toHaveBeenCalledTimes(2);
      expect(notifications.show).not.toHaveBeenCalled();
    });

    it("send a message with the text and the note flag", async () => {
      vi.mocked(api.sendMessage).mockResolvedValue([event("m")]);
      const input = {
        ticketId: "t1",
        authorId: "c1",
        text: "oi",
        internal: true,
      };
      expect(await sendMessage(input)).toBe(true);
      expect(api.sendMessage).toHaveBeenCalledWith(input);
    });

    it("change a status with its reason", async () => {
      vi.mocked(api.changeStatus).mockResolvedValue([event("s")]);
      const input = {
        ticketId: "t1",
        to: Status.Resolved,
        reason: "feito",
        userId: "c1",
      };
      expect(await changeStatus(input)).toBe(true);
      expect(api.changeStatus).toHaveBeenCalledWith(input);
    });

    it("show the server's message when it refuses, and report failure", async () => {
      vi.mocked(api.assumeTicket).mockRejectedValue(
        new Error("Este chamado já foi pego por Rafael."),
      );
      expect(await takeTicket("t1", "c1")).toBe(false);
      expect(shown()).toEqual([
        expect.objectContaining({
          color: "red",
          title: "Não foi possível concluir",
          message: "Este chamado já foi pego por Rafael.",
        }),
      ]);
      expect(ticketsStore.applyEvent).not.toHaveBeenCalled();
    });

    it("show a generic message when the failure is not an Error", async () => {
      vi.mocked(api.sendMessage).mockRejectedValue("boom");
      expect(
        await sendMessage({
          ticketId: "t",
          authorId: "a",
          text: "x",
          internal: false,
        }),
      ).toBe(false);
      expect(shown()[0]).toMatchObject({ message: "Erro inesperado." });
    });
  });

  describe("reassignTickets", () => {
    const input = (ids: string[]) => ({
      ticketIds: ids,
      consultantId: "c2",
      managerId: "m1",
    });

    it("sends every ticket to the consultant, with the manager as the author", async () => {
      vi.mocked(api.reassignTicket).mockResolvedValue([event("x")]);
      await reassignTickets(input(["t1", "t2"]));
      expect(api.reassignTicket).toHaveBeenCalledWith({
        ticketId: "t1",
        consultantId: "c2",
        managerId: "m1",
      });
      expect(api.reassignTicket).toHaveBeenCalledWith({
        ticketId: "t2",
        consultantId: "c2",
        managerId: "m1",
      });
    });

    it("counts them all as done and tells so once, in the singular for one", async () => {
      vi.mocked(api.reassignTicket).mockResolvedValue([event("x")]);
      expect(await reassignTickets(input(["t1"]))).toEqual({
        done: 1,
        failed: 0,
      });
      expect(shown()).toEqual([
        expect.objectContaining({
          color: "green",
          message: "1 chamado redistribuído.",
        }),
      ]);
    });

    it("uses the plural for several", async () => {
      vi.mocked(api.reassignTicket).mockResolvedValue([event("x")]);
      expect(await reassignTickets(input(["a", "b", "c"]))).toEqual({
        done: 3,
        failed: 0,
      });
      expect(shown()[0]).toMatchObject({
        message: "3 chamados redistribuídos.",
      });
    });

    it("applies the events of each ticket that went through", async () => {
      vi.mocked(api.reassignTicket)
        .mockResolvedValueOnce([event("a"), event("b")])
        .mockResolvedValueOnce([event("c")]);
      await reassignTickets(input(["t1", "t2"]));
      expect(ticketsStore.applyEvent).toHaveBeenCalledTimes(3);
    });

    it("keeps going when some fail, and says how many and why", async () => {
      vi.mocked(api.reassignTicket)
        .mockResolvedValueOnce([event("a")])
        .mockRejectedValueOnce(new Error("Este consultor é de outro grupo."))
        .mockRejectedValueOnce(new Error("Outro erro."));
      expect(await reassignTickets(input(["t1", "t2", "t3"]))).toEqual({
        done: 1,
        failed: 2,
      });
      expect(shown()).toEqual([
        expect.objectContaining({ color: "green" }),
        expect.objectContaining({
          color: "red",
          title: "2 não foram redistribuídos",
          message: "Este consultor é de outro grupo.",
        }),
      ]);
    });

    it("uses the singular for a single failure", async () => {
      vi.mocked(api.reassignTicket).mockRejectedValue(new Error("Não."));
      expect(await reassignTickets(input(["t1"]))).toEqual({
        done: 0,
        failed: 1,
      });
      expect(shown()).toEqual([
        expect.objectContaining({
          color: "red",
          title: "1 não foi redistribuído",
        }),
      ]);
    });

    it("tells nothing is done when none went through", async () => {
      vi.mocked(api.reassignTicket).mockRejectedValue("x");
      await reassignTickets(input(["t1", "t2"]));
      expect(
        shown().some((notificationData) => notificationData.color === "green"),
      ).toBe(false);
      expect(shown()[0]).toMatchObject({ message: "Erro inesperado." });
    });
  });

  describe("markRead", () => {
    it("marks the ticket as read in the store", () => {
      const spy = vi.spyOn(ticketsStore, "markRead");
      markRead("t9");
      expect(spy).toHaveBeenCalledWith("t9");
    });
  });

  describe("createTicket", () => {
    const input = {
      requesterId: "h",
      categoryId: "c",
      priority: Priority.Medium,
      title: "Impressora",
      description: "Sem toner",
    };
    const opened = (id: string): DomainEvent => ({
      id: `e-${id}`,
      tipo: EventType.TicketOpened,
      ocorrido_em: "2026-11-03T13:00:00Z",
      payload: { ...(rawData.chamados[0] as Ticket), id },
    });

    it("applies the events and gives back the id of the new ticket", async () => {
      vi.mocked(api.openTicket).mockResolvedValue([opened("new-1")]);
      expect(await createTicket(input)).toBe("new-1");
      expect(api.openTicket).toHaveBeenCalledWith(input);
      expect(ticketsStore.applyEvent).toHaveBeenCalledTimes(1);
      expect(notifications.show).not.toHaveBeenCalled();
    });

    it("finds the new ticket among other events", async () => {
      vi.mocked(api.openTicket).mockResolvedValue([event("a"), opened("n2")]);
      expect(await createTicket(input)).toBe("n2");
    });

    it("gives back nothing when the server answers without a new ticket", async () => {
      vi.mocked(api.openTicket).mockResolvedValue([event("a")]);
      expect(await createTicket(input)).toBeNull();
    });

    it("explains why it could not, and gives back nothing", async () => {
      vi.mocked(api.openTicket).mockRejectedValue(
        new Error("Informe o título e a descrição."),
      );
      expect(await createTicket(input)).toBeNull();
      expect(shown()).toEqual([
        expect.objectContaining({
          color: "red",
          title: "Não foi possível abrir o chamado",
          message: "Informe o título e a descrição.",
        }),
      ]);
    });

    it("uses a generic message when the failure is not an Error", async () => {
      vi.mocked(api.openTicket).mockRejectedValue("boom");
      await createTicket(input);
      expect(shown()[0]).toMatchObject({ message: "Erro inesperado." });
    });
  });

  describe("reopenTicket", () => {
    const input = { ticketId: "t1", customerId: "h", reason: "Voltou" };

    it("applies the events of the reopening and reports success", async () => {
      vi.mocked(api.reopenTicket).mockResolvedValue([event("a"), event("b")]);
      expect(await reopenTicket(input)).toBe(true);
      expect(api.reopenTicket).toHaveBeenCalledWith(input);
      expect(ticketsStore.applyEvent).toHaveBeenCalledTimes(2);
    });

    it("shows what the server said when it refuses", async () => {
      vi.mocked(api.reopenTicket).mockRejectedValue(
        new Error("Conte o que continua errado."),
      );
      expect(await reopenTicket(input)).toBe(false);
      expect(shown()[0]).toMatchObject({
        color: "red",
        message: "Conte o que continua errado.",
      });
    });
  });
});
