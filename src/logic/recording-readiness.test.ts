import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  calculateCalendarDaysRemaining,
  calculateRecordingReadiness,
  type RecordingReadinessInput,
} from "./recording-readiness";
import type { SectionTrend, SectionTrendDirection } from "./section-mastery";

function trend(
  index: number,
  latestConfidence: number | null,
  direction: SectionTrendDirection = "flat",
): SectionTrend {
  return {
    sectionId: DEMO_SONG_MAP.sections[index]!.id,
    latestConfidence,
    trend: latestConfidence === null ? "insufficient_data" : direction,
    entriesLogged: latestConfidence === null ? 0 : direction === "insufficient_data" ? 1 : 2,
  };
}

function input(overrides: Partial<RecordingReadinessInput> = {}): RecordingReadinessInput {
  return {
    sectionTrends: DEMO_SONG_MAP.sections.map((_, index) => trend(index, 3)),
    daysRemaining: 5,
    originalPlanDays: 10,
    ...overrides,
  };
}

describe("recording readiness", () => {
  it("withholds a score until every mapped section has confidence data", () => {
    const result = calculateRecordingReadiness(
      input({
        sectionTrends: [trend(0, 3), trend(1, 4), trend(2, null), trend(3, null), trend(4, 2)],
      }),
    );

    expect(result).toMatchObject({
      status: "insufficient_data",
      score: null,
      factors: {
        measuredSections: 3,
        totalSections: 5,
        averageConfidence: 3,
      },
    });
    expect(result.reasons).toContain("2 sections still need a first rating.");
  });

  it("returns on track with a transparent factor breakdown", () => {
    const result = calculateRecordingReadiness(input());

    expect(result).toMatchObject({
      status: "on_track",
      score: 60,
      factors: {
        averageConfidence: 3,
        decliningSections: 0,
        daysRemaining: 5,
        originalPlanDays: 10,
        timeUsedPercent: 50,
        expectedConfidence: 2.5,
        confidenceGap: -0.5,
      },
    });
  });

  it("returns behind when confidence lags expected by more than 1.2", () => {
    const result = calculateRecordingReadiness(
      input({
        sectionTrends: DEMO_SONG_MAP.sections.map((_, index) => trend(index, 2)),
        daysRemaining: 1,
        originalPlanDays: 10,
      }),
    );

    expect(result).toMatchObject({
      status: "behind",
      score: 40,
      factors: { expectedConfidence: 4.5, confidenceGap: 2.5 },
    });
  });

  it("returns behind for two declines even when confidence is high and the date is close", () => {
    const result = calculateRecordingReadiness(
      input({
        sectionTrends: [
          trend(0, 4, "declining"),
          trend(1, 5, "declining"),
          trend(2, 4),
          trend(3, 4),
          trend(4, 4),
        ],
        daysRemaining: 2,
        originalPlanDays: 10,
      }),
    );

    expect(result).toMatchObject({ status: "behind", score: 68 });
    expect(result.reasons).toContain("2 sections currently have declining confidence trends.");
  });

  it("returns ready only for complete high confidence near the target with no declines", () => {
    const result = calculateRecordingReadiness(
      input({
        sectionTrends: [trend(0, 4), trend(1, 5), trend(2, 4), trend(3, 4), trend(4, 4)],
        daysRemaining: 2,
        originalPlanDays: 10,
      }),
    );

    expect(result).toMatchObject({
      status: "ready",
      score: 84,
      factors: { averageConfidence: 4.2, decliningSections: 0 },
    });
  });

  it("keeps the exact 1.2 confidence-gap boundary on track", () => {
    const result = calculateRecordingReadiness(
      input({
        sectionTrends: [trend(0, 2), trend(1, 3), trend(2, 3), trend(3, 3), trend(4, 3)],
        daysRemaining: 1,
        originalPlanDays: 5,
      }),
    );

    expect(result.factors.confidenceGap).toBe(1.2);
    expect(result.status).toBe("on_track");
  });

  it("clamps time used and the readiness score", () => {
    const early = calculateRecordingReadiness(input({ daysRemaining: 20, originalPlanDays: 10 }));
    const low = calculateRecordingReadiness(
      input({
        sectionTrends: DEMO_SONG_MAP.sections.map((_, index) => trend(index, 1, "declining")),
        daysRemaining: 0,
      }),
    );

    expect(early.factors.timeUsedPercent).toBe(0);
    expect(low.factors.timeUsedPercent).toBe(100);
    expect(low.score).toBe(0);
  });

  it("rejects duplicate sections and inconsistent confidence coverage", () => {
    expect(() => calculateRecordingReadiness(input({ sectionTrends: [] }))).toThrow();
    expect(() =>
      calculateRecordingReadiness(
        input({ sectionTrends: [trend(0, 3), trend(0, 4)] }),
      ),
    ).toThrow();
    expect(() =>
      calculateRecordingReadiness(
        input({
          sectionTrends: [
            { ...trend(0, 3), latestConfidence: 6 },
            ...DEMO_SONG_MAP.sections.slice(1).map((_, index) => trend(index + 1, 3)),
          ],
        }),
      ),
    ).toThrow();
    expect(() =>
      calculateRecordingReadiness(
        input({
          sectionTrends: [
            { ...trend(0, 3), latestConfidence: null },
            ...DEMO_SONG_MAP.sections.slice(1).map((_, index) => trend(index + 1, 3)),
          ],
        }),
      ),
    ).toThrow();
    expect(() =>
      calculateRecordingReadiness(
        input({
          sectionTrends: [
            { ...trend(0, 3), entriesLogged: 1, trend: "flat" },
            ...DEMO_SONG_MAP.sections.slice(1).map((_, index) => trend(index + 1, 3)),
          ],
        }),
      ),
    ).toThrow();
  });
});

describe("readiness calendar", () => {
  it("calculates UTC calendar days and clamps past targets to zero", () => {
    expect(
      calculateCalendarDaysRemaining("2026-08-15", new Date("2026-07-19T23:30:00.000Z")),
    ).toBe(27);
    expect(
      calculateCalendarDaysRemaining("2026-07-18", new Date("2026-07-19T01:00:00.000Z")),
    ).toBe(0);
  });

  it("is invariant for equivalent timezone-offset instants", () => {
    expect(
      calculateCalendarDaysRemaining(
        "2026-08-15",
        new Date("2026-07-19T23:30:00-07:00"),
      ),
    ).toBe(
      calculateCalendarDaysRemaining(
        "2026-08-15",
        new Date("2026-07-20T06:30:00.000Z"),
      ),
    );
  });

  it("rejects impossible target dates and invalid current clocks", () => {
    expect(() =>
      calculateCalendarDaysRemaining("2026-02-30", new Date("2026-01-01T00:00:00.000Z")),
    ).toThrowError(expect.objectContaining({ code: "invalid_target_date" }));
    expect(() =>
      calculateCalendarDaysRemaining("2026-08-15", new Date(Number.NaN)),
    ).toThrowError(expect.objectContaining({ code: "invalid_current_date" }));
  });
});
