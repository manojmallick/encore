import type { SongMap } from "../song-map";

/**
 * Deterministic Build Week fixture. Song title and artist are metadata; every
 * difficulty note is original structural practice guidance, not lyric text.
 */
export const DEMO_SONG_MAP = {
  id: "3b8a7ba8-8422-4d76-a5a8-26ac37d8e001",
  title: "Dreams",
  artist: "Fleetwood Mac",
  targetDate: "2026-08-15",
  createdAt: "2026-07-19T08:00:00.000Z",
  status: "in_progress",
  sections: [
    {
      id: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d101",
      name: "Intro",
      orderIndex: 0,
      difficultyNotes:
        "Settle into a steady tempo before the vocal entry and keep the dynamics controlled.",
      noteKind: "artist_structural_note",
      status: "not_started",
    },
    {
      id: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d102",
      name: "Verse 1",
      orderIndex: 1,
      difficultyNotes:
        "Keep breath support even while maintaining a quiet, conversational tone.",
      noteKind: "artist_structural_note",
      status: "not_started",
    },
    {
      id: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d103",
      name: "Chorus",
      orderIndex: 2,
      difficultyNotes:
        "Lift the intensity without rushing and keep the repeated chord changes relaxed.",
      noteKind: "artist_structural_note",
      status: "not_started",
    },
    {
      id: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d104",
      name: "Bridge",
      orderIndex: 3,
      difficultyNotes:
        "Isolate the register shift and practice the transition slowly before restoring tempo.",
      noteKind: "artist_structural_note",
      status: "not_started",
    },
    {
      id: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d105",
      name: "Final chorus",
      orderIndex: 4,
      difficultyNotes:
        "Maintain pitch and energy after a full run, especially through the bridge transition.",
      noteKind: "artist_structural_note",
      status: "not_started",
    },
  ],
} as const satisfies SongMap;
