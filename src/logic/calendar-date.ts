import { z } from "zod";

const MILLISECONDS_PER_DAY = 86_400_000;
const IsoCalendarDateSchema = z.iso.date();

export type CalendarDateInputErrorCode = "invalid_target_date" | "invalid_current_date";

export class CalendarDateInputError extends TypeError {
  readonly code: CalendarDateInputErrorCode;

  constructor(code: CalendarDateInputErrorCode, message: string) {
    super(message);
    this.name = "CalendarDateInputError";
    this.code = code;
  }
}

function utcDayFromTarget(targetDate: string): number {
  const parsed = IsoCalendarDateSchema.safeParse(targetDate);
  if (!parsed.success) {
    throw new CalendarDateInputError(
      "invalid_target_date",
      "Target date must be a real calendar date in YYYY-MM-DD format.",
    );
  }

  const [year, month, day] = parsed.data.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function utcDayFromInstant(now: Date): number {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new CalendarDateInputError(
      "invalid_current_date",
      "Calendar calculation requires a valid current date.",
    );
  }

  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function calendarDaysUntil(targetDate: string, now: Date): number {
  return (utcDayFromTarget(targetDate) - utcDayFromInstant(now)) / MILLISECONDS_PER_DAY;
}
