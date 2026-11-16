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
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/auth-context";
import { homePath } from "@/paths";
import { DEMO_PASSWORD, ROLE_LABEL, USERS } from "@/auth/users";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = signIn(email, password);
    if (user) {
      navigate(homePath(user.role), { replace: true });
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
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              label="Senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
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
          {USERS.map((user) => (
            <UnstyledButton
              key={user.id}
              onClick={() => {
                setEmail(user.email);
                setPassword(DEMO_PASSWORD);
                setError(false);
              }}
            >
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {user.name} · {ROLE_LABEL[user.role]}
                </Text>
                <Text size="xs" c="dimmed">
                  {user.description}
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
