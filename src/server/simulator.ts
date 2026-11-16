import { isActive } from "@/domain/status";
import type { Person, Ticket } from "@/domain/types";
import { getDb } from "./db";
import * as ops from "./ops";
import { Status, Profile } from "@/domain/enums";

const pick = <Item>(items: Item[]): Item | undefined =>
  items[Math.floor(Math.random() * items.length)];

function pickFor(
  candidates: Ticket[],
  concerns: (ticket: Ticket) => boolean,
): Ticket | undefined {
  const mine = candidates.filter(concerns);
  return Math.random() < 0.7 && mine.length ? pick(mine) : pick(candidates);
}

const concernsOf = (focus: Person) => (ticket: Ticket) =>
  focus.perfil === Profile.Customer
    ? ticket.solicitante_id === focus.id
    : focus.perfil === Profile.Consultant
      ? ticket.responsavel_id === focus.id
      : true;

export function startSimulator(focus: Person): () => void {
  const database = getDb();
  const people = (profile: Person["perfil"]) =>
    database.usuarios.filter((person) => person.perfil === profile);

  const role = new Map(
    database.usuarios.map((person) => [person.id, person.perfil]),
  );
  const texts = {
    customer: [
      ...new Set(
        database.mensagens
          .filter((message) => role.get(message.autor_id) === Profile.Customer)
          .map((message) => message.texto),
      ),
    ],
    staff: [
      ...new Set(
        database.mensagens
          .filter(
            (message) =>
              role.get(message.autor_id) === Profile.Consultant &&
              !message.interna,
          )
          .map((message) => message.texto),
      ),
    ],
    note: [
      ...new Set(
        database.mensagens
          .filter((message) => message.interna)
          .map((message) => message.texto),
      ),
    ],
  };
  const concerns = concernsOf(focus);

  function customerReplies() {
    const ticket = pickFor(
      database.chamados.filter(
        (currentTicket) =>
          currentTicket.responsavel_id &&
          (currentTicket.status === Status.InProgress ||
            currentTicket.status === Status.WaitingCustomer),
      ),
      concerns,
    );
    const text = pick(texts.customer);
    if (!ticket || !text) return;
    ops.addMessage({
      ticketId: ticket.id,
      authorId: ticket.solicitante_id,
      text,
      internal: false,
    });
  }

  function consultantReplies() {
    const ticket = pickFor(
      database.chamados.filter(
        (currentTicket) =>
          currentTicket.responsavel_id &&
          currentTicket.status === Status.InProgress,
      ),
      concerns,
    );
    const text = pick(texts.staff);
    if (!ticket?.responsavel_id || !text) return;
    ops.addMessage({
      ticketId: ticket.id,
      authorId: ticket.responsavel_id,
      text,
      internal: false,
    });
  }

  function newTicket() {
    const customer = pick(people(Profile.Customer));

    const groupId = focus.grupo_id ?? pick(database.grupos)?.id;
    const category = pick(
      Math.random() < 0.7
        ? database.categorias.filter(
            (currentCategory) => currentCategory.grupo_id === groupId,
          )
        : database.categorias,
    );
    const title = pick(database.chamados)?.titulo;
    const description = pick(texts.customer);
    const priority = pick(database.sla)?.prioridade;
    if (!customer || !category || !title || !description || !priority) return;
    ops.openTicket({
      requesterId: customer.id,
      categoryId: category.id,
      priority,
      title,
      description,
    });
  }

  function colleagueTakesFromQueue() {
    const queue = database.chamados.filter(
      (currentTicket) =>
        !currentTicket.responsavel_id &&
        currentTicket.status === Status.Open &&
        (focus.grupo_id ? currentTicket.grupo_id === focus.grupo_id : true),
    );
    const ticket = pick(queue);
    const colleague = pick(
      people(Profile.Consultant).filter(
        (person) =>
          person.id !== focus.id && person.grupo_id === ticket?.grupo_id,
      ),
    );
    if (ticket && colleague) ops.assumeTicket(ticket.id, colleague.id);
  }

  function colleagueLeavesNote() {
    const ticket = pickFor(
      database.chamados.filter(
        (currentTicket) =>
          currentTicket.responsavel_id && isActive(currentTicket.status),
      ),
      concerns,
    );
    const colleague = pick(
      people(Profile.Consultant).filter(
        (person) =>
          person.id !== focus.id && person.grupo_id === ticket?.grupo_id,
      ),
    );
    const text = pick(texts.note);
    if (ticket && colleague && text) {
      ops.addMessage({
        ticketId: ticket.id,
        authorId: colleague.id,
        text,
        internal: true,
      });
    }
  }

  function tick() {
    const roll = Math.random();
    try {
      if (roll < 0.35) customerReplies();
      else if (roll < 0.5) consultantReplies();
      else if (roll < 0.7) newTicket();
      else if (roll < 0.9) colleagueTakesFromQueue();
      else colleagueLeavesNote();
    } catch {}
  }

  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(
      () => {
        tick();
        schedule();
      },
      3000 + Math.random() * 5000,
    );
  };
  schedule();
  return () => clearTimeout(timer);
}
