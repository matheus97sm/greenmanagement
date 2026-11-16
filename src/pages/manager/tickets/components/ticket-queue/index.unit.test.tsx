import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Language, setLanguage } from "@/i18n";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { RICARDO_ID, rawData } from "@/test-data";
import { TicketQueue } from ".";

const renders = vi.hoisted(() => ({ status: 0 }));

vi.mock("@/components/status-badge", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/components/status-badge")>();
  return {
    ...original,
    StatusBadge: (props: Parameters<typeof original.StatusBadge>[0]) => {
      renders.status += 1;
      return original.StatusBadge(props);
    },
  };
});

const NOW = Date.parse(rawData.meta.agora);
const byNumber = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero)!;

function renderQueue(
  props: {
    tickets?: typeof rawData.chamados;
    selected?: string[];
    lockedGroupId?: string;
    total?: number;
  } = {},
) {
  const tickets = props.tickets ?? [byNumber(10503), byNumber(10001)];
  const onOpen = vi.fn();
  const onToggle = vi.fn();
  const onToggleAll = vi.fn();
  const view = renderWithProviders(
    <TicketQueue
      tickets={tickets}
      total={props.total ?? tickets.length}
      selected={new Set(props.selected ?? [])}
      lockedGroupId={props.lockedGroupId}
      now={NOW}
      emptyText="Nada por aqui."
      onOpen={onOpen}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
    />,
    { userId: RICARDO_ID },
  );
  return { ...view, onOpen, onToggle, onToggleAll };
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("TicketQueue", () => {
  beforeEach(() => {
    loadStoreAs(RICARDO_ID);
  });

  it("shows the number, title, requester and who has the ticket", () => {
    const { container } = renderQueue();
    const ticket = byNumber(10503);
    const requester = rawData.usuarios.find(
      (person) => person.id === ticket.solicitante_id,
    )!;
    const owner = rawData.usuarios.find(
      (person) => person.id === ticket.responsavel_id,
    )!;
    const [row] = rowsOf(container);
    expect(row).toHaveTextContent(`#10503 · ${ticket.titulo}`);
    expect(row).toHaveTextContent(requester.nome);
    expect(row).toHaveTextContent(`com ${owner.nome}`);
  });

  it("shows the row texts in English", async () => {
    await setLanguage(Language.EnUs);
    const queued = rawData.chamados.find((ticket) => !ticket.responsavel_id)!;
    const { container } = renderQueue({ tickets: [queued] });
    expect(rowsOf(container)[0]).toHaveTextContent("unassigned");
    expect(screen.getByText("Select all")).toBeInTheDocument();
  });

  it("says when nobody has the ticket", () => {
    const queued = rawData.chamados.find((ticket) => !ticket.responsavel_id)!;
    const { container } = renderQueue({ tickets: [queued] });
    expect(rowsOf(container)[0]).toHaveTextContent("sem responsável");
  });

  it("shows priority, status and the SLA of each ticket", () => {
    const { container } = renderQueue();
    const [row] = rowsOf(container);
    expect(within(row).getByText("Crítica")).toBeInTheDocument();
    expect(within(row).getByText("Em atendimento")).toBeInTheDocument();
    expect(row).toHaveTextContent(/estourad/i);
  });

  it("opens the conversation from the ticket title without selecting it", async () => {
    const { onOpen, onToggle } = renderQueue();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Abrir conversa do chamado 10503",
      }),
    );
    expect(onOpen).toHaveBeenCalledWith(byNumber(10503).id);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("reports a click on a ticket's checkbox", async () => {
    const { onToggle } = renderQueue();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    );
    expect(onToggle).toHaveBeenCalledWith(byNumber(10503).id);
  });

  it("marks the selected tickets", () => {
    renderQueue({ selected: [byNumber(10503).id] });
    expect(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10001" }),
    ).not.toBeChecked();
  });

  it("asks to select everything when the box is ticked", async () => {
    const { onToggleAll } = renderQueue();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    );
    expect(onToggleAll).toHaveBeenCalledWith(
      [byNumber(10503).id, byNumber(10001).id],
      true,
    );
  });

  it("shows the select-all box as partly checked with some selected", () => {
    renderQueue({ selected: [byNumber(10503).id] });
    expect(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    ).toBePartiallyChecked();
  });

  it("shows the empty message when there is nothing to list", () => {
    renderQueue({ tickets: [] });
    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("says how many more tickets are left out of the list", () => {
    renderQueue({ total: 225 });
    expect(
      screen.getByText("Mostrando os 2 mais urgentes de 225."),
    ).toBeInTheDocument();
  });

  describe("one group at a time", () => {
    const infra = byNumber(10503);
    const apps = rawData.chamados.find(
      (ticket) => ticket.grupo_id !== infra.grupo_id,
    )!;
    const mixed = [infra, apps, byNumber(10001)];
    const box = (numero: number) =>
      screen.getByRole("checkbox", { name: `Selecionar chamado ${numero}` });

    it("leaves every ticket enabled while nothing is locked", () => {
      renderQueue({ tickets: mixed });
      for (const ticket of mixed) expect(box(ticket.numero)).toBeEnabled();
    });

    it("disables the tickets of the other group once a group is locked", () => {
      renderQueue({
        tickets: mixed,
        selected: [infra.id],
        lockedGroupId: infra.grupo_id,
      });
      expect(box(infra.numero)).toBeEnabled();
      expect(box(10001)).toBeEnabled();
      expect(box(apps.numero)).toBeDisabled();
    });

    it("dims the locked rows and keeps the conversation reachable", async () => {
      const { container, onOpen } = renderQueue({
        tickets: mixed,
        selected: [infra.id],
        lockedGroupId: infra.grupo_id,
      });
      const locked = rowsOf(container).filter((resolve) =>
        resolve.hasAttribute("data-locked"),
      );
      expect(locked).toHaveLength(1);
      expect(locked[0]).toHaveTextContent(`#${apps.numero}`);

      await userEvent.click(
        screen.getByRole("button", {
          name: `Abrir conversa do chamado ${apps.numero}`,
        }),
      );
      expect(onOpen).toHaveBeenCalledWith(apps.id);
    });

    it("shows the group of each ticket", () => {
      const { container } = renderQueue({ tickets: mixed });
      const names = rowsOf(container).map(
        (resolve) => resolve.textContent ?? "",
      );
      expect(names[0]).toContain("Infraestrutura");
      expect(names[1]).toContain("Aplicações");
    });

    it("selects all only for the group of the first ticket when nothing is locked", async () => {
      const { onToggleAll } = renderQueue({ tickets: mixed });
      expect(screen.getByText("só Infraestrutura")).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Selecionar todos" }),
      );
      expect(onToggleAll).toHaveBeenCalledWith(
        [infra.id, byNumber(10001).id],
        true,
      );
    });

    it("selects all inside the locked group even when it is not the first one", async () => {
      const second = rawData.chamados.filter(
        (ticket) => ticket.grupo_id === apps.grupo_id,
      );
      const list = [infra, second[0], second[1]];
      const { onToggleAll } = renderQueue({
        tickets: list,
        selected: [second[0].id],
        lockedGroupId: apps.grupo_id,
      });
      expect(screen.getByText("só Aplicações")).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Selecionar todos" }),
      );
      expect(onToggleAll).toHaveBeenCalledWith(
        [second[0].id, second[1].id],
        true,
      );
    });

    it("does not mention a group when the whole list belongs to one", () => {
      renderQueue();
      expect(screen.queryByText(/^só /)).not.toBeInTheDocument();
    });

    it("counts the select-all box as ticked once its group is fully selected", () => {
      renderQueue({
        tickets: mixed,
        selected: [infra.id, byNumber(10001).id],
        lockedGroupId: infra.grupo_id,
      });
      expect(
        screen.getByRole("checkbox", { name: "Selecionar todos" }),
      ).toBeChecked();
    });
  });

  describe("when one ticket is ticked", () => {
    const tickets = rawData.chamados.slice(0, 12);

    function Harness() {
      const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
      const toggle = useCallback(
        (id: string) =>
          setSelected((current) => {
            const next = new Set(current);
            if (!next.delete(id)) next.add(id);
            return next;
          }),
        [],
      );
      const open = useCallback(() => {}, []);
      const all = useCallback(() => {}, []);
      return (
        <TicketQueue
          tickets={tickets}
          total={tickets.length}
          selected={selected}
          lockedGroupId={undefined}
          now={NOW}
          emptyText="-"
          onOpen={open}
          onToggle={toggle}
          onToggleAll={all}
        />
      );
    }

    it("redraws only that row, not the whole list", async () => {
      renderWithProviders(<Harness />, { userId: RICARDO_ID });
      const drawn = screen.getAllByRole("checkbox", {
        name: /Selecionar chamado/,
      });
      expect(drawn.length).toBeGreaterThan(3);

      const before = renders.status;
      await userEvent.click(drawn[0]);
      const redrawn = renders.status - before;

      expect(drawn[0]).toBeChecked();
      expect(redrawn).toBeGreaterThan(0);
      expect(redrawn).toBeLessThanOrEqual(1);
    });
  });
});
