import { z } from "zod";

import { GeneratedPracticePlanSchema, type GeneratedPracticePlan } from "./practice-plan";
import { PracticeLogEntrySchema, type PracticeLogEntry, type SectionTrend } from "./section-mastery";
import type { RecordingReadinessResult, RecordingReadinessStatus } from "./recording-readiness";
import type { SongMap } from "./song-map";

export const CREATOR_RECOMMENDATIONS = [
  "gather_data",
  "adjust_plan",
  "keep_practicing",
  "record",
] as const;

export type CreatorRecommendation = (typeof CREATOR_RECOMMENDATIONS)[number];

export interface DashboardWeakSection {
  readonly sectionId: string;
  readonly sectionName: string;
  readonly latestConfidence: number | null;
  readonly trend: SectionTrend["trend"];
  readonly reason: string;
}

export interface CreatorDashboardRecommendation {
  readonly action: CreatorRecommendation;
  readonly label: string;
  readonly message: string;
}

export interface CreatorDashboardSnapshot {
  readonly daysRemaining: number;
  readonly loggedSessions: number;
  readonly totalSessions: number;
  readonly measuredSections: number;
  readonly totalSections: number;
  readonly readinessStatus: RecordingReadinessStatus;
  readonly readinessScore: number | null;
  readonly nextSession: {
    readonly sessionNumber: number;
    readonly focus: string;
  } | null;
  readonly weakSections: readonly DashboardWeakSection[];
  readonly recommendation: CreatorDashboardRecommendation;
}

export interface CreatorDashboardInput {
  readonly songMap: Pick<SongMap, "id" | "sections">;
  readonly plan: GeneratedPracticePlan;
  readonly practiceLogs: readonly PracticeLogEntry[];
  readonly sectionTrends: readonly SectionTrend[];
  readonly readiness: RecordingReadinessResult;
}

const RECOMMENDATIONS: Record<RecordingReadinessStatus, CreatorDashboardRecommendation> = {
  insufficient_data: {
    action: "gather_data",
    label: "Gather section data",
    message: "Log a first confidence rating for every section before making the recording call.",
  },
  behind: {
    action: "adjust_plan",
    label: "Adjust the plan",
    message: "Focus the weakest sections or move the date before committing to record.",
  },
  on_track: {
    action: "keep_practicing",
    label: "Keep practicing",
    message: "Follow the next sessions and let confidence keep pace with the countdown.",
  },
  ready: {
    action: "record",
    label: "Record the song",
    message: "Confidence, trends, and timing support moving into the recording step.",
  },
};

function weakReason(trend: SectionTrend): string {
  if (trend.latestConfidence === null) {
    return "No confidence rating yet";
  }
  if (trend.trend === "declining") {
    return `Declining at ${trend.latestConfidence}/5`;
  }
  return `Confidence is ${trend.latestConfidence}/5`;
}

export function createCreatorDashboard(
  input: CreatorDashboardInput,
): CreatorDashboardSnapshot {
  const plan = GeneratedPracticePlanSchema.parse(input.plan);
  const practiceLogs = z.array(PracticeLogEntrySchema).parse(input.practiceLogs);
  const sectionById = new Map(
    input.songMap.sections.map((section, orderIndex) => [section.id, { section, orderIndex }]),
  );
  const trendById = new Map(input.sectionTrends.map((trend) => [trend.sectionId, trend]));

  if (
    sectionById.size !== input.songMap.sections.length ||
    trendById.size !== input.sectionTrends.length ||
    input.sectionTrends.length !== input.songMap.sections.length ||
    input.sectionTrends.some((trend) => !sectionById.has(trend.sectionId))
  ) {
    throw new TypeError("Creator dashboard requires one trend for every mapped section.");
  }

  if (
    input.readiness.factors.totalSections !== input.songMap.sections.length ||
    input.readiness.factors.measuredSections > input.readiness.factors.totalSections
  ) {
    throw new TypeError("Creator dashboard readiness coverage does not match the Song Map.");
  }

  const loggedSessionNumbers = new Set(
    practiceLogs
      .filter(
        (entry) =>
          entry.songMapId === input.songMap.id &&
          entry.sessionNumber >= 1 &&
          entry.sessionNumber <= plan.totalSessions &&
          sectionById.has(entry.sectionId),
      )
      .map((entry) => entry.sessionNumber),
  );
  const nextSession = plan.sessions.find(
    (session) => !loggedSessionNumbers.has(session.sessionNumber),
  );

  const weakSections = input.sectionTrends
    .filter(
      (trend) =>
        trend.latestConfidence === null ||
        trend.trend === "declining" ||
        trend.latestConfidence < 4,
    )
    .sort((left, right) => {
      const leftMap = sectionById.get(left.sectionId)!;
      const rightMap = sectionById.get(right.sectionId)!;
      const unratedDelta = Number(right.latestConfidence === null) - Number(left.latestConfidence === null);
      if (unratedDelta !== 0) return unratedDelta;
      const decliningDelta = Number(right.trend === "declining") - Number(left.trend === "declining");
      if (decliningDelta !== 0) return decliningDelta;
      const confidenceDelta = (left.latestConfidence ?? 0) - (right.latestConfidence ?? 0);
      return confidenceDelta || leftMap.orderIndex - rightMap.orderIndex;
    })
    .slice(0, 3)
    .map((trend) => ({
      sectionId: trend.sectionId,
      sectionName: sectionById.get(trend.sectionId)!.section.name,
      latestConfidence: trend.latestConfidence,
      trend: trend.trend,
      reason: weakReason(trend),
    }));

  return {
    daysRemaining: input.readiness.factors.daysRemaining,
    loggedSessions: loggedSessionNumbers.size,
    totalSessions: plan.totalSessions,
    measuredSections: input.readiness.factors.measuredSections,
    totalSections: input.readiness.factors.totalSections,
    readinessStatus: input.readiness.status,
    readinessScore: input.readiness.score,
    nextSession: nextSession
      ? { sessionNumber: nextSession.sessionNumber, focus: nextSession.focus }
      : null,
    weakSections,
    recommendation: RECOMMENDATIONS[input.readiness.status],
  };
}
