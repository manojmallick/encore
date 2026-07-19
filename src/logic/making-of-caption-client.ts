import { z } from "zod";

import {
  GeneratedMakingOfCaptionSchema,
  MakingOfCaptionRequestSchema,
  type GeneratedMakingOfCaption,
  type MakingOfCaptionRequest,
} from "./making-of-caption";

const ApiErrorSchema = z
  .object({
    error: z
      .object({ code: z.string(), message: z.string() })
      .passthrough(),
  })
  .passthrough();

const ACTIONABLE_ERROR_CODES = new Set([
  "invalid_request",
  "not_recorded",
  "invalid_history",
  "lyric_risk_blocked",
]);

export class MakingOfCaptionRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MakingOfCaptionRequestError";
    this.code = code;
  }
}

export type MakingOfCaptionFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function requestMakingOfCaption(
  input: MakingOfCaptionRequest,
  fetchCaption: MakingOfCaptionFetch = fetch,
): Promise<GeneratedMakingOfCaption> {
  const parsedRequest = MakingOfCaptionRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    throw new MakingOfCaptionRequestError(
      "invalid_request",
      "A recorded song with at least one valid practice entry is required before generating a caption.",
    );
  }
  const request = parsedRequest.data;
  let response: Response;

  try {
    response = await fetchCaption("/api/making-of-caption", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new MakingOfCaptionRequestError(
      "network_error",
      "Encore could not reach the caption generator. Check your connection and try again.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MakingOfCaptionRequestError(
      "invalid_response",
      "The caption generator returned an unreadable response. Please try again.",
    );
  }

  if (!response.ok) {
    const parsedError = ApiErrorSchema.safeParse(body);
    const code = parsedError.success ? parsedError.data.error.code : "generation_failed";
    throw new MakingOfCaptionRequestError(
      code,
      parsedError.success && ACTIONABLE_ERROR_CODES.has(code)
        ? parsedError.data.error.message
        : "Encore could not generate this caption right now. Please try again shortly.",
    );
  }

  const parsedCaption = GeneratedMakingOfCaptionSchema.safeParse(body);
  if (!parsedCaption.success) {
    throw new MakingOfCaptionRequestError(
      "invalid_response",
      "The generated caption did not match Encore's safe caption format. Please try again.",
    );
  }
  return parsedCaption.data;
}
