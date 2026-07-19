import { z } from "zod";

import { checkArtistNoteLyricRisk } from "./lyric-risk";
import type { SongMap } from "./song-map";

export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;
export const SECTION_TRENDS = [
  "improving",
  "flat",
  "declining",
  "insufficient_data",
] as const;

export const PracticeLogEntrySchema = z
  .object({
    id: z.uuid(),
    songMapId: z.uuid(),
    sectionId: z.uuid(),
    sessionNumber: z.number().int().positive(),
    loggedAt: z.iso.datetime(),
    confidenceLevel: z.number().int().min(1).max(5),
    note: z.string().trim().max(280),
  })
  .strict();

export const NewPracticeLogSchema = PracticeLogEntrySchema.pick({
  sectionId: true,
  sessionNumber: true,
  confidenceLevel: true,
  note: true,
});

export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type SectionTrendDirection = (typeof SECTION_TRENDS)[number];
export type PracticeLogEntry = z.infer<typeof PracticeLogEntrySchema>;
export type NewPracticeLog = z.infer<typeof NewPracticeLogSchema>;

export interface SectionTrend {
  readonly sectionId: string;
  readonly latestConfidence: number | null;
  readonly trend: SectionTrendDirection;
  readonly entriesLogged: number;
}

export type PracticeLogInputErrorCode =
  | "invalid_entry"
  | "unknown_section"
  | "unknown_session"
  | "lyric_risk";

export class PracticeLogInputError extends Error {
  readonly code: PracticeLogInputErrorCode;

  constructor(code: PracticeLogInputErrorCode, message: string) {
    super(message);
    this.name = "PracticeLogInputError";
    this.code = code;
  }
}

export interface PracticeLogContext {
  readonly songMap: Pick<SongMap, "id" | "sections">;
  readonly totalSessions: number;
  readonly id: string;
  readonly loggedAt: string;
}

export function createPracticeLogEntry(
  input: NewPracticeLog,
  context: PracticeLogContext,
): PracticeLogEntry {
  const parsedInput = NewPracticeLogSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new PracticeLogInputError(
      "invalid_entry",
      "Choose a section, a confidence rating from 1 to 5, and a note under 280 characters.",
    );
  }

  if (!context.songMap.sections.some((section) => section.id === parsedInput.data.sectionId)) {
    throw new PracticeLogInputError(
      "unknown_section",
      "Choose a section from the active Song Map.",
    );
  }

  if (
    !Number.isInteger(context.totalSessions) ||
    parsedInput.data.sessionNumber > context.totalSessions
  ) {
    throw new PracticeLogInputError(
      "unknown_session",
      "Choose a session from the active countdown plan.",
    );
  }

  if (parsedInput.data.note) {
    const lyricRisk = checkArtistNoteLyricRisk(parsedInput.data.note);
    if (!lyricRisk.passed) {
      throw new PracticeLogInputError(
        "lyric_risk",
        lyricRisk.issues[0]?.rewriteGuidance ??
          "Rewrite the note as a short structural practice observation without lyrics.",
      );
    }
  }

  const entry = PracticeLogEntrySchema.safeParse({
    ...parsedInput.data,
    id: context.id,
    songMapId: context.songMap.id,
    loggedAt: context.loggedAt,
  });

  if (!entry.success) {
    throw new PracticeLogInputError(
      "invalid_entry",
      "Encore could not validate this practice entry. Please try again.",
    );
  }

  return entry.data;
}

function chronological(left: PracticeLogEntry, right: PracticeLogEntry): number {
  const timestampDelta = Date.parse(left.loggedAt) - Date.parse(right.loggedAt);
  return timestampDelta || left.id.localeCompare(right.id);
}

export function computeSectionTrends(
  entries: readonly PracticeLogEntry[],
  sectionIds: readonly string[],
): readonly SectionTrend[] {
  const validEntries = z.array(PracticeLogEntrySchema).parse(entries);
  const uniqueSectionIds = [...new Set(sectionIds)];

  return uniqueSectionIds.map((sectionId) => {
    const sectionEntries = validEntries
      .filter((entry) => entry.sectionId === sectionId)
      .sort(chronological);
    const latest = sectionEntries.at(-1);

    if (sectionEntries.length < 2) {
      return {
        sectionId,
        latestConfidence: latest?.confidenceLevel ?? null,
        trend: "insufficient_data" as const,
        entriesLogged: sectionEntries.length,
      };
    }

    const recent = sectionEntries.slice(-3);
    const delta = recent.at(-1)!.confidenceLevel - recent[0]!.confidenceLevel;
    const trend: SectionTrendDirection =
      delta > 0 ? "improving" : delta < 0 ? "declining" : "flat";

    return {
      sectionId,
      latestConfidence: latest!.confidenceLevel,
      trend,
      entriesLogged: sectionEntries.length,
    };
  });
}
