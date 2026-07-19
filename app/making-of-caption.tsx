"use client";

import { useState } from "react";

import {
  MakingOfCaptionRequestError,
  requestMakingOfCaption,
  type GeneratedMakingOfCaption,
  type PracticeLogEntry,
  type RecordingDecision,
  type SongMap,
} from "@/src/logic";

export interface MakingOfCaptionProps {
  readonly songMap: SongMap;
  readonly practiceLogs: readonly PracticeLogEntry[];
  readonly recordingDecision: RecordingDecision;
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
}: MakingOfCaptionProps) {
  const [state, setState] = useState<CaptionState>({
    phase: "idle",
    caption: null,
    error: null,
  });
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | null>(null);
  const hasPracticeHistory = practiceLogs.length > 0;

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

  return (
    <section className="making-of-card" aria-labelledby="making-of-heading">
      <div className="making-of-intro">
        <div>
          <p className="eyebrow">Making Of caption</p>
          <h3 id="making-of-heading">Turn the practice history into the story.</h3>
        </div>
        <span>GPT-5.6</span>
      </div>
      <p className="making-of-description">
        Encore uses only your Song Map and saved practice entries—never lyrics—to draft a
        short caption for the recorded cover.
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

      {state.error && <p className="caption-feedback error" role="alert">{state.error}</p>}
      {copyStatus === "copied" && <p className="caption-feedback" role="status">Caption copied.</p>}
      {copyStatus === "error" && (
        <p className="caption-feedback error" role="alert">
          Copy was blocked by the browser. Select the caption and copy it manually.
        </p>
      )}

      <div className="caption-actions">
        {state.caption && (
          <button type="button" className="caption-copy-button" onClick={copyCaption}>
            Copy caption
          </button>
        )}
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
      </div>
    </section>
  );
}
