import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { RouteObject } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { SESSION_KEY } from "@/auth/session";
import type { Snapshot } from "@/domain/types";
import { initDb } from "@/server/db";
import { scopedSnapshot } from "@/server/visibility";
import { ticketsStore } from "@/store/ticketsStore";
import { rawData } from "./test-data";

export interface RenderOptions {
  userId?: string;
  route?: string;
}

export function renderRoutes(
  routes: RouteObject[],
  { userId, route = "/" }: RenderOptions = {},
) {
  localStorage.clear();
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const view = render(
    <MantineProvider env="test">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MantineProvider>,
  );
  return { ...view, router };
}

export function renderWithProviders(
  element: ReactElement,
  options: RenderOptions & { path?: string } = {},
) {
  const { path = "*", ...rest } = options;
  return renderRoutes([{ path, element: element }], rest);
}

export function loadStoreAs(
  userId: string,
  tweak?: (snapshot: Snapshot) => void,
): Snapshot {
  const database = initDb(rawData);
  const viewer = database.usuarios.find((person) => person.id === userId);
  if (!viewer) throw new Error(`Unknown user ${userId}`);
  const snapshot = scopedSnapshot(database, viewer);
  tweak?.(snapshot);
  ticketsStore.reset();
  ticketsStore.loadSnapshot(snapshot);
  return snapshot;
}
