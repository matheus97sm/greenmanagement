import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    selectAll: "Selecionar todos",
    onlyGroup: "só {{name}}",
    showing: "Mostrando os {{shown}} mais urgentes de {{total}}.",
    selectTicket: "Selecionar chamado {{number}}",
    openTicket: "Abrir conversa do chamado {{number}}",
    withOwner: "{{requester}} · com {{owner}}",
    withoutOwner: "{{requester}} · sem responsável",
  },
  [Language.EnUs]: {
    selectAll: "Select all",
    onlyGroup: "only {{name}}",
    showing: "Showing the {{shown}} most urgent of {{total}}.",
    selectTicket: "Select ticket {{number}}",
    openTicket: "Open conversation of ticket {{number}}",
    withOwner: "{{requester}} · with {{owner}}",
    withoutOwner: "{{requester}} · unassigned",
  },
};
