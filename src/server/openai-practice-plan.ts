import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  PracticePlanConfigurationError,
  PracticePlanModelError,
  PracticePlanModelOutputSchema,
  type PracticePlanModelRequest,
} from "../logic/practice-plan";

export const PRACTICE_PLAN_REASONING_EFFORT = "low" as const;

export class OpenAIConfigurationError extends PracticePlanConfigurationError {
  constructor() {
    super("OPENAI_API_KEY is not configured on the server.");
    this.name = "OpenAIConfigurationError";
  }
}

export function buildOpenAIPracticePlanRequest(request: PracticePlanModelRequest) {
  return {
    model: request.model,
    reasoning: { effort: PRACTICE_PLAN_REASONING_EFFORT },
    input: [
      { role: "system" as const, content: request.systemPrompt },
      { role: "user" as const, content: request.userPrompt },
    ],
    text: {
      format: zodTextFormat(PracticePlanModelOutputSchema, "practice_plan"),
    },
  };
}

export interface OpenAIPracticePlanAdapterOptions {
  readonly apiKey?: string;
  readonly parseResponse?: (
    request: ReturnType<typeof buildOpenAIPracticePlanRequest>,
  ) => Promise<{ readonly output_parsed: unknown }>;
}

export async function generatePracticePlanWithOpenAI(
  request: PracticePlanModelRequest,
  options: OpenAIPracticePlanAdapterOptions = {},
): Promise<unknown> {
  const openAIRequest = buildOpenAIPracticePlanRequest(request);

  try {
    let response: { readonly output_parsed: unknown };
    if (options.parseResponse) {
      response = await options.parseResponse(openAIRequest);
    } else {
      const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new OpenAIConfigurationError();
      }
      const client = new OpenAI({ apiKey });
      response = await client.responses.parse(openAIRequest);
    }

    if (!response.output_parsed) {
      throw new PracticePlanModelError(
        "GPT-5.6 did not return a parsed practice plan; the response may have been refused or incomplete.",
      );
    }

    return response.output_parsed;
  } catch (error) {
    if (error instanceof OpenAIConfigurationError || error instanceof PracticePlanModelError) {
      throw error;
    }
    throw new PracticePlanModelError("OpenAI Responses API request failed.", {
      cause: error,
    });
  }
}
