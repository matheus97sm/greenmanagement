import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Status } from "@/domain/enums";
import { STATUS_LABEL } from "@/domain/status";
import { renderWithProviders } from "@/test-utils";
import { StatusBadge } from ".";

describe("StatusBadge", () => {
  it.each(Object.values(Status))(
    "names the status %s in Portuguese",
    (status) => {
      renderWithProviders(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_LABEL[status])).toBeInTheDocument();
    },
  );

  it("uses a different label for every status", () => {
    const labels = Object.values(Status).map((status) => STATUS_LABEL[status]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
