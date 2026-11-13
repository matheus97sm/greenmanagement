import { redirect } from "react-router";
import type { RouteObject } from "react-router";
import { getSessionUser } from "./auth/session";
import type { User } from "./auth/users";
import { AppLayout } from "./components/AppLayout";
import { TicketsPage as ConsultantTicketsPage } from "./pages/consultant/tickets";
import { TicketsPage as CustomerTicketsPage } from "./pages/customer/tickets";
import { LoginPage } from "./pages/login";
import { TicketsPage as ManagerTicketsPage } from "./pages/manager/tickets";
import { homePath } from "./paths";
import { Role } from "./auth/enums";

function requireUser(): User {
  const user = getSessionUser();
  if (!user) throw redirect("/");
  return user;
}

const authenticatedLoader = () => {
  requireUser();
  return null;
};

const roleLoader = (role: Role) => () => {
  const user = requireUser();
  if (user.role !== role) throw redirect(homePath(user.role));
  return null;
};

const loginLoader = () => {
  const user = getSessionUser();
  if (user) throw redirect(homePath(user.role));
  return null;
};

const fallbackLoader = () => {
  const user = getSessionUser();
  throw redirect(user ? homePath(user.role) : "/");
};

function profileRoute(role: Role, tickets: RouteObject): RouteObject {
  return {
    path: role,
    loader: roleLoader(role),
    children: [
      { index: true, loader: () => redirect(homePath(role)) },
      tickets,
    ],
  };
}

export const routes: RouteObject[] = [
  { path: "/", loader: loginLoader, Component: LoginPage },
  {
    loader: authenticatedLoader,
    Component: AppLayout,
    children: [
      profileRoute(Role.Consultant, {
        path: "tickets/:id?",
        Component: ConsultantTicketsPage,
      }),
      profileRoute(Role.Manager, {
        path: "tickets",
        Component: ManagerTicketsPage,
      }),
      profileRoute(Role.Customer, {
        path: "tickets",
        Component: CustomerTicketsPage,
      }),
    ],
  },
  { path: "*", loader: fallbackLoader },
];
