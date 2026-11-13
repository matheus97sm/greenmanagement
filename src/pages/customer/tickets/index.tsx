import { Stack, Text, Title } from "@mantine/core";
import { useAuth } from "@/auth/auth-context";

export function TicketsPage() {
  const { user } = useAuth();

  return (
    <Stack gap="xs">
      <Title order={2}>Meus chamados</Title>
      <Text c="dimmed">
        Olá, {user?.name}. A visão do cliente será construída em seguida.
      </Text>
    </Stack>
  );
}
