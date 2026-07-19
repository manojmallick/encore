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
  GeneratedPracticePlanSchema,
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
  INITIAL_PRACTICE_PLAN_STATE,
  PracticePlanRequestError,
  reducePracticePlanWorkspace,
  requestCountdownPracticePlan,
  type PracticePlanFetch,
  type PracticePlanWorkspaceAction,
  type PracticePlanWorkspaceState,
} from "./practice-plan-client";
export {
  PRACTICE_PLAN_STORAGE_VERSION,
  persistPracticePlan,
  practicePlanStorageKey,
  restorePracticePlan,
  type PracticePlanStorage,
  type RestoredPracticePlan,
} from "./practice-plan-storage";
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
