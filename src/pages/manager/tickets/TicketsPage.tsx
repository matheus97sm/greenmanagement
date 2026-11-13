import { Stack, Text, Title } from "@mantine/core";
import { useAuth } from "../../../auth/auth-context";

export function TicketsPage() {
  const { user } = useAuth();

  return (
    <Stack gap="xs">
      <Title order={2}>Equipe e chamados</Title>
      <Text c="dimmed">
        Olá, {user?.name}. A visão do gestor será construída em seguida.
      </Text>
    </Stack>
  );
}
