import { act, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { MARINA_ID, RICARDO_ID } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { useAuth } from "./auth-context";
import type { AuthContextValue } from "./auth-context";
import { SESSION_KEY } from "./session";
import { DEMO_PASSWORD } from "./users";

let auth: AuthContextValue;

function Probe({ expose }: { expose: (value: AuthContextValue) => void }) {
  const value = useAuth();
  useEffect(() => expose(value));
  return <p>{value.user ? value.user.name : "ninguém"}</p>;
}

function renderProbe(userId?: string) {
  return renderWithProviders(
    <Probe
      expose={(value) => {
        auth = value;
      }}
    />,
    { userId },
  );
}

describe("AuthProvider", () => {
  beforeEach(() => localStorage.clear());

  it("starts signed out when there is no saved session", () => {
    renderProbe();
    expect(screen.getByText("ninguém")).toBeInTheDocument();
  });

  it("starts signed in as the person of the saved session", () => {
    renderProbe(MARINA_ID);
    expect(screen.getByText("Marina Almeida")).toBeInTheDocument();
  });

  it("signs in with the right e-mail and password and remembers it", () => {
    renderProbe();
    let result: ReturnType<typeof auth.signIn> = null;
    act(() => {
      result = auth.signIn("ricardo.monteiro@suporte.example", DEMO_PASSWORD);
    });
    expect(result).toMatchObject({ id: RICARDO_ID });
    expect(screen.getByText("Ricardo Monteiro")).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBe(RICARDO_ID);
  });

  it("ignores case and spaces around the e-mail", () => {
    renderProbe();
    act(() => {
      auth.signIn("  Marina.Almeida@Suporte.Example ", DEMO_PASSWORD);
    });
    expect(screen.getByText("Marina Almeida")).toBeInTheDocument();
  });

  it("refuses a wrong password and stays signed out", () => {
    renderProbe();
    let result: ReturnType<typeof auth.signIn> = null;
    act(() => {
      result = auth.signIn("marina.almeida@suporte.example", "errada");
    });
    expect(result).toBeNull();
    expect(screen.getByText("ninguém")).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("refuses an unknown e-mail", () => {
    renderProbe();
    let result: ReturnType<typeof auth.signIn> = null;
    act(() => {
      result = auth.signIn("ninguem@suporte.example", DEMO_PASSWORD);
    });
    expect(result).toBeNull();
    expect(screen.getByText("ninguém")).toBeInTheDocument();
  });

  it("signs out and forgets the session", () => {
    renderProbe(MARINA_ID);
    act(() => auth.signOut());
    expect(screen.getByText("ninguém")).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
