"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { CreatorDashboard } from "./creator-dashboard";
import { MakingOfCaption } from "./making-of-caption";

import {
  DEMO_SONG_MAP,
  CONFIDENCE_LEVELS,
  INITIAL_PRACTICE_PLAN_STATE,
  PracticeLogInputError,
  PracticePlanRequestError,
  calculateCalendarDaysRemaining,
  calculateRecordingReadiness,
  computeSectionTrends,
  createCreatorDashboard,
  createPracticeLogEntry,
  createRecordingDecision,
  createSongPublication,
  persistPracticePlan,
  persistPracticeLogs,
  persistRecordingDecision,
  persistSongPublication,
  reducePracticePlanWorkspace,
  removeSongPublication,
  requestCountdownPracticePlan,
  restorePracticePlan,
  restorePracticeLogs,
  restoreRecordingDecision,
  restoreSongPublication,
  type ConfidenceLevel,
  type GeneratedMakingOfCaption,
  type PracticeLogEntry,
  type RecordingDecision,
  type RecordingDecisionKind,
  type RecordingReadinessStatus,
  type SectionTrendDirection,
  type SongPublication,
} from "@/src/logic";

const DEFAULT_SESSIONS_PER_WEEK = 2;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

const TREND_LABELS: Record<SectionTrendDirection, string> = {
  improving: "Improving",
  flat: "Holding steady",
  declining: "Needs attention",
  insufficient_data: "More data needed",
};

const READINESS_LABELS: Record<RecordingReadinessStatus, string> = {
  insufficient_data: "Need more data",
  behind: "Behind",
  on_track: "On track",
  ready: "Ready",
};

