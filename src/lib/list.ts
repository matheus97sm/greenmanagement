export function lastItems<Item>(
  items: Item[],
  shown: number,
): { hidden: number; visible: Item[] } {
  const hidden = Math.max(0, items.length - shown);
  return { hidden, visible: hidden ? items.slice(-shown) : items };
}
