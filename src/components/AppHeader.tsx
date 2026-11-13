import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconLeaf, IconLogout } from "@tabler/icons-react";
import { useAuth } from "../auth/auth-context";
import { ROLE_LABEL } from "../auth/users";

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs">
        <IconLeaf size={24} />
        <Title order={4}>Green Management</Title>
      </Group>

      {user && (
        <Group gap="sm">
          <Avatar size="sm" color="green" radius="xl">
            {user.name[0]}
          </Avatar>
          <div>
            <Text size="sm" fw={500} lh={1.2}>
              {user.name}
            </Text>
            <Badge size="xs" variant="light" color="green">
              {ROLE_LABEL[user.role]}
            </Badge>
          </div>
          <Tooltip label="Sair">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Sair"
              onClick={signOut}
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Group>
  );
}
