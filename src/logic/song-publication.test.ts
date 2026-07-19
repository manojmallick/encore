import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  SONG_PUBLICATION_STORAGE_VERSION,
  SongPublicationInputError,
  createSongPublication,
  persistSongPublication,
  removeSongPublication,
  restoreSongPublication,
  songPublicationStorageKey,
  type GeneratedMakingOfCaption,
  type RecordingDecision,
} from "./index";

const CAPTION: GeneratedMakingOfCaption = {
  model: "gpt-5.6",
  caption:
    "I spent two focused sessions making the Chorus transition feel steady. Here is my recorded cover of Dreams.",
  practiceSessions: 2,
  practiceEntries: 2,
  lyricRisk: {
    passed: true,
    message: "Lyric-risk check passed — generated only from the notes you provided.",
  },
};

const RECORDED_DECISION: RecordingDecision = {
  songMapId: DEMO_SONG_MAP.id,
  decision: "recorded",
  decidedAt: "2026-07-19T10:00:00.000Z",
  readinessStatus: "on_track",
  readinessScore: 80,
  acknowledgedNotReady: true,
};

class MemoryStorage {
  readonly values = new Map<string, string>();
  failReads = false;
  failWrites = false;
  failRemoves = false;

  getItem(key: string): string | null {
    if (this.failReads) throw new Error("read denied");
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("write denied");
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failRemoves) throw new Error("remove denied");
    this.values.delete(key);
  }
}

describe("song publication lifecycle", () => {
  it("creates a published caption snapshot for a matching recorded decision", () => {
    expect(
      createSongPublication(
        DEMO_SONG_MAP.id,
        RECORDED_DECISION,
        CAPTION,
        "2026-07-19T11:00:00.000Z",
      ),
    ).toEqual({
      songMapId: DEMO_SONG_MAP.id,
      status: "published",
      publishedAt: "2026-07-19T11:00:00.000Z",
      caption: CAPTION,
    });
  });

  it("rejects non-recorded, mismatched, and malformed publication inputs", () => {
    expect(() =>
      createSongPublication(
        DEMO_SONG_MAP.id,
        { ...RECORDED_DECISION, decision: "keep_practicing" },
        CAPTION,
        "2026-07-19T11:00:00.000Z",
      ),
    ).toThrowError(SongPublicationInputError);
    expect(() =>
      createSongPublication(
        DEMO_SONG_MAP.id,
        {
          ...RECORDED_DECISION,
          songMapId: "20000000-0000-4000-8000-000000000001",
        },
        CAPTION,
        "2026-07-19T11:00:00.000Z",
      ),
    ).toThrowError(SongPublicationInputError);
    expect(() =>
      createSongPublication(
        DEMO_SONG_MAP.id,
        RECORDED_DECISION,
        { ...CAPTION, caption: "Too short" },
        "2026-07-19T11:00:00.000Z",
      ),
    ).toThrowError(SongPublicationInputError);
  });

  it("persists and restores a versioned publication record", () => {
    const storage = new MemoryStorage();
    const publication = createSongPublication(
      DEMO_SONG_MAP.id,
      RECORDED_DECISION,
      CAPTION,
      "2026-07-19T11:00:00.000Z",
    );

    expect(persistSongPublication(storage, publication)).toBe(true);
    expect(
      JSON.parse(storage.values.get(songPublicationStorageKey(DEMO_SONG_MAP.id))!),
    ).toMatchObject({
      version: SONG_PUBLICATION_STORAGE_VERSION,
      publication: { status: "published" },
    });
    expect(
      restoreSongPublication(storage, DEMO_SONG_MAP.id, RECORDED_DECISION),
    ).toEqual(publication);
  });

  it("discards malformed, mismatched, and orphaned publication state", () => {
    const storage = new MemoryStorage();
    const key = songPublicationStorageKey(DEMO_SONG_MAP.id);

    storage.values.set(key, "not json");
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, RECORDED_DECISION)).toBeNull();
    expect(storage.values.has(key)).toBe(false);

    storage.values.set(
      key,
      JSON.stringify({
        version: SONG_PUBLICATION_STORAGE_VERSION,
        publication: {
          ...createSongPublication(
            DEMO_SONG_MAP.id,
            RECORDED_DECISION,
            CAPTION,
            "2026-07-19T11:00:00.000Z",
          ),
          songMapId: "20000000-0000-4000-8000-000000000001",
        },
      }),
    );
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, RECORDED_DECISION)).toBeNull();
    expect(storage.values.has(key)).toBe(false);

    const publication = createSongPublication(
      DEMO_SONG_MAP.id,
      RECORDED_DECISION,
      CAPTION,
      "2026-07-19T11:00:00.000Z",
    );
    persistSongPublication(storage, publication);
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, null)).toBeNull();
    expect(storage.values.has(key)).toBe(false);
  });

  it("handles unavailable storage and reopening without losing the in-memory record", () => {
    const storage = new MemoryStorage();
    const publication = createSongPublication(
      DEMO_SONG_MAP.id,
      RECORDED_DECISION,
      CAPTION,
      "2026-07-19T11:00:00.000Z",
    );

    storage.failWrites = true;
    expect(persistSongPublication(storage, publication)).toBe(false);
    storage.failWrites = false;
    persistSongPublication(storage, publication);
    storage.failReads = true;
    expect(restoreSongPublication(storage, DEMO_SONG_MAP.id, RECORDED_DECISION)).toBeNull();
    storage.failReads = false;
    storage.failRemoves = true;
    expect(removeSongPublication(storage, DEMO_SONG_MAP.id)).toBe(false);
    expect(storage.values.has(songPublicationStorageKey(DEMO_SONG_MAP.id))).toBe(true);
    storage.failRemoves = false;
    expect(removeSongPublication(storage, DEMO_SONG_MAP.id)).toBe(true);
    expect(storage.values.has(songPublicationStorageKey(DEMO_SONG_MAP.id))).toBe(false);
  });
});
