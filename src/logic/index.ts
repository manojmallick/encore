export { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
export {
  LYRIC_RISK_CODES,
  LYRIC_RISK_DISCLAIMER,
  LYRIC_RISK_PASSED_MESSAGE,
  LyricRiskBlockedError,
  checkArtistNoteLyricRisk,
  checkSongMapLyricRisk,
  enforceSongMapLyricRisk,
  type FlaggedSongSection,
  type LyricRiskCheck,
  type LyricRiskCode,
  type LyricRiskIssue,
  type SongMapLyricRiskCheck,
} from "./lyric-risk";
export {
  MAX_PRACTICE_SESSIONS,
  PRACTICE_PLAN_MODEL,
  PracticePlanConfigurationError,
  PracticePlanInputError,
  PracticePlanModelError,
  PracticePlanModelOutputSchema,
  PracticePlanOutputError,
  PracticePlanRequestSchema,
  PracticeSessionSchema,
  buildPracticePlanPrompts,
  calculateCountdownFacts,
  generateCountdownPracticePlan,
  type CountdownFacts,
  type GeneratedPracticePlan,
  type PracticePlanInputErrorCode,
  type PracticePlanModelGenerator,
  type PracticePlanModelOutput,
  type PracticePlanModelRequest,
  type PracticePlanRequest,
  type PracticeSession,
} from "./practice-plan";
export {
  NOTE_KINDS,
  SECTION_STATUSES,
  SONG_STATUSES,
  type IsoDate,
  type IsoTimestamp,
  type NoteKind,
  type SectionStatus,
  type SongMap,
  type SongSection,
  type SongStatus,
} from "./song-map";

export function greeting(): string {
  return "Plan the hard parts. Know when you are ready. Publish the story.";
}
