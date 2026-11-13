const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < MIN) return "menos de 1min";
  if (abs < HOUR) return `${Math.floor(abs / MIN)}min`;
  if (abs < DAY) {
    const h = Math.floor(abs / HOUR);
    const m = Math.floor((abs % HOUR) / MIN);
    return m ? `${h}h ${m}min` : `${h}h`;
  }
  const d = Math.floor(abs / DAY);
  const h = Math.floor((abs % DAY) / HOUR);
  return h ? `${d}d ${h}h` : `${d}d`;
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
