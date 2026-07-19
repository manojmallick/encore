import { describe, expect, it } from "vitest";

import { createCreatorDashboard } from "./creator-dashboard";
import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import type { GeneratedPracticePlan } from "./practice-plan";
import type { PracticeLogEntry, SectionTrend } from "./section-mastery";
import type { RecordingReadinessResult, RecordingReadinessStatus } from "./recording-readiness";

const PLAN: GeneratedPracticePlan = {
  model: "gpt-5.6",
  daysRemaining: 27,
  totalSessions: 2,
  lyricRisk: { passed: true, message: "Artist notes passed the lyric-risk check." },
  sessions: [
    { sessionNumber: 1, focus: "Bridge transition", technique: "Loop slowly." },
    { sessionNumber: 2, focus: "Full run-through", technique: "Record one take." },
  ],
};

function readiness(status: RecordingReadinessStatus): RecordingReadinessResult {
  return {
    status,
    score: status === "insufficient_data" ? null : 68,
    title: "Readiness",
    message: "Explanation",
    reasons: ["Reason"],
    factors: {
      measuredSections: status === "insufficient_data" ? 4 : 5,
      totalSections: 5,
      averageConfidence: status === "insufficient_data" ? 3 : 3.4,
      decliningSections: 1,
      daysRemaining: 8,
      originalPlanDays: 27,
      timeUsedPercent: 70,
      expectedConfidence: 3.5,
      confidenceGap: 0.1,
    },
  };
}

function trend(
  index: number,
  latestConfidence: number | null,
  direction: SectionTrend["trend"],
  entriesLogged = latestConfidence === null ? 0 : 2,
): SectionTrend {
  return {
    sectionId: DEMO_SONG_MAP.sections[index]!.id,
    latestConfidence,
    trend: direction,
    entriesLogged,
  };
}

const LOG: PracticeLogEntry = {
  id: "9d8c9f62-c437-4f4a-8b4b-000000000001",
  songMapId: DEMO_SONG_MAP.id,
  sectionId: DEMO_SONG_MAP.sections[1]!.id,
  sessionNumber: 1,
  loggedAt: "2026-07-20T10:00:00.000Z",
  confidenceLevel: 3,
  note: "Structural note.",
};

describe("creator dashboard projection", () => {
  it("combines progress, next session, coverage, and readiness", () => {
    const dashboard = createCreatorDashboard({
      songMap: DEMO_SONG_MAP,
      plan: PLAN,
      practiceLogs: [LOG],
      sectionTrends: [
        trend(0, null, "insufficient_data"),
        trend(1, 3, "declining"),
        trend(2, 2, "flat"),
        trend(3, 4, "improving"),
        trend(4, 2, "flat"),
      ],
      readiness: readiness("insufficient_data"),
    });

    expect(dashboard).toMatchObject({
      daysRemaining: 8,
      loggedSessions: 1,
      totalSessions: 2,
      measuredSections: 4,
      totalSections: 5,
      readinessStatus: "insufficient_data",
      readinessScore: null,
      nextSession: { sessionNumber: 2, focus: "Full run-through" },
      recommendation: { action: "gather_data" },
    });
  });

  it("ranks unrated, declining, then lower-confidence sections with map-order ties", () => {
    const dashboard = createCreatorDashboard({
      songMap: DEMO_SONG_MAP,
      plan: PLAN,
      practiceLogs: [LOG],
      sectionTrends: [
        trend(0, null, "insufficient_data"),
        trend(1, 3, "declining"),
        trend(2, 2, "flat"),
        trend(3, 4, "improving"),
        trend(4, 2, "flat"),
      ],
      readiness: readiness("insufficient_data"),
    });

    expect(dashboard.weakSections.map((section) => section.sectionName)).toEqual([
      "Intro",
      "Verse 1",
      "Chorus",
    ]);
    expect(dashboard.weakSections.map((section) => section.reason)).toEqual([
      "No confidence rating yet",
      "Declining at 3/5",
      "Confidence is 2/5",
    ]);
  });

  it.each([
    ["insufficient_data", "gather_data"],
    ["behind", "adjust_plan"],
    ["on_track", "keep_practicing"],
    ["ready", "record"],
  ] as const)("maps %s readiness to %s", (status, action) => {
    const dashboard = createCreatorDashboard({
      songMap: DEMO_SONG_MAP,
      plan: PLAN,
      practiceLogs: [],
      sectionTrends: DEMO_SONG_MAP.sections.map((_, index) => trend(index, 4, "flat")),
      readiness: readiness(status),
    });

    expect(dashboard.recommendation.action).toBe(action);
  });

  it("reports no next session after every planned session has a log", () => {
    const dashboard = createCreatorDashboard({
      songMap: DEMO_SONG_MAP,
      plan: PLAN,
      practiceLogs: [LOG, { ...LOG, id: "9d8c9f62-c437-4f4a-8b4b-000000000002", sessionNumber: 2 }],
      sectionTrends: DEMO_SONG_MAP.sections.map((_, index) => trend(index, 4, "flat")),
      readiness: readiness("on_track"),
    });

    expect(dashboard.loggedSessions).toBe(2);
    expect(dashboard.nextSession).toBeNull();
  });

  it("rejects missing or mismatched section trends", () => {
    expect(() =>
      createCreatorDashboard({
        songMap: DEMO_SONG_MAP,
        plan: PLAN,
        practiceLogs: [],
        sectionTrends: [trend(0, 3, "flat")],
        readiness: readiness("on_track"),
      }),
    ).toThrow();
  });
});
