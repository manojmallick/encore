import { z } from "zod";

import { SECTION_TRENDS, type SectionTrend } from "./section-mastery";

export const RECORDING_READINESS_STATUSES = [
  "insufficient_data",
  "behind",
  "on_track",
  "ready",
] as const;

const ReadinessSectionTrendSchema = z
  .object({
    sectionId: z.uuid(),
    latestConfidence: z.number().int().min(1).max(5).nullable(),
    trend: z.enum(SECTION_TRENDS),
    entriesLogged: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((section, context) => {
    const hasConfidence = section.latestConfidence !== null;
    if ((section.entriesLogged === 0 && hasConfidence) || (section.entriesLogged > 0 && !hasConfidence)) {
      context.addIssue({
        code: "custom",
        message: "Confidence and entry count must describe the same coverage state.",
        path: ["latestConfidence"],
      });
    }
    if (section.entriesLogged < 2 && section.trend !== "insufficient_data") {
      context.addIssue({
        code: "custom",
        message: "Fewer than two entries must use the insufficient-data trend.",
        path: ["trend"],
      });
    }
    if (section.entriesLogged >= 2 && section.trend === "insufficient_data") {
      context.addIssue({
        code: "custom",
        message: "Two or more entries must have a calculated trend.",
        path: ["trend"],
      });
    }
  });

export const RecordingReadinessInputSchema = z
  .object({
    sectionTrends: z.array(ReadinessSectionTrendSchema).min(1).max(12),
    daysRemaining: z.number().int().nonnegative(),
    originalPlanDays: z.number().int().positive(),
  })
  .strict()
  .superRefine((input, context) => {
    const uniqueIds = new Set(input.sectionTrends.map((section) => section.sectionId));
    if (uniqueIds.size !== input.sectionTrends.length) {
      context.addIssue({
        code: "custom",
        message: "Readiness requires one trend per section.",
        path: ["sectionTrends"],
      });
    }
  });

export type RecordingReadinessStatus = (typeof RECORDING_READINESS_STATUSES)[number];

export interface RecordingReadinessInput {
  readonly sectionTrends: readonly SectionTrend[];
  readonly daysRemaining: number;
  readonly originalPlanDays: number;
}

export interface RecordingReadinessFactors {
  readonly measuredSections: number;
  readonly totalSections: number;
  readonly averageConfidence: number | null;
  readonly decliningSections: number;
  readonly daysRemaining: number;
  readonly originalPlanDays: number;
  readonly timeUsedPercent: number;
  readonly expectedConfidence: number;
  readonly confidenceGap: number | null;
}

export interface RecordingReadinessResult {
  readonly status: RecordingReadinessStatus;
  readonly score: number | null;
  readonly title: string;
  readonly message: string;
  readonly reasons: readonly string[];
  readonly factors: RecordingReadinessFactors;
}

const MILLISECONDS_PER_DAY = 86_400_000;
const THRESHOLD_EPSILON = 1e-9;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function targetUtcDay(targetDate: string): number {
  const parsedDate = z.iso.date().parse(targetDate);
  const [year, month, day] = parsedDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCalendarDaysRemaining(targetDate: string, now: Date): number {
  if (Number.isNaN(now.getTime())) {
    throw new TypeError("Readiness requires a valid current date.");
  }

  return Math.max(
    0,
    Math.ceil((targetUtcDay(targetDate) - utcDay(now)) / MILLISECONDS_PER_DAY),
  );
}

export function calculateRecordingReadiness(
  input: RecordingReadinessInput,
): RecordingReadinessResult {
  const parsed = RecordingReadinessInputSchema.parse(input);
  const measured = parsed.sectionTrends.filter(
    (section): section is typeof section & { latestConfidence: number } =>
      section.latestConfidence !== null,
  );
  const totalSections = parsed.sectionTrends.length;
  const measuredSections = measured.length;
  const decliningSections = parsed.sectionTrends.filter(
    (section) => section.trend === "declining",
  ).length;
  const timeUsedRatio = Math.max(
    0,
    Math.min(1, 1 - parsed.daysRemaining / parsed.originalPlanDays),
  );
  const rawExpectedConfidence = timeUsedRatio * 5;
  const rawAverageConfidence =
    measuredSections === 0
      ? null
      : measured.reduce((sum, section) => sum + section.latestConfidence, 0) /
        measuredSections;
  const expectedConfidence = roundToTwo(rawExpectedConfidence);
  const averageConfidence =
    rawAverageConfidence === null ? null : roundToTwo(rawAverageConfidence);
  const rawConfidenceGap =
    rawAverageConfidence === null ? null : rawExpectedConfidence - rawAverageConfidence;
  const confidenceGap =
    rawConfidenceGap === null ? null : roundToTwo(rawConfidenceGap);

  const factors: RecordingReadinessFactors = {
    measuredSections,
    totalSections,
    averageConfidence,
    decliningSections,
    daysRemaining: parsed.daysRemaining,
    originalPlanDays: parsed.originalPlanDays,
    timeUsedPercent: Math.round(timeUsedRatio * 100),
    expectedConfidence,
    confidenceGap,
  };

  if (measuredSections < totalSections) {
    const missingSections = totalSections - measuredSections;
    return {
      status: "insufficient_data",
      score: null,
      title: "Readiness needs more data",
      message: "Log confidence for every mapped section before Encore makes a recording call.",
      reasons: [
        `${measuredSections} of ${totalSections} sections have a confidence rating.`,
        `${missingSections} ${missingSections === 1 ? "section still needs" : "sections still need"} a first rating.`,
      ],
      factors,
    };
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round((rawAverageConfidence! / 5) * 100 - decliningSections * 8)),
  );
  const behindForGap = rawConfidenceGap! > 1.2 + THRESHOLD_EPSILON;
  const behindForDeclines = decliningSections >= 2;

  if (behindForGap || behindForDeclines) {
    const reasons = [
      ...(behindForGap
        ? [`Confidence is ${confidenceGap} points below the ${expectedConfidence}/5 expected now.`]
        : []),
      ...(behindForDeclines
        ? [`${decliningSections} sections currently have declining confidence trends.`]
        : []),
      `The score starts from ${averageConfidence}/5 average confidence and subtracts 8 points per declining section.`,
    ];
    return {
      status: "behind",
      score,
      title: "Behind — adjust the plan",
      message: "Reduce a difficult section, add focused practice, or move the recording date.",
      reasons,
      factors,
    };
  }

  if (averageConfidence! >= 4 && parsed.daysRemaining <= 2 && decliningSections === 0) {
    return {
      status: "ready",
      score,
      title: "Ready to record",
      message: "Confidence is high, no section is declining, and record day is close.",
      reasons: [
        `Average confidence is ${averageConfidence}/5 across every section.`,
        `${parsed.daysRemaining} ${parsed.daysRemaining === 1 ? "day remains" : "days remain"} and no section is declining.`,
      ],
      factors,
    };
  }

  return {
    status: "on_track",
    score,
    title: "On track",
    message: "Confidence is keeping pace with the countdown. Keep following the plan.",
    reasons: [
      `Average confidence is ${averageConfidence}/5 versus ${expectedConfidence}/5 expected now.`,
      `${decliningSections} declining ${decliningSections === 1 ? "section" : "sections"}; two would trigger a behind result.`,
    ],
    factors,
  };
}
