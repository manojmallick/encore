import { z } from "zod";

import {
  GeneratedMakingOfCaptionSchema,
  type GeneratedMakingOfCaption,
} from "./making-of-caption";
import {
  RecordingDecisionSchema,
  type RecordingDecision,
} from "./recording-decision";
import type { PracticePlanStorage } from "./practice-plan-storage";

export const SONG_PUBLICATION_STORAGE_VERSION = 1;
const SONG_PUBLICATION_STORAGE_PREFIX = "encore:song-publication";

export const SongPublicationSchema = z
  .object({
    songMapId: z.uuid(),
    status: z.literal("published"),
    publishedAt: z.iso.datetime(),
    caption: GeneratedMakingOfCaptionSchema,
  })
  .strict();

const PersistedSongPublicationSchema = z
  .object({
    version: z.literal(SONG_PUBLICATION_STORAGE_VERSION),
    publication: SongPublicationSchema,
  })
  .strict();

export type SongPublication = z.infer<typeof SongPublicationSchema>;

export class SongPublicationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SongPublicationInputError";
  }
}

function isMatchingRecordedDecision(
  decision: RecordingDecision | null,
  songMapId: string,
): boolean {
  const parsed = RecordingDecisionSchema.safeParse(decision);
  return (
    parsed.success &&
    parsed.data.songMapId === songMapId &&
    parsed.data.decision === "recorded"
  );
}

export function createSongPublication(
  songMapId: string,
  recordingDecision: RecordingDecision | null,
  caption: GeneratedMakingOfCaption,
  publishedAt: string,
): SongPublication {
  if (!isMatchingRecordedDecision(recordingDecision, songMapId)) {
    throw new SongPublicationInputError(
      "A matching recorded decision is required before marking this song published.",
    );
  }

  const parsed = SongPublicationSchema.safeParse({
    songMapId,
    status: "published",
    publishedAt,
    caption,
  });
  if (!parsed.success) {
    throw new SongPublicationInputError(
      "A valid Making Of caption is required before marking this song published.",
    );
  }
  return parsed.data;
}

export function songPublicationStorageKey(songMapId: string): string {
  return `${SONG_PUBLICATION_STORAGE_PREFIX}:v${SONG_PUBLICATION_STORAGE_VERSION}:${songMapId}`;
}

function discard(storage: PracticePlanStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Invalid publication state is ignored even when storage cleanup is denied.
  }
}

export function restoreSongPublication(
  storage: PracticePlanStorage,
  songMapId: string,
  recordingDecision: RecordingDecision | null,
): SongPublication | null {
  const key = songPublicationStorageKey(songMapId);
  let rawValue: string | null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return null;
  }
  if (rawValue === null) return null;

  try {
    const parsed = PersistedSongPublicationSchema.safeParse(JSON.parse(rawValue));
    if (
      !parsed.success ||
      parsed.data.publication.songMapId !== songMapId ||
      !isMatchingRecordedDecision(recordingDecision, songMapId)
    ) {
      discard(storage, key);
      return null;
    }
    return parsed.data.publication;
  } catch {
    discard(storage, key);
    return null;
  }
}

export function persistSongPublication(
  storage: PracticePlanStorage,
  publication: SongPublication,
): boolean {
  const persisted = PersistedSongPublicationSchema.safeParse({
    version: SONG_PUBLICATION_STORAGE_VERSION,
    publication,
  });
  if (!persisted.success) return false;

  try {
    storage.setItem(
      songPublicationStorageKey(publication.songMapId),
      JSON.stringify(persisted.data),
    );
    return true;
  } catch {
    return false;
  }
}

export function removeSongPublication(
  storage: PracticePlanStorage,
  songMapId: string,
): boolean {
  try {
    storage.removeItem(songPublicationStorageKey(songMapId));
    return true;
  } catch {
    return false;
  }
}
