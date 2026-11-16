import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { USERS } from "@/auth/users";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { TicketSummary } from ".";

const me = USERS.find((u) => u.id === HELENA_ID)!;
const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

function renderSummary(numero: number) {
  return renderWithProviders(
    <TicketSummary ticketId={idOf(numero)} me={me} />,
    { userId: HELENA_ID },
  );
}

describe("TicketSummary", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
  });

  it("says in plain words what is going on and who is looking after it", () => {
    renderSummary(10611);
    expect(screen.getByText("Em atendimento")).toBeInTheDocument();
    expect(
      screen.getByText("Marina Almeida está cuidando do seu chamado."),
    ).toBeInTheDocument();
    expect(screen.getByText("Quem está cuidando")).toBeInTheDocument();
  });

  it("makes clear when the team is waiting for her", () => {
    renderSummary(10613);
    expect(screen.getByText("Aguardando você")).toBeInTheDocument();
    expect(
      screen.getByText(/precisa de uma resposta sua para continuar/),
    ).toBeInTheDocument();
  });

  it("says that nobody has taken a new ticket, and when to expect the first answer", () => {
    renderSummary(10614);
    expect(screen.getByText("Ainda ninguém")).toBeInTheDocument();
    expect(
      screen.getByText(/Primeira resposta prevista até/),
    ).toBeInTheDocument();
  });

  it("admits when the promised date has already passed", () => {
    renderSummary(10614);
    expect(screen.getByText(/esse prazo já passou/)).toBeInTheDocument();
  });

  it("promises nothing while the team waits for her", () => {
    renderSummary(10613);
    expect(screen.getByText("Sem previsão no momento")).toBeInTheDocument();
  });

  it("shows the dates in her own time zone", () => {
    renderSummary(10613);
    const updated = screen.getByText("Última atualização").parentElement!;
    expect(within(updated).getByText(/02\/11\/26.*02:10/)).toBeInTheDocument();
    expect(within(updated).queryByText(/23:10/)).not.toBeInTheDocument();
  });

  it("lists what already happened, without the reasons the team wrote", () => {
    renderSummary(10612);
    expect(screen.getByText("O que já aconteceu")).toBeInTheDocument();
    expect(screen.getByText("Chamado aberto")).toBeInTheDocument();
    expect(
      screen.getByText("Thiago Nascimento assumiu o chamado"),
    ).toBeInTheDocument();
    expect(screen.getByText("Chamado encerrado")).toBeInTheDocument();
    expect(screen.queryByText(/Pegando da fila/)).not.toBeInTheDocument();
    expect(screen.queryByText(/automaticamente/)).not.toBeInTheDocument();
  });

  it("offers the way back for a closed ticket", () => {
    renderSummary(10612);
    expect(screen.getByText(/você pode reabri-lo/)).toBeInTheDocument();
  });

  it("never shows the category, the group or the priority", () => {
    const { container } = renderSummary(10611);
    expect(container.textContent).not.toMatch(
      /Infraestrutura|Aplicações|Prioridade|Rede e VPN|SLA/,
    );
  });

  it("shows nothing for a ticket that is not in the store", () => {
    renderWithProviders(<TicketSummary ticketId="unknown" me={me} />, {
      userId: HELENA_ID,
    });
    expect(screen.queryByText("Última atualização")).not.toBeInTheDocument();
    expect(screen.queryByText("O que já aconteceu")).not.toBeInTheDocument();
  });
});
