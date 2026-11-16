import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    idleHours: "Horas sem chamado",
    idleOf: "de {{hours}} de expediente",
    teamIdleness: "Ociosidade da equipe",
    assigned: "Chamados atribuídos",
    resolved: "Chamados resolvidos",
    mostIdle: "Mais tempo sem chamado",
    nobody: "Ninguém",
    everyoneHadTickets: "Todos tiveram chamados",
  },
  [Language.EnUs]: {
    idleHours: "Hours without tickets",
    idleOf: "of {{hours}} of working time",
    teamIdleness: "Team idleness",
    assigned: "Assigned tickets",
    resolved: "Resolved tickets",
    mostIdle: "Most time without tickets",
    nobody: "Nobody",
    everyoneHadTickets: "Everyone had tickets",
  },
};
