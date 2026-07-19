import { describe, expect, it, vi } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  INITIAL_PRACTICE_PLAN_STATE,
  PracticePlanRequestError,
  reducePracticePlanWorkspace,
  requestCountdownPracticePlan,
} from "./practice-plan-client";
import type { GeneratedPracticePlan } from "./practice-plan";

const PLAN: GeneratedPracticePlan = {
  model: "gpt-5.6",
  daysRemaining: 27,
  totalSessions: 2,
  lyricRisk: { passed: true, message: "Artist notes passed the lyric-risk check." },
  sessions: [
    { sessionNumber: 1, focus: "Bridge transition", technique: "Loop it slowly." },
    { sessionNumber: 2, focus: "Full run-through", technique: "Record one take." },
  ],
};

describe("practice-plan browser client", () => {
  it("submits the v0.5 request contract and validates a successful plan", async () => {
    const fetchPlan = vi.fn(async () => Response.json(PLAN));

    await expect(
      requestCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        fetchPlan,
      ),
    ).resolves.toEqual(PLAN);

    expect(fetchPlan).toHaveBeenCalledWith(
      "/api/practice-plan",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 }),
      }),
    );
  });

  it("surfaces actionable API errors and rejects malformed success responses", async () => {
    await expect(
      requestCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        async () =>
          Response.json(
            { error: { code: "generation_failed", message: "Please try again." } },
            { status: 502 },
          ),
      ),
    ).rejects.toMatchObject({
      name: "PracticePlanRequestError",
      code: "generation_failed",
      message: "Encore could not generate this practice plan right now. Please try again shortly.",
    });

    await expect(
      requestCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        async () => Response.json({ ...PLAN, totalSessions: 3 }),
      ),
    ).rejects.toBeInstanceOf(PracticePlanRequestError);
  });

  it("keeps server configuration details out of browser error copy", async () => {
    await expect(
      requestCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        async () =>
          Response.json(
            {
              error: {
                code: "configuration_error",
                message: "OPENAI_API_KEY is not configured on the server.",
              },
            },
            { status: 500 },
          ),
      ),
    ).rejects.not.toThrow("OPENAI_API_KEY");
  });

  it("turns network failures into a retryable product message", async () => {
    await expect(
      requestCountdownPracticePlan(
        { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 },
        async () => {
          throw new Error("socket detail");
        },
      ),
    ).rejects.toMatchObject({ code: "network_error" });
  });
});

describe("practice-plan workspace state", () => {
  it("moves through empty, loading, error/retry, and success states", () => {
    const empty = reducePracticePlanWorkspace(INITIAL_PRACTICE_PLAN_STATE, {
      type: "restore",
      plan: null,
    });
    expect(empty.phase).toBe("empty");

    const loading = reducePracticePlanWorkspace(empty, { type: "submit" });
    expect(loading.phase).toBe("loading");
    expect(reducePracticePlanWorkspace(loading, { type: "submit" })).toBe(loading);

    const failed = reducePracticePlanWorkspace(loading, {
      type: "reject",
      message: "Please try again.",
    });
    expect(failed).toEqual({ phase: "error", plan: null, error: "Please try again." });

    const retrying = reducePracticePlanWorkspace(failed, { type: "submit" });
    const resolved = reducePracticePlanWorkspace(retrying, { type: "resolve", plan: PLAN });
    expect(resolved).toEqual({ phase: "success", plan: PLAN, error: null });
  });

  it("restores an existing plan directly into the review state", () => {
    expect(
      reducePracticePlanWorkspace(INITIAL_PRACTICE_PLAN_STATE, {
        type: "restore",
        plan: PLAN,
      }),
    ).toEqual({ phase: "success", plan: PLAN, error: null });
  });
});
