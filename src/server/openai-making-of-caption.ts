import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  MakingOfCaptionConfigurationError,
  MakingOfCaptionModelError,
  MakingOfCaptionModelOutputSchema,
  type MakingOfCaptionModelRequest,
} from "../logic";

export const MAKING_OF_CAPTION_REASONING_EFFORT = "low" as const;

export class OpenAIMakingOfCaptionConfigurationError extends MakingOfCaptionConfigurationError {
  constructor() {
    super("OPENAI_API_KEY is not configured on the server.");
    this.name = "OpenAIMakingOfCaptionConfigurationError";
  }
}

export function buildOpenAIMakingOfCaptionRequest(request: MakingOfCaptionModelRequest) {
  return {
    model: request.model,
    reasoning: { effort: MAKING_OF_CAPTION_REASONING_EFFORT },
    input: [
      { role: "system" as const, content: request.systemPrompt },
      { role: "user" as const, content: request.userPrompt },
    ],
    text: {
      verbosity: "low" as const,
      format: zodTextFormat(MakingOfCaptionModelOutputSchema, "making_of_caption"),
    },
  };
}

export interface OpenAIMakingOfCaptionAdapterOptions {
  readonly apiKey?: string;
  readonly parseResponse?: (
    request: ReturnType<typeof buildOpenAIMakingOfCaptionRequest>,
  ) => Promise<{ readonly output_parsed: unknown }>;
}

export async function generateMakingOfCaptionWithOpenAI(
  request: MakingOfCaptionModelRequest,
  options: OpenAIMakingOfCaptionAdapterOptions = {},
): Promise<unknown> {
  const openAIRequest = buildOpenAIMakingOfCaptionRequest(request);

  try {
    let response: { readonly output_parsed: unknown };
    if (options.parseResponse) {
      response = await options.parseResponse(openAIRequest);
    } else {
      const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new OpenAIMakingOfCaptionConfigurationError();
      }
      const client = new OpenAI({ apiKey });
      response = await client.responses.parse(openAIRequest);
    }

    if (!response.output_parsed) {
      throw new MakingOfCaptionModelError(
        "GPT-5.6 did not return a parsed caption; the response may have been refused or incomplete.",
      );
    }

    return response.output_parsed;
  } catch (error) {
    if (
      error instanceof OpenAIMakingOfCaptionConfigurationError ||
      error instanceof MakingOfCaptionModelError
    ) {
      throw error;
    }
    throw new MakingOfCaptionModelError("OpenAI Responses API request failed.", {
      cause: error,
    });
  }
}
