import type { SongMap } from "./song-map";

export const LYRIC_RISK_CODES = [
  "long_quotation",
  "stanza_structure",
  "repeated_line",
] as const;

export type LyricRiskCode = (typeof LYRIC_RISK_CODES)[number];

export const LYRIC_RISK_PASSED_MESSAGE =
  "Lyric-risk check passed — generated only from the notes you provided.";

export const LYRIC_RISK_DISCLAIMER =
  "This heuristic reduces risk but cannot determine copyright status or provide legal advice.";

export interface LyricRiskIssue {
  readonly code: LyricRiskCode;
  readonly message: string;
  readonly rewriteGuidance: string;
}

export type LyricRiskCheck =
  | { readonly passed: true; readonly issues: readonly [] }
  | { readonly passed: false; readonly issues: readonly LyricRiskIssue[] };

export interface FlaggedSongSection {
  readonly sectionId: string;
  readonly sectionName: string;
  readonly issues: readonly LyricRiskIssue[];
}

export type SongMapLyricRiskCheck =
  | { readonly passed: true; readonly flaggedSections: readonly [] }
  | {
      readonly passed: false;
      readonly flaggedSections: readonly FlaggedSongSection[];
    };

const LONG_QUOTATION_PATTERN = /["“”][^"“”\r\n]{40,}["“”]/u;
const MIN_SUBSTANTIVE_LINE_LENGTH = 12;

const ISSUE_COPY: Record<LyricRiskCode, Omit<LyricRiskIssue, "code">> = {
  long_quotation: {
    message: "This note contains a long quoted passage that may be lyric text.",
    rewriteGuidance:
      "Remove the quotation and describe the musical challenge in your own words, such as the transition, register, rhythm, or dynamics.",
  },
  stanza_structure: {
    message: "This note uses several substantial lines that resemble a lyric stanza.",
    rewriteGuidance:
      "Replace the line-by-line text with one short structural note about what is difficult to perform.",
  },
  repeated_line: {
    message: "This note repeats the same substantial line, which may resemble a chorus or refrain.",
    rewriteGuidance:
      "Keep one concise description of the practice problem and remove the repeated text.",
  },
};

function issue(code: LyricRiskCode): LyricRiskIssue {
  return { code, ...ISSUE_COPY[code] };
}

function normalizeLine(line: string): string {
  return line
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function checkArtistNoteLyricRisk(note: string): LyricRiskCheck {
  const issues: LyricRiskIssue[] = [];
  const lines = note
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const substantiveLines = lines.filter(
    (line) => normalizeLine(line).length >= MIN_SUBSTANTIVE_LINE_LENGTH,
  );

  if (LONG_QUOTATION_PATTERN.test(note)) {
    issues.push(issue("long_quotation"));
  }

  if (substantiveLines.length >= 3) {
    issues.push(issue("stanza_structure"));
  }

  const normalizedLines = substantiveLines.map(normalizeLine);
  if (new Set(normalizedLines).size < normalizedLines.length) {
    issues.push(issue("repeated_line"));
  }

  return issues.length === 0 ? { passed: true, issues: [] } : { passed: false, issues };
}

export function checkSongMapLyricRisk(
  songMap: Pick<SongMap, "sections">,
): SongMapLyricRiskCheck {
  const flaggedSections: FlaggedSongSection[] = [];

  for (const section of songMap.sections) {
    const result = checkArtistNoteLyricRisk(section.difficultyNotes);
    if (!result.passed) {
      flaggedSections.push({
        sectionId: section.id,
        sectionName: section.name,
        issues: result.issues,
      });
    }
  }

  return flaggedSections.length === 0
    ? { passed: true, flaggedSections: [] }
    : { passed: false, flaggedSections };
}

export class LyricRiskBlockedError extends Error {
  readonly result: Extract<SongMapLyricRiskCheck, { passed: false }>;

  constructor(result: Extract<SongMapLyricRiskCheck, { passed: false }>) {
    const sectionLabel = result.flaggedSections.length === 1 ? "section" : "sections";
    super(
      `Lyric-risk check blocked ${result.flaggedSections.length} ${sectionLabel}. Rewrite the flagged notes as structural practice guidance.`,
    );
    this.name = "LyricRiskBlockedError";
    this.result = result;
  }
}

export function enforceSongMapLyricRisk(songMap: Pick<SongMap, "sections">): void {
  const result = checkSongMapLyricRisk(songMap);
  if (!result.passed) {
    throw new LyricRiskBlockedError(result);
  }
}
