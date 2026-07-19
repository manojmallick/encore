import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import type { GeneratedPracticePlan } from "./practice-plan";
import {
  persistPracticePlan,
  practicePlanStorageKey,
  restorePracticePlan,
  type PracticePlanStorage,
} from "./practice-plan-storage";

const PLAN: GeneratedPracticePlan = {
  model: "gpt-5.6",
  daysRemaining: 27,
  totalSessions: 2,
  lyricRisk: { passed: true, message: "Artist notes passed the lyric-risk check." },
  sessions: [
    { sessionNumber: 1, focus: "Bridge transition", technique: "Loop it slowly." },
    { sessionNumber: 2, focus: "Full run-through", technique: "Record one take." },
  ],
};

class MemoryStorage implements PracticePlanStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("practice-plan browser persistence", () => {
  it("round-trips a validated plan per Song Map", () => {
    const storage = new MemoryStorage();

    expect(persistPracticePlan(storage, DEMO_SONG_MAP, 2, PLAN)).toBe(true);
    expect(restorePracticePlan(storage, DEMO_SONG_MAP)).toEqual({
      sessionsPerWeek: 2,
      plan: PLAN,
    });
  });

  it("ignores and removes malformed stored values", () => {
    const storage = new MemoryStorage();
    const key = practicePlanStorageKey(DEMO_SONG_MAP.id);
    storage.setItem(key, "not-json");

    expect(restorePracticePlan(storage, DEMO_SONG_MAP)).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it("invalidates a plan when the Song Map target date changes", () => {
    const storage = new MemoryStorage();
    persistPracticePlan(storage, DEMO_SONG_MAP, 2, PLAN);

    expect(
      restorePracticePlan(storage, { ...DEMO_SONG_MAP, targetDate: "2026-08-16" }),
    ).toBeNull();
  });

  it("rejects invalid plans and tolerates unavailable browser storage", () => {
    const storage = new MemoryStorage();
    expect(
      persistPracticePlan(storage, DEMO_SONG_MAP, 2, { ...PLAN, totalSessions: 3 }),
    ).toBe(false);

    const unavailableStorage: PracticePlanStorage = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
      removeItem() {
        throw new Error("denied");
      },
    };
    expect(restorePracticePlan(unavailableStorage, DEMO_SONG_MAP)).toBeNull();
    expect(persistPracticePlan(unavailableStorage, DEMO_SONG_MAP, 2, PLAN)).toBe(false);
  });
});
