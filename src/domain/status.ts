import { Status } from "./enums";

export const STATUS_LABEL: Record<Status, string> = {
  [Status.Open]: "Aberto",
  [Status.InProgress]: "Em atendimento",
  [Status.WaitingCustomer]: "Aguardando cliente",
  [Status.Resolved]: "Resolvido",
  [Status.Closed]: "Fechado",
};

export const STATUS_COLOR: Record<Status, string> = {
  [Status.Open]: "violet",
  [Status.InProgress]: "blue",
  [Status.WaitingCustomer]: "orange",
  [Status.Resolved]: "teal",
  [Status.Closed]: "gray",
};

export const TRANSITIONS: Record<Status, Status[]> = {
  [Status.Open]: [Status.InProgress],
  [Status.InProgress]: [Status.WaitingCustomer, Status.Resolved],
  [Status.WaitingCustomer]: [Status.InProgress, Status.Resolved],
  [Status.Resolved]: [Status.Closed, Status.InProgress],
  [Status.Closed]: [Status.InProgress],
};

export function isReopen(from: Status, to: Status): boolean {
  return (
    (from === Status.Resolved || from === Status.Closed) &&
    to === Status.InProgress
  );
}

export function isActive(status: Status): boolean {
  return status !== Status.Resolved && status !== Status.Closed;
}
