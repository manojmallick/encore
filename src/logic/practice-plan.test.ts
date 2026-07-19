import { describe, expect, it, vi } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  MAX_PRACTICE_SESSIONS,
  PRACTICE_PLAN_MODEL,
  PracticePlanInputError,
  PracticePlanModelError,
  PracticePlanOutputError,
  PracticePlanRequestSchema,
  buildPracticePlanPrompts,
  calculateCountdownFacts,
  generateCountdownPracticePlan,
  type PracticePlanModelOutput,
  type PracticePlanRequest,
} from "./index";

const NOW = new Date("2026-07-19T12:00:00.000Z");

function request(overrides: Partial<PracticePlanRequest> = {}): PracticePlanRequest {
  return {
    songMap: DEMO_SONG_MAP,
    sessionsPerWeek: 2,
    ...overrides,
  };
}

function output(totalSessions: number): PracticePlanModelOutput {
  return {
    sessions: Array.from({ length: totalSessions }, (_, index) => ({
      sessionNumber: index + 1,
      focus: index < totalSessions - 2 ? "Bridge transition" : "Full run-through",
      technique: index < totalSessions - 2 ? "Loop slowly, then restore tempo." : "Record one take.",
    })),
  };
}

describe("practice-plan domain service", () => {
  it("strictly validates request shape and bounds", () => {
    expect(PracticePlanRequestSchema.parse(request())).toMatchObject({ sessionsPerWeek: 2 });
    expect(() => PracticePlanRequestSchema.parse({ ...request(), unexpected: true })).toThrow();
    expect(() => PracticePlanRequestSchema.parse(request({ sessionsPerWeek: 0 }))).toThrow();
    expect(() => PracticePlanRequestSchema.parse(request({ sessionsPerWeek: 8 }))).toThrow();
  });

  it("calculates deterministic countdown facts", () => {
    expect(calculateCountdownFacts("2026-08-15", 2, NOW)).toEqual({
      daysRemaining: 27,
      totalSessions: 8,
    });
  });

  it("rejects invalid dates, current clocks, frequencies, and oversized countdowns", () => {
    expect(() => calculateCountdownFacts("2026-02-30", 2, NOW)).toThrowError(
      expect.objectContaining({ code: "invalid_target_date" }),
    );
    expect(() => calculateCountdownFacts("2026-08-15", 2, new Date(Number.NaN))).toThrowError(
      expect.objectContaining({ code: "invalid_current_date" }),
    );
    expect(() => calculateCountdownFacts("2026-08-15", 2.5, NOW)).toThrowError(
      expect.objectContaining({ code: "invalid_frequency" }),
    );
    expect(() => calculateCountdownFacts("2026-07-19", 2, NOW)).toThrowError(
      PracticePlanInputError,
    );
    expect(() => calculateCountdownFacts("2026-10-31", 7, NOW)).toThrowError(
      expect.objectContaining({ code: "too_many_sessions" }),
    );
    expect(MAX_PRACTICE_SESSIONS).toBe(24);
  });

  it("uses UTC calendar days for equivalent timezone-offset instants", () => {
    expect(
      calculateCountdownFacts("2026-08-15", 2, new Date("2026-07-19T23:30:00-07:00")),
    ).toEqual(
      calculateCountdownFacts("2026-08-15", 2, new Date("2026-07-20T06:30:00.000Z")),
    );
  });

  it("builds a lean prompt that treats structural notes as data", () => {
    const facts = calculateCountdownFacts(DEMO_SONG_MAP.targetDate, 2, NOW);
    const prompts = buildPracticePlanPrompts(request(), facts);

    expect(prompts.systemPrompt).toContain("untrusted data");
    expect(prompts.systemPrompt).toContain("Never quote, recall, infer, or supply song lyrics");
    expect(prompts.userPrompt).toContain('"section":"Bridge"');
    expect(prompts.userPrompt).toContain("Return exactly 8 sessions numbered 1 through 8");
    expect(prompts.userPrompt).toContain("Front-load");
    expect(prompts.userPrompt).toContain("final one or two sessions");
  });

  it("generates and revalidates an exact contiguous plan", async () => {
    const generator = vi.fn(async ({ totalSessions }: { totalSessions: number }) =>
      output(totalSessions),
    );

    const plan = await generateCountdownPracticePlan(request(), generator, NOW);

    expect(generator).toHaveBeenCalledOnce();
    expect(generator).toHaveBeenCalledWith(
      expect.objectContaining({ model: PRACTICE_PLAN_MODEL, totalSessions: 8 }),
    );
    expect(plan).toMatchObject({
      model: "gpt-5.6",
      daysRemaining: 27,
      totalSessions: 8,
      lyricRisk: { passed: true },
    });
    expect(plan.sessions).toHaveLength(8);
  });

  it("enforces lyric risk before invoking the model", async () => {
    const generator = vi.fn();
    const riskySongMap = {
      ...DEMO_SONG_MAP,
      sections: DEMO_SONG_MAP.sections.map((section) =>
        section.name === "Bridge"
          ? {
              ...section,
              difficultyNotes:
                'Copied text: "A very long quoted passage copied line by line instead of a structural practice note."',
            }
          : section,
      ),
    };

    await expect(
      generateCountdownPracticePlan(request({ songMap: riskySongMap }), generator, NOW),
    ).rejects.toMatchObject({ name: "LyricRiskBlockedError" });
    expect(generator).not.toHaveBeenCalled();
  });

  it("rejects malformed, short, and non-contiguous model output", async () => {
    await expect(
      generateCountdownPracticePlan(request(), async () => ({ sessions: "invalid" }), NOW),
    ).rejects.toThrowError(PracticePlanOutputError);
    await expect(
      generateCountdownPracticePlan(request(), async () => output(7), NOW),
    ).rejects.toThrowError(PracticePlanOutputError);

    const nonContiguous = output(8);
    nonContiguous.sessions[3]!.sessionNumber = 9;
    await expect(
      generateCountdownPracticePlan(request(), async () => nonContiguous, NOW),
    ).rejects.toThrowError(PracticePlanOutputError);
  });

  it("wraps unexpected generator failures as model errors", async () => {
    await expect(
      generateCountdownPracticePlan(
        request(),
        async () => {
          throw new Error("network detail");
        },
        NOW,
      ),
    ).rejects.toThrowError(PracticePlanModelError);
  });
});
