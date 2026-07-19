import { describe, expect, it, vi } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  MAKING_OF_CAPTION_MODEL,
  MakingOfCaptionInputError,
  MakingOfCaptionModelError,
  MakingOfCaptionOutputError,
  buildMakingOfCaptionPrompts,
  generateMakingOfCaption,
  type MakingOfCaptionRequest,
} from "./index";

const DECISION = {
  songMapId: DEMO_SONG_MAP.id,
  decision: "recorded" as const,
  decidedAt: "2026-07-19T10:00:00.000Z",
  readinessStatus: "on_track" as const,
  readinessScore: 80,
  acknowledgedNotReady: true,
};

function logs() {
  return [
    {
      id: "10000000-0000-4000-8000-000000000001",
      songMapId: DEMO_SONG_MAP.id,
      sectionId: DEMO_SONG_MAP.sections[2]!.id,
      sessionNumber: 1,
      loggedAt: "2026-07-17T10:00:00.000Z",
      confidenceLevel: 2,
      note: "The chorus stayed controlled at a slower tempo.",
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      songMapId: DEMO_SONG_MAP.id,
      sectionId: DEMO_SONG_MAP.sections[2]!.id,
      sessionNumber: 2,
      loggedAt: "2026-07-18T10:00:00.000Z",
      confidenceLevel: 4,
      note: "The transition held together in the full run.",
    },
  ];
}

function request(overrides: Partial<MakingOfCaptionRequest> = {}): MakingOfCaptionRequest {
  return {
    songMap: {
      ...DEMO_SONG_MAP,
      sections: DEMO_SONG_MAP.sections.map((section) => ({ ...section })),
    },
    practiceLogs: logs(),
    recordingDecision: DECISION,
    ...overrides,
  };
}

const OUTPUT = {
  caption:
    "I spent two focused sessions getting the Chorus transition from uncertain to steady. Here is my recorded cover of Dreams.",
};

describe("making-of-caption domain service", () => {
  it("builds a lean prompt from untrusted, lyric-free practice history", () => {
    const prompts = buildMakingOfCaptionPrompts(request());

    expect(prompts.systemPrompt).toContain("untrusted content");
    expect(prompts.systemPrompt).toContain("Never quote, recall, infer, transform, or supply song lyrics");
    expect(prompts.userPrompt).toContain('"section":"Chorus"');
    expect(prompts.userPrompt).toContain('"startingConfidence":2');
    expect(prompts.userPrompt).toContain('"latestConfidence":4');
    expect(prompts.userPrompt).toContain("2 to 4 concise sentences");
  });

  it("generates a validated caption with source evidence", async () => {
    const generator = vi.fn(async () => OUTPUT);

    await expect(generateMakingOfCaption(request(), generator)).resolves.toEqual({
      model: MAKING_OF_CAPTION_MODEL,
      caption: OUTPUT.caption,
      practiceSessions: 2,
      practiceEntries: 2,
      lyricRisk: expect.objectContaining({ passed: true }),
    });
    expect(generator).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.6" }),
    );
  });

  it("requires a matching recorded decision before model invocation", async () => {
    const generator = vi.fn();
    const input = request({
      recordingDecision: { ...DECISION, decision: "keep_practicing" },
    });

    await expect(generateMakingOfCaption(input, generator)).rejects.toMatchObject({
      name: "MakingOfCaptionInputError",
      code: "not_recorded",
    });
    expect(generator).not.toHaveBeenCalled();
  });

  it("rejects practice history that does not belong to the Song Map", async () => {
    const generator = vi.fn();
    const input = request({
      practiceLogs: logs().map((entry) => ({
        ...entry,
        songMapId: "20000000-0000-4000-8000-000000000001",
      })),
    });

    await expect(generateMakingOfCaption(input, generator)).rejects.toThrowError(
      MakingOfCaptionInputError,
    );
    expect(generator).not.toHaveBeenCalled();
  });

  it("blocks risky Song Map and practice-log notes before model invocation", async () => {
    const generator = vi.fn();
    const riskySongMap = request({
      songMap: {
        ...request().songMap,
        sections: request().songMap.sections.map((section, index) =>
          index === 0
            ? {
                ...section,
                difficultyNotes:
                  'Copied text: "A very long quoted passage copied line by line instead of a structural practice note."',
              }
            : section,
        ),
      },
    });
    const riskyLog = request({
      practiceLogs: logs().map((entry, index) =>
        index === 0
          ? {
              ...entry,
              note: 'Copied text: "A very long quoted passage copied line by line instead of a structural observation."',
            }
          : entry,
      ),
    });

    await expect(generateMakingOfCaption(riskySongMap, generator)).rejects.toMatchObject({
      code: "lyric_risk_blocked",
    });
    await expect(generateMakingOfCaption(riskyLog, generator)).rejects.toMatchObject({
      code: "lyric_risk_blocked",
    });
    expect(generator).not.toHaveBeenCalled();
  });

  it("rejects malformed and lyric-risky model output", async () => {
    await expect(
      generateMakingOfCaption(request(), async () => ({ caption: "Too short" })),
    ).rejects.toThrowError(MakingOfCaptionOutputError);
    await expect(
      generateMakingOfCaption(request(), async () => ({
        caption:
          'My practice story became this: "A very long quoted passage copied from somewhere instead of a safe description of the process."',
      })),
    ).rejects.toThrowError(MakingOfCaptionOutputError);
  });

  it("wraps unexpected generator failures", async () => {
    await expect(
      generateMakingOfCaption(request(), async () => {
        throw new Error("provider detail");
      }),
    ).rejects.toThrowError(MakingOfCaptionModelError);
  });
});
