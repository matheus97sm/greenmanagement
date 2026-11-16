import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startRealtime } from "@/store/realtime";
import { HELENA_ID, MARINA_ID } from "@/test-data";
import { renderRoutes } from "@/test-utils";
import { AppLayout } from ".";

vi.mock("@/store/realtime", () => ({ startRealtime: vi.fn() }));

const routes = [
  {
    path: "/",
    Component: AppLayout,
    children: [{ index: true, element: <p>Conteúdo da página</p> }],
  },
];

describe("AppLayout", () => {
  const stop = vi.fn();

  beforeEach(() => {
    stop.mockReset();
    vi.mocked(startRealtime).mockReset().mockReturnValue(stop);
  });

  it("shows the header and the page inside it", () => {
    renderRoutes(routes, { userId: MARINA_ID });
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Marina Almeida")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo da página")).toBeInTheDocument();
  });

  it("starts the live connection for the signed-in user", () => {
    renderRoutes(routes, { userId: MARINA_ID });
    expect(startRealtime).toHaveBeenCalledTimes(1);
    expect(startRealtime).toHaveBeenCalledWith(MARINA_ID);
  });

  it("starts it for whoever is signed in, not always the same person", () => {
    renderRoutes(routes, { userId: HELENA_ID });
    expect(startRealtime).toHaveBeenCalledWith(HELENA_ID);
  });

  it("stops the connection when the layout goes away", () => {
    const { unmount } = renderRoutes(routes, { userId: MARINA_ID });
    expect(stop).not.toHaveBeenCalled();
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("shows nothing and connects to nothing without a signed-in user", () => {
    renderRoutes(routes);
    expect(startRealtime).not.toHaveBeenCalled();
    expect(screen.queryByText("Conteúdo da página")).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
