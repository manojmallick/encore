import { describe, expect, it, vi } from "vitest";

import {
  DEMO_SONG_MAP,
  MakingOfCaptionModelError,
  type MakingOfCaptionRequest,
} from "../../../src/logic";
import { OpenAIMakingOfCaptionConfigurationError } from "../../../src/server/openai-making-of-caption";
import { createMakingOfCaptionPost } from "./route";

const OUTPUT = {
  caption:
    "I spent two focused sessions making the Chorus transition feel steady. Here is my recorded cover of Dreams.",
};

function body(): MakingOfCaptionRequest {
  return {
    songMap: {
      ...DEMO_SONG_MAP,
      sections: DEMO_SONG_MAP.sections.map((section) => ({ ...section })),
    },
    practiceLogs: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        songMapId: DEMO_SONG_MAP.id,
        sectionId: DEMO_SONG_MAP.sections[2]!.id,
        sessionNumber: 1,
        loggedAt: "2026-07-18T10:00:00.000Z",
        confidenceLevel: 4,
        note: "The transition stayed controlled at a slower tempo.",
      },
    ],
    recordingDecision: {
      songMapId: DEMO_SONG_MAP.id,
      decision: "recorded",
      decidedAt: "2026-07-19T10:00:00.000Z",
      readinessStatus: "on_track",
      readinessScore: 80,
      acknowledgedNotReady: true,
    },
  };
}

function request(value: unknown): Request {
  return new Request("http://localhost/api/making-of-caption", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}

function handler(
  generateModelOutput: Parameters<typeof createMakingOfCaptionPost>[0]["generateModelOutput"],
) {
  return createMakingOfCaptionPost({ generateModelOutput });
}

describe("POST /api/making-of-caption", () => {
  it("returns a validated, lyric-safe caption", async () => {
    const response = await handler(vi.fn(async () => OUTPUT))(request(body()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      model: "gpt-5.6",
      caption: OUTPUT.caption,
      practiceSessions: 1,
      practiceEntries: 1,
      lyricRisk: { passed: true },
    });
  });

  it("returns 400 for malformed or unknown request fields", async () => {
    const generateModelOutput = vi.fn();
    const response = await handler(generateModelOutput)(
      request({ ...body(), unexpected: true }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 422 when the song is not recorded", async () => {
    const value = body();
    value.recordingDecision.decision = "keep_practicing";
    const response = await handler(vi.fn())(request(value));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "not_recorded" },
    });
  });

  it("returns 422 and skips the model for lyric-risky practice history", async () => {
    const value = body();
    value.practiceLogs[0]!.note =
      'Copied text: "A very long quoted passage copied line by line instead of a structural practice observation."';
    const generateModelOutput = vi.fn();
    const response = await handler(generateModelOutput)(request(value));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "lyric_risk_blocked" },
    });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 500 when OpenAI server configuration is absent", async () => {
    const response = await handler(async () => {
      throw new OpenAIMakingOfCaptionConfigurationError();
    })(request(body()));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "configuration_error" },
    });
  });

  it("returns 502 for provider and unsafe output failures", async () => {
    const provider = await handler(async () => {
      throw new MakingOfCaptionModelError("provider failed");
    })(request(body()));
    const unsafe = await handler(async () => ({
      caption:
        'My story includes "A very long quoted passage copied from somewhere instead of a safe account of the practice process."',
    }))(request(body()));

    expect(provider.status).toBe(502);
    expect(unsafe.status).toBe(502);
    await expect(provider.json()).resolves.toMatchObject({
      error: { code: "generation_failed" },
    });
    await expect(unsafe.json()).resolves.toMatchObject({
      error: { code: "generation_failed" },
    });
  });
});
