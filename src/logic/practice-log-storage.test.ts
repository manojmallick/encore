import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  persistPracticeLogs,
  practiceLogStorageKey,
  restorePracticeLogs,
} from "./practice-log-storage";
import type { PracticePlanStorage } from "./practice-plan-storage";
import type { PracticeLogEntry } from "./section-mastery";

const ENTRY: PracticeLogEntry = {
  id: "9d8c9f62-c437-4f4a-8b4b-000000000001",
  songMapId: DEMO_SONG_MAP.id,
  sectionId: DEMO_SONG_MAP.sections[3]!.id,
  sessionNumber: 2,
  loggedAt: "2026-07-21T10:00:00.000Z",
  confidenceLevel: 3,
  note: "The transition is steadier at a slower tempo.",
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

describe("practice-log browser persistence", () => {
  it("round-trips validated entries per Song Map", () => {
    const storage = new MemoryStorage();

    expect(persistPracticeLogs(storage, DEMO_SONG_MAP, [ENTRY])).toBe(true);
    expect(restorePracticeLogs(storage, DEMO_SONG_MAP)).toEqual([ENTRY]);
  });

  it("ignores and removes malformed stored logs", () => {
    const storage = new MemoryStorage();
    const key = practiceLogStorageKey(DEMO_SONG_MAP.id);
    storage.setItem(key, "not-json");

    expect(restorePracticeLogs(storage, DEMO_SONG_MAP)).toEqual([]);
    expect(storage.getItem(key)).toBeNull();
  });

  it("rejects entries for another Song Map or an unknown section", () => {
    const storage = new MemoryStorage();

    expect(
      persistPracticeLogs(storage, DEMO_SONG_MAP, [
        { ...ENTRY, songMapId: "9d8c9f62-c437-4f4a-8b4b-000000000099" },
      ]),
    ).toBe(false);
    expect(
      persistPracticeLogs(storage, DEMO_SONG_MAP, [
        { ...ENTRY, sectionId: "9d8c9f62-c437-4f4a-8b4b-000000000099" },
      ]),
    ).toBe(false);
  });

  it("tolerates unavailable browser storage", () => {
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

    expect(restorePracticeLogs(unavailableStorage, DEMO_SONG_MAP)).toEqual([]);
    expect(persistPracticeLogs(unavailableStorage, DEMO_SONG_MAP, [ENTRY])).toBe(false);
  });
});
