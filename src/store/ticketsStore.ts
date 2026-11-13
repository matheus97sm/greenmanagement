import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  isStaff,
} from "../domain/rules";
import type {
  Category,
  DomainEvent,
  Group,
  HistoryEntry,
  Message,
  Person,
  Snapshot,
  SlaPolicy,
  Ticket,
} from "../domain/types";
import { anchorClock, nowIso } from "../lib/clock";

export interface TicketsState {
  status: "idle" | "loading" | "ready" | "error";
  tickets: Record<string, Ticket>;
  messages: Record<string, Message[]>;
  history: Record<string, HistoryEntry[]>;
  people: Record<string, Person>;
  groups: Record<string, Group>;
  categories: Record<string, Category>;
  sla: SlaPolicy[];
  lastRead: Record<string, string>;
  loadedAt: string;

  statusAt: Record<string, string>;
  assignedAt: Record<string, string>;
}

function emptyState(): TicketsState {
  return {
    status: "idle",
    tickets: {},
    messages: {},
    history: {},
    people: {},
    groups: {},
    categories: {},
    sla: [],
    lastRead: {},
    loadedAt: nowIso(),
    statusAt: {},
    assignedAt: {},
  };
}

function insertSorted<T extends { id: string }>(
  list: T[] | undefined,
  item: T,
  time: (x: T) => string,
): T[] {
  const current = list ?? [];
  if (current.some((x) => x.id === item.id)) return current;
  const next = [...current, item];
  next.sort((a, b) => time(a).localeCompare(time(b)));
  return next;
}

const byCreated = (m: Message) => m.criada_em;
const byOccurred = (h: HistoryEntry) => h.ocorrido_em;

function groupBy<T>(items: T[], key: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}

function sortedBy<T>(items: T[], time: (x: T) => string): T[] {
  return [...items].sort((a, b) => time(a).localeCompare(time(b)));
}

function latest(entries: HistoryEntry[], tipo: HistoryEntry["tipo"]) {
  return entries.filter((h) => h.tipo === tipo).at(-1)?.ocorrido_em;
}

function reduce(
  state: TicketsState,
  event: DomainEvent,
  orphans: Map<string, DomainEvent[]>,
): TicketsState {
  const park = (ticketId: string) =>
    orphans.set(ticketId, [...(orphans.get(ticketId) ?? []), event]);

  switch (event.tipo) {
    case "chamado.aberto": {
      const ticket = event.payload;
      if (state.tickets[ticket.id]) return state;
      let next: TicketsState = {
        ...state,
        tickets: { ...state.tickets, [ticket.id]: ticket },
        statusAt: { ...state.statusAt, [ticket.id]: ticket.aberto_em },
        assignedAt: { ...state.assignedAt, [ticket.id]: ticket.aberto_em },
      };
      const pending = orphans.get(ticket.id);
      if (pending) {
        orphans.delete(ticket.id);
        for (const e of pending) next = reduce(next, e, orphans);
      }
      return next;
    }

    case "chamado.atribuido": {
      const { chamado_id, consultor_id } = event.payload;
      const ticket = state.tickets[chamado_id];
      if (!ticket) {
        park(chamado_id);
        return state;
      }
      const entry: HistoryEntry = {
        id: event.id,
        chamado_id,
        tipo: "atribuicao",
        de: null,
        para: null,
        usuario_id: consultor_id,
        motivo: null,
        ocorrido_em: event.ocorrido_em,
      };
      const history = insertSorted(
        state.history[chamado_id],
        entry,
        byOccurred,
      );
      const stale =
        event.ocorrido_em < (state.assignedAt[chamado_id] ?? ticket.aberto_em);
      return {
        ...state,
        history: { ...state.history, [chamado_id]: history },
        tickets: stale
          ? state.tickets
          : {
              ...state.tickets,
              [chamado_id]: applyAssignment(
                ticket,
                consultor_id,
                event.ocorrido_em,
              ),
            },
        assignedAt: stale
          ? state.assignedAt
          : { ...state.assignedAt, [chamado_id]: event.ocorrido_em },
      };
    }

    case "mensagem.adicionada": {
      const message = event.payload;
      const list = state.messages[message.chamado_id];
      if (list?.some((m) => m.id === message.id)) return state;
      const ticket = state.tickets[message.chamado_id];
      return {
        ...state,
        messages: {
          ...state.messages,
          [message.chamado_id]: insertSorted(list, message, byCreated),
        },
        tickets: ticket
          ? {
              ...state.tickets,
              [ticket.id]: applyMessage(
                ticket,
                message,
                isStaff(state.people[message.autor_id]),
              ),
            }
          : state.tickets,
      };
    }

    case "status.alterado": {
      const p = event.payload;
      const ticket = state.tickets[p.chamado_id];
      if (!ticket) {
        park(p.chamado_id);
        return state;
      }
      const entry: HistoryEntry = {
        id: event.id,
        chamado_id: p.chamado_id,
        tipo: "status",
        de: p.de,
        para: p.para,
        usuario_id: p.usuario_id,
        motivo: p.motivo,
        ocorrido_em: event.ocorrido_em,
      };
      const before = state.history[p.chamado_id];
      const stale =
        event.ocorrido_em < (state.statusAt[p.chamado_id] ?? ticket.aberto_em);
      return {
        ...state,
        history: {
          ...state.history,
          [p.chamado_id]: insertSorted(before, entry, byOccurred),
        },
        tickets: stale
          ? state.tickets
          : {
              ...state.tickets,
              [p.chamado_id]: applyStatusChange(
                ticket,
                { de: p.de, para: p.para, ocorrido_em: event.ocorrido_em },
                before,
                state.sla,
              ),
            },
        statusAt: stale
          ? state.statusAt
          : { ...state.statusAt, [p.chamado_id]: event.ocorrido_em },
      };
    }
  }
}

