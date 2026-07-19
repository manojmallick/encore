import { describe, expect, it } from "vitest";

import {
  DEMO_SONG_MAP,
  LYRIC_RISK_CODES,
  LYRIC_RISK_DISCLAIMER,
  LYRIC_RISK_PASSED_MESSAGE,
  LyricRiskBlockedError,
  checkArtistNoteLyricRisk,
  checkSongMapLyricRisk,
  enforceSongMapLyricRisk,
} from "./index";

describe("lyric-risk policy", () => {
  it("keeps reason codes and cautious policy copy stable", () => {
    expect(LYRIC_RISK_CODES).toEqual([
      "long_quotation",
      "stanza_structure",
      "repeated_line",
    ]);
    expect(LYRIC_RISK_PASSED_MESSAGE).toContain("notes you provided");
    expect(LYRIC_RISK_DISCLAIMER).toContain("cannot determine copyright status");
    expect(LYRIC_RISK_DISCLAIMER).toContain("legal advice");
  });

  it.each([
    "",
    "Loop the bridge transition slowly, then restore the original tempo.",
    "Breath support: stay relaxed through the final chorus!",
    "Short note\nSecond note",
    'Practice the short phrase "more gently" without pushing.',
  ])("passes ordinary structural note: %s", (note) => {
    expect(checkArtistNoteLyricRisk(note)).toEqual({ passed: true, issues: [] });
  });

  it.each([
    'Practice this text: "A very long quoted passage copied line by line instead of a structural practice note."',
    "Practice this text: “A very long quoted passage copied line by line instead of a structural practice note.”",
  ])("blocks long straight and curly quoted passages", (note) => {
    const result = checkArtistNoteLyricRisk(note);

    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.issues.map(({ code }) => code)).toContain("long_quotation");
      expect(result.issues[0]?.rewriteGuidance).toContain("musical challenge");
    }
  });

  it("blocks stanza-like multiline text with rewrite guidance", () => {
    const result = checkArtistNoteLyricRisk(
      "First substantial line copied here\nSecond substantial line copied here\nThird substantial line copied here",
    );

    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.issues.map(({ code }) => code)).toContain("stanza_structure");
      expect(result.issues.find(({ code }) => code === "stanza_structure")?.rewriteGuidance).toContain(
        "structural note",
      );
    }
  });

  it("blocks repeated substantive lines despite punctuation or case differences", () => {
    const result = checkArtistNoteLyricRisk(
      "Repeat this substantial practice line!\nrepeat this substantial practice line",
    );

    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.issues.map(({ code }) => code)).toContain("repeated_line");
    }
  });

  it("passes every structural note in the demo fixture", () => {
    expect(checkSongMapLyricRisk(DEMO_SONG_MAP)).toEqual({
      passed: true,
      flaggedSections: [],
    });
    expect(() => enforceSongMapLyricRisk(DEMO_SONG_MAP)).not.toThrow();
  });

  it("reports and enforces blocked Song Map sections by stable identity", () => {
    const blockedSongMap = {
      ...DEMO_SONG_MAP,
      sections: DEMO_SONG_MAP.sections.map((section) =>
        section.name === "Bridge"
          ? {
              ...section,
              difficultyNotes:
                'Copied text: "A very long quoted passage copied line by line instead of a structural practice note."',
            }
          : section,
      ),
    };
    const result = checkSongMapLyricRisk(blockedSongMap);

    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.flaggedSections).toHaveLength(1);
      expect(result.flaggedSections[0]).toMatchObject({
        sectionId: "0f6de6c4-9b7c-4f69-9d91-7e8a3a63d104",
        sectionName: "Bridge",
      });
      expect(result.flaggedSections[0]?.issues.map(({ code }) => code)).toContain(
        "long_quotation",
      );
    }

    expect(() => enforceSongMapLyricRisk(blockedSongMap)).toThrowError(LyricRiskBlockedError);
    try {
      enforceSongMapLyricRisk(blockedSongMap);
    } catch (error) {
      expect(error).toBeInstanceOf(LyricRiskBlockedError);
      expect((error as LyricRiskBlockedError).result).toEqual(result);
    }
  });
});
