import { z } from "zod";

import {
  GeneratedPracticePlanSchema,
  PracticePlanRequestSchema,
  type GeneratedPracticePlan,
  type PracticePlanRequest,
} from "./practice-plan";

const ApiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

const ACTIONABLE_ERROR_CODES = new Set([
  "invalid_request",
  "invalid_target_date",
  "invalid_frequency",
  "past_target_date",
  "too_many_sessions",
  "lyric_risk_blocked",
]);

function clientErrorMessage(code: string, serverMessage: string): string {
  return ACTIONABLE_ERROR_CODES.has(code)
    ? serverMessage
    : "Encore could not generate this practice plan right now. Please try again shortly.";
}

export class PracticePlanRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PracticePlanRequestError";
    this.code = code;
  }
}

export type PracticePlanFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function requestCountdownPracticePlan(
  input: PracticePlanRequest,
  fetchPlan: PracticePlanFetch = fetch,
): Promise<GeneratedPracticePlan> {
  const parsedRequest = PracticePlanRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    throw new PracticePlanRequestError(
      "invalid_request",
      "Choose a valid future Song Map and a practice rhythm from 1 through 7 sessions per week.",
    );
  }
  const request = parsedRequest.data;
  let response: Response;

  try {
    response = await fetchPlan("/api/practice-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new PracticePlanRequestError(
      "network_error",
      "Encore could not reach the plan generator. Check your connection and try again.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new PracticePlanRequestError(
      "invalid_response",
      "The plan generator returned an unreadable response. Please try again.",
    );
  }

  if (!response.ok) {
    const parsedError = ApiErrorSchema.safeParse(body);
    const code = parsedError.success ? parsedError.data.error.code : "generation_failed";
    throw new PracticePlanRequestError(
      code,
      parsedError.success
        ? clientErrorMessage(code, parsedError.data.error.message)
        : "Encore could not generate this practice plan. Please try again.",
    );
  }

  const parsedPlan = GeneratedPracticePlanSchema.safeParse(body);
  if (!parsedPlan.success) {
    throw new PracticePlanRequestError(
      "invalid_response",
      "The generated plan did not match Encore's session format. Please try again.",
    );
  }

  return parsedPlan.data;
}

export type PracticePlanWorkspaceState =
  | { readonly phase: "hydrating"; readonly plan: null; readonly error: null }
  | { readonly phase: "empty"; readonly plan: null; readonly error: null }
  | { readonly phase: "loading"; readonly plan: null; readonly error: null }
  | { readonly phase: "error"; readonly plan: null; readonly error: string }
  | { readonly phase: "success"; readonly plan: GeneratedPracticePlan; readonly error: null };

export type PracticePlanWorkspaceAction =
  | { readonly type: "restore"; readonly plan: GeneratedPracticePlan | null }
  | { readonly type: "submit" }
  | { readonly type: "resolve"; readonly plan: GeneratedPracticePlan }
  | { readonly type: "reject"; readonly message: string };

export const INITIAL_PRACTICE_PLAN_STATE: PracticePlanWorkspaceState = {
  phase: "hydrating",
  plan: null,
  error: null,
};

export function reducePracticePlanWorkspace(
  state: PracticePlanWorkspaceState,
  action: PracticePlanWorkspaceAction,
): PracticePlanWorkspaceState {
  if (state.phase === "loading" && action.type === "submit") {
    return state;
  }

  switch (action.type) {
    case "restore":
      return action.plan
        ? { phase: "success", plan: action.plan, error: null }
        : { phase: "empty", plan: null, error: null };
    case "submit":
      return { phase: "loading", plan: null, error: null };
    case "resolve":
      return { phase: "success", plan: action.plan, error: null };
    case "reject":
      return { phase: "error", plan: null, error: action.message };
  }
}
