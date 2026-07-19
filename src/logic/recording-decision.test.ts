import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import type { PracticePlanStorage } from "./practice-plan-storage";
import {
  createRecordingDecision,
  persistRecordingDecision,
  recordingDecisionStorageKey,
  restoreRecordingDecision,
} from "./recording-decision";
import type { RecordingReadinessResult, RecordingReadinessStatus } from "./recording-readiness";

function readiness(status: RecordingReadinessStatus): RecordingReadinessResult {
  return {
    status,
    score: status === "insufficient_data" ? null : 80,
    title: "Readiness",
    message: "Explanation",
    reasons: ["Reason"],
    factors: {
      measuredSections: status === "insufficient_data" ? 0 : 5,
      totalSections: 5,
      averageConfidence: status === "insufficient_data" ? null : 4,
      decliningSections: 0,
      daysRemaining: 2,
      originalPlanDays: 27,
      timeUsedPercent: 93,
      expectedConfidence: 4.63,
      confidenceGap: status === "insufficient_data" ? null : 0.63,
    },
  };
}

class MemoryStorage implements PracticePlanStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe("recording decisions", () => {
  it("creates ready and keep-practicing decisions", () => {
    expect(
      createRecordingDecision(
        DEMO_SONG_MAP.id,
        "recorded",
        readiness("ready"),
        false,
        "2026-08-14T10:00:00.000Z",
      ),
    ).toMatchObject({ decision: "recorded", readinessStatus: "ready" });
    expect(
      createRecordingDecision(
        DEMO_SONG_MAP.id,
        "keep_practicing",
        readiness("behind"),
        false,
        "2026-07-20T10:00:00.000Z",
      ),
    ).toMatchObject({ decision: "keep_practicing", acknowledgedNotReady: false });
  });

  it("requires explicit acknowledgement to record before ready", () => {
    expect(() =>
      createRecordingDecision(
        DEMO_SONG_MAP.id,
        "recorded",
        readiness("on_track"),
        false,
        "2026-07-20T10:00:00.000Z",
      ),
    ).toThrow();
    expect(
      createRecordingDecision(
        DEMO_SONG_MAP.id,
        "recorded",
        readiness("on_track"),
        true,
        "2026-07-20T10:00:00.000Z",
      ),
    ).toMatchObject({ decision: "recorded", acknowledgedNotReady: true });
  });

  it("round-trips a validated decision per Song Map", () => {
    const storage = new MemoryStorage();
    const decision = createRecordingDecision(
      DEMO_SONG_MAP.id,
      "recorded",
      readiness("ready"),
      false,
      "2026-08-14T10:00:00.000Z",
    );

    expect(persistRecordingDecision(storage, decision)).toBe(true);
    expect(restoreRecordingDecision(storage, DEMO_SONG_MAP.id)).toEqual(decision);
  });

  it("discards malformed or mismatched decisions and tolerates denied storage", () => {
    const storage = new MemoryStorage();
    const key = recordingDecisionStorageKey(DEMO_SONG_MAP.id);
    storage.setItem(key, "not-json");
    expect(restoreRecordingDecision(storage, DEMO_SONG_MAP.id)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    const denied: PracticePlanStorage = {
      getItem() { throw new Error("denied"); },
      setItem() { throw new Error("denied"); },
      removeItem() { throw new Error("denied"); },
    };
    expect(restoreRecordingDecision(denied, DEMO_SONG_MAP.id)).toBeNull();
    const decision = createRecordingDecision(
      DEMO_SONG_MAP.id,
      "keep_practicing",
      readiness("on_track"),
      false,
      "2026-07-20T10:00:00.000Z",
    );
    expect(persistRecordingDecision(denied, decision)).toBe(false);
  });
});