export function CountdownWorkspace() {
  const [state, dispatch] = useReducer(
    reducePracticePlanWorkspace,
    INITIAL_PRACTICE_PLAN_STATE,
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(DEFAULT_SESSIONS_PER_WEEK);
  const [persistenceStatus, setPersistenceStatus] = useState<"saved" | "unavailable" | null>(
    null,
  );
  const [practiceLogs, setPracticeLogs] = useState<readonly PracticeLogEntry[]>([]);
  const [activeLogSession, setActiveLogSession] = useState<number | null>(null);
  const practiceLogFormRef = useRef<HTMLFormElement>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    DEMO_SONG_MAP.sections[0]!.id,
  );
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>(3);
  const [practiceNote, setPracticeNote] = useState("");
  const [logFeedback, setLogFeedback] = useState<{
    readonly kind: "saved" | "warning" | "error";
    readonly message: string;
  } | null>(null);
  const [recordingDecision, setRecordingDecision] = useState<RecordingDecision | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<{
    readonly kind: "saved" | "warning" | "error";
    readonly message: string;
  } | null>(null);
  const [publication, setPublication] = useState<SongPublication | null>(null);
  const [publicationFeedback, setPublicationFeedback] = useState<{
    readonly kind: "saved" | "warning" | "error";
    readonly message: string;
  } | null>(null);
  const isRecorded = recordingDecision?.decision === "recorded";
  const isPublished = publication?.status === "published";

  const sectionTrends = useMemo(
    () =>
      computeSectionTrends(
        practiceLogs,
        DEMO_SONG_MAP.sections.map((section) => section.id),
      ),
    [practiceLogs],
  );
  const recordingReadiness = useMemo(() => {
    if (state.phase !== "success") {
      return null;
    }

    return calculateRecordingReadiness({
      sectionTrends,
      daysRemaining: calculateCalendarDaysRemaining(DEMO_SONG_MAP.targetDate, new Date()),
      originalPlanDays: state.plan.daysRemaining,
    });
  }, [sectionTrends, state]);
  const creatorDashboard = useMemo(() => {
    if (state.phase !== "success" || recordingReadiness === null) {
      return null;
    }

    return createCreatorDashboard({
      songMap: DEMO_SONG_MAP,
      plan: state.plan,
      practiceLogs,
      sectionTrends,
      readiness: recordingReadiness,
    });
  }, [practiceLogs, recordingReadiness, sectionTrends, state]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const restored = restorePracticePlan(window.localStorage, DEMO_SONG_MAP);
      const restoredLogs = restorePracticeLogs(window.localStorage, DEMO_SONG_MAP);
      const restoredDecision = restoreRecordingDecision(
        window.localStorage,
        DEMO_SONG_MAP.id,
      );
      const restoredPublication = restoreSongPublication(
        window.localStorage,
        DEMO_SONG_MAP.id,
        restoredDecision,
      );
      if (restored) {
        setSessionsPerWeek(restored.sessionsPerWeek);
        setPersistenceStatus("saved");
      }
      setPracticeLogs(restoredLogs);
      setRecordingDecision(restoredDecision);
      setPublication(restoredPublication);
      dispatch({ type: "restore", plan: restored?.plan ?? null });
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeLogSession !== null) {
      practiceLogFormRef.current?.querySelector("select")?.focus();
    }
  }, [activeLogSession]);

  async function generatePlan() {
    if (state.phase === "loading" || isRecorded) {
      return;
    }

    dispatch({ type: "submit" });
    setPersistenceStatus(null);

    try {
      const plan = await requestCountdownPracticePlan({
        songMap: DEMO_SONG_MAP,
        sessionsPerWeek,
      });
      const saved = persistPracticePlan(
        window.localStorage,
        DEMO_SONG_MAP,
        sessionsPerWeek,
        plan,
      );
      setPersistenceStatus(saved ? "saved" : "unavailable");
      dispatch({ type: "resolve", plan });
    } catch (error) {
      dispatch({
        type: "reject",
        message:
          error instanceof PracticePlanRequestError
            ? error.message
            : "Encore could not generate this plan. Please try again.",
      });
    }
  }

  function openLogForm(sessionNumber: number) {
    if (isRecorded) return;
    setActiveLogSession(sessionNumber);
    setLogFeedback(null);
    setPracticeNote("");
    setConfidenceLevel(3);
  }

  function submitPracticeLog(event: FormEvent<HTMLFormElement>, sessionNumber: number) {
    event.preventDefault();
    if (isRecorded) return;

    try {
      const entry = createPracticeLogEntry(
        {
          sectionId: selectedSectionId,
          sessionNumber,
          confidenceLevel,
          note: practiceNote,
        },
        {
          songMap: DEMO_SONG_MAP,
          totalSessions: state.phase === "success" ? state.plan.totalSessions : 0,
          id: crypto.randomUUID(),
          loggedAt: new Date().toISOString(),
        },
      );
      const nextLogs = [...practiceLogs, entry];
      const saved = persistPracticeLogs(window.localStorage, DEMO_SONG_MAP, nextLogs);

      setPracticeLogs(nextLogs);
      setActiveLogSession(null);
      setPracticeNote("");
      setConfidenceLevel(3);
      setLogFeedback({
        kind: saved ? "saved" : "warning",
        message: saved
          ? "Practice entry saved in this browser."
          : "Entry added for this visit, but browser storage is unavailable.",
      });
    } catch (error) {
      setLogFeedback({
        kind: "error",
        message:
          error instanceof PracticeLogInputError
            ? error.message
            : "Encore could not save this practice entry. Please try again.",
      });
    }
  }

  function saveRecordingDecision(
    decisionKind: RecordingDecisionKind,
    acknowledgedNotReady: boolean,
  ) {
    if (recordingReadiness === null) return;

    try {
      const decision = createRecordingDecision(
        DEMO_SONG_MAP.id,
        decisionKind,
        recordingReadiness,
        acknowledgedNotReady,
        new Date().toISOString(),
      );
      const saved = persistRecordingDecision(window.localStorage, decision);
      setRecordingDecision(decision);
      setActiveLogSession(null);
      setDecisionFeedback({
        kind: saved ? "saved" : "warning",
        message: saved
          ? decisionKind === "recorded"
            ? "Recording decision saved. Practice controls are now frozen."
            : "Keep-practicing decision saved."
          : "Decision applied for this visit, but browser storage is unavailable.",
      });
    } catch {
      setDecisionFeedback({
        kind: "error",
        message: "Encore could not save this recording decision. Please try again.",
      });
    }
  }

  function markSongPublished(caption: GeneratedMakingOfCaption) {
    try {
      const nextPublication = createSongPublication(
        DEMO_SONG_MAP.id,
        recordingDecision,
        caption,
        new Date().toISOString(),
      );
      const saved = persistSongPublication(window.localStorage, nextPublication);
      setPublication(nextPublication);
      setPublicationFeedback({
        kind: saved ? "saved" : "warning",
        message: saved
          ? "Published milestone saved. The Encore golden path is complete."
          : "Marked published for this visit, but browser storage is unavailable.",
      });
    } catch {
      setPublicationFeedback({
        kind: "error",
        message: "Encore could not mark this song published. Please try again.",
      });
    }
  }

  function reopenRecordedStep() {
    const removed = removeSongPublication(window.localStorage, DEMO_SONG_MAP.id);
    setPublication(null);
    setPublicationFeedback({
      kind: removed ? "saved" : "warning",
      message: removed
        ? "Publish milestone reopened. The recording and practice history are unchanged."
        : "Reopened for this visit, but the saved milestone could not be removed.",
    });
  }

  const isLoading = state.phase === "loading";

  return (
    <main className="app-shell" aria-busy={isLoading}>
      <a className="skip-link" href="#plan-workspace">
        Skip to practice workspace
      </a>
      <header className="hero">
        <a className="wordmark" href="#top" aria-label="Encore home">
          Encore<span aria-hidden="true">.</span>
        </a>
        <div className="hero-copy" id="top">
          <p className="eyebrow">Countdown studio</p>
          <h1>Turn the hard parts into a plan you can finish.</h1>
          <p className="hero-description">
            One song, one target date, and a focused practice sequence built from your own
            structural notes—never lyrics.
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="song-panel" aria-labelledby="song-heading">
          <div className="panel-kicker">
            <span className="status-dot" aria-hidden="true" />
            {isPublished ? "Published" : isRecorded ? "Recording complete" : "Demo song map"}
          </div>
          <h2 id="song-heading">{DEMO_SONG_MAP.title}</h2>
          <p className="artist">Originally by {DEMO_SONG_MAP.artist}</p>

          <dl className="song-facts">
            <div>
              <dt>Target</dt>
              <dd>{formatDate(DEMO_SONG_MAP.targetDate)}</dd>
            </div>
            <div>
              <dt>Sections</dt>
              <dd>{DEMO_SONG_MAP.sections.length}</dd>
            </div>
          </dl>

          <ul className="section-list" aria-label="Mapped song sections">
            {DEMO_SONG_MAP.sections.map((section) => (
              <li key={section.id}>{section.name}</li>
            ))}
          </ul>

          <label className="frequency-control" htmlFor="sessions-per-week">
            <span>Practice rhythm</span>
            <select
              id="sessions-per-week"
              value={sessionsPerWeek}
              disabled={isLoading || isRecorded}
              onChange={(event) => setSessionsPerWeek(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency} {frequency === 1 ? "session" : "sessions"} / week
                </option>
              ))}
            </select>
          </label>

          <button className="generate-button" disabled={isLoading || isRecorded} onClick={generatePlan}>
            {isPublished ? (
              "Published"
            ) : isRecorded ? (
              "Recording complete"
            ) : isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Building your countdown…
              </>
            ) : state.phase === "success" ? (
              "Regenerate plan"
            ) : (
              "Generate practice plan"
            )}
          </button>
          <p className="privacy-note">
            {isPublished
              ? "The record-to-publish path is complete."
              : isRecorded
                ? "Return to practice from the dashboard to edit this plan."
              : "Saved only in this browser. Your notes stay lyric-free."}
          </p>
        </aside>

        <section
          className="plan-panel"
          id="plan-workspace"
          tabIndex={-1}
          aria-labelledby="plan-heading"
          aria-live="polite"
        >
          {state.phase === "hydrating" && (
            <div className="state-card compact-state">
              <span className="spinner dark" aria-hidden="true" />
              <p>Checking for your saved countdown…</p>
            </div>
          )}

          {state.phase === "empty" && (
            <div className="state-card empty-state">
              <span className="state-number" aria-hidden="true">01</span>
              <p className="eyebrow">Your next move</p>
              <h2 id="plan-heading">A clear session-by-session path starts here.</h2>
              <p>
                Encore will front-load the tricky transitions, then shift toward confident
                full run-throughs as the recording date gets closer.
              </p>
              <button className="text-action" onClick={generatePlan}>
                Build my countdown <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}

          {state.phase === "loading" && (
            <div className="state-card loading-state">
              <div className="loading-orbit" aria-hidden="true">
                <span />
              </div>
              <p className="eyebrow">Arranging the practice work</p>
              <h2 id="plan-heading">Front-loading the hard parts.</h2>
              <p>Balancing focused repetition with final confidence-building runs.</p>
            </div>
          )}

          {state.phase === "error" && (
            <div className="state-card error-state" role="alert">
              <span className="state-number" aria-hidden="true">!</span>
              <p className="eyebrow">Plan interrupted</p>
              <h2 id="plan-heading">That countdown did not land.</h2>
              <p>{state.error}</p>
              <button className="text-action" onClick={generatePlan}>
                Try again <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}

          {state.phase === "success" && (
            <div className="plan-content">
              <div className="plan-header">
                <div>
                  <p className="eyebrow">Practice countdown</p>
                  <h2 id="plan-heading">Your route to record day.</h2>
                </div>
                <dl className="plan-metrics" aria-label="Countdown summary">
                  <div>
                    <dt>Days left</dt>
                    <dd>
                      {recordingReadiness?.factors.daysRemaining ?? state.plan.daysRemaining}
                    </dd>
                  </div>
                  <div>
                    <dt>Sessions</dt>
                    <dd>{state.plan.totalSessions}</dd>
                  </div>
                </dl>
              </div>

              <p
                className={`save-status ${persistenceStatus === "unavailable" ? "warning" : ""}`}
                role="status"
              >
                <span aria-hidden="true">{persistenceStatus === "saved" ? "✓" : "○"}</span>
                {persistenceStatus === "saved"
                  ? "Saved in this browser"
                  : "Plan available for this visit; browser storage is unavailable"}
              </p>

              {state.plan.generationSource === "demo_fixture" && (
                <aside className="demo-response-notice" role="note">
                  <strong>Demo response · GPT-5.6 schema</strong>
                  <span>
                    No OpenAI API key is configured. This deterministic mock follows the
                    production response contract, but it was not generated by GPT-5.6.
                  </span>
                </aside>
              )}

              {creatorDashboard && recordingReadiness && (
                <CreatorDashboard
                  songTitle={DEMO_SONG_MAP.title}
                  dashboard={creatorDashboard}
                  readiness={recordingReadiness}
                  decision={recordingDecision}
                  isPublished={isPublished}
                  decisionFeedback={decisionFeedback}
                  onKeepPracticing={() => saveRecordingDecision("keep_practicing", false)}
                  onMarkRecorded={(acknowledged) =>
                    saveRecordingDecision("recorded", acknowledged)
                  }
                  onReturnToPractice={() => saveRecordingDecision("keep_practicing", false)}
                />
              )}

              {isRecorded && recordingDecision && (
                <MakingOfCaption
                  songMap={DEMO_SONG_MAP}
                  practiceLogs={practiceLogs}
                  recordingDecision={recordingDecision}
                  publication={publication}
                  publicationFeedback={publicationFeedback}
                  onMarkPublished={markSongPublished}
                  onReopenPublished={reopenRecordedStep}
                />
              )}

              {recordingReadiness && (
                <section
                  className={`readiness-card readiness-${recordingReadiness.status}`}
                  aria-labelledby="readiness-heading"
                >
                  <div className="readiness-summary">
                    <div>
                      <p className="eyebrow">Recording readiness</p>
                      <span className="readiness-badge">
                        {READINESS_LABELS[recordingReadiness.status]}
                      </span>
                      <h3 id="readiness-heading">{recordingReadiness.title}</h3>
                      <p>{recordingReadiness.message}</p>
                    </div>
                    <div className="readiness-score" aria-label={
                      recordingReadiness.score === null
                        ? "Readiness score unavailable until every section has data"
                        : `Readiness score ${recordingReadiness.score} out of 100`
                    }>
                      <strong>{recordingReadiness.score ?? "—"}</strong>
                      <span>{recordingReadiness.score === null ? "No score yet" : "/ 100"}</span>
                    </div>
                  </div>

                  <ul className="readiness-reasons" aria-label="Why this readiness result">
                    {recordingReadiness.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>

                  <dl className="readiness-factors">
                    <div>
                      <dt>Coverage</dt>
                      <dd>
                        {recordingReadiness.factors.measuredSections}/
                        {recordingReadiness.factors.totalSections} sections
                      </dd>
                    </div>
                    <div>
                      <dt>Avg confidence</dt>
                      <dd>
                        {recordingReadiness.factors.averageConfidence === null
                          ? "—"
                          : `${recordingReadiness.factors.averageConfidence}/5`}
                      </dd>
                    </div>
                    <div>
                      <dt>Time used</dt>
                      <dd>{recordingReadiness.factors.timeUsedPercent}%</dd>
                    </div>
                    <div>
                      <dt>Expected now</dt>
                      <dd>{recordingReadiness.factors.expectedConfidence}/5</dd>
                    </div>
                    <div>
                      <dt>Confidence gap</dt>
                      <dd>
                        {recordingReadiness.factors.confidenceGap === null
                          ? "—"
                          : recordingReadiness.factors.confidenceGap}
                      </dd>
                    </div>
                    <div>
                      <dt>Declining</dt>
                      <dd>{recordingReadiness.factors.decliningSections} sections</dd>
                    </div>
                  </dl>

                  <p className="readiness-formula">
                    Score = average confidence ÷ 5 × 100 − 8 points per declining section.
                    Behind triggers above a 1.2 confidence gap or at two declining sections.
                  </p>
                </section>
              )}

              <section className="mastery-section" aria-labelledby="mastery-heading">
                <div className="mastery-heading-row">
                  <div>
                    <p className="eyebrow">Section mastery</p>
                    <h3 id="mastery-heading">Confidence, section by section.</h3>
                  </div>
                  <p>{practiceLogs.length} {practiceLogs.length === 1 ? "entry" : "entries"} logged</p>
                </div>

                <div className="trend-grid">
                  {sectionTrends.map((trend) => {
                    const section = DEMO_SONG_MAP.sections.find(
                      (candidate) => candidate.id === trend.sectionId,
                    )!;
                    return (
                      <article className={`trend-card trend-${trend.trend}`} key={trend.sectionId}>
                        <div>
                          <p>{section.name}</p>
                          <strong>
                            {trend.latestConfidence === null ? "—" : `${trend.latestConfidence}/5`}
                          </strong>
                        </div>
                        <span>{TREND_LABELS[trend.trend]}</span>
                        <small>
                          {trend.entriesLogged} {trend.entriesLogged === 1 ? "entry" : "entries"}
                        </small>
                      </article>
                    );
                  })}
                </div>

                {practiceLogs.length === 0 && (
                  <p className="mastery-empty">
                    Log confidence after a session. Two entries unlock the first trend.
                  </p>
                )}
                {logFeedback && logFeedback.kind !== "error" && (
                  <p
                    className={`log-feedback ${logFeedback.kind}`}
                    role="status"
                  >
                    {logFeedback.message}
                  </p>
                )}
              </section>

              <ol className="session-list">
                {state.plan.sessions.map((session) => {
                  const sessionLogs = practiceLogs.filter(
                    (entry) => entry.sessionNumber === session.sessionNumber,
                  );
                  return (
                    <li className="session-card" key={session.sessionNumber}>
                      <span className="session-index">
                        {String(session.sessionNumber).padStart(2, "0")}
                      </span>
                      <div className="session-body">
                        <p className="session-label">Session {session.sessionNumber}</p>
                        <h3>{session.focus}</h3>
                        <p>{session.technique}</p>

                        {sessionLogs.length > 0 && (
                          <ul className="logged-entry-list" aria-label={`Session ${session.sessionNumber} practice entries`}>
                            {sessionLogs.map((entry) => {
                              const section = DEMO_SONG_MAP.sections.find(
                                (candidate) => candidate.id === entry.sectionId,
                              )!;
                              return (
                                <li key={entry.id}>
                                  <strong>{section.name} · {entry.confidenceLevel}/5</strong>
                                  {entry.note && <span>{entry.note}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {!isRecorded && activeLogSession === session.sessionNumber ? (
                          <form
                            className="practice-log-form"
                            ref={practiceLogFormRef}
                            onSubmit={(event) => submitPracticeLog(event, session.sessionNumber)}
                          >
                            <div className="log-form-heading">
                              <strong>Log this practice</strong>
                              <button type="button" onClick={() => setActiveLogSession(null)}>
                                Cancel
                              </button>
                            </div>

                            <label>
                              <span>Section practiced</span>
                              <select
                                value={selectedSectionId}
                                onChange={(event) => setSelectedSectionId(event.target.value)}
                              >
                                {DEMO_SONG_MAP.sections.map((section) => (
                                  <option key={section.id} value={section.id}>{section.name}</option>
                                ))}
                              </select>
                            </label>

                            <fieldset>
                              <legend>Confidence after practice</legend>
                              <div className="confidence-options">
                                {CONFIDENCE_LEVELS.map((level) => (
                                  <label key={level}>
                                    <input
                                      type="radio"
                                      name={`confidence-${session.sessionNumber}`}
                                      value={level}
                                      checked={confidenceLevel === level}
                                      onChange={() => setConfidenceLevel(level)}
                                    />
                                    <span>{level}</span>
                                  </label>
                                ))}
                              </div>
                              <small>1 = uncertain · 5 = ready</small>
                            </fieldset>

                            <label>
                              <span>Structural note <small>optional</small></span>
                              <textarea
                                value={practiceNote}
                                maxLength={280}
                                rows={3}
                                placeholder="e.g. Transition stayed steady at a slower tempo."
                                onChange={(event) => setPracticeNote(event.target.value)}
                              />
                            </label>
                            {logFeedback?.kind === "error" && (
                              <p className="log-feedback error" role="alert">
                                {logFeedback.message}
                              </p>
                            )}
                            <div className="log-form-footer">
                              <small>{practiceNote.length}/280 · No lyrics</small>
                              <button type="submit">Save practice entry</button>
                            </div>
                          </form>
                        ) : !isRecorded ? (
                          <button
                            className="log-practice-button"
                            type="button"
                            onClick={() => openLogForm(session.sessionNumber)}
                          >
                            <span aria-hidden="true">＋</span> Log practice
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <footer className="safety-line">
                <span aria-hidden="true">✓</span>
                {state.plan.lyricRisk.message}
              </footer>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
