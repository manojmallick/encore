import type {
  MakingOfCaptionModelGenerator,
  PracticePlanModelGenerator,
  PracticePlanModelRequest,
} from "../logic";
import { generateMakingOfCaptionWithOpenAI } from "./openai-making-of-caption";
import { generatePracticePlanWithOpenAI } from "./openai-practice-plan";

export type GenerationSource = "openai" | "demo_fixture";

export interface ModelRuntime<TGenerator> {
  readonly generationSource: GenerationSource;
  readonly generateModelOutput: TGenerator;
}

export type ModelRuntimeEnvironment = Readonly<Record<string, string | undefined>>;

const FOCUSED_PRACTICE = [
  {
    focus: "Hardest mapped section",
    technique:
      "Work in short loops at a controlled tempo, then reconnect the section to what comes before it.",
  },
  {
    focus: "Transition control",
    technique:
      "Alternate isolated transition repetitions with one longer phrase, keeping the timing consistent.",
  },
  {
    focus: "Confidence under repetition",
    technique:
      "Repeat the mapped challenge three times, record confidence after each pass, and keep the cleanest setup.",
  },
  {
    focus: "Section connection",
    technique:
      "Link two neighboring mapped sections without stopping and note where recovery becomes uncertain.",
  },
] as const;

const CLOSING_PRACTICE = [
  {
    focus: "Full-song transitions",
    technique:
      "Run the song from start to finish, then revisit only the transitions that interrupted the flow.",
  },
  {
    focus: "Recording rehearsal",
    technique:
      "Record one uninterrupted rehearsal and use the section notes for a final focused review.",
  },
] as const;

export const DEMO_CAPTION =
  "I used the countdown to focus on the sections I logged and watched my confidence change session by session. Here is my recorded cover and the practice story behind it.";

export const generateDemoPracticePlan: PracticePlanModelGenerator = async (
  request: PracticePlanModelRequest,
) => {
  const focusedSessionCount = Math.max(0, request.totalSessions - CLOSING_PRACTICE.length);

  return {
    sessions: Array.from({ length: request.totalSessions }, (_, index) => {
      const template =
        index < focusedSessionCount
          ? FOCUSED_PRACTICE[index % FOCUSED_PRACTICE.length]!
          : CLOSING_PRACTICE[index - focusedSessionCount]!;
      return { sessionNumber: index + 1, ...template };
    }),
  };
};

export const generateDemoMakingOfCaption: MakingOfCaptionModelGenerator = async () => ({
  caption: DEMO_CAPTION,
});

function apiKey(environment: ModelRuntimeEnvironment): string | null {
  const value = environment.OPENAI_API_KEY?.trim();
  return value ? value : null;
}

export function practicePlanRuntime(
  environment: ModelRuntimeEnvironment = process.env,
): ModelRuntime<PracticePlanModelGenerator> {
  const key = apiKey(environment);
  return key
    ? {
        generationSource: "openai",
        generateModelOutput: (request) =>
          generatePracticePlanWithOpenAI(request, { apiKey: key }),
      }
    : {
        generationSource: "demo_fixture",
        generateModelOutput: generateDemoPracticePlan,
      };
}

export function makingOfCaptionRuntime(
  environment: ModelRuntimeEnvironment = process.env,
): ModelRuntime<MakingOfCaptionModelGenerator> {
  const key = apiKey(environment);
  return key
    ? {
        generationSource: "openai",
        generateModelOutput: (request) =>
          generateMakingOfCaptionWithOpenAI(request, { apiKey: key }),
      }
    : {
        generationSource: "demo_fixture",
        generateModelOutput: generateDemoMakingOfCaption,
      };
}
