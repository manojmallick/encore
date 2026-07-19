export const SONG_STATUSES = ["in_progress", "recorded", "published"] as const;

export type SongStatus = (typeof SONG_STATUSES)[number];

export const SECTION_STATUSES = ["not_started", "in_progress", "ready"] as const;

export type SectionStatus = (typeof SECTION_STATUSES)[number];

export const NOTE_KINDS = ["artist_structural_note"] as const;

export type NoteKind = (typeof NOTE_KINDS)[number];

/** A calendar date serialized as YYYY-MM-DD. */
export type IsoDate = string;

/** An instant serialized in ISO 8601 format. */
export type IsoTimestamp = string;

export interface SongSection {
  readonly id: string;
  readonly name: string;
  readonly orderIndex: number;
  readonly difficultyNotes: string;
  readonly noteKind: NoteKind;
  readonly status: SectionStatus;
}

export interface SongMap {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly targetDate: IsoDate;
  readonly createdAt: IsoTimestamp;
  readonly status: SongStatus;
  readonly sections: readonly SongSection[];
}
