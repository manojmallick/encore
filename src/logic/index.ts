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
  PRACTICE_LOG_STORAGE_VERSION,
  persistPracticeLogs,
  practiceLogStorageKey,
  restorePracticeLogs,
} from "./practice-log-storage";
export {
  RECORDING_READINESS_STATUSES,
  RecordingReadinessInputSchema,
  calculateCalendarDaysRemaining,
  calculateRecordingReadiness,
  type RecordingReadinessFactors,
  type RecordingReadinessInput,
  type RecordingReadinessResult,
  type RecordingReadinessStatus,
} from "./recording-readiness";
export {
  CONFIDENCE_LEVELS,
  SECTION_TRENDS,
  NewPracticeLogSchema,
  PracticeLogEntrySchema,
  PracticeLogInputError,
  computeSectionTrends,
  createPracticeLogEntry,
  type ConfidenceLevel,
  type NewPracticeLog,
  type PracticeLogContext,
  type PracticeLogEntry,
  type PracticeLogInputErrorCode,
  type SectionTrend,
  type SectionTrendDirection,
} from "./section-mastery";
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
