import { Language, setLanguage } from "@/i18n";
import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatDayMonth,
  formatDuration,
  formatHours,
  formatPercent,
} from "./format";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatDuration", () => {
  it("says less than a minute below one minute", () => {
    expect(formatDuration(0)).toBe("menos de 1min");
    expect(formatDuration(MIN - 1)).toBe("menos de 1min");
  });

  it("says it in English when the language is switched", async () => {
    await setLanguage(Language.EnUs);
    expect(formatDuration(0)).toBe("less than 1min");
  });

  it("uses minutes below an hour", () => {
    expect(formatDuration(MIN)).toBe("1min");
    expect(formatDuration(59 * MIN + 59_000)).toBe("59min");
  });

  it("uses hours and leftover minutes below a day", () => {
    expect(formatDuration(HOUR)).toBe("1h");
    expect(formatDuration(90 * MIN)).toBe("1h 30min");
    expect(formatDuration(23 * HOUR + 59 * MIN)).toBe("23h 59min");
  });

  it("uses days and leftover hours from a day on", () => {
    expect(formatDuration(DAY)).toBe("1d");
    expect(formatDuration(26 * HOUR)).toBe("1d 2h");
    expect(formatDuration(300 * DAY)).toBe("300d");
  });

  it("measures overdue time the same way as time left", () => {
    expect(formatDuration(-2 * HOUR)).toBe(formatDuration(2 * HOUR));
  });
});

describe("formatDateTime", () => {
  const instant = "2026-11-03T13:00:00Z";

  it("shows the date and time in the given time zone", () => {
    expect(formatDateTime(instant, "America/Sao_Paulo")).toMatch(
      /03\/11\/2026.*10:00/,
    );
  });

  it("shows the same instant differently in another zone", () => {
    expect(formatDateTime(instant, "Europe/Lisbon")).toMatch(
      /03\/11\/2026.*13:00/,
    );
  });

  it("follows the locale it is given", () => {
    expect(formatDateTime(instant, "UTC", "en-US")).toMatch(/11\/3\/26/);
  });
});

describe("formatHours", () => {
  it("writes whole hours without decimals", () => {
    expect(formatHours(0)).toBe("0 h");
    expect(formatHours(12 * HOUR)).toBe("12 h");
  });

  it("uses a decimal comma with one digit", () => {
    expect(formatHours(2.5 * HOUR)).toBe("2,5 h");
  });

  it("follows the language it is given", () => {
    expect(formatHours(2.5 * HOUR, Language.EnUs)).toBe("2.5 h");
  });

  it("rounds to one decimal", () => {
    expect(formatHours(1.04 * HOUR)).toBe("1 h");
    expect(formatHours(1.26 * HOUR)).toBe("1,3 h");
  });
});

describe("formatPercent", () => {
  it("turns a share into a rounded percentage", () => {
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(0.254)).toBe("25%");
    expect(formatPercent(1)).toBe("100%");
  });

  it("rounds half up", () => {
    expect(formatPercent(0.005)).toBe("1%");
  });
});

describe("formatDayMonth", () => {
  it("writes day and month with two digits", () => {
    expect(formatDayMonth(Date.parse("2026-11-02T15:00:00Z"), "UTC")).toBe(
      "02/11",
    );
  });

  it("follows the language it is given", () => {
    expect(
      formatDayMonth(Date.parse("2026-11-02T15:00:00Z"), "UTC", Language.EnUs),
    ).toBe("11/02");
  });

  it("uses the day of the given time zone", () => {
    const earlyUtc = Date.parse("2026-11-02T01:00:00Z");
    expect(formatDayMonth(earlyUtc, "UTC")).toBe("02/11");
    expect(formatDayMonth(earlyUtc, "America/Sao_Paulo")).toBe("01/11");
  });
});
