import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    failedTitle: "Não foi possível concluir",
    createFailedTitle: "Não foi possível abrir o chamado",
    redistributed_one: "{{count}} chamado redistribuído.",
    redistributed_other: "{{count}} chamados redistribuídos.",
    notRedistributed_one: "{{count}} não foi redistribuído",
    notRedistributed_other: "{{count}} não foram redistribuídos",
  },
  [Language.EnUs]: {
    failedTitle: "Could not finish",
    createFailedTitle: "Could not open the ticket",
    redistributed_one: "{{count}} ticket reassigned.",
    redistributed_other: "{{count}} tickets reassigned.",
    notRedistributed_one: "{{count}} was not reassigned",
    notRedistributed_other: "{{count}} were not reassigned",
  },
};
