import { describe, expect, it } from "vitest";

import { DEMO_SONG_MAP } from "./fixtures/demo-song-map";
import {
  PracticeLogInputError,
  computeSectionTrends,
  createPracticeLogEntry,
  type ConfidenceLevel,
  type PracticeLogEntry,
} from "./section-mastery";

const BRIDGE_ID = DEMO_SONG_MAP.sections[3]!.id;
const INTRO_ID = DEMO_SONG_MAP.sections[0]!.id;

function entry(
  idSuffix: number,
  sectionId: string,
  confidenceLevel: ConfidenceLevel,
  loggedAt: string,
): PracticeLogEntry {
  return {
    id: `9d8c9f62-c437-4f4a-8b4b-${String(idSuffix).padStart(12, "0")}`,
    songMapId: DEMO_SONG_MAP.id,
    sectionId,
    sessionNumber: 1,
    loggedAt,
    confidenceLevel,
    note: "Structural practice note.",
  };
}

describe("practice logging", () => {
  it("creates a validated entry linked to a mapped section and session", () => {
    expect(
      createPracticeLogEntry(
        {
          sectionId: BRIDGE_ID,
          sessionNumber: 2,
          confidenceLevel: 3,
          note: "The register transition is steadier at a slower tempo.",
        },
        {
          songMap: DEMO_SONG_MAP,
          totalSessions: 8,
          id: "9d8c9f62-c437-4f4a-8b4b-000000000001",
          loggedAt: "2026-07-21T10:00:00.000Z",
        },
      ),
    ).toMatchObject({
      songMapId: DEMO_SONG_MAP.id,
      sectionId: BRIDGE_ID,
      sessionNumber: 2,
      confidenceLevel: 3,
    });
  });

  it("rejects unknown sections, out-of-range sessions, and invalid confidence", () => {
    const context = {
      songMap: DEMO_SONG_MAP,
      totalSessions: 2,
      id: "9d8c9f62-c437-4f4a-8b4b-000000000001",
      loggedAt: "2026-07-21T10:00:00.000Z",
    };

    expect(() =>
      createPracticeLogEntry(
        {
          sectionId: "9d8c9f62-c437-4f4a-8b4b-000000000099",
          sessionNumber: 1,
          confidenceLevel: 3,
          note: "",
        },
        context,
      ),
    ).toThrowError(expect.objectContaining({ code: "unknown_section" }));
    expect(() =>
      createPracticeLogEntry(
        { sectionId: BRIDGE_ID, sessionNumber: 3, confidenceLevel: 3, note: "" },
        context,
      ),
    ).toThrowError(expect.objectContaining({ code: "unknown_session" }));
    expect(() =>
      createPracticeLogEntry(
        { sectionId: BRIDGE_ID, sessionNumber: 1, confidenceLevel: 6, note: "" },
        context,
      ),
    ).toThrowError(PracticeLogInputError);
  });

  it("applies the lyric-risk policy to optional practice notes", () => {
    expect(() =>
      createPracticeLogEntry(
        {
          sectionId: BRIDGE_ID,
          sessionNumber: 1,
          confidenceLevel: 2,
          note: 'Copied text: "A very long quoted passage copied line by line instead of a structural practice note."',
        },
        {
          songMap: DEMO_SONG_MAP,
          totalSessions: 8,
          id: "9d8c9f62-c437-4f4a-8b4b-000000000001",
          loggedAt: "2026-07-21T10:00:00.000Z",
        },
      ),
    ).toThrowError(expect.objectContaining({ code: "lyric_risk" }));
  });
});

describe("section mastery trends", () => {
  it("returns insufficient data for every mapped section with fewer than two entries", () => {
    const trends = computeSectionTrends(
      [entry(1, BRIDGE_ID, 3, "2026-07-21T10:00:00.000Z")],
      [INTRO_ID, BRIDGE_ID],
    );

    expect(trends).toEqual([
      {
        sectionId: INTRO_ID,
        latestConfidence: null,
        trend: "insufficient_data",
        entriesLogged: 0,
      },
      {
        sectionId: BRIDGE_ID,
        latestConfidence: 3,
        trend: "insufficient_data",
        entriesLogged: 1,
      },
    ]);
  });

  it.each([
    [[2, 3], "improving"],
    [[3, 3], "flat"],
    [[4, 2], "declining"],
  ] as const)("classifies confidence %j as %s", (levels, expectedTrend) => {
    const trends = computeSectionTrends(
      levels.map((level, index) =>
        entry(index + 1, BRIDGE_ID, level, `2026-07-${21 + index}T10:00:00.000Z`),
      ),
      [BRIDGE_ID],
    );

    expect(trends[0]).toMatchObject({
      latestConfidence: levels.at(-1),
      trend: expectedTrend,
      entriesLogged: levels.length,
    });
  });

  it("sorts chronologically and compares only the most recent three entries", () => {
    const trends = computeSectionTrends(
      [
        entry(4, BRIDGE_ID, 5, "2026-07-24T10:00:00.000Z"),
        entry(1, BRIDGE_ID, 5, "2026-07-20T10:00:00.000Z"),
        entry(3, BRIDGE_ID, 3, "2026-07-23T10:00:00.000Z"),
        entry(2, BRIDGE_ID, 2, "2026-07-22T10:00:00.000Z"),
      ],
      [BRIDGE_ID],
    );

    expect(trends[0]).toEqual({
      sectionId: BRIDGE_ID,
      latestConfidence: 5,
      trend: "improving",
      entriesLogged: 4,
    });
  });
});
