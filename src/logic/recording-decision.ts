import { z } from "zod";

import { RECORDING_READINESS_STATUSES, type RecordingReadinessResult } from "./recording-readiness";
import type { PracticePlanStorage } from "./practice-plan-storage";

export const RECORDING_DECISIONS = ["keep_practicing", "recorded"] as const;
export const RECORDING_DECISION_STORAGE_VERSION = 1;
const RECORDING_DECISION_STORAGE_PREFIX = "encore:recording-decision";

export const RecordingDecisionSchema = z
  .object({
    songMapId: z.uuid(),
    decision: z.enum(RECORDING_DECISIONS),
    decidedAt: z.iso.datetime(),
    readinessStatus: z.enum(RECORDING_READINESS_STATUSES),
    readinessScore: z.number().int().min(0).max(100).nullable(),
    acknowledgedNotReady: z.boolean(),
  })
  .strict()
  .superRefine((decision, context) => {
    if (
      (decision.readinessStatus === "insufficient_data") !==
      (decision.readinessScore === null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Readiness score must match the readiness coverage state.",
        path: ["readinessScore"],
      });
    }
    if (
      decision.decision === "recorded" &&
      decision.readinessStatus !== "ready" &&
      !decision.acknowledgedNotReady
    ) {
      context.addIssue({
        code: "custom",
        message: "Recording before ready requires explicit acknowledgement.",
        path: ["acknowledgedNotReady"],
      });
    }
  });

const PersistedRecordingDecisionSchema = z
  .object({
    version: z.literal(RECORDING_DECISION_STORAGE_VERSION),
    decision: RecordingDecisionSchema,
  })
  .strict();

export type RecordingDecisionKind = (typeof RECORDING_DECISIONS)[number];
export type RecordingDecision = z.infer<typeof RecordingDecisionSchema>;

export function createRecordingDecision(
  songMapId: string,
  decision: RecordingDecisionKind,
  readiness: RecordingReadinessResult,
  acknowledgedNotReady: boolean,
  decidedAt: string,
): RecordingDecision {
  return RecordingDecisionSchema.parse({
    songMapId,
    decision,
    decidedAt,
    readinessStatus: readiness.status,
    readinessScore: readiness.score,
    acknowledgedNotReady,
  });
}

export function recordingDecisionStorageKey(songMapId: string): string {
  return `${RECORDING_DECISION_STORAGE_PREFIX}:v${RECORDING_DECISION_STORAGE_VERSION}:${songMapId}`;
}

function discard(storage: PracticePlanStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Denied storage access is equivalent to having no restorable decision.
  }
}

export function restoreRecordingDecision(
  storage: PracticePlanStorage,
  songMapId: string,
): RecordingDecision | null {
  const key = recordingDecisionStorageKey(songMapId);
  let rawValue: string | null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return null;
  }
  if (rawValue === null) return null;

  try {
    const parsed = PersistedRecordingDecisionSchema.safeParse(JSON.parse(rawValue));
    if (!parsed.success || parsed.data.decision.songMapId !== songMapId) {
      discard(storage, key);
      return null;
    }
    return parsed.data.decision;
  } catch {
    discard(storage, key);
    return null;
  }
}

export function persistRecordingDecision(
  storage: PracticePlanStorage,
  decision: RecordingDecision,
): boolean {
  const persisted = PersistedRecordingDecisionSchema.safeParse({
    version: RECORDING_DECISION_STORAGE_VERSION,
    decision,
  });
  if (!persisted.success) return false;

  try {
    storage.setItem(
      recordingDecisionStorageKey(decision.songMapId),
      JSON.stringify(persisted.data),
    );
    return true;
  } catch {
    return false;
  }
}
