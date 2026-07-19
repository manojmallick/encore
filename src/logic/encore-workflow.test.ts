import { describe, expect, it, vi } from "vitest";

import {
  DEMO_SONG_MAP,
  LyricRiskBlockedError,
  MakingOfCaptionInputError,
  MakingOfCaptionOutputError,
  PracticeLogInputError,
  PracticePlanOutputError,
  SongPublicationInputError,
  calculateRecordingReadiness,
  computeSectionTrends,
  createCreatorDashboard,
  createPracticeLogEntry,
  createRecordingDecision,
  createSongPublication,
  generateCountdownPracticePlan,
  generateMakingOfCaption,
  persistPracticeLogs,
  persistPracticePlan,
  persistRecordingDecision,
  persistSongPublication,
  practiceLogStorageKey,
  practicePlanStorageKey,
  removeSongPublication,
  restorePracticeLogs,
  restorePracticePlan,
  restoreRecordingDecision,
  restoreSongPublication,
  songPublicationStorageKey,
  type PracticePlanStorage,
} from ".";

const NOW = new Date("2026-07-19T12:00:00.000Z");
const CAPTION =
  "I built confidence in every mapped section and carried that work into a complete recording of Dreams.";

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

function uuid(index: number): string {
  return `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function mutableSongMap() {
  return {
    ...DEMO_SONG_MAP,
    sections: DEMO_SONG_MAP.sections.map((section) => ({ ...section })),
  };
}

async function createPlan() {
  return generateCountdownPracticePlan(
    { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
    async ({ totalSessions }) => ({
      sessions: Array.from({ length: totalSessions }, (_, index) => ({
        sessionNumber: index + 1,
        focus: index < totalSessions - 2 ? "Section control" : "Full run-through",
        technique: "Use a concrete structural practice technique.",
      })),
    }),
    NOW,
  );
}

describe("Encore critical workflow", () => {
  it("moves validated state from plan through practice, record, caption, and publish", async () => {
    const storage = new MemoryStorage();
    const plan = await createPlan();
    expect(persistPracticePlan(storage, DEMO_SONG_MAP, 2, plan)).toBe(true);
    expect(restorePracticePlan(storage, DEMO_SONG_MAP)?.plan).toEqual(plan);

    const logs = DEMO_SONG_MAP.sections.flatMap((section, sectionIndex) =>
      [3, 5].map((confidenceLevel, entryIndex) =>
        createPracticeLogEntry(
          {
            sectionId: section.id,
            sessionNumber: (sectionIndex % plan.totalSessions) + 1,
            confidenceLevel: confidenceLevel as 3 | 5,
            note: `${section.name} stayed controlled during a structural run-through.`,
          },
          {
            songMap: DEMO_SONG_MAP,
            totalSessions: plan.totalSessions,
            id: uuid(sectionIndex * 2 + entryIndex + 1),
            loggedAt: `2026-07-1${entryIndex + 7}T1${sectionIndex}:00:00.000Z`,
          },
        ),
      ),
    );
    expect(persistPracticeLogs(storage, DEMO_SONG_MAP, logs)).toBe(true);
    expect(restorePracticeLogs(storage, DEMO_SONG_MAP)).toEqual(logs);

    const trends = computeSectionTrends(
      logs,
      DEMO_SONG_MAP.sections.map((section) => section.id),
    );
    const readiness = calculateRecordingReadiness({
      sectionTrends: trends,
      daysRemaining: 2,
      originalPlanDays: plan.daysRemaining,
    });
    expect(readiness.status).toBe("ready");
    expect(
      createCreatorDashboard({
        songMap: DEMO_SONG_MAP,
        plan,
        practiceLogs: logs,
        sectionTrends: trends,
        readiness,
      }).recommendation.action,
    ).toBe("record");

    const decision = createRecordingDecision(
      DEMO_SONG_MAP.id,
      "recorded",
      readiness,
      false,
      "2026-07-19T12:10:00.000Z",
    );
    expect(persistRecordingDecision(storage, decision)).toBe(true);
    expect(restoreRecordingDecision(storage, DEMO_SONG_MAP.id)).toEqual(decision);

    const caption = await generateMakingOfCaption(
      { songMap: mutableSongMap(), practiceLogs: logs, recordingDecision: decision },
      async () => ({ caption: CAPTION }),
    );
    const publication = createSongPublication(
      DEMO_SONG_MAP.id,
      decision,
      caption,
      "2026-07-19T12:20:00.000Z",
    );
    expect(persistSongPublication(storage, publication)).toBe(true);
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, decision)).toEqual(publication);

    expect(removeSongPublication(storage, DEMO_SONG_MAP.id)).toBe(true);
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, decision)).toBeNull();
    expect(restoreRecordingDecision(storage, DEMO_SONG_MAP.id)).toEqual(decision);
    expect(restorePracticeLogs(storage, DEMO_SONG_MAP)).toEqual(logs);
  });

  it("blocks lyric-risky song notes before plan model invocation", async () => {
    const generateModelOutput = vi.fn();
    const unsafeSongMap = {
      ...DEMO_SONG_MAP,
      sections: DEMO_SONG_MAP.sections.map((section, index) =>
        index === 0
          ? {
              ...section,
              difficultyNotes:
                'Copied text: "A very long quoted passage copied line by line instead of a structural practice note."',
            }
          : section,
      ),
    };

    await expect(
      generateCountdownPracticePlan(
        { songMap: unsafeSongMap, sessionsPerWeek: 2 },
        generateModelOutput,
        NOW,
      ),
    ).rejects.toBeInstanceOf(LyricRiskBlockedError);
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("rejects malformed plan output and invalid practice relationships", async () => {
    await expect(
      generateCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        async () => ({ sessions: [] }),
        NOW,
      ),
    ).rejects.toBeInstanceOf(PracticePlanOutputError);

    expect(() =>
      createPracticeLogEntry(
        {
          sectionId: uuid(90),
          sessionNumber: 1,
          confidenceLevel: 3,
          note: "A structural observation.",
        },
        {
          songMap: mutableSongMap(),
          totalSessions: 2,
          id: uuid(91),
          loggedAt: "2026-07-19T12:00:00.000Z",
        },
      ),
    ).toThrow(PracticeLogInputError);
  });

  it("rejects mismatched history and unsafe generated captions before publication", async () => {
    const plan = await createPlan();
    const readiness = calculateRecordingReadiness({
      sectionTrends: computeSectionTrends([], DEMO_SONG_MAP.sections.map((section) => section.id)),
      daysRemaining: 2,
      originalPlanDays: plan.daysRemaining,
    });
    const decision = createRecordingDecision(
      DEMO_SONG_MAP.id,
      "recorded",
      readiness,
      true,
      "2026-07-19T12:00:00.000Z",
    );
    const mismatchedLog = createPracticeLogEntry(
      {
        sectionId: DEMO_SONG_MAP.sections[0]!.id,
        sessionNumber: 1,
        confidenceLevel: 3,
        note: "The transition stayed controlled.",
      },
      {
        songMap: DEMO_SONG_MAP,
        totalSessions: plan.totalSessions,
        id: uuid(92),
        loggedAt: "2026-07-19T12:00:00.000Z",
      },
    );
    const generateModelOutput = vi.fn(async () => ({ caption: CAPTION }));

    await expect(
      generateMakingOfCaption(
        {
          songMap: mutableSongMap(),
          practiceLogs: [{ ...mismatchedLog, songMapId: uuid(93) }],
          recordingDecision: decision,
        },
        generateModelOutput,
      ),
    ).rejects.toBeInstanceOf(MakingOfCaptionInputError);
    expect(generateModelOutput).not.toHaveBeenCalled();

    await expect(
      generateMakingOfCaption(
        {
          songMap: mutableSongMap(),
          practiceLogs: [mismatchedLog],
          recordingDecision: decision,
        },
        async () => ({
          caption:
            'My story includes "A very long quoted passage copied from somewhere instead of a safe account of practice."',
        }),
      ),
    ).rejects.toBeInstanceOf(MakingOfCaptionOutputError);

    expect(() =>
      createSongPublication(
        DEMO_SONG_MAP.id,
        { ...decision, songMapId: uuid(94) },
        {
          model: "gpt-5.6",
          caption: CAPTION,
          practiceSessions: 1,
          practiceEntries: 1,
          lyricRisk: { passed: true, message: "Passed." },
        },
        "2026-07-19T12:30:00.000Z",
      ),
    ).toThrow(SongPublicationInputError);
  });

  it("discards corrupted and orphaned persisted workflow state", async () => {
    const storage = new MemoryStorage();
    storage.setItem(practicePlanStorageKey(DEMO_SONG_MAP.id), "{not-json");
    storage.setItem(practiceLogStorageKey(DEMO_SONG_MAP.id), "{not-json");

    expect(restorePracticePlan(storage, DEMO_SONG_MAP)).toBeNull();
    expect(restorePracticeLogs(storage, DEMO_SONG_MAP)).toEqual([]);
    expect(storage.values.has(practicePlanStorageKey(DEMO_SONG_MAP.id))).toBe(false);
    expect(storage.values.has(practiceLogStorageKey(DEMO_SONG_MAP.id))).toBe(false);

    const plan = await createPlan();
    const readiness = calculateRecordingReadiness({
      sectionTrends: computeSectionTrends([], DEMO_SONG_MAP.sections.map((section) => section.id)),
      daysRemaining: 2,
      originalPlanDays: plan.daysRemaining,
    });
    const decision = createRecordingDecision(
      DEMO_SONG_MAP.id,
      "recorded",
      readiness,
      true,
      "2026-07-19T12:00:00.000Z",
    );
    const log = createPracticeLogEntry(
      {
        sectionId: DEMO_SONG_MAP.sections[0]!.id,
        sessionNumber: 1,
        confidenceLevel: 3,
        note: "The transition stayed controlled.",
      },
      {
        songMap: DEMO_SONG_MAP,
        totalSessions: plan.totalSessions,
        id: uuid(95),
        loggedAt: "2026-07-19T12:00:00.000Z",
      },
    );
    const caption = await generateMakingOfCaption(
      { songMap: mutableSongMap(), practiceLogs: [log], recordingDecision: decision },
      async () => ({ caption: CAPTION }),
    );
    const publication = createSongPublication(
      DEMO_SONG_MAP.id,
      decision,
      caption,
      "2026-07-19T12:30:00.000Z",
    );
    expect(persistSongPublication(storage, publication)).toBe(true);

    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, null)).toBeNull();
    expect(storage.values.has(songPublicationStorageKey(DEMO_SONG_MAP.id))).toBe(false);
  });
});
