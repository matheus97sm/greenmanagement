import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconLeaf, IconLogout } from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/auth/auth-context";
import { ROLE_LABEL } from "@/auth/users";
import { navItemsFor } from "@/paths";
import { ColorSchemeToggle } from "./ColorSchemeToggle";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = user ? navItemsFor(user.role) : [];

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs">
        <IconLeaf size={24} />
        <Title order={4}>Green Management</Title>
        {items.length > 0 && (
          <Group gap={4} ml="md" component="nav" aria-label="Páginas">
            {items.map((item) => (
              <Button
                key={item.to}
                component={Link}
                to={item.to}
                size="compact-sm"
                variant={pathname.startsWith(item.to) ? "light" : "subtle"}
                color={pathname.startsWith(item.to) ? "green" : "gray"}
                aria-current={pathname.startsWith(item.to) ? "page" : undefined}
              >
                {item.label}
              </Button>
            ))}
          </Group>
        )}
      </Group>

      <Group gap="sm">
        <ColorSchemeToggle />
        {user && (
          <>
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
                onClick={handleSignOut}
              >
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
      </Group>
    </Group>
  );
}
