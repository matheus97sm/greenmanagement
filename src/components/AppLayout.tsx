import { useEffect } from "react";
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";
import { useAuth } from "../auth/auth-context";
import { startRealtime } from "../store/realtime";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    return startRealtime(userId);
  }, [userId]);

  if (!user) return null;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
