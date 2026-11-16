import { describe, expect, it } from "vitest";
import { Priority, Status } from "./enums";
import {
  isActive,
  isReopen,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  TRANSITIONS,
} from "./status";

const statuses = Object.values(Status);
const priorities = Object.values(Priority);

describe("labels and colours", () => {
  it("name every status and give it a colour", () => {
    for (const status of statuses) {
      expect(STATUS_LABEL[status]).toBeTruthy();
      expect(STATUS_COLOR[status]).toBeTruthy();
    }
  });

  it("name every priority and give it a colour", () => {
    for (const priority of priorities) {
      expect(PRIORITY_LABEL[priority]).toBeTruthy();
      expect(PRIORITY_COLOR[priority]).toBeTruthy();
    }
  });

  it("never reuse a label", () => {
    expect(new Set(statuses.map((s) => STATUS_LABEL[s])).size).toBe(
      statuses.length,
    );
    expect(new Set(priorities.map((p) => PRIORITY_LABEL[p])).size).toBe(
      priorities.length,
    );
  });
});

describe("TRANSITIONS", () => {
  it("has an entry for every status, leading only to real statuses", () => {
    for (const status of statuses) {
      expect(TRANSITIONS[status].length).toBeGreaterThan(0);
      for (const to of TRANSITIONS[status]) expect(statuses).toContain(to);
    }
  });

  it("never leads a status to itself", () => {
    for (const status of statuses) {
      expect(TRANSITIONS[status]).not.toContain(status);
    }
  });

  it("only starts a ticket by taking it into work", () => {
    expect(TRANSITIONS[Status.Open]).toEqual([Status.InProgress]);
  });

  it("lets a finished ticket come back only into work", () => {
    expect(TRANSITIONS[Status.Closed]).toEqual([Status.InProgress]);
    expect(TRANSITIONS[Status.Resolved]).toContain(Status.InProgress);
  });
});

describe("isReopen", () => {
  it("is true for going back into work from resolved or closed", () => {
    expect(isReopen(Status.Resolved, Status.InProgress)).toBe(true);
    expect(isReopen(Status.Closed, Status.InProgress)).toBe(true);
  });

  it("is false for ordinary moves", () => {
    expect(isReopen(Status.Open, Status.InProgress)).toBe(false);
    expect(isReopen(Status.WaitingCustomer, Status.InProgress)).toBe(false);
    expect(isReopen(Status.InProgress, Status.Resolved)).toBe(false);
    expect(isReopen(Status.Resolved, Status.Closed)).toBe(false);
  });

  it("agrees with the allowed transitions: every reopen is allowed", () => {
    for (const from of statuses) {
      for (const to of statuses) {
        if (isReopen(from, to)) expect(TRANSITIONS[from]).toContain(to);
      }
    }
  });
});

describe("isActive", () => {
  it("is false only for resolved and closed", () => {
    expect(statuses.filter((s) => !isActive(s))).toEqual([
      Status.Resolved,
      Status.Closed,
    ]);
  });
});
