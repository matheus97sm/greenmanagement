import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { Priority } from "@/domain/enums";
import { createTicket } from "@/store/actions";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { NewTicketModal } from ".";

vi.mock("@/store/actions", () => ({
  createTicket: vi.fn(),
  reopenTicket: vi.fn(),
  sendMessage: vi.fn(),
}));

const currentUser = USERS.find((user) => user.id === HELENA_ID)!;
const vpn = rawData.categorias.find(
  (category) => category.nome === "Rede e VPN",
)!;

function renderModal() {
  const onClose = vi.fn();
  const onOpenTicket = vi.fn();
  renderWithProviders(
    <NewTicketModal
      currentUser={currentUser}
      onClose={onClose}
      onOpenTicket={onOpenTicket}
    />,
    { userId: HELENA_ID },
  );
  return { onClose, onOpenTicket };
}

const summary = () => screen.getByLabelText(/Resumo do problema/);
const description = () => screen.getByLabelText(/O que está acontecendo/);
const submit = () => screen.getByRole("button", { name: "Abrir chamado" });

async function pickTopic(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getAllByLabelText(/Sobre o quê/)[0]);
  await user.click(await screen.findByRole("option", { name }));
}

describe("NewTicketModal", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
    vi.mocked(createTicket).mockReset().mockResolvedValue("new-ticket-id");
  });

  it("asks only what she can answer, in plain words", () => {
    renderModal();
    expect(screen.getByText("Novo chamado")).toBeInTheDocument();
    expect(summary()).toBeInTheDocument();
    expect(description()).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Sobre o quê/)[0]).toBeInTheDocument();
    expect(
      screen.getByText("Quanto isso atrapalha o seu trabalho?"),
    ).toBeInTheDocument();
  });

  it("never mentions category, group or priority", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).not.toMatch(
      /categoria|grupo|prioridade|SLA|Infraestrutura|Aplicações/i,
    );
  });

  it("starts with the middle answer to how much it disrupts her work", () => {
    renderModal();
    expect(
      screen.getByRole("radio", { name: "Atrapalha, mas consigo trabalhar" }),
    ).toBeChecked();
  });

  it("does not open the ticket until everything is filled in", async () => {
    const user = userEvent.setup();
    renderModal();
    expect(submit()).toBeDisabled();
    await user.type(summary(), "Impressora sem toner");
    await user.type(description(), "Acabou o toner");
    expect(submit()).toBeDisabled();
    await pickTopic(user, "Estação de trabalho");
    expect(submit()).toBeEnabled();
  });

  it("opens the ticket with her words and the priority her answer stands for", async () => {
    const user = userEvent.setup();
    const { onOpenTicket } = renderModal();
    await user.type(summary(), "Impressora sem toner");
    await user.type(description(), "Acabou o toner da impressora do 2º andar");
    await pickTopic(user, "Rede e VPN");
    await user.click(
      screen.getByRole("radio", { name: "Não consigo trabalhar" }),
    );
    await user.click(submit());

    await waitFor(() =>
      expect(createTicket).toHaveBeenCalledWith({
        requesterId: HELENA_ID,
        categoryId: vpn.id,
        priority: Priority.High,
        title: "Impressora sem toner",
        description: "Acabou o toner da impressora do 2º andar",
      }),
    );
    await waitFor(() =>
      expect(onOpenTicket).toHaveBeenCalledWith("new-ticket-id"),
    );
  });

  it("stays open when the ticket could not be created", async () => {
    vi.mocked(createTicket).mockResolvedValue(null);
    const user = userEvent.setup();
    const { onOpenTicket } = renderModal();
    await user.type(summary(), "Impressora sem toner");
    await user.type(description(), "Acabou");
    await pickTopic(user, "ERP");
    await user.click(submit());

    await waitFor(() => expect(createTicket).toHaveBeenCalled());
    expect(onOpenTicket).not.toHaveBeenCalled();
    expect(summary()).toHaveValue("Impressora sem toner");
  });

  it("closes without creating anything when she cancels", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(createTicket).not.toHaveBeenCalled();
  });

  describe("when she describes a problem she already reported", () => {
    it("points to the closed ticket and to the one still open, as she types", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(summary(), "VPN não liga em casa");

      expect(
        await screen.findByText("Você já abriu algo parecido"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("#10612 · VPN não liga a partir de casa"),
      ).toBeInTheDocument();
      expect(screen.getByText(/#10614 ·/)).toBeInTheDocument();
    });

    it("lets her go to the old ticket instead of opening a new one", async () => {
      const user = userEvent.setup();
      const { onOpenTicket } = renderModal();
      await user.type(summary(), "VPN não liga em casa");
      const buttons = await screen.findAllByRole("button", {
        name: "Abrir esse chamado",
      });
      await user.click(buttons[0]);

      expect(onOpenTicket).toHaveBeenCalledTimes(1);
      expect(createTicket).not.toHaveBeenCalled();
    });

    it("says nothing for a problem she has not reported before", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(summary(), "Impressora sem toner");
      expect(
        screen.queryByText("Você já abriu algo parecido"),
      ).not.toBeInTheDocument();
    });
  });
});
