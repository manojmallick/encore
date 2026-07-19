"use client";

import { useState } from "react";

import {
  MakingOfCaptionRequestError,
  requestMakingOfCaption,
  type GeneratedMakingOfCaption,
  type PracticeLogEntry,
  type RecordingDecision,
  type SongPublication,
  type SongMap,
} from "@/src/logic";

export interface MakingOfCaptionProps {
  readonly songMap: SongMap;
  readonly practiceLogs: readonly PracticeLogEntry[];
  readonly recordingDecision: RecordingDecision;
  readonly publication: SongPublication | null;
  readonly publicationFeedback: {
    readonly kind: "saved" | "warning" | "error";
    readonly message: string;
  } | null;
  readonly onMarkPublished: (caption: GeneratedMakingOfCaption) => void;
  readonly onReopenPublished: () => void;
}

type CaptionState =
  | { readonly phase: "idle"; readonly caption: null; readonly error: null }
  | { readonly phase: "loading"; readonly caption: GeneratedMakingOfCaption | null; readonly error: null }
  | { readonly phase: "success"; readonly caption: GeneratedMakingOfCaption; readonly error: null }
  | { readonly phase: "error"; readonly caption: GeneratedMakingOfCaption | null; readonly error: string };

export function MakingOfCaption({
  songMap,
  practiceLogs,
  recordingDecision,
  publication,
  publicationFeedback,
  onMarkPublished,
  onReopenPublished,
}: MakingOfCaptionProps) {
  const [state, setState] = useState<CaptionState>(() =>
    publication
      ? { phase: "success", caption: publication.caption, error: null }
      : { phase: "idle", caption: null, error: null },
  );
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | null>(null);
  const [showPublishFlow, setShowPublishFlow] = useState(false);
  const [confirmedExternalPost, setConfirmedExternalPost] = useState(false);
  const hasPracticeHistory = practiceLogs.length > 0;
  const isPublished = publication?.status === "published";

  function formatPublishedDate(value: string): string {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  async function generateCaption() {
    if (state.phase === "loading" || !hasPracticeHistory) return;
    setCopyStatus(null);
    setState({ phase: "loading", caption: state.caption, error: null });

    try {
      const caption = await requestMakingOfCaption({
        songMap: {
          ...songMap,
          sections: songMap.sections.map((section) => ({ ...section })),
        },
        practiceLogs: [...practiceLogs],
        recordingDecision,
      });
      setState({ phase: "success", caption, error: null });
    } catch (error) {
      setState({
        phase: "error",
        caption: state.caption,
        error:
          error instanceof MakingOfCaptionRequestError
            ? error.message
            : "Encore could not generate this caption. Please try again.",
      });
    }
  }

  async function copyCaption() {
    if (!state.caption) return;
    try {
      await navigator.clipboard.writeText(state.caption.caption);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  function markPublished() {
    if (!state.caption || !confirmedExternalPost) return;
    onMarkPublished(state.caption);
    setShowPublishFlow(false);
    setConfirmedExternalPost(false);
  }

  return (
    <section className="making-of-card" aria-labelledby="making-of-heading">
      <div className="making-of-intro">
        <div>
          <p className="eyebrow">Making Of caption</p>
          <h3 id="making-of-heading">Turn the practice history into the story.</h3>
        </div>
        <span>{isPublished ? "Published" : "GPT-5.6"}</span>
      </div>
      <p className="making-of-description">
        {isPublished
          ? "The cover and its Making Of story are marked published. Encore saved this milestone locally; it did not post to an external platform."
          : "Encore uses only your Song Map and saved practice entries—never lyrics—to draft a short caption for the recorded cover."}
      </p>

      {!hasPracticeHistory && (
        <div className="caption-empty">
          <strong>Practice history needed</strong>
          <p>Return to practice and log at least one section before generating the story.</p>
        </div>
      )}

      {state.caption && (
        <div className="caption-result">
          <blockquote>{state.caption.caption}</blockquote>
          <div className="caption-evidence">
            <span>{state.caption.practiceSessions} practiced {state.caption.practiceSessions === 1 ? "session" : "sessions"}</span>
            <span>{state.caption.practiceEntries} {state.caption.practiceEntries === 1 ? "entry" : "entries"}</span>
          </div>
          <p className="caption-safety">
            <span aria-hidden="true">✓</span>
            {state.caption.lyricRisk.message}
          </p>
        </div>
      )}

      {isPublished && publication && (
        <div className="published-completion">
          <div className="published-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Record-to-publish path complete</strong>
              <p>Marked published {formatPublishedDate(publication.publishedAt)}.</p>
            </div>
          </div>
          <ol aria-label="Completed Encore golden path">
            {[
              ["Map", "Song structured"],
              ["Plan", "Countdown generated"],
              ["Practice", "Progress logged"],
              ["Record", "Recording confirmed"],
              ["Publish", "Story shared"],
            ].map(([step, detail]) => (
              <li key={step}>
                <span aria-hidden="true">✓</span>
                <div><strong>{step}</strong><small>{detail}</small></div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!isPublished && state.caption && (
        <div className="publish-step">
          {!showPublishFlow ? (
            <>
              <div>
                <strong>Posted the cover?</strong>
                <p>Encore will only record the milestone—it will not publish anywhere for you.</p>
              </div>
              <button type="button" onClick={() => setShowPublishFlow(true)}>
                Finish publish step
              </button>
            </>
          ) : (
            <div className="publish-confirmation">
              <div className="publish-confirmation-heading">
                <strong>Confirm external publish</strong>
                <button type="button" onClick={() => setShowPublishFlow(false)}>Cancel</button>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={confirmedExternalPost}
                  onChange={(event) => setConfirmedExternalPost(event.target.checked)}
                />
                <span>I posted this recorded cover and its caption outside Encore.</span>
              </label>
              <button
                type="button"
                className="confirm-published-button"
                disabled={!confirmedExternalPost}
                onClick={markPublished}
              >
                Mark song published
              </button>
            </div>
          )}
        </div>
      )}

      {state.error && <p className="caption-feedback error" role="alert">{state.error}</p>}
      {copyStatus === "copied" && <p className="caption-feedback" role="status">Caption copied.</p>}
      {copyStatus === "error" && (
        <p className="caption-feedback error" role="alert">
          Copy was blocked by the browser. Select the caption and copy it manually.
        </p>
      )}
      {publicationFeedback && (
        <p
          className={`caption-feedback ${publicationFeedback.kind === "error" ? "error" : ""}`}
          role={publicationFeedback.kind === "error" ? "alert" : "status"}
        >
          {publicationFeedback.message}
        </p>
      )}

      <div className="caption-actions">
        {state.caption && (
          <button type="button" className="caption-copy-button" onClick={copyCaption}>
            Copy caption
          </button>
        )}
        {isPublished ? (
          <button type="button" className="caption-reopen-button" onClick={onReopenPublished}>
            Reopen recorded step
          </button>
        ) : (
          <button
            type="button"
            className="caption-generate-button"
            disabled={!hasPracticeHistory || state.phase === "loading"}
            onClick={generateCaption}
          >
            {state.phase === "loading" ? (
              <><span className="spinner" aria-hidden="true" /> Drafting the story…</>
            ) : state.caption ? (
              "Regenerate caption"
            ) : (
              "Generate Making Of caption"
            )}
          </button>
        )}
      </div>
    </section>
  );
}
