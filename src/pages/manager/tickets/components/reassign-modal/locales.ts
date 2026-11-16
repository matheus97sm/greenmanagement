import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    title_one: "Redistribuir chamado",
    title_other: "Redistribuir {{count}} chamados",
    hint: "Só aparecem consultores do grupo dos chamados. A lista mostra a carga atual de cada um.",
    newOwner: "Novo responsável",
    pickConsultant: "Escolha um consultor",
    mixedGroups:
      "Os chamados selecionados são de grupos diferentes. Redistribua um grupo de cada vez.",
    cancel: "Cancelar",
    confirm: "Redistribuir",
    option_zero: "{{name}} · {{count}} chamados",
    option_one: "{{name}} · {{count}} chamado",
    option_other: "{{name}} · {{count}} chamados",
  },
  [Language.EnUs]: {
    title_one: "Reassign ticket",
    title_other: "Reassign {{count}} tickets",
    hint: "Only consultants from the tickets' group are listed. The list shows each one's current workload.",
    newOwner: "New owner",
    pickConsultant: "Pick a consultant",
    mixedGroups:
      "The selected tickets belong to different groups. Reassign one group at a time.",
    cancel: "Cancel",
    confirm: "Reassign",
    option_zero: "{{name}} · {{count}} tickets",
    option_one: "{{name}} · {{count}} ticket",
    option_other: "{{name}} · {{count}} tickets",
  },
};
