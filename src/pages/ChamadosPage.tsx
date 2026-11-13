import { Stack, Text, Title } from "@mantine/core";
import { useAuth } from "../auth/auth-context";

export function ChamadosPage() {
  const { user } = useAuth();

  return (
    <Stack gap="xs">
      <Title order={2}>Chamados</Title>
      <Text c="dimmed">
        Olá, {user?.name}. A área de chamados será construída aqui.
      </Text>
    </Stack>
  );
}
