import { Priority, Status } from "./enums";

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

export const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.Critical]: "red",
  [Priority.High]: "orange",
  [Priority.Medium]: "yellow",
  [Priority.Low]: "gray",
};
