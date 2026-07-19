"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CreatorDashboardSnapshot,
  RecordingDecision,
  RecordingReadinessResult,
} from "@/src/logic";

export interface CreatorDashboardProps {
  readonly songTitle: string;
  readonly dashboard: CreatorDashboardSnapshot;
  readonly readiness: RecordingReadinessResult;
  readonly decision: RecordingDecision | null;
  readonly isPublished: boolean;
  readonly decisionFeedback: {
    readonly kind: "saved" | "warning" | "error";
    readonly message: string;
  } | null;
  readonly onKeepPracticing: () => void;
  readonly onMarkRecorded: (acknowledgedNotReady: boolean) => void;
  readonly onReturnToPractice: () => void;
}

const READINESS_COPY: Record<CreatorDashboardSnapshot["readinessStatus"], string> = {
  insufficient_data: "Need data",
  behind: "Behind",
  on_track: "On track",
  ready: "Ready",
};

function formatDecisionDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function CreatorDashboard({
  songTitle,
  dashboard,
  readiness,
  decision,
  isPublished,
  decisionFeedback,
  onKeepPracticing,
  onMarkRecorded,
  onReturnToPractice,
}: CreatorDashboardProps) {
  const [showDecisionFlow, setShowDecisionFlow] = useState(false);
  const [acknowledgedNotReady, setAcknowledgedNotReady] = useState(false);
  const decisionFlowRef = useRef<HTMLDivElement>(null);
  const isRecorded = decision?.decision === "recorded";
  const requiresOverride = readiness.status !== "ready";

  useEffect(() => {
    if (showDecisionFlow) {
      const target =
        decisionFlowRef.current?.querySelector<HTMLElement>("input") ??
        decisionFlowRef.current?.querySelector<HTMLElement>("button");
      target?.focus();
    }
  }, [showDecisionFlow]);

  function closeDecisionFlow() {
    setShowDecisionFlow(false);
    setAcknowledgedNotReady(false);
  }

  function keepPracticing() {
    onKeepPracticing();
    closeDecisionFlow();
  }

  function markRecorded() {
    onMarkRecorded(acknowledgedNotReady);
    closeDecisionFlow();
  }

  return (
    <section className={`creator-dashboard ${isRecorded ? "dashboard-recorded" : ""}`} aria-labelledby="dashboard-heading">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Creator dashboard</p>
          <h3 id="dashboard-heading">One view. One recording decision.</h3>
        </div>
        <span className="dashboard-status">
          <span aria-hidden="true" />
          {isPublished ? "Published" : isRecorded ? "Recorded" : "In practice"}
        </span>
      </header>

      <dl className="dashboard-metrics">
        <div>
          <dt>Countdown</dt>
          <dd>{dashboard.daysRemaining} days</dd>
        </div>
        <div>
          <dt>Sessions practiced</dt>
          <dd>{dashboard.loggedSessions}/{dashboard.totalSessions}</dd>
        </div>
        <div>
          <dt>Section coverage</dt>
          <dd>{dashboard.measuredSections}/{dashboard.totalSections}</dd>
        </div>
        <div>
          <dt>Readiness</dt>
          <dd>
            {READINESS_COPY[dashboard.readinessStatus]}
            {dashboard.readinessScore === null ? "" : ` · ${dashboard.readinessScore}`}
          </dd>
        </div>
      </dl>

      <div className="dashboard-panels">
        <article className="dashboard-panel next-panel">
          <p className="dashboard-panel-label">Next session</p>
          {dashboard.nextSession ? (
            <>
              <strong>Session {dashboard.nextSession.sessionNumber}</strong>
              <span>{dashboard.nextSession.focus}</span>
            </>
          ) : (
            <>
              <strong>Plan practiced</strong>
              <span>Every countdown session has at least one entry.</span>
            </>
          )}
        </article>

        <article className="dashboard-panel weak-panel">
          <p className="dashboard-panel-label">Weak sections</p>
          {dashboard.weakSections.length > 0 ? (
            <ol>
              {dashboard.weakSections.map((section) => (
                <li key={section.sectionId}>
                  <strong>{section.sectionName}</strong>
                  <span>{section.reason}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dashboard-clear">No section is below 4/5 or declining.</p>
          )}
        </article>

        <article className="dashboard-panel decision-panel">
          <p className="dashboard-panel-label">Recommended move</p>
          <strong>{dashboard.recommendation.label}</strong>
          <p>{dashboard.recommendation.message}</p>

          {isRecorded ? (
            <div className="recorded-decision">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>
                  {isPublished ? `${songTitle} is published` : `${songTitle} is marked recorded`}
                </strong>
                {isPublished ? (
                  <p>The Map → Plan → Practice → Record → Publish path is complete.</p>
                ) : (
                  <>
                    <p>
                      Decision saved {formatDecisionDate(decision.decidedAt)} with readiness {decision.readinessStatus.replace("_", " ")}.
                    </p>
                    <button type="button" onClick={onReturnToPractice}>Return to practice</button>
                  </>
                )}
              </div>
            </div>
          ) : showDecisionFlow ? (
            <div className="recording-decision-flow" ref={decisionFlowRef}>
              <div className="decision-flow-heading">
                <strong>Make the recording call</strong>
                <button type="button" onClick={closeDecisionFlow}>Cancel</button>
              </div>
              {requiresOverride && (
                <label className="override-confirmation">
                  <input
                    type="checkbox"
                    checked={acknowledgedNotReady}
                    onChange={(event) => setAcknowledgedNotReady(event.target.checked)}
                  />
                  <span>
                    Readiness is {readiness.status.replace("_", " ")}. I understand Encore recommends more practice, but the artistic decision is mine.
                  </span>
                </label>
              )}
              <div className="decision-actions">
                <button type="button" className="secondary-decision" onClick={keepPracticing}>
                  Keep practicing
                </button>
                <button
                  type="button"
                  className="primary-decision"
                  disabled={requiresOverride && !acknowledgedNotReady}
                  onClick={markRecorded}
                >
                  Confirm song recorded
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="review-decision-button"
              onClick={() => setShowDecisionFlow(true)}
            >
              Review recording decision <span aria-hidden="true">↗</span>
            </button>
          )}

          {decision?.decision === "keep_practicing" && !showDecisionFlow && (
            <p className="previous-decision">Last decision: keep practicing · {formatDecisionDate(decision.decidedAt)}</p>
          )}
          {decisionFeedback && (
            <p
              className={`decision-feedback ${decisionFeedback.kind}`}
              role={decisionFeedback.kind === "error" ? "alert" : "status"}
            >
              {decisionFeedback.message}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
