import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SimilarTicket } from "@/domain/similarity";
import { rawData } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { SimilarTickets } from ".";

const hit = (numero: number): SimilarTicket => ({
  ticket: rawData.chamados.find((t) => t.numero === numero)!,
  score: 1,
});

function renderHits(hits: SimilarTicket[]) {
  const onOpen = vi.fn();
  const view = renderWithProviders(
    <SimilarTickets hits={hits} onOpen={onOpen} />,
  );
  return { ...view, onOpen };
}

describe("SimilarTickets", () => {
  it("shows nothing when nothing looks alike", () => {
    renderHits([]);
    expect(
      screen.queryByText("Você já abriu algo parecido"),
    ).not.toBeInTheDocument();
  });

  it("lists the tickets that look alike, with where each one stands", () => {
    renderHits([hit(10612), hit(10614)]);
    expect(screen.getByText("Você já abriu algo parecido")).toBeInTheDocument();
    expect(
      screen.getByText("#10612 · VPN não liga a partir de casa"),
    ).toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(screen.getByText("Recebido")).toBeInTheDocument();
  });

  it("suggests reopening when one of them is finished", () => {
    renderHits([hit(10612)]);
    expect(
      screen.getByText(/pode reabrir esse chamado em vez de abrir outro/),
    ).toBeInTheDocument();
  });

  it("suggests following a ticket that is still open", () => {
    renderHits([hit(10614)]);
    expect(
      screen.getByText(/acompanhe por lá em vez de abrir outro chamado/),
    ).toBeInTheDocument();
  });

  it("opens the ticket that was picked", async () => {
    const { onOpen } = renderHits([hit(10612), hit(10614)]);
    const buttons = screen.getAllByRole("button", {
      name: "Abrir esse chamado",
    });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    expect(onOpen).toHaveBeenCalledWith(hit(10612).ticket.id);
  });
});
