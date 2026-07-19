import { describe, expect, it, vi } from "vitest";

import {
  MakingOfCaptionModelError,
  type MakingOfCaptionModelRequest,
} from "../logic";
import {
  MAKING_OF_CAPTION_REASONING_EFFORT,
  OpenAIMakingOfCaptionConfigurationError,
  buildOpenAIMakingOfCaptionRequest,
  generateMakingOfCaptionWithOpenAI,
} from "./openai-making-of-caption";

const MODEL_REQUEST: MakingOfCaptionModelRequest = {
  model: "gpt-5.6",
  systemPrompt: "System instructions",
  userPrompt: "User caption data",
};

const OUTPUT = {
  caption:
    "I worked through two focused sessions before the transition finally felt steady. Here is the recorded cover.",
};

describe("OpenAI Making Of caption adapter", () => {
  it("builds the documented GPT-5.6 Responses structured-output request", () => {
    const request = buildOpenAIMakingOfCaptionRequest(MODEL_REQUEST);

    expect(request).toMatchObject({
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: "System instructions" },
        { role: "user", content: "User caption data" },
      ],
      text: {
        verbosity: "low",
        format: { type: "json_schema", name: "making_of_caption", strict: true },
      },
    });
    expect(MAKING_OF_CAPTION_REASONING_EFFORT).toBe("low");
  });

  it("returns parsed structured output through an injected Responses parser", async () => {
    const parseResponse = vi.fn(async () => ({ output_parsed: OUTPUT }));

    await expect(
      generateMakingOfCaptionWithOpenAI(MODEL_REQUEST, { parseResponse }),
    ).resolves.toEqual(OUTPUT);
    expect(parseResponse).toHaveBeenCalledOnce();
  });

  it("rejects absent parsed output as refusal or incomplete output", async () => {
    await expect(
      generateMakingOfCaptionWithOpenAI(MODEL_REQUEST, {
        parseResponse: async () => ({ output_parsed: null }),
      }),
    ).rejects.toThrowError(MakingOfCaptionModelError);
  });

  it("wraps provider failures without exposing details", async () => {
    await expect(
      generateMakingOfCaptionWithOpenAI(MODEL_REQUEST, {
        parseResponse: async () => {
          throw new Error("provider detail");
        },
      }),
    ).rejects.toMatchObject({
      name: "MakingOfCaptionModelError",
      message: "OpenAI Responses API request failed.",
    });
  });

  it("fails safely when the server API key is absent", async () => {
    await expect(
      generateMakingOfCaptionWithOpenAI(MODEL_REQUEST, { apiKey: "" }),
    ).rejects.toThrowError(OpenAIMakingOfCaptionConfigurationError);
  });
});
