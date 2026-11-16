import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    tabMine: "Meus ({{count}})",
    tabQueue: "Fila do grupo ({{count}})",
    searchPlaceholder: "Buscar por nº, título ou cliente",
    empty: "Nenhum chamado por aqui.",
    filterActive: "Em andamento",
    filterAll: "Todos",
  },
  [Language.EnUs]: {
    tabMine: "Mine ({{count}})",
    tabQueue: "Group queue ({{count}})",
    searchPlaceholder: "Search by no., title or customer",
    empty: "No tickets here.",
    filterActive: "In progress",
    filterAll: "All",
  },
};
