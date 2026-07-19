import { z } from "zod";

import { GeneratedPracticePlanSchema, type GeneratedPracticePlan } from "./practice-plan";
import type { SongMap } from "./song-map";

export const PRACTICE_PLAN_STORAGE_VERSION = 1;
const PRACTICE_PLAN_STORAGE_PREFIX = "encore:practice-plan";

const PersistedPracticePlanSchema = z
  .object({
    version: z.literal(PRACTICE_PLAN_STORAGE_VERSION),
    songMapId: z.uuid(),
    targetDate: z.iso.date(),
    sessionsPerWeek: z.number().int().min(1).max(7),
    plan: GeneratedPracticePlanSchema,
  })
  .strict();

export interface PracticePlanStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RestoredPracticePlan {
  readonly sessionsPerWeek: number;
  readonly plan: GeneratedPracticePlan;
}

export function practicePlanStorageKey(songMapId: string): string {
  return `${PRACTICE_PLAN_STORAGE_PREFIX}:v${PRACTICE_PLAN_STORAGE_VERSION}:${songMapId}`;
}

function discard(storage: PracticePlanStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage access may be denied; an invalid value is still safe to ignore.
  }
}

export function restorePracticePlan(
  storage: PracticePlanStorage,
  songMap: Pick<SongMap, "id" | "targetDate">,
): RestoredPracticePlan | null {
  const key = practicePlanStorageKey(songMap.id);
  let rawValue: string | null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return null;
  }

  if (rawValue === null) {
    return null;
  }

  try {
    const parsed = PersistedPracticePlanSchema.safeParse(JSON.parse(rawValue));
    if (
      !parsed.success ||
      parsed.data.songMapId !== songMap.id ||
      parsed.data.targetDate !== songMap.targetDate
    ) {
      discard(storage, key);
      return null;
    }

    return {
      sessionsPerWeek: parsed.data.sessionsPerWeek,
      plan: parsed.data.plan,
    };
  } catch {
    discard(storage, key);
    return null;
  }
}

export function persistPracticePlan(
  storage: PracticePlanStorage,
  songMap: Pick<SongMap, "id" | "targetDate">,
  sessionsPerWeek: number,
  plan: GeneratedPracticePlan,
): boolean {
  const persisted = PersistedPracticePlanSchema.safeParse({
    version: PRACTICE_PLAN_STORAGE_VERSION,
    songMapId: songMap.id,
    targetDate: songMap.targetDate,
    sessionsPerWeek,
    plan,
  });

  if (!persisted.success) {
    return false;
  }

  try {
    storage.setItem(practicePlanStorageKey(songMap.id), JSON.stringify(persisted.data));
    return true;
  } catch {
    return false;
  }
}
