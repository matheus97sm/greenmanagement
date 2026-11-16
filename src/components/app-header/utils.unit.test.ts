import { describe, expect, it } from "vitest";
import { isCurrentPage } from "./utils";

describe("isCurrentPage", () => {
  it("matches the page itself", () => {
    expect(isCurrentPage("/manager/tickets", "/manager/tickets")).toBe(true);
  });

  it("matches a page opened inside it, such as a conversation", () => {
    expect(isCurrentPage("/manager/tickets/abc-123", "/manager/tickets")).toBe(
      true,
    );
  });

  it("does not match another page", () => {
    expect(isCurrentPage("/manager/dashboard", "/manager/tickets")).toBe(false);
  });

  it("does not match a path that only starts with the same letters", () => {
    expect(isCurrentPage("/manager/ticketsX", "/manager/tickets")).toBe(false);
  });
});
