import { useMemo, useRef } from "react";
import { Checkbox, Group, Stack, Text } from "@mantine/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTickets } from "@/store/useTickets";
import {
  LIST_MAX_HEIGHT,
  LIST_MIN_HEIGHT,
  ROW_HEIGHT,
  ROW_OVERSCAN,
} from "./constants";
import { TicketRow } from "./row";
import type { Props } from "./types";
import { buildItems, isLocked, selectionScope } from "./utils";

export function TicketQueue({
  tickets,
  total,
  selected,
  lockedGroupId,
  now,
  emptyText,
  onOpen,
  onToggle,
  onToggleAll,
}: Props) {
  const { history, people, groups } = useTickets();

  const items = useMemo(
    () => buildItems({ tickets, people, groups, history, now }),
    [tickets, people, groups, history, now],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: ROW_OVERSCAN,
  });

  const { targetGroupId, selectable, mixed } = selectionScope(
    tickets,
    lockedGroupId,
  );
  const allSelected =
    selectable.length > 0 &&
    selectable.every((ticket) => selected.has(ticket.id));
  const someSelected = selectable.some((ticket) => selected.has(ticket.id));

  return (
    <Stack gap={0}>
      {tickets.length > 0 && (
        <Group
          px="sm"
          py="xs"
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
          }}
        >
          <Checkbox
            size="xs"
            label="Selecionar todos"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={(event) =>
              onToggleAll(
                selectable.map((ticket) => ticket.id),
                event.currentTarget.checked,
              )
            }
          />
          {mixed && (
            <Text size="xs" c="dimmed">
              só {groups[targetGroupId ?? ""]?.nome}
            </Text>
          )}
        </Group>
      )}
      <div
        ref={parentRef}
        style={{
          maxHeight: LIST_MAX_HEIGHT,
          minHeight: LIST_MIN_HEIGHT,
          overflowY: "auto",
        }}
      >
        {tickets.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" p="lg">
            {emptyText}
          </Text>
        )}
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={item.ticket.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TicketRow
                  item={item}
                  selected={selected.has(item.ticket.id)}
                  locked={isLocked(item.ticket, lockedGroupId)}
                  onOpen={onOpen}
                  onToggle={onToggle}
                />
              </div>
            );
          })}
        </div>
      </div>
      {total > tickets.length && (
        <Text size="xs" c="dimmed" ta="center" p="sm">
          Mostrando os {tickets.length} mais urgentes de {total}.
        </Text>
      )}
    </Stack>
  );
}
