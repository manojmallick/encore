"use client";

import { useEffect, useReducer, useState } from "react";

import {
  DEMO_SONG_MAP,
  INITIAL_PRACTICE_PLAN_STATE,
  PracticePlanRequestError,
  persistPracticePlan,
  reducePracticePlanWorkspace,
  requestCountdownPracticePlan,
  restorePracticePlan,
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

export function CountdownWorkspace() {
  const [state, dispatch] = useReducer(
    reducePracticePlanWorkspace,
    INITIAL_PRACTICE_PLAN_STATE,
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(DEFAULT_SESSIONS_PER_WEEK);
  const [persistenceStatus, setPersistenceStatus] = useState<"saved" | "unavailable" | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const restored = restorePracticePlan(window.localStorage, DEMO_SONG_MAP);
      if (restored) {
        setSessionsPerWeek(restored.sessionsPerWeek);
        setPersistenceStatus("saved");
      }
      dispatch({ type: "restore", plan: restored?.plan ?? null });
    });

    return () => {
      active = false;
    };
  }, []);

  async function generatePlan() {
    if (state.phase === "loading") {
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

  const isLoading = state.phase === "loading";

  return (
    <main className="app-shell" aria-busy={isLoading}>
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
            Demo song map
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

          <div className="section-list" aria-label="Mapped song sections">
            {DEMO_SONG_MAP.sections.map((section) => (
              <span key={section.id}>{section.name}</span>
            ))}
          </div>

          <label className="frequency-control" htmlFor="sessions-per-week">
            <span>Practice rhythm</span>
            <select
              id="sessions-per-week"
              value={sessionsPerWeek}
              disabled={isLoading}
              onChange={(event) => setSessionsPerWeek(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency} {frequency === 1 ? "session" : "sessions"} / week
                </option>
              ))}
            </select>
          </label>

          <button className="generate-button" disabled={isLoading} onClick={generatePlan}>
            {isLoading ? (
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
          <p className="privacy-note">Saved only in this browser. Your notes stay lyric-free.</p>
        </aside>

        <section className="plan-panel" aria-labelledby="plan-heading" aria-live="polite">
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
              <p className="eyebrow">GPT-5.6 is arranging the work</p>
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
                <div className="plan-metrics" aria-label="Countdown summary">
                  <div>
                    <strong>{state.plan.daysRemaining}</strong>
                    <span>days left</span>
                  </div>
                  <div>
                    <strong>{state.plan.totalSessions}</strong>
                    <span>sessions</span>
                  </div>
                </div>
              </div>

              <p className={`save-status ${persistenceStatus === "unavailable" ? "warning" : ""}`}>
                <span aria-hidden="true">{persistenceStatus === "saved" ? "✓" : "○"}</span>
                {persistenceStatus === "saved"
                  ? "Saved in this browser"
                  : "Plan available for this visit; browser storage is unavailable"}
              </p>

              <ol className="session-list">
                {state.plan.sessions.map((session) => (
                  <li className="session-card" key={session.sessionNumber}>
                    <span className="session-index">
                      {String(session.sessionNumber).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="session-label">Session {session.sessionNumber}</p>
                      <h3>{session.focus}</h3>
                      <p>{session.technique}</p>
                    </div>
                  </li>
                ))}
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
