import type { Person, Ticket } from "./types";

export function matchesSearch(
  ticket: Ticket,
  term: string,
  people: Record<string, Person>,
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const requester = people[ticket.solicitante_id];
  return (
    String(ticket.numero).includes(needle) ||
    ticket.titulo.toLowerCase().includes(needle) ||
    (requester?.nome ?? "").toLowerCase().includes(needle) ||
    (requester?.empresa ?? "").toLowerCase().includes(needle)
  );
}
