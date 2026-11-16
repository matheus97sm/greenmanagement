import { describe, expect, it } from "vitest";
import { ApiErrorCode } from "@/domain/enums";
import { ApiError } from "./errors";

describe("ApiError", () => {
  it("carries the code of what was refused", () => {
    const error = new ApiError(ApiErrorCode.NotYourTicket);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(ApiErrorCode.NotYourTicket);
    expect(error.message).toBe(ApiErrorCode.NotYourTicket);
    expect(error.params).toEqual({});
  });

  it("carries the values that go with it", () => {
    const error = new ApiError(ApiErrorCode.TicketTakenByPerson, {
      name: "Rafael",
    });
    expect(error.params).toEqual({ name: "Rafael" });
  });
});
