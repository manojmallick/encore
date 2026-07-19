import { z } from "zod";

import {
  LyricRiskBlockedError,
  PracticePlanConfigurationError,
  PracticePlanInputError,
  PracticePlanOutputError,
  PracticePlanRequestSchema,
  PracticePlanModelError,
  generateCountdownPracticePlan,
  type PracticePlanModelGenerator,
} from "../../../src/logic";
import { generatePracticePlanWithOpenAI } from "../../../src/server/openai-practice-plan";

export interface PracticePlanRouteDependencies {
  readonly generateModelOutput: PracticePlanModelGenerator;
  readonly now: () => Date;
}

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

export function createPracticePlanPost(dependencies: PracticePlanRouteDependencies) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const body: unknown = await request.json();
      const input = PracticePlanRequestSchema.parse(body);
      const plan = await generateCountdownPracticePlan(
        input,
        dependencies.generateModelOutput,
        dependencies.now(),
      );
      return Response.json(plan, { status: 200 });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof z.ZodError) {
        return errorResponse(
          400,
          "invalid_request",
          "Request body is not a valid practice plan request.",
        );
      }
      if (error instanceof PracticePlanInputError) {
        return errorResponse(400, error.code, error.message);
      }
      if (error instanceof LyricRiskBlockedError) {
        return errorResponse(
          422,
          "lyric_risk_blocked",
          error.message,
          error.result.flaggedSections,
        );
      }
      if (error instanceof PracticePlanConfigurationError) {
        return errorResponse(500, "configuration_error", error.message);
      }
      if (error instanceof PracticePlanModelError || error instanceof PracticePlanOutputError) {
        return errorResponse(
          502,
          "generation_failed",
          "Practice plan generation did not return a valid result. Please try again.",
        );
      }
      return errorResponse(500, "internal_error", "An unexpected server error occurred.");
    }
  };
}

export const POST = createPracticePlanPost({
  generateModelOutput: generatePracticePlanWithOpenAI,
  now: () => new Date(),
});
