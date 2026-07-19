import { describe, expect, it, vi } from "vitest";

import {
  PracticePlanModelError,
  type PracticePlanModelOutput,
  type PracticePlanModelRequest,
} from "../logic";
import {
  OpenAIConfigurationError,
  PRACTICE_PLAN_REASONING_EFFORT,
  buildOpenAIPracticePlanRequest,
  generatePracticePlanWithOpenAI,
} from "./openai-practice-plan";

const MODEL_REQUEST: PracticePlanModelRequest = {
  model: "gpt-5.6",
  systemPrompt: "System instructions",
  userPrompt: "User countdown data",
  totalSessions: 2,
};

const OUTPUT: PracticePlanModelOutput = {
  sessions: [
    { sessionNumber: 1, focus: "Bridge", technique: "Loop slowly." },
    { sessionNumber: 2, focus: "Full run", technique: "Record one take." },
  ],
};

describe("OpenAI practice-plan adapter", () => {
  it("builds the documented GPT-5.6 Responses structured-output request", () => {
    const request = buildOpenAIPracticePlanRequest(MODEL_REQUEST);

    expect(request).toMatchObject({
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: "System instructions" },
        { role: "user", content: "User countdown data" },
      ],
      text: { format: { type: "json_schema", name: "practice_plan", strict: true } },
    });
    expect(PRACTICE_PLAN_REASONING_EFFORT).toBe("low");
  });

  it("returns parsed structured output through an injected Responses parser", async () => {
    const parseResponse = vi.fn(async () => ({ output_parsed: OUTPUT }));

    await expect(
      generatePracticePlanWithOpenAI(MODEL_REQUEST, { parseResponse }),
    ).resolves.toEqual(OUTPUT);
    expect(parseResponse).toHaveBeenCalledOnce();
  });

  it("rejects absent parsed output as refusal or incomplete output", async () => {
    await expect(
      generatePracticePlanWithOpenAI(MODEL_REQUEST, {
        parseResponse: async () => ({ output_parsed: null }),
      }),
    ).rejects.toThrowError(PracticePlanModelError);
  });

  it("wraps Responses API failures without exposing provider details", async () => {
    await expect(
      generatePracticePlanWithOpenAI(MODEL_REQUEST, {
        parseResponse: async () => {
          throw new Error("provider detail");
        },
      }),
    ).rejects.toMatchObject({
      name: "PracticePlanModelError",
      message: "OpenAI Responses API request failed.",
    });
  });

  it("fails safely when the server API key is absent", async () => {
    await expect(
      generatePracticePlanWithOpenAI(MODEL_REQUEST, { apiKey: "" }),
    ).rejects.toThrowError(OpenAIConfigurationError);
  });
});
