export function lastItems<T>(
  items: T[],
  shown: number,
): { hidden: number; visible: T[] } {
  const hidden = Math.max(0, items.length - shown);
  return { hidden, visible: hidden ? items.slice(-shown) : items };
}
