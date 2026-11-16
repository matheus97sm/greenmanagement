const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < MIN) return "menos de 1min";
  if (abs < HOUR) return `${Math.floor(abs / MIN)}min`;
  if (abs < DAY) {
    const hours = Math.floor(abs / HOUR);
    const minutes = Math.floor((abs % HOUR) / MIN);
    return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / HOUR);
  return hours ? `${days}d ${hours}h` : `${days}d`;
}

export function formatDateTime(
  iso: string,
  timeZone?: string,
  locale = "pt-BR",
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

export function formatHours(ms: number): string {
  const hours = ms / HOUR;
  return `${hours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function formatDayMonth(timestamp: number, timeZone?: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
  }).format(new Date(timestamp));
}
