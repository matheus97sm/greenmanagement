import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    searchLabel: "Buscar chamado",
    searchPlaceholder: "Buscar por número ou título",
    noneFound: "Nenhum chamado encontrado.",
    noneYet: "Você ainda não abriu nenhum chamado.",
    unread_one: "{{count}} nova",
    unread_other: "{{count}} novas",
    withHandler: "Com {{name}}",
    withoutHandler: "Ainda sem responsável",
    handlerAndUpdate: "{{handler}} · atualizado em {{date}}",
  },
  [Language.EnUs]: {
    searchLabel: "Search ticket",
    searchPlaceholder: "Search by number or title",
    noneFound: "No tickets found.",
    noneYet: "You have not opened any tickets yet.",
    unread_one: "{{count}} new",
    unread_other: "{{count}} new",
    withHandler: "With {{name}}",
    withoutHandler: "No one assigned yet",
    handlerAndUpdate: "{{handler}} · updated on {{date}}",
  },
};
