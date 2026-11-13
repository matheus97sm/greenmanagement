import type { Status } from "./types";

export const STATUS_LABEL: Record<Status, string> = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando cliente",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export const STATUS_COLOR: Record<Status, string> = {
  aberto: "violet",
  em_atendimento: "blue",
  aguardando_cliente: "orange",
  resolvido: "teal",
  fechado: "gray",
};

export const TRANSITIONS: Record<Status, Status[]> = {
  aberto: ["em_atendimento"],
  em_atendimento: ["aguardando_cliente", "resolvido"],
  aguardando_cliente: ["em_atendimento", "resolvido"],
  resolvido: ["fechado", "em_atendimento"],
  fechado: ["em_atendimento"],
};

export function isReopen(from: Status, to: Status): boolean {
  return (
    (from === "resolvido" || from === "fechado") && to === "em_atendimento"
  );
}

export function isActive(status: Status): boolean {
  return status !== "resolvido" && status !== "fechado";
}
