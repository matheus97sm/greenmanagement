import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DEMO_PASSWORD, USERS } from "@/auth/users";
import { MARINA_ID } from "@/test-data";
import { renderRoutes } from "@/test-utils";
import { LoginPage } from ".";

const routes = [
  { path: "/", element: <LoginPage /> },
  { path: "/consultant/tickets", element: <p>consultant home</p> },
  { path: "/manager/tickets", element: <p>manager home</p> },
  { path: "/customer/tickets", element: <p>customer home</p> },
];

const email = () => screen.getByLabelText(/^E-mail/);
const password = () => screen.getByLabelText(/^Senha/);
const submit = () => screen.getByRole("button", { name: "Entrar" });
const demo = (role: string) => USERS.find((u) => u.role === role)!;

describe("login page", () => {
  it("asks for e-mail and password", () => {
    renderRoutes(routes);
    expect(email()).toHaveValue("");
    expect(password()).toHaveValue("");
    expect(submit()).toBeInTheDocument();
  });

  it("lists the demo users and the shared password", () => {
    renderRoutes(routes);
    for (const user of USERS) {
      expect(screen.getByText(new RegExp(user.name))).toBeInTheDocument();
    }
    expect(
      screen.getByText(`Senha de todos: ${DEMO_PASSWORD}`),
    ).toBeInTheDocument();
  });

  it("rejects a wrong password and stays on the page", async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes);
    await user.type(email(), demo("consultant").email);
    await user.type(password(), "errada");
    await user.click(submit());

    expect(screen.getByText("E-mail ou senha inválidos.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(localStorage.length).toBe(0);
  });

  it("rejects an unknown e-mail", async () => {
    const user = userEvent.setup();
    renderRoutes(routes);
    await user.type(email(), "ninguem@suporte.example");
    await user.type(password(), DEMO_PASSWORD);
    await user.click(submit());
    expect(screen.getByText("E-mail ou senha inválidos.")).toBeInTheDocument();
  });

  it("signs the consultant in and sends her to her own page", async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes);
    await user.type(email(), demo("consultant").email);
    await user.type(password(), DEMO_PASSWORD);
    await user.click(submit());

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/consultant/tickets"),
    );
    expect(screen.getByText("consultant home")).toBeInTheDocument();
    expect(localStorage.getItem("greenmanagement.session")).toBe(MARINA_ID);
  });

  it("fills the form when a demo user is clicked, and sends each profile home", async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes);
    const manager = demo("manager");

    await user.click(screen.getByText(new RegExp(manager.name)));
    expect(email()).toHaveValue(manager.email);
    expect(password()).toHaveValue(DEMO_PASSWORD);

    await user.click(submit());
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/manager/tickets"),
    );
  });

  it("clears an earlier error when a demo user is picked", async () => {
    const user = userEvent.setup();
    renderRoutes(routes);
    await user.type(email(), "x@y.z");
    await user.type(password(), "errada");
    await user.click(submit());
    expect(screen.getByText("E-mail ou senha inválidos.")).toBeInTheDocument();

    await user.click(screen.getByText(new RegExp(demo("customer").name)));
    expect(
      screen.queryByText("E-mail ou senha inválidos."),
    ).not.toBeInTheDocument();
  });
});
