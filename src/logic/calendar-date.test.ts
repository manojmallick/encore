import { describe, expect, it } from "vitest";

import { CalendarDateInputError, calendarDaysUntil } from "./calendar-date";

describe("UTC calendar dates", () => {
  it("uses the UTC calendar day for equivalent timezone-offset instants", () => {
    const pacificInstant = new Date("2026-03-08T23:30:00-08:00");
    const sameUtcInstant = new Date("2026-03-09T07:30:00.000Z");

    expect(calendarDaysUntil("2026-03-10", pacificInstant)).toBe(1);
    expect(calendarDaysUntil("2026-03-10", sameUtcInstant)).toBe(1);
  });

  it("ignores time of day and remains stable across daylight-saving boundaries", () => {
    expect(calendarDaysUntil("2026-11-02", new Date("2026-10-31T00:01:00.000Z"))).toBe(2);
    expect(calendarDaysUntil("2026-11-02", new Date("2026-10-31T23:59:00.000Z"))).toBe(2);
  });

  it("returns zero for the same UTC day and negative values for past targets", () => {
    expect(calendarDaysUntil("2026-07-19", new Date("2026-07-19T23:59:00.000Z"))).toBe(0);
    expect(calendarDaysUntil("2026-07-18", new Date("2026-07-19T00:01:00.000Z"))).toBe(-1);
  });

  it("rejects impossible targets and invalid current clocks", () => {
    expect(() => calendarDaysUntil("2026-02-30", new Date())).toThrowError(
      expect.objectContaining({ code: "invalid_target_date" }),
    );
    expect(() => calendarDaysUntil("2026-08-15", new Date(Number.NaN))).toThrowError(
      expect.objectContaining({ code: "invalid_current_date" }),
    );
    expect(() => calendarDaysUntil("not-a-date", new Date())).toThrowError(
      CalendarDateInputError,
    );
  });
});
