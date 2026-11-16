import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    levelIdle: "Sem chamados",
    levelOverloaded: "Sobrecarregado",
    load: "Carga de {{name}}",
    breached_one: "{{count}} estourado",
    breached_other: "{{count}} estourados",
    atRisk: "{{count}} em risco",
    waitingCustomer: "{{count}} aguardando cliente",
    unassigned: "{{count}} sem responsável",
    emptyQueue: "Fila vazia",
  },
  [Language.EnUs]: {
    levelIdle: "No tickets",
    levelOverloaded: "Overloaded",
    load: "Workload of {{name}}",
    breached_one: "{{count}} overdue",
    breached_other: "{{count}} overdue",
    atRisk: "{{count}} at risk",
    waitingCustomer: "{{count}} waiting for customer",
    unassigned: "{{count}} unassigned",
    emptyQueue: "Empty queue",
  },
};
