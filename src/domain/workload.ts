import { LoadLevel, Profile, SlaKind } from "./enums";
import { compareBySla, slaInfo } from "./sla";
import { isActive } from "./status";
import type { Person, Ticket } from "./types";

export const OVERLOAD_FACTOR = 1.5;

export interface Workload {
  consultant: Person;
  active: number;
  waitingCustomer: number;
  breached: number;
  atRisk: number;
  level: LoadLevel;
}

export function consultantsOf(people: Person[], groupIds: string[]): Person[] {
  return people.filter(
    (p) =>
      p.perfil === Profile.Consultant &&
      !!p.grupo_id &&
      groupIds.includes(p.grupo_id),
  );
}

export function needsAttention(ticket: Ticket, now: number): boolean {
  if (!isActive(ticket.status)) return false;
  const { kind } = slaInfo(ticket, now);
  return (
    kind === SlaKind.Breached ||
    kind === SlaKind.Critical ||
    kind === SlaKind.Warning
  );
}

export function riskTickets(tickets: Ticket[], now: number): Ticket[] {
  return tickets.filter((t) => needsAttention(t, now)).sort(compareBySla(now));
}

export function unassignedTickets(tickets: Ticket[], now: number): Ticket[] {
  return tickets
    .filter((t) => isActive(t.status) && !t.responsavel_id)
    .sort(compareBySla(now));
}

export function activeTicketsOf(
  tickets: Ticket[],
  consultantId: string,
  now: number,
): Ticket[] {
  return tickets
    .filter((t) => isActive(t.status) && t.responsavel_id === consultantId)
    .sort(compareBySla(now));
}

export function levelOf(active: number, groupAverage: number): LoadLevel {
  if (active === 0) return LoadLevel.Idle;
  return active >= groupAverage * OVERLOAD_FACTOR
    ? LoadLevel.Overloaded
    : LoadLevel.Normal;
}

export function workloadByConsultant(
  tickets: Ticket[],
  consultants: Person[],
  now: number,
): Workload[] {
  const stats = new Map(
    consultants.map((c) => [
      c.id,
      { active: 0, waitingCustomer: 0, breached: 0, atRisk: 0 },
    ]),
  );

  for (const ticket of tickets) {
    const entry = ticket.responsavel_id && stats.get(ticket.responsavel_id);
    if (!entry || !isActive(ticket.status)) continue;
    entry.active += 1;
    const { kind } = slaInfo(ticket, now);
    if (kind === SlaKind.Paused) entry.waitingCustomer += 1;
    else if (kind === SlaKind.Breached) entry.breached += 1;
    else if (kind === SlaKind.Critical || kind === SlaKind.Warning)
      entry.atRisk += 1;
  }

  const averageByGroup = new Map<string, number>();
  for (const c of consultants) {
    const group = c.grupo_id ?? "";
    if (averageByGroup.has(group)) continue;
    const members = consultants.filter((m) => m.grupo_id === c.grupo_id);
    const total = members.reduce((sum, m) => sum + stats.get(m.id)!.active, 0);
    averageByGroup.set(group, total / members.length);
  }

  return consultants.map((consultant) => {
    const s = stats.get(consultant.id)!;
    return {
      consultant,
      ...s,
      level: levelOf(s.active, averageByGroup.get(consultant.grupo_id ?? "")!),
    };
  });
}

const LEVEL_ORDER: Record<LoadLevel, number> = {
  [LoadLevel.Idle]: 0,
  [LoadLevel.Overloaded]: 1,
  [LoadLevel.Normal]: 2,
};

export function compareWorkload(a: Workload, b: Workload): number {
  return (
    LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
    b.breached - a.breached ||
    b.atRisk - a.atRisk ||
    b.active - a.active ||
    a.consultant.nome.localeCompare(b.consultant.nome)
  );
}

export interface TeamSummary {
  active: number;
  breached: number;
  atRisk: number;
  unassigned: number;
  idle: number;
}

export function teamSummary(
  tickets: Ticket[],
  workloads: Workload[],
  now: number,
): TeamSummary {
  const summary: TeamSummary = {
    active: 0,
    breached: 0,
    atRisk: 0,
    unassigned: 0,
    idle: workloads.filter((w) => w.level === LoadLevel.Idle).length,
  };
  for (const ticket of tickets) {
    if (!isActive(ticket.status)) continue;
    summary.active += 1;
    if (!ticket.responsavel_id) summary.unassigned += 1;
    const { kind } = slaInfo(ticket, now);
    if (kind === SlaKind.Breached) summary.breached += 1;
    else if (kind === SlaKind.Critical || kind === SlaKind.Warning)
      summary.atRisk += 1;
  }
  return summary;
}
