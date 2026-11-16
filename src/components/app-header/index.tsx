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
import { useLabels, useTranslate } from "@/i18n";
import { navItemsFor } from "@/paths";
import { ColorSchemeToggle } from "../color-scheme-toggle";
import { LanguageToggle } from "../language-toggle";
import { NAV_PAGE_KEY } from "./constants";
import { locales } from "./locales";
import { isCurrentPage } from "./utils";

export function AppHeader() {
  const translate = useTranslate(locales);
  const labels = useLabels();
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
          <Group
            gap={4}
            ml="md"
            component="nav"
            aria-label={translate("pages")}
          >
            {items.map((item) => {
              const current = isCurrentPage(pathname, item.to);
              return (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  size="compact-sm"
                  variant={current ? "light" : "subtle"}
                  color={current ? "green" : "gray"}
                  aria-current={current ? "page" : undefined}
                >
                  {translate(NAV_PAGE_KEY[item.page])}
                </Button>
              );
            })}
          </Group>
        )}
      </Group>

      <Group gap="sm">
        <LanguageToggle />
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
                {labels.role(user.role)}
              </Badge>
            </div>
            <Tooltip label={translate("signOut")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={translate("signOut")}
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
