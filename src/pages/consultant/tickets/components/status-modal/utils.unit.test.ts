import { describe, expect, it } from "vitest";
import { Status } from "@/domain/enums";
import { targetOptions } from "./utils";

describe("targetOptions", () => {
  it("offers the forward transitions of an open ticket", () => {
    expect(targetOptions(Status.Open)).toEqual([Status.InProgress]);
  });

  it("offers waiting for the customer or resolving, while in progress", () => {
    expect(targetOptions(Status.InProgress)).toEqual([
      Status.WaitingCustomer,
      Status.Resolved,
    ]);
  });

  it("offers closing a resolved ticket, but not reopening it, unless asked", () => {
    expect(targetOptions(Status.Resolved)).toEqual([Status.Closed]);
    expect(targetOptions(Status.Resolved, true)).toEqual([Status.InProgress]);
  });

  it("offers only reopening for a closed ticket", () => {
    expect(targetOptions(Status.Closed)).toEqual([]);
    expect(targetOptions(Status.Closed, true)).toEqual([Status.InProgress]);
  });

  it("offers nothing to reopen on a ticket that is not finished", () => {
    expect(targetOptions(Status.InProgress, true)).toEqual([]);
  });
});
