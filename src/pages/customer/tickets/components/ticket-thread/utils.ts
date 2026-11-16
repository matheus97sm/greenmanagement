import type { Message } from "@/domain/types";
import { UNKNOWN_AUTHOR } from "./constants";
import type { ThreadInput, ThreadItem } from "./types";

export function threadItems({
  ticket,
  messages,
  people,
  meId,
  since,
}: ThreadInput): ThreadItem[] {
  const itemOf = (
    key: string,
    at: string,
    authorId: string,
    text: string,
  ): ThreadItem => {
    const isOwn = authorId === meId;
    return {
      key,
      at,
      author: people[authorId]?.nome ?? UNKNOWN_AUTHOR,
      role: people[authorId]?.perfil,
      isOwn,
      text,
      isNew: !isOwn && at > since,
    };
  };

  const fromMessage = (m: Message) =>
    itemOf(m.id, m.criada_em, m.autor_id, m.texto);

  return [
    itemOf(
      "description",
      ticket.aberto_em,
      ticket.solicitante_id,
      ticket.descricao,
    ),
    ...(messages ?? []).map(fromMessage),
  ].sort((a, b) => a.at.localeCompare(b.at));
}
