import { z } from "zod";

import { PracticeLogEntrySchema, type PracticeLogEntry } from "./section-mastery";
import type { SongMap } from "./song-map";
import type { PracticePlanStorage } from "./practice-plan-storage";

export const PRACTICE_LOG_STORAGE_VERSION = 1;
const PRACTICE_LOG_STORAGE_PREFIX = "encore:practice-logs";
const MAX_PRACTICE_LOG_ENTRIES = 500;

const PersistedPracticeLogsSchema = z
  .object({
    version: z.literal(PRACTICE_LOG_STORAGE_VERSION),
    songMapId: z.uuid(),
    entries: z.array(PracticeLogEntrySchema).max(MAX_PRACTICE_LOG_ENTRIES),
  })
  .strict();

export function practiceLogStorageKey(songMapId: string): string {
  return `${PRACTICE_LOG_STORAGE_PREFIX}:v${PRACTICE_LOG_STORAGE_VERSION}:${songMapId}`;
}

function discard(storage: PracticePlanStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Denied storage access is equivalent to having no restorable log.
  }
}

export function restorePracticeLogs(
  storage: PracticePlanStorage,
  songMap: Pick<SongMap, "id" | "sections">,
): readonly PracticeLogEntry[] {
  const key = practiceLogStorageKey(songMap.id);
  let rawValue: string | null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return [];
  }

  if (rawValue === null) {
    return [];
  }

  try {
    const parsed = PersistedPracticeLogsSchema.safeParse(JSON.parse(rawValue));
    const sectionIds = new Set(songMap.sections.map((section) => section.id));
    if (
      !parsed.success ||
      parsed.data.songMapId !== songMap.id ||
      parsed.data.entries.some(
        (entry) => entry.songMapId !== songMap.id || !sectionIds.has(entry.sectionId),
      )
    ) {
      discard(storage, key);
      return [];
    }

    return parsed.data.entries;
  } catch {
    discard(storage, key);
    return [];
  }
}

export function persistPracticeLogs(
  storage: PracticePlanStorage,
  songMap: Pick<SongMap, "id" | "sections">,
  entries: readonly PracticeLogEntry[],
): boolean {
  const sectionIds = new Set(songMap.sections.map((section) => section.id));
  const persisted = PersistedPracticeLogsSchema.safeParse({
    version: PRACTICE_LOG_STORAGE_VERSION,
    songMapId: songMap.id,
    entries,
  });

  if (
    !persisted.success ||
    persisted.data.entries.some(
      (entry) => entry.songMapId !== songMap.id || !sectionIds.has(entry.sectionId),
    )
  ) {
    return false;
  }

  try {
    storage.setItem(practiceLogStorageKey(songMap.id), JSON.stringify(persisted.data));
    return true;
  } catch {
    return false;
  }
}
