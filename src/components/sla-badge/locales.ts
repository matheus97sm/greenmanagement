import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    breachedFirstResponse: "1ª resposta estourada há {{duration}}",
    breached: "Estourado há {{duration}}",
    dueFirstResponse: "1ª resposta em {{duration}}",
    paused: "Prazo pausado",
    finished: "Encerrado",
  },
  [Language.EnUs]: {
    breachedFirstResponse: "First response overdue by {{duration}}",
    breached: "Overdue by {{duration}}",
    dueFirstResponse: "First response in {{duration}}",
    paused: "Deadline paused",
    finished: "Finished",
  },
};
