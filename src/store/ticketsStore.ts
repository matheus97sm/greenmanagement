import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  isStaff,
} from "@/domain/rules";
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
} from "@/domain/types";
import { anchorClock, nowIso } from "@/lib/clock";
import { EventType, HistoryType } from "@/domain/enums";
import { LoadStatus } from "./enums";

export interface TicketsState {
  status: LoadStatus;
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
    status: LoadStatus.Idle,
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

function insertSorted<Item extends { id: string }>(
  list: Item[] | undefined,
  item: Item,
  time: (currentItem: Item) => string,
): Item[] {
  const current = list ?? [];
  if (current.some((currentItem) => currentItem.id === item.id)) return current;
  const next = [...current, item];
  next.sort((first, second) => time(first).localeCompare(time(second)));
  return next;
}

const byCreated = (message: Message) => message.criada_em;
const byOccurred = (historyEntry: HistoryEntry) => historyEntry.ocorrido_em;

function groupBy<Item>(
  items: Item[],
  key: (item: Item) => string,
): Record<string, Item[]> {
  const out: Record<string, Item[]> = {};
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}

function sortedBy<Item>(items: Item[], time: (item: Item) => string): Item[] {
  return [...items].sort((first, second) =>
    time(first).localeCompare(time(second)),
  );
}

function latest(entries: HistoryEntry[], tipo: HistoryEntry["tipo"]) {
  return entries.filter((historyEntry) => historyEntry.tipo === tipo).at(-1)
    ?.ocorrido_em;
}

function reduce(
  state: TicketsState,
  event: DomainEvent,
  orphans: Map<string, DomainEvent[]>,
): TicketsState {
  const park = (ticketId: string) =>
    orphans.set(ticketId, [...(orphans.get(ticketId) ?? []), event]);

  switch (event.tipo) {
    case EventType.TicketOpened: {
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
        for (const domainEvent of pending)
          next = reduce(next, domainEvent, orphans);
      }
      return next;
    }

    case EventType.TicketAssigned: {
      const { chamado_id, consultor_id } = event.payload;
      const ticket = state.tickets[chamado_id];
      if (!ticket) {
        park(chamado_id);
        return state;
      }
      const entry: HistoryEntry = {
        id: event.id,
        chamado_id,
        tipo: HistoryType.Assignment,
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

    case EventType.MessageAdded: {
      const message = event.payload;
      const list = state.messages[message.chamado_id];
      if (list?.some((currentMessage) => currentMessage.id === message.id))
        return state;
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

    case EventType.StatusChanged: {
      const payload = event.payload;
      const ticket = state.tickets[payload.chamado_id];
      if (!ticket) {
        park(payload.chamado_id);
        return state;
      }
      const entry: HistoryEntry = {
        id: event.id,
        chamado_id: payload.chamado_id,
        tipo: HistoryType.Status,
        de: payload.de,
        para: payload.para,
        usuario_id: payload.usuario_id,
        motivo: payload.motivo,
        ocorrido_em: event.ocorrido_em,
      };
      const before = state.history[payload.chamado_id];
      const stale =
        event.ocorrido_em <
        (state.statusAt[payload.chamado_id] ?? ticket.aberto_em);
      return {
        ...state,
        history: {
          ...state.history,
          [payload.chamado_id]: insertSorted(before, entry, byOccurred),
        },
        tickets: stale
          ? state.tickets
          : {
              ...state.tickets,
              [payload.chamado_id]: applyStatusChange(
                ticket,
                {
                  de: payload.de,
                  para: payload.para,
                  ocorrido_em: event.ocorrido_em,
                },
                before,
                state.sla,
              ),
            },
        statusAt: stale
          ? state.statusAt
          : { ...state.statusAt, [payload.chamado_id]: event.ocorrido_em },
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
  let generation = 0;

  const set = (next: TicketsState) => {
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
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
      const messages = groupBy(
        snapshot.mensagens,
        (message) => message.chamado_id,
      );
      const history = groupBy(
        snapshot.historico,
        (historyEntry) => historyEntry.chamado_id,
      );

      const base: TicketsState = {
        ...emptyState(),
        status: LoadStatus.Ready,
        tickets: Object.fromEntries(
          snapshot.chamados.map((ticket) => [ticket.id, ticket]),
        ),
        people: Object.fromEntries(
          snapshot.usuarios.map((person) => [person.id, person]),
        ),
        groups: Object.fromEntries(
          snapshot.grupos.map((group) => [group.id, group]),
        ),
        categories: Object.fromEntries(
          snapshot.categorias.map((category) => [category.id, category]),
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
      for (const ticket of snapshot.chamados) {
        const entries = base.history[ticket.id] ?? [];
        base.statusAt[ticket.id] =
          latest(entries, HistoryType.Status) ?? ticket.aberto_em;
        base.assignedAt[ticket.id] =
          latest(entries, HistoryType.Assignment) ?? ticket.aberto_em;
      }

      let next = base;
      for (const [id, list] of Object.entries(state.messages)) {
        for (const message of list) {
          next = {
            ...next,
            messages: {
              ...next.messages,
              [id]: insertSorted(next.messages[id], message, byCreated),
            },
          };
        }
      }

      for (const [id, pending] of [...orphans]) {
        if (!next.tickets[id]) continue;
        orphans.delete(id);
        for (const domainEvent of pending)
          next = reduce(next, domainEvent, orphans);
      }
      set(next);
    },

    load(
      fetchSnapshot: () => Promise<Snapshot>,
      readMarks: Record<string, string> = {},
    ): Promise<void> {
      if (loadPromise) return loadPromise;
      set({ ...state, status: LoadStatus.Loading });
      const requestedIn = generation;
      loadPromise = fetchSnapshot()
        .then((snapshot) => {
          if (requestedIn !== generation) return;
          this.loadSnapshot(snapshot);
          this.restoreRead(readMarks);
        })
        .catch(() => {
          if (requestedIn !== generation) return;
          loadPromise = null;
          set({ ...state, status: LoadStatus.Error });
        });
      return loadPromise;
    },

    reset() {
      generation += 1;
      seenEvents.clear();
      orphans.clear();
      loadPromise = null;
      set(emptyState());
    },

    restoreRead(marks: Record<string, string>) {
      const known = Object.fromEntries(
        Object.entries(marks).filter(([id]) => id in state.tickets),
      );
      set({ ...state, lastRead: { ...known, ...state.lastRead } });
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
    (message) => message.autor_id !== meId && message.criada_em > since,
  ).length;
}