export function createTicketsStore() {
  let state = emptyState();
  const listeners = new Set<() => void>();
  const seenEvents = new Set<string>();
  const orphans = new Map<string, DomainEvent[]>();
  let loadPromise: Promise<void> | null = null;

  const set = (next: TicketsState) => {
    if (next === state) return;
    state = next;
    listeners.forEach((l) => l());
  };

  return {
    getState: () => state,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    applyEvent(event: DomainEvent): boolean {
      if (seenEvents.has(event.id)) return false;
      seenEvents.add(event.id);
      set(reduce(state, event, orphans));
      return true;
    },

    loadSnapshot(snapshot: Snapshot) {
      anchorClock(snapshot.agora);
      const messages = groupBy(snapshot.mensagens, (m) => m.chamado_id);
      const history = groupBy(snapshot.historico, (h) => h.chamado_id);

      const base: TicketsState = {
        ...emptyState(),
        status: "ready",
        tickets: Object.fromEntries(snapshot.chamados.map((t) => [t.id, t])),
        people: Object.fromEntries(snapshot.usuarios.map((p) => [p.id, p])),
        groups: Object.fromEntries(snapshot.grupos.map((g) => [g.id, g])),
        categories: Object.fromEntries(
          snapshot.categorias.map((c) => [c.id, c]),
        ),
        messages: Object.fromEntries(
          Object.entries(messages).map(([id, list]) => [
            id,
            sortedBy(list, byCreated),
          ]),
        ),
        history: Object.fromEntries(
          Object.entries(history).map(([id, list]) => [
            id,
            sortedBy(list, byOccurred),
          ]),
        ),
        sla: snapshot.sla,
        statusAt: {},
        assignedAt: {},
        loadedAt: nowIso(),
        lastRead: state.lastRead,
      };
      for (const t of snapshot.chamados) {
        const entries = base.history[t.id] ?? [];
        base.statusAt[t.id] = latest(entries, "status") ?? t.aberto_em;
        base.assignedAt[t.id] = latest(entries, "atribuicao") ?? t.aberto_em;
      }

      let next = base;
      for (const [id, list] of Object.entries(state.messages)) {
        for (const m of list) {
          next = {
            ...next,
            messages: {
              ...next.messages,
              [id]: insertSorted(next.messages[id], m, byCreated),
            },
          };
        }
      }

      for (const [id, pending] of [...orphans]) {
        if (!next.tickets[id]) continue;
        orphans.delete(id);
        for (const e of pending) next = reduce(next, e, orphans);
      }
      set(next);
    },

    load(fetchSnapshot: () => Promise<Snapshot>): Promise<void> {
      if (loadPromise) return loadPromise;
      set({ ...state, status: "loading" });
      loadPromise = fetchSnapshot()
        .then((s) => this.loadSnapshot(s))
        .catch(() => {
          loadPromise = null;
          set({ ...state, status: "error" });
        });
      return loadPromise;
    },

    reset() {
      seenEvents.clear();
      orphans.clear();
      loadPromise = null;
      set(emptyState());
    },

    markRead(ticketId: string) {
      set({
        ...state,
        lastRead: { ...state.lastRead, [ticketId]: nowIso() },
      });
    },
  };
}

export const ticketsStore = createTicketsStore();

export function unreadCount(
  state: TicketsState,
  ticketId: string,
  meId: string,
): number {
  const since = state.lastRead[ticketId] ?? state.loadedAt;
  return (state.messages[ticketId] ?? []).filter(
    (m) => m.autor_id !== meId && m.criada_em > since,
  ).length;
}
