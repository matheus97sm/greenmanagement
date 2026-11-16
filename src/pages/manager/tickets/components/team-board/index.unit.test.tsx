import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { consultantsOf, workloadByConsultant } from "@/domain/workload";
import { rawData } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { TeamBoard } from ".";

const NOW = Date.parse(rawData.meta.agora);
const workloads = workloadByConsultant(
  rawData.chamados,
  consultantsOf(
    rawData.usuarios,
    rawData.grupos.map((g) => g.id),
  ),
  NOW,
);
const idOf = (nome: string) =>
  rawData.usuarios.find((u) => u.nome === nome)!.id;
const infra = rawData.grupos.find((g) => g.nome === "Infraestrutura")!;

function renderBoard(
  props: { selectedId?: string; unassigned?: Record<string, number> } = {},
) {
  const onSelect = vi.fn();
  const onShowUnassigned = vi.fn();
  renderWithProviders(
    <TeamBoard
      groups={rawData.grupos}
      workloads={workloads}
      unassignedByGroup={props.unassigned ?? { [infra.id]: 35 }}
      selectedId={props.selectedId}
      onSelect={onSelect}
      onShowUnassigned={onShowUnassigned}
    />,
  );
  return { onSelect, onShowUnassigned };
}

const rowOf = (nome: string) =>
  screen.getByText(nome).closest("button") as HTMLElement;

describe("TeamBoard", () => {
  it("shows the twelve consultants split by group", () => {
    renderBoard();
    expect(screen.getByText("Infraestrutura")).toBeInTheDocument();
    expect(screen.getByText("Aplicações")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(12);
  });

  it("shows how many tickets each consultant carries", () => {
    renderBoard();
    expect(within(rowOf("Marina Almeida")).getByText("42")).toBeInTheDocument();
    expect(
      within(rowOf("Thiago Nascimento")).getByText("75"),
    ).toBeInTheDocument();
  });

  it("flags who carries far more than the group average", () => {
    renderBoard();
    expect(
      within(rowOf("Thiago Nascimento")).getByText("Sobrecarregado"),
    ).toBeInTheDocument();
    expect(
      within(rowOf("Rafael Costa")).queryByText("Sobrecarregado"),
    ).not.toBeInTheDocument();
  });

  it("flags who has nothing assigned", () => {
    renderBoard();
    expect(
      within(rowOf("Leandro Alves")).getByText("Sem chamados"),
    ).toBeInTheDocument();
  });

  it("lists the idle consultant before the rest of the group", () => {
    renderBoard();
    const names = screen
      .getAllByRole("button", { pressed: false })
      .map((b) => b.textContent ?? "");
    const apps = names.filter((n) =>
      ["Beatriz", "Felipe", "Fernanda", "Gustavo", "Larissa", "Leandro"].some(
        (first) => n.startsWith(first),
      ),
    );
    expect(apps[0]).toContain("Leandro Alves");
  });

  it("shows the breached and at-risk counts of a consultant", () => {
    renderBoard();
    const marina = workloads.find(
      (w) => w.consultant.nome === "Marina Almeida",
    )!;
    expect(marina.breached).toBeGreaterThan(0);
    expect(
      within(rowOf("Marina Almeida")).getByText(
        new RegExp(`${marina.breached} estourad`),
      ),
    ).toBeInTheDocument();
  });

  it("tells which consultant was picked", async () => {
    const { onSelect } = renderBoard({ selectedId: idOf("Marina Almeida") });
    expect(rowOf("Marina Almeida")).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(rowOf("Rafael Costa"));
    expect(onSelect).toHaveBeenCalledWith(idOf("Rafael Costa"));
  });

  it("links to the group queue when it has tickets nobody took", async () => {
    const { onShowUnassigned } = renderBoard();
    await userEvent.click(
      screen.getByRole("button", { name: "35 sem responsável" }),
    );
    expect(onShowUnassigned).toHaveBeenCalledWith(infra.id);
    expect(screen.getByText("Fila vazia")).toBeInTheDocument();
  });
});
