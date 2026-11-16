import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    active: "Chamados ativos",
    breached: "Prazo estourado",
    atRisk: "Vencem em menos de 4h",
    unassigned: "Sem responsável",
    idle: "Consultores sem chamados",
  },
  [Language.EnUs]: {
    active: "Active tickets",
    breached: "Deadline missed",
    atRisk: "Due in under 4h",
    unassigned: "Unassigned",
    idle: "Consultants without tickets",
  },
};
