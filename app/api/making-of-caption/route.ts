import { z } from "zod";

import {
  MakingOfCaptionConfigurationError,
  MakingOfCaptionInputError,
  MakingOfCaptionModelError,
  MakingOfCaptionOutputError,
  MakingOfCaptionRequestSchema,
  generateMakingOfCaption,
  type MakingOfCaptionModelGenerator,
} from "../../../src/logic";
import { generateMakingOfCaptionWithOpenAI } from "../../../src/server/openai-making-of-caption";

export interface MakingOfCaptionRouteDependencies {
  readonly generateModelOutput: MakingOfCaptionModelGenerator;
}

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status },
  );
}

export function createMakingOfCaptionPost(
  dependencies: MakingOfCaptionRouteDependencies,
) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const body: unknown = await request.json();
      const input = MakingOfCaptionRequestSchema.parse(body);
      const caption = await generateMakingOfCaption(
        input,
        dependencies.generateModelOutput,
      );
      return Response.json(caption, { status: 200 });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof z.ZodError) {
        return errorResponse(
          400,
          "invalid_request",
          "Request body is not a valid Making Of caption request.",
        );
      }
      if (error instanceof MakingOfCaptionInputError) {
        return errorResponse(422, error.code, error.message, error.details);
      }
      if (error instanceof MakingOfCaptionConfigurationError) {
        return errorResponse(500, "configuration_error", error.message);
      }
      if (
        error instanceof MakingOfCaptionModelError ||
        error instanceof MakingOfCaptionOutputError
      ) {
        return errorResponse(
          502,
          "generation_failed",
          "Caption generation did not return a safe, valid result. Please try again.",
        );
      }
      return errorResponse(500, "internal_error", "An unexpected server error occurred.");
    }
  };
}

export const POST = createMakingOfCaptionPost({
  generateModelOutput: generateMakingOfCaptionWithOpenAI,
});
