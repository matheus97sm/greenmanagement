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

  const fromMessage = (message: Message) =>
    itemOf(message.id, message.criada_em, message.autor_id, message.texto);

  return [
    itemOf(
      "description",
      ticket.aberto_em,
      ticket.solicitante_id,
      ticket.descricao,
    ),
    ...(messages ?? []).map(fromMessage),
  ].sort((firstThreadItem, threadItem) =>
    firstThreadItem.at.localeCompare(threadItem.at),
  );
}
