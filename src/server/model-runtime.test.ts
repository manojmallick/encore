import { describe, expect, it } from "vitest";

import type {
  MakingOfCaptionModelRequest,
  PracticePlanModelRequest,
} from "../logic";
import {
  DEMO_CAPTION,
  generateDemoPracticePlan,
  makingOfCaptionRuntime,
  practicePlanRuntime,
} from "./model-runtime";

const PLAN_REQUEST: PracticePlanModelRequest = {
  model: "gpt-5.6",
  systemPrompt: "system",
  userPrompt: "user",
  totalSessions: 6,
};

const CAPTION_REQUEST: MakingOfCaptionModelRequest = {
  model: "gpt-5.6",
  systemPrompt: "system",
  userPrompt: "user",
};

describe("model runtime", () => {
  it("uses deterministic demo fixtures when the API key is absent", async () => {
    const planRuntime = practicePlanRuntime({});
    const captionRuntime = makingOfCaptionRuntime({ OPENAI_API_KEY: "  " });

    expect(planRuntime.generationSource).toBe("demo_fixture");
    expect(captionRuntime.generationSource).toBe("demo_fixture");
    await expect(planRuntime.generateModelOutput(PLAN_REQUEST)).resolves.toEqual(
      await generateDemoPracticePlan(PLAN_REQUEST),
    );
    await expect(captionRuntime.generateModelOutput(CAPTION_REQUEST)).resolves.toEqual({
      caption: DEMO_CAPTION,
    });
  });

  it("returns the requested number of contiguous response-shaped sessions", async () => {
    const output = await generateDemoPracticePlan(PLAN_REQUEST);

    expect(output).toMatchObject({
      sessions: expect.arrayContaining([
        expect.objectContaining({ sessionNumber: 1 }),
        expect.objectContaining({ sessionNumber: 6 }),
      ]),
    });
    expect((output as { sessions: unknown[] }).sessions).toHaveLength(6);
  });

  it("selects the OpenAI adapters only for a non-empty key", () => {
    expect(
      practicePlanRuntime({ OPENAI_API_KEY: "server-key" }).generationSource,
    ).toBe("openai");
    expect(
      makingOfCaptionRuntime({ OPENAI_API_KEY: "server-key" }).generationSource,
    ).toBe("openai");
  });
});
