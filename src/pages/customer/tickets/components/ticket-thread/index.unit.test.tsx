import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { USERS } from "@/auth/users";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { PAGE_SIZE } from "./constants";
import { TicketThread } from ".";

const me = USERS.find((u) => u.id === HELENA_ID)!;
const ticket = rawData.chamados.find((t) => t.numero === 10611)!;

function renderThread(since: string) {
  return renderWithProviders(
    <TicketThread ticketId={ticket.id} me={me} since={since} />,
    { userId: HELENA_ID },
  );
}

describe("TicketThread", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
  });

  it("shows what she wrote and what the team answered", () => {
    renderThread("2026-12-01T00:00:00Z");
    expect(screen.getByText(ticket.descricao)).toBeInTheDocument();
    expect(
      screen.getByText("Confirmado o problema. Estou tratando."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Já está a funcionar, obrigada."),
    ).toBeInTheDocument();
  });

  it("calls her own messages Você and names the team", () => {
    renderThread("2026-12-01T00:00:00Z");
    expect(screen.getAllByText("Você").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Marina Almeida").length).toBeGreaterThan(0);
    expect(screen.queryByText("Helena Fernandes")).not.toBeInTheDocument();
  });

  it("tells the team from the customer with a badge on each message", () => {
    renderThread("2026-12-01T00:00:00Z");
    expect(screen.getAllByText("Consultor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cliente").length).toBeGreaterThan(0);
  });

  it("marks as new only the team messages after the last visit", () => {
    renderThread("2026-10-20T00:00:00Z");
    expect(screen.getAllByText("Novo")).toHaveLength(2);
  });

  it("marks nothing as new when she has seen everything", () => {
    renderThread("2026-12-01T00:00:00Z");
    expect(screen.queryByText("Novo")).not.toBeInTheDocument();
  });

  it("shows the dates in her own time zone, summer time included", () => {
    renderThread("2026-12-01T00:00:00Z");
    expect(screen.getAllByText(/22\/10\/26.*08:37/).length).toBeGreaterThan(0);
  });

  it("never shows an internal note", () => {
    renderWithProviders(
      <TicketThread
        ticketId={rawData.chamados.find((t) => t.numero === 10612)!.id}
        me={me}
        since="2026-12-01T00:00:00Z"
      />,
      { userId: HELENA_ID },
    );
    expect(screen.queryByText("Nota interna")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Mesmo problema do chamado da semana passada/),
    ).not.toBeInTheDocument();
  });

  describe("with a very long conversation", () => {
    beforeEach(() => {
      loadStoreAs(HELENA_ID, (snapshot) => {
        for (let i = 0; i < 130; i += 1) {
          snapshot.mensagens.push({
            id: `long-${i}`,
            chamado_id: ticket.id,
            criada_em: new Date(
              Date.parse("2026-10-23T00:00:00Z") + i * 60_000,
            ).toISOString(),
            autor_id: ticket.responsavel_id!,
            texto: `Mensagem longa ${i}`,
            interna: false,
          });
        }
      });
    });

    it("shows only the latest messages and says how many are left out", () => {
      renderThread("2026-12-01T00:00:00Z");
      const total = 1 + 5 + 130;
      expect(
        screen.getByRole("button", {
          name: `Mostrar mensagens anteriores (${total - PAGE_SIZE})`,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Mensagem longa 129")).toBeInTheDocument();
      expect(screen.queryByText(ticket.descricao)).not.toBeInTheDocument();
    });

    it("shows earlier ones on demand", async () => {
      renderThread("2026-12-01T00:00:00Z");
      await userEvent.click(
        screen.getByRole("button", { name: /Mostrar mensagens anteriores/ }),
      );
      expect(screen.getByText(ticket.descricao)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Mostrar mensagens anteriores/ }),
      ).not.toBeInTheDocument();
    });
  });
});
