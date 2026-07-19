import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  NOTE_KINDS,
  SECTION_STATUSES,
  SONG_STATUSES,
  type SongMap,
} from "./song-map";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

describe("Song Map domain", () => {
  it("keeps lifecycle vocabularies explicit and closed", () => {
    expect(SONG_STATUSES).toEqual(["in_progress", "recorded", "published"]);
    expect(SECTION_STATUSES).toEqual(["not_started", "in_progress", "ready"]);
    expect(NOTE_KINDS).toEqual(["artist_structural_note"]);
  });

  it("exports a deterministic fixture assignable to SongMap", () => {
    const songMap: SongMap = DEMO_SONG_MAP;

    expect(songMap).toMatchObject({
      title: "Dreams",
      artist: "Fleetwood Mac",
      status: "in_progress",
      targetDate: "2026-08-15",
      createdAt: "2026-07-19T08:00:00.000Z",
    });
    expect(songMap.id).toMatch(UUID_PATTERN);
    expect(songMap.targetDate).toMatch(ISO_DATE_PATTERN);
    expect(Date.parse(songMap.createdAt)).not.toBeNaN();
    expect(Date.parse(`${songMap.targetDate}T00:00:00.000Z`)).toBeGreaterThan(
      Date.parse(songMap.createdAt),
    );
  });

  it("uses unique stable IDs and contiguous zero-based section ordering", () => {
    const sectionIds = DEMO_SONG_MAP.sections.map(({ id }) => id);

    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(sectionIds.every((id) => UUID_PATTERN.test(id))).toBe(true);
    expect(DEMO_SONG_MAP.sections.map(({ orderIndex }) => orderIndex)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it("contains only attributed, single-paragraph structural practice notes", () => {
    for (const section of DEMO_SONG_MAP.sections) {
      expect(section.noteKind).toBe("artist_structural_note");
      expect(section.difficultyNotes).toBe(section.difficultyNotes.trim());
      expect(section.difficultyNotes.length).toBeGreaterThan(20);
      expect(section.difficultyNotes).not.toMatch(/[\n\r"“”]/);
    }
  });
});
