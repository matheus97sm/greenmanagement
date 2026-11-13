import { isActive } from "@/domain/status";
import type { Person, Ticket } from "@/domain/types";
import { getDb } from "./db";
import * as ops from "./ops";
import { Status, Profile } from "@/domain/enums";

const pick = <T>(items: T[]): T | undefined =>
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
  const db = getDb();
  const people = (profile: Person["perfil"]) =>
    db.usuarios.filter((u) => u.perfil === profile);

  const role = new Map(db.usuarios.map((u) => [u.id, u.perfil]));
  const texts = {
    customer: [
      ...new Set(
        db.mensagens
          .filter((m) => role.get(m.autor_id) === Profile.Customer)
          .map((m) => m.texto),
      ),
    ],
    staff: [
      ...new Set(
        db.mensagens
          .filter(
            (m) => role.get(m.autor_id) === Profile.Consultant && !m.interna,
          )
          .map((m) => m.texto),
      ),
    ],
    note: [
      ...new Set(db.mensagens.filter((m) => m.interna).map((m) => m.texto)),
    ],
  };
  const concerns = concernsOf(focus);

  function customerReplies() {
    const ticket = pickFor(
      db.chamados.filter(
        (t) =>
          t.responsavel_id &&
          (t.status === Status.InProgress ||
            t.status === Status.WaitingCustomer),
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
      db.chamados.filter(
        (t) => t.responsavel_id && t.status === Status.InProgress,
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

    const groupId = focus.grupo_id ?? pick(db.grupos)?.id;
    const category = pick(
      Math.random() < 0.7
        ? db.categorias.filter((c) => c.grupo_id === groupId)
        : db.categorias,
    );
    const title = pick(db.chamados)?.titulo;
    const description = pick(texts.customer);
    const priority = pick(db.sla)?.prioridade;
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
    const queue = db.chamados.filter(
      (t) =>
        !t.responsavel_id &&
        t.status === Status.Open &&
        (focus.grupo_id ? t.grupo_id === focus.grupo_id : true),
    );
    const ticket = pick(queue);
    const colleague = pick(
      people(Profile.Consultant).filter(
        (p) => p.id !== focus.id && p.grupo_id === ticket?.grupo_id,
      ),
    );
    if (ticket && colleague) ops.assumeTicket(ticket.id, colleague.id);
  }

  function colleagueLeavesNote() {
    const ticket = pickFor(
      db.chamados.filter((t) => t.responsavel_id && isActive(t.status)),
      concerns,
    );
    const colleague = pick(
      people(Profile.Consultant).filter(
        (p) => p.id !== focus.id && p.grupo_id === ticket?.grupo_id,
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
    const r = Math.random();
    try {
      if (r < 0.35) customerReplies();
      else if (r < 0.5) consultantReplies();
      else if (r < 0.7) newTicket();
      else if (r < 0.9) colleagueTakesFromQueue();
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
