import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconAlertCircle, IconLeaf } from "@tabler/icons-react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/auth-context";
import { DEMO_PASSWORD, ROLE_LABEL, USERS } from "../auth/users";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (user) return <Navigate to="/chamados" replace />;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signIn(email, password)) {
      navigate("/chamados", { replace: true });
    } else {
      setError(true);
    }
  };

  return (
    <Container size={420} py={80}>
      <Stack align="center" gap="xs" mb="lg">
        <IconLeaf size={40} />
        <Title order={2}>Green Management</Title>
        <Text c="dimmed" size="sm">
          Entre para acessar os chamados
        </Text>
      </Stack>

      <Paper withBorder shadow="sm" p="lg" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                E-mail ou senha inválidos.
              </Alert>
            )}
            <TextInput
              label="E-mail"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Button type="submit" fullWidth>
              Entrar
            </Button>
          </Stack>
        </form>

        <Divider
          my="lg"
          label="Usuários de demonstração"
          labelPosition="center"
        />
        <Stack gap="xs">
          {USERS.map((u) => (
            <UnstyledButton
              key={u.id}
              onClick={() => {
                setEmail(u.email);
                setPassword(DEMO_PASSWORD);
                setError(false);
              }}
            >
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {u.name} · {ROLE_LABEL[u.role]}
                </Text>
                <Text size="xs" c="dimmed">
                  {u.description}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
          <Center>
            <Text size="xs" c="dimmed">
              Senha de todos: {DEMO_PASSWORD}
            </Text>
          </Center>
        </Stack>
      </Paper>
    </Container>
  );
}
