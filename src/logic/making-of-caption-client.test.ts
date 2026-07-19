import { describe, expect, it, vi } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  MakingOfCaptionRequestError,
  requestMakingOfCaption,
  type MakingOfCaptionRequest,
} from "./index";

function input(): MakingOfCaptionRequest {
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
        note: "The transition stayed controlled.",
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

const CAPTION = {
  model: "gpt-5.6",
  caption:
    "I spent one focused session making the Chorus transition feel steady. Here is my recorded cover of Dreams.",
  practiceSessions: 1,
  practiceEntries: 1,
  lyricRisk: {
    passed: true,
    message: "Lyric-risk check passed — generated only from the notes you provided.",
  },
};

describe("making-of-caption client", () => {
  it("posts the validated request and returns a validated caption", async () => {
    const fetchCaption = vi.fn(async () => Response.json(CAPTION));

    await expect(requestMakingOfCaption(input(), fetchCaption)).resolves.toEqual(CAPTION);
    expect(fetchCaption).toHaveBeenCalledWith(
      "/api/making-of-caption",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("preserves actionable lyric-risk errors", async () => {
    const fetchCaption = vi.fn(async () =>
      Response.json(
        { error: { code: "lyric_risk_blocked", message: "Rewrite the flagged note." } },
        { status: 422 },
      ),
    );

    await expect(requestMakingOfCaption(input(), fetchCaption)).rejects.toMatchObject({
      code: "lyric_risk_blocked",
      message: "Rewrite the flagged note.",
    });
  });

  it("hides provider details for server failures", async () => {
    const fetchCaption = vi.fn(async () =>
      Response.json(
        { error: { code: "generation_failed", message: "provider detail" } },
        { status: 502 },
      ),
    );

    await expect(requestMakingOfCaption(input(), fetchCaption)).rejects.toMatchObject({
      code: "generation_failed",
      message: "Encore could not generate this caption right now. Please try again shortly.",
    });
  });

  it("rejects unreadable and malformed success responses", async () => {
    await expect(
      requestMakingOfCaption(input(), async () => new Response("not json")),
    ).rejects.toThrowError(MakingOfCaptionRequestError);
    await expect(
      requestMakingOfCaption(input(), async () => Response.json({ caption: "invalid" })),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("maps network failures to an actionable message", async () => {
    await expect(
      requestMakingOfCaption(input(), async () => {
        throw new Error("offline");
      }),
    ).rejects.toMatchObject({
      code: "network_error",
      message: expect.stringContaining("Check your connection"),
    });
  });
});
