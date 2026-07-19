import { describe, expect, it, vi } from "vitest";

import { DEMO_SONG_MAP, PracticePlanModelError } from "../../../src/logic";
import { OpenAIConfigurationError } from "../../../src/server/openai-practice-plan";
import { createPracticePlanPost } from "./route";

const NOW = new Date("2026-07-19T12:00:00.000Z");

function request(body: unknown): Request {
  return new Request("http://localhost/api/practice-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string): Request {
  return new Request("http://localhost/api/practice-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function validBody() {
  return { songMap: DEMO_SONG_MAP, sessionsPerWeek: 2 };
}

function output(totalSessions: number) {
  return {
    sessions: Array.from({ length: totalSessions }, (_, index) => ({
      sessionNumber: index + 1,
      focus: index < totalSessions - 2 ? "Bridge" : "Full run",
      technique: "Use a concrete practice technique.",
    })),
  };
}

function handler(generateModelOutput: Parameters<typeof createPracticePlanPost>[0]["generateModelOutput"]) {
  return createPracticePlanPost({ generateModelOutput, now: () => NOW });
}

describe("POST /api/practice-plan", () => {
  it("returns a validated countdown plan", async () => {
    const generateModelOutput = vi.fn(async ({ totalSessions }) => output(totalSessions));
    const response = await handler(generateModelOutput)(request(validBody()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      model: "gpt-5.6",
      daysRemaining: 27,
      totalSessions: 8,
      lyricRisk: { passed: true },
    });
    expect(body.sessions).toHaveLength(8);
  });

  it("returns 400 for malformed or unknown request fields", async () => {
    const generateModelOutput = vi.fn();
    const response = await handler(generateModelOutput)(
      request({ ...validBody(), unexpected: true }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
    expect(generateModelOutput).not.toHaveBeenCalled();

    const malformed = await handler(generateModelOutput)(rawRequest("{not-json"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ error: { code: "invalid_request" } });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 400 and skips the model for empty maps and invalid frequency", async () => {
    const generateModelOutput = vi.fn();
    const emptyMap = await handler(generateModelOutput)(
      request({
        ...validBody(),
        songMap: { ...DEMO_SONG_MAP, sections: [] },
      }),
    );
    const invalidFrequency = await handler(generateModelOutput)(
      request({ ...validBody(), sessionsPerWeek: 2.5 }),
    );

    expect(emptyMap.status).toBe(400);
    expect(invalidFrequency.status).toBe(400);
    await expect(emptyMap.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
    await expect(invalidFrequency.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid countdown", async () => {
    const generateModelOutput = vi.fn();
    for (const targetDate of ["2026-07-18", "2026-07-19"]) {
      const response = await handler(generateModelOutput)(
        request({
          ...validBody(),
          songMap: { ...DEMO_SONG_MAP, targetDate },
        }),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "past_target_date" },
      });
    }
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 422 with affected sections before model invocation", async () => {
    const generateModelOutput = vi.fn();
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
    const response = await handler(generateModelOutput)(
      request({ songMap: riskySongMap, sessionsPerWeek: 2 }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      error: {
        code: "lyric_risk_blocked",
        details: [{ sectionName: "Bridge" }],
      },
    });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 500 when OpenAI server configuration is absent", async () => {
    const response = await handler(async () => {
      throw new OpenAIConfigurationError();
    })(request(validBody()));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: "configuration_error",
        message: "Practice plan generation is not configured right now.",
      },
    });
  });

  it("returns a generic 500 when the server clock is invalid", async () => {
    const generateModelOutput = vi.fn();
    const response = await createPracticePlanPost({
      generateModelOutput,
      now: () => new Date(Number.NaN),
    })(request(validBody()));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "internal_error", message: "An unexpected server error occurred." },
    });
    expect(generateModelOutput).not.toHaveBeenCalled();
  });

  it("returns 502 for provider and output-contract failures", async () => {
    const providerResponse = await handler(async () => {
      throw new PracticePlanModelError("provider failed");
    })(request(validBody()));
    const outputResponse = await handler(async () => output(1))(request(validBody()));
    const missingOutputResponse = await handler(async () => null)(request(validBody()));

    expect(providerResponse.status).toBe(502);
    expect(await providerResponse.json()).toMatchObject({ error: { code: "generation_failed" } });
    expect(outputResponse.status).toBe(502);
    expect(await outputResponse.json()).toMatchObject({ error: { code: "generation_failed" } });
    expect(missingOutputResponse.status).toBe(502);
    expect(await missingOutputResponse.json()).toMatchObject({
      error: { code: "generation_failed" },
    });
  });
});
