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
import { useLabels, useTranslate } from "@/i18n";
import { useAuth } from "@/auth/auth-context";
import { homePath } from "@/paths";
import { DEMO_PASSWORD, USERS } from "@/auth/users";
import { ROLE_DESCRIPTION_KEY } from "./constants";
import { locales } from "./locales";

export function LoginPage() {
  const translate = useTranslate(locales);
  const labels = useLabels();
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
          {translate("subtitle")}
        </Text>
      </Stack>

      <Paper withBorder shadow="sm" p="lg" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                {translate("invalidCredentials")}
              </Alert>
            )}
            <TextInput
              label={translate("emailLabel")}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              label={translate("passwordLabel")}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            <Button type="submit" fullWidth>
              {translate("submit")}
            </Button>
          </Stack>
        </form>

        <Divider
          my="lg"
          label={translate("demoUsers")}
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
                  {user.name} · {labels.role(user.role)}
                </Text>
                <Text size="xs" c="dimmed">
                  {translate(ROLE_DESCRIPTION_KEY[user.role])}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
          <Center>
            <Text size="xs" c="dimmed">
              {translate("sharedPassword", { password: DEMO_PASSWORD })}
            </Text>
          </Center>
        </Stack>
      </Paper>
    </Container>
  );
}
