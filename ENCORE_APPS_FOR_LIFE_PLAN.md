# ENCORE — FULL MAXIMIZED PLAN
# OpenAI Build Week | Track: Apps for Your Life ($15K / $10K)
# Deadline: July 21, 2026 @ 5:00pm PDT

---

## V0.0.1 PRODUCT THESIS AND BUILD WEEK SCOPE

### Product thesis

Encore helps independent cover artists move one specific song from
"I want to perform this" to "published." It turns the artist's own notes
about difficult song sections into a dated practice plan, tracks whether
those sections are improving, gives an honest recording-readiness signal,
and turns the completed practice history into a Making Of caption.

The product is not a general music curriculum. Its defining workflow is:

> Map one song -> plan the hard parts -> practice -> assess readiness ->
> record -> publish.

### Target user

The first user is an independent cover artist who already knows how to
practice but needs structure and an honest answer to: "Will this song be
ready to record by my target date?"

### The one Build Week proof

Given one realistic sample song, a judge can complete this golden path:

1. Create a Song Map using only the artist's own structural notes.
2. Generate a dated GPT-5.6 countdown plan.
3. Log confidence for practiced sections and see their trends.
4. Receive a transparent readiness result with an explanation.
5. Mark the song recorded and generate a Making Of caption from the log.

### Must ship

- Song Map Builder with title, artist, target date, ordered sections, and
  artist-authored difficulty notes.
- GPT-5.6 countdown plan with hard sections front-loaded and final
  confidence-building run-throughs.
- Session logging and deterministic section trend calculations.
- A tested readiness model with `insufficient_data`, `on_track`, `behind`,
  and `ready` outcomes.
- Making Of caption generation from the artist's own practice history.
- Lyric-risk checks on artist notes before outbound model requests.
- One preloaded sample that demonstrates the complete golden path.
- A deployed build, reproducible README, passing tests, and a public demo
  video under three minutes that explicitly shows how Codex and GPT-5.6
  were used.

### Stretch only after the golden path works

- Supabase persistence across browsers or devices.
- Additional sample songs and richer charts.
- Export, sharing, reminders, or installable-app behavior.
- Further visual polish beyond a responsive, accessible demo.

### Explicitly excluded from Build Week v1.0.0

- Authentication, profiles, teams, subscriptions, and social features.
- Audio recording, pitch analysis, transcription, or song recognition.
- Automatic lyric, tablature, chord, or sheet-music retrieval.
- Generic lessons, curriculum progression, or instrument instruction.
- Native mobile applications and external publishing integrations.

### Release gates

1. **Functional MVP (`v0.8.0`)** -- Song Map -> GPT-5.6 plan -> practice
   log -> tested readiness result. If time is constrained, deploy this.
2. **Differentiated submission (`v0.11.0`)** -- Add the record-to-publish
   flow and Making Of caption.
3. **Judge-ready release (`v1.0.0`)** -- Complete verification, accessibility,
   reproducibility, deployment, evidence, and submission documentation.

### Version-by-version commit plan

| Version | Commit | Definition of done |
|---|---|---|
| `v0.0.1` | `docs: define Encore product thesis and Build Week scope` | Thesis, target user, bounded scope, release gates, and roadmap are committed. |
| `v0.1.0` | `chore: scaffold Encore web app and test tooling` | Next.js, TypeScript, styling, environment example, lint, build, and test commands work. |
| `v0.2.0` | `feat: add song map domain model and demo fixture` | Typed domain objects and one realistic, lyric-free sample song exist. |
| `v0.3.0` | `feat: build editable song map workflow` | A user can create and validate a dated, ordered Song Map. |
| `v0.4.0` | `feat: enforce lyric-risk checks on artist notes` | Pass/block behavior is tested and failure copy helps the user rewrite notes. |
| `v0.5.0` | `feat: generate structured countdown plans with GPT-5.6` | Server-side generation returns validated structured output with handled failures. |
| `v0.6.0` | `feat: display and persist countdown practice sessions` | Map -> Generate -> Review works with loading, retry, and empty states. |
| `v0.7.0` | `feat: add section practice logs and mastery trends` | Confidence history and improving/flat/declining calculations are tested. |
| `v0.8.0` | `feat: calculate transparent recording readiness` | Readiness states and regression cases are deterministic and explained in the UI. |
| `v0.9.0` | `feat: add creator dashboard and recording decision flow` | Countdown, weak sections, trends, and readiness form one coherent screen. |
| `v0.10.0` | `feat: generate making-of captions with GPT-5.6` | A caption can be generated, copied, and regenerated from practice history. |
| `v0.11.0` | `feat: complete the record-to-publish golden path` | A song can move through recorded and published states end to end. |
| `v0.12.0` | `test: cover critical Encore workflows and failures` | Unit tests and one end-to-end golden-path test pass with a recorded real count. |
| `v0.13.0` | `fix: harden dates validation and API failures` | Timezones, past dates, empty data, invalid confidence, and malformed output are handled. |
| `v0.14.0` | `style: polish responsive demo experience and accessibility` | The golden path works on mobile and desktop with keyboard-visible focus and readable contrast. |
| `v0.15.0` | `docs: prepare reproducible Build Week submission` | README, setup, architecture, challenge diary, and Codex/GPT-5.6 evidence are complete. |
| `v0.16.0` | `chore: configure production deployment and smoke test` | The production URL passes a clean-browser golden-path smoke test. |
| `v1.0.0` | `release: freeze Encore Build Week submission` | Repository, deployed app, video, and Devpost description describe the same tested product. |

### Submission evidence gate

- Preserve timestamped Codex task/session evidence and the ordered Git history.
- Record the real readiness and Lyric Firewall test counts; never estimate them.
- Show at least one live GPT-5.6 plan request and caption request in the demo.
- Keep the repository public with a relevant license, or use the event's
  documented private-repository sharing process.
- Submit before July 21, 2026 at 5:00pm PDT; no post-deadline changes count.

---

## DO THIS IN THE NEXT 2 HOURS (if not already done)

```
[ ] Request Codex credits at openai.devpost.com/resources
    DEADLINE: July 17, 12:00pm PT
[ ] Create OpenAI account if not done: auth.openai.com/create-account
[ ] Install Devpost Hackathons Plugin in ChatGPT
[ ] Register this project on openai.devpost.com
```

---

## WHY THIS PROJECT, MAXIMIZED

You run @creativeartistscorner, recording cover songs. That workflow is
structurally different from what every music-learning app assumes.
Yousician, Simply Piano, Duolingo Music all teach generic curriculum
progression -- scales, chords, levels. Nobody builds for the actual
cover-artist workflow: pick a specific song, learn its specific hard
parts, get performance-ready by a specific date, record it, publish it.

The maximization strategy:

1. Don't build "another music practice app" -- build the PROOF that the
   cover-artist workflow is a genuinely different shape from generic
   music education, one that ends at "publish," not "level up."

2. Design around a real copyright constraint from the start: the tool
   never needs or touches actual song lyrics. It works entirely from the
   artist's OWN structural notes about their own song ("the key change
   in the bridge," "high note in the final chorus"). This reduces the
   risk of collecting or reproducing protected material and is
   philosophically correct: it organizes the artist's own knowledge; it
   does not pretend to understand the song for them. It is a product
   safeguard, not a legal determination or guarantee.

3. Front-load the most human artifact -- the "Making Of" caption --
   into the first 15 seconds of the demo video, not a feature tour.

4. Make the /feedback Codex Session ID show real iteration on the
   readiness-score algorithm, the one genuinely quantitative piece.

---

## GAP-CLOSING UPGRADES (applied from competitive analysis of confirmed winners)

### UPGRADE 1 -- Fresh benchmark: a real regression test suite, not a claim

Same pattern as TutorOS's readiness score, applied to Encore's own version:

```typescript
// lib/readiness-score.test.ts (Encore variant)
import { computeReadiness } from "./readiness-score";

const cases = [
  {
    name: "two declining sections should flag behind, even with strong average",
    input: {
      sectionTrends: [
        { sectionId: "bridge", latestConfidence: 5, trend: "declining", entriesLogged: 3 },
        { sectionId: "chorus", latestConfidence: 5, trend: "declining", entriesLogged: 3 },
        { sectionId: "verse1", latestConfidence: 5, trend: "flat", entriesLogged: 3 },
      ],
      daysRemaining: 3,
      originalPlanDays: 18,
    },
    expectedStatus: "behind",
  },
  // add the remaining real cases actually exercised during build
];

let passed = 0;
for (const c of cases) {
  const result = computeReadiness(c.input as any);
  if (result.status === c.expectedStatus) passed++;
  else console.error(`FAILED: ${c.name} -- got ${result.status}`);
}
console.log(`${passed}/${cases.length} readiness-score test cases passed`);
```

Report the real pass count in the README -- not an estimate.

### UPGRADE 2 -- Named governance feature: the Lyric Firewall

This is the strongest upgrade available to Encore: the copyright design
constraint already exists (Feature list, point 2) but has been a passive
design choice, not an active, demoable feature. Turn it into one:

```typescript
// lib/lyric-firewall.ts
// Runs on every outbound prompt before it reaches GPT-5.6. Flags any
// prompt that looks like it contains quoted song lyrics rather than the
// artist's own structural notes -- a defense-in-depth check, not just a
// design intention.

const LYRIC_RISK_PATTERNS = [
  /"\s*[\w\s]{40,}\s*"/,          // long quoted passages
  /\n{2,}.{20,}\n{2,}.{20,}/,     // stanza-like line breaks
];

export function lyricFirewallCheck(promptText: string): {
  passed: boolean;
  reason?: string;
} {
  for (const pattern of LYRIC_RISK_PATTERNS) {
    if (pattern.test(promptText)) {
      return {
        passed: false,
        reason: "Prompt contains a pattern resembling quoted lyrics or " +
          "stanza structure -- Encore only accepts the artist's own " +
          "structural notes, never lyric text. Rewrite in your own words.",
      };
    }
  }
  return { passed: true };
}
```

Show a visible confirmation in the UI on every generated plan and caption:
**"Lyric-risk check passed -- generated only from the notes you
provided."** Give this its own beat in the demo video,
right after the Song Map Builder -- it's a genuinely distinctive trust
signal that most music apps never think to build, let alone show.

### UPGRADE 3 -- Real Challenges diary (fill in DURING build)

```
CHALLENGE 1: [exact bug -- e.g. the readiness-score averaging issue,
  specific to Encore's own test case]
  What we assumed: ...
  What actually happened: [exact failing case]
  The fix: [exact code change]

CHALLENGE 2: [second real issue -- e.g. an edge case in the countdown
  plan generator when daysUntil is very small]
```

### UPGRADE 4 -- Codex/GPT-5.6 coverage checklist

```
[ ] Codex-authored files: practice-plan route, making-of-caption route,
    section-mastery.ts, readiness-score.ts, lyric-firewall.ts -- real count
[ ] Codex session steps in the /feedback session: ___
[ ] GPT-5.6 API calls per full flow (plan + log + caption): ___
[ ] Lyric Firewall test cases (should-pass and should-block): ___/___
```

---

## THE ONE CLAIM TO PROVE

"This is what actually happens between picking a song and posting the
cover -- not a generic curriculum, a plan for THIS song."

Every feature below exists to make this claim land. The Song Map and the
Making Of caption are the two artifacts that make it undeniable.

---

## A NOTE ON COPYRIGHT (read this before building)

Encore never ingests, stores, reproduces, or reasons over actual song
lyrics or sheet music. Every input about "what's hard in this song" is
written by the artist in their own words. GPT-5.6 is never asked to
recall or produce lyrics -- only to organize the artist's own notes into
a plan and, later, into a caption. This is a deliberate design constraint,
not an oversight, and it should be stated explicitly in the README so
judges see it was handled correctly. The Lyric Firewall is a
defense-in-depth heuristic that reduces risk; it cannot prove that text
is non-infringing and should not be presented as legal advice or a
copyright guarantee.

---

## FEATURE 1 — SONG MAP BUILDER

**What it does:** The artist enters the song title and artist (metadata
only), then manually tags sections (Verse 1, Chorus, Bridge, etc.) with
their own difficulty notes in their own words -- no lyrics involved.
This becomes the "map" everything else is built on.

**Why it matters for judging:** This is the Design criterion's anchor --
a coherent product experience needs one clear starting artifact a judge
immediately understands, the way Switchboard's Venture Lines work. Here
it's the Song Map: title, sections, and the artist's own words about
what's hard.

**Data model:**

```sql
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  target_date date,
  status text default 'in_progress',   -- 'in_progress', 'recorded', 'published'
  created_at timestamptz default now()
);

create table sections (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id),
  name text not null,                  -- 'Verse 1', 'Chorus', 'Bridge'
  order_index int not null,
  difficulty_notes text,               -- artist's own words, never lyrics
  status text default 'not_started'
);
```

**Frontend component:**

```typescript
// components/SongMapBuilder.tsx
"use client";
import { useState } from "react";

interface Section {
  name: string;
  difficultyNotes: string;
}

export default function SongMapBuilder({
  onSave,
}: {
  onSave: (data: { title: string; artist: string; targetDate: string; sections: Section[] }) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { name: "Verse 1", difficultyNotes: "" },
    { name: "Chorus", difficultyNotes: "" },
  ]);

  const addSection = () =>
    setSections((s) => [...s, { name: "", difficultyNotes: "" }]);

  const updateSection = (i: number, field: keyof Section, value: string) =>
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, [field]: value } : sec)));

  return (
    <div className="space-y-5 max-w-lg">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Song title"
        className="w-full px-3 py-2 rounded-lg border text-sm"
      />
      <input
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder="Original artist"
        className="w-full px-3 py-2 rounded-lg border text-sm"
      />
      <input
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm"
      />

      <div className="space-y-3">
        {sections.map((sec, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <input
              value={sec.name}
              onChange={(e) => updateSection(i, "name", e.target.value)}
              placeholder="Section name (e.g. Bridge)"
              className="w-full px-2 py-1.5 rounded border text-sm font-medium"
            />
            <textarea
              value={sec.difficultyNotes}
              onChange={(e) => updateSection(i, "difficultyNotes", e.target.value)}
              placeholder="What's hard here, in your own words -- e.g. 'key change, high note on the last line'"
              rows={2}
              className="w-full px-2 py-1.5 rounded border text-sm resize-none"
            />
          </div>
        ))}
      </div>

      <button onClick={addSection} className="text-sm text-blue-600 font-medium">
        + Add section
      </button>

      <button
        onClick={() => onSave({ title, artist, targetDate, sections })}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-black"
      >
        Build my practice plan &rarr;
      </button>
    </div>
  );
}
```

---

## FEATURE 2 — COUNTDOWN PRACTICE PLAN GENERATOR

**What it does:** Given the Song Map and a target date, GPT-5.6 generates
a session-by-session countdown plan -- front-loading the hardest sections
early and shifting to confidence-building run-throughs of easier sections
as the date approaches.

**Why it matters for judging:** This is the Technological Implementation
piece -- the plan is genuinely generated from the artist's own structural
input, not a generic template, and the front-load/confidence-build
sequencing is a real scheduling decision an LLM is well-suited to make.

```typescript
// app/api/practice-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { songTitle, sections, targetDate, sessionsPerWeek } = await req.json();

  const daysUntil = Math.max(
    1,
    Math.round((new Date(targetDate).getTime() - Date.now()) / 86_400_000)
  );
  const totalSessions = Math.max(1, Math.round((daysUntil / 7) * sessionsPerWeek));

  const prompt = `You are building a practice countdown plan for a
cover-song artist preparing to record and publish by a specific date.
You are NOT given and must NOT reference the song's actual lyrics --
only the artist's own structural notes below.

Song: "${songTitle}"
Days until target date: ${daysUntil}
Total practice sessions available: ${totalSessions}
Sections and the artist's own difficulty notes:
${sections.map((s: any) => `- ${s.name}: ${s.difficultyNotes || "no specific concerns noted"}`).join("\n")}

Build a session-by-session plan (one entry per session, numbered).
Rules:
- Front-load the sections the artist flagged as hardest into the
  earliest sessions, when there's the most runway to struggle and improve
- Shift toward full run-throughs and confidence-building in the final
  1-2 sessions before the target date
- Each session entry: which section(s) to focus on, and one concrete
  practice technique suited to the type of difficulty noted (e.g. a key
  change suggests isolating the transition measure and looping it slowly)
- Keep each entry to 1-2 sentences

Return as JSON: { "sessions": [{ "sessionNumber": 1, "focus": "...",
"technique": "..." }] }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return NextResponse.json(JSON.parse(completion.choices[0].message.content!));
}
```

---

## FEATURE 3 — SESSION LOG + SECTION MASTERY TRACKER

**What it does:** After each practice session, the artist logs a quick
note per section worked on ("bridge: still cracking on the high note,"
"verse 1: solid"). Encore tracks a confidence trend per section across
the whole prep period.

**Why it matters for judging:** This is the algorithmic core -- distinct
from a generic "mark as done" checkbox, it tracks trend direction per
section, which is what feeds the readiness score in Feature 4.

```typescript
// lib/section-mastery.ts

interface ProgressEntry {
  sectionId: string;
  sessionDate: string; // ISO date
  confidenceLevel: number; // 1-5, self-reported by the artist
}

interface SectionTrend {
  sectionId: string;
  latestConfidence: number;
  trend: "improving" | "flat" | "declining" | "insufficient_data";
  entriesLogged: number;
}

export function computeSectionTrends(entries: ProgressEntry[]): SectionTrend[] {
  const bySection: Record<string, ProgressEntry[]> = {};
  for (const e of entries) {
    if (!bySection[e.sectionId]) bySection[e.sectionId] = [];
    bySection[e.sectionId].push(e);
  }

  return Object.entries(bySection).map(([sectionId, list]) => {
    const sorted = [...list].sort(
      (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
    );

    if (sorted.length < 2) {
      return {
        sectionId,
        latestConfidence: sorted[0]?.confidenceLevel ?? 0,
        trend: "insufficient_data" as const,
        entriesLogged: sorted.length,
      };
    }

    const recent = sorted.slice(-3); // last up to 3 entries
    const delta = recent[recent.length - 1].confidenceLevel - recent[0].confidenceLevel;

    const trend: SectionTrend["trend"] =
      delta > 0 ? "improving" : delta < 0 ? "declining" : "flat";

    return {
      sectionId,
      latestConfidence: sorted[sorted.length - 1].confidenceLevel,
      trend,
      entriesLogged: sorted.length,
    };
  });
}
```

---

## FEATURE 4 — READINESS SCORE

**What it does:** Combines section confidence trends with days remaining
against the original plan length to produce one honest status: "On
track," "Behind -- reduce scope," or "Ready." This is the number that
tells the artist whether to trust their gut or trust the calendar.

**Why it matters for judging:** This is the Potential Impact anchor --
it directly addresses the real, specific problem of an artist not
knowing whether they're actually ready, versus just feeling anxious or
overconfident close to a publish date.

```typescript
// lib/readiness-score.ts
import { computeSectionTrends } from "./section-mastery";

interface ReadinessInput {
  sectionTrends: ReturnType<typeof computeSectionTrends>;
  daysRemaining: number;
  originalPlanDays: number;
}

interface ReadinessResult {
  score: number; // 0-100
  status: "ready" | "on_track" | "behind";
  message: string;
}

export function computeReadiness({
  sectionTrends,
  daysRemaining,
  originalPlanDays,
}: ReadinessInput): ReadinessResult {
  const avgConfidence =
    sectionTrends.reduce((sum, t) => sum + t.latestConfidence, 0) /
    Math.max(1, sectionTrends.length);

  const decliningCount = sectionTrends.filter((t) => t.trend === "declining").length;
  const timeUsedRatio = 1 - daysRemaining / Math.max(1, originalPlanDays);

  // Confidence should track roughly with time used; behind if confidence
  // lags well below the proportion of time already spent.
  const expectedConfidenceByNow = timeUsedRatio * 5; // scale to 1-5
  const confidenceGap = expectedConfidenceByNow - avgConfidence;

  let score = Math.round((avgConfidence / 5) * 100 - decliningCount * 8);
  score = Math.max(0, Math.min(100, score));

  let status: ReadinessResult["status"];
  let message: string;

  if (confidenceGap > 1.2 || decliningCount >= 2) {
    status = "behind";
    message =
      "You're behind where the plan expected at this point. Consider dropping a section to a simpler version, or pushing the date.";
  } else if (avgConfidence >= 4 && daysRemaining <= 2) {
    status = "ready";
    message = "Sections are holding steady and the date is close. You're ready to record.";
  } else {
    status = "on_track";
    message = "Confidence is tracking reasonably with the time you've used. Keep going.";
  }

  return { score, status, message };
}
```

---

## FEATURE 5 — "MAKING OF" CAPTION GENERATOR (the standout feature)

**What it does:** Once the artist marks the song as recorded/published,
GPT-5.6 synthesizes the entire session log into a short, honest caption
for the video description or social post -- the one feature that ties
directly into the real creator publish workflow, which generic music
apps never build because they don't think about the publish step at all.

**Why it matters for judging:** This is the differentiator that separates
Encore from every generic music-practice app at this hackathon. It's also
the single most shareable, screenshot-able artifact in the whole product
-- exactly what a judge will remember after seeing 200 other submissions.

```typescript
// app/api/making-of-caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { songTitle, artist, sessionLogSummary, hardestSection, totalPracticeSessions } =
    await req.json();

  const prompt = `Write a short, honest "making of" caption for a cover
song video, based on the artist's own practice log below. Do NOT
reference or quote the song's lyrics -- only the practice process itself.

Song: "${songTitle}" (originally by ${artist})
Total practice sessions logged: ${totalPracticeSessions}
Hardest section, per the artist's own notes: ${hardestSection}
Session log summary (artist's own words across the prep period):
${sessionLogSummary}

Write 2-3 sentences, first person, specific and honest -- not generic
"hope you enjoy" filler. Reference the actual struggle and the actual
turning point if one is evident in the log. End with a natural line
into "here's my cover of [song]."

Example tone (do not copy, just match the register):
"Took me about three weeks and way more reps than I'd like to admit on
that bridge key change before it finally clicked. Here's my cover of
[Song]."`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6",
    messages: [{ role: "user", content: prompt }],
  });

  return NextResponse.json({ caption: completion.choices[0].message.content });
}
```

---

## README.md

```markdown
# Encore

Built for OpenAI Build Week 2026. Track: Apps for Your Life.

## The problem

I record cover songs on @creativeartistscorner. Every music-learning app
I've used teaches a generic curriculum -- scales, chords, levels. None of
them are built for what a cover artist actually does: pick a specific
song, learn its specific hard parts, get performance-ready by a specific
date, record it, publish it.

## Copyright, handled deliberately

Encore never ingests, stores, or reasons over actual song lyrics. Every
input about song difficulty is written by the artist in their own words
("key change in the bridge," "high note in the final chorus"). This is a
design constraint from day one, not an afterthought.

## What it does

1. Song Map Builder -- title, artist, sections, artist's own difficulty notes
2. Countdown practice plan -- session-by-session, hardest sections
   front-loaded, confidence-building runs near the target date
3. Session log + section mastery tracker -- confidence trend per section
4. Readiness score -- an honest "ready / on track / behind" signal, not
   just a feeling
5. Making Of caption generator -- turns the practice log into a short,
   honest caption for the actual published video

## Install

git clone https://github.com/manojmallick/encore
cd encore
npm install
cp .env.example .env.local   # add OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
npm run dev

## Test without rebuilding

Live demo: [Vercel URL] -- one sample song pre-loaded with a realistic
practice log so the readiness score and Making Of caption have real data
to work from immediately.

## How Codex was used to build this

The readiness-score algorithm (`lib/readiness-score.ts`) went through
real iteration with Codex: the first version only looked at average
confidence and ignored declining sections entirely, which meant a song
with two sections actively getting worse could still score as "on track"
if the others were strong. The current version weights declining
sections explicitly and compares confidence growth against time already
used, not just an absolute threshold.

Session ID: [insert /feedback session ID]

## License

MIT
```

---

## DEMO VIDEO SCRIPT (2:35 total)

```
[0:00-0:15] THE HOOK -- the artifact first, no explanation
Screen: the Making Of caption, full frame.
"Took me about three weeks and way more reps than I'd like to admit on
that bridge key change before it finally clicked. Here's my cover of..."
VOICE: "This came from my own practice log. Not a template."

[0:15-0:30] WHO I AM
"I record covers on my own channel. Every music app I've tried teaches
generic scales and chords. None of them think about the actual workflow:
pick a song, learn the hard parts, hit a date, publish."

[0:30-1:00] LIVE DEMO -- the song map
Show: entering a song title, tagging sections, writing difficulty notes
in plain language -- "key change in the bridge."
"No lyrics anywhere in this app. Just my own notes about my own struggle points."

[1:00-1:30] THE PLAN + THE TRACKER
Show: countdown plan generated, hardest sections front-loaded.
Show: logging a session, confidence trend updating per section.

[1:30-1:55] THE READINESS SCORE
Show: the honest status -- "Behind, consider dropping a section" example,
then a "Ready to record" example.
"It doesn't just cheerlead. It tells you the truth."

[1:55-2:15] HOW CODEX BUILT THIS
"The readiness algorithm's first version missed declining sections
entirely. Codex helped me catch and fix that."
Show the /feedback session ID.

[2:15-2:35] CLOSE
"Encore. For the space between picking a song and hitting publish."
Live demo URL on screen, held 3+ seconds.
```

---

## CODEX SESSION STRATEGY

```
STEP 1 -- Scaffold prompt (broad)
"Build a Next.js app with a Supabase-backed data model for songs,
sections, and per-section practice-session progress logs."

STEP 2 -- The algorithmic piece (the hard part)
"Build a readiness-score function that combines section confidence
trends with days remaining against the original plan length, and
returns an honest status: ready, on track, or behind."

STEP 3 -- Iteration prompt (specific bug)
"This version only looks at average confidence and misses sections that
are actively declining even if the average still looks fine. Fix it so
declining sections meaningfully lower the score even when other sections
are strong."

STEP 4 -- Extension prompt
"Now build the Making Of caption generator that synthesizes the session
log into a short, honest caption -- without ever referencing song lyrics,
only the artist's own practice notes."

STEP 5 -- Run /feedback
Capture the session ID at the end of this exact session.
```

---

## 6-DAY BUILD SCHEDULE

```
====================================================================
DAY 1
====================================================================
  [ ] Supabase schema: songs, sections, practice_sessions, section_progress
  [ ] Scaffold Next.js app with Codex
  [ ] Song Map Builder component (Feature 1)

====================================================================
DAY 2
====================================================================
  [ ] Countdown practice plan endpoint + UI (Feature 2)
  [ ] Test with a realistic sample song and section notes

====================================================================
DAY 3
====================================================================
  [ ] Section mastery tracker: lib/section-mastery.ts (Feature 3)
  [ ] Session logging UI

====================================================================
DAY 4
====================================================================
  [ ] Readiness score: lib/readiness-score.ts (Feature 4, Steps 2-3 above)
  [ ] Verify score behaves correctly with a declining-section test case

====================================================================
DAY 5
====================================================================
  [ ] Making Of caption generator (Feature 5)
  [ ] Deploy to Vercel, seed with one realistic sample song + practice log
  [ ] Record demo video, upload to YouTube
  [ ] Write Devpost project description + README

====================================================================
DAY 6 -- buffer, do not skip
====================================================================
  [ ] Test from a clean environment
  [ ] Confirm /feedback Session ID entered on submission form
  [ ] Submit 12+ hours before deadline
```

---

## FINAL PRE-SUBMIT CHECKLIST

```
[ ] All 5 features working end to end
[ ] Zero lyrics anywhere in the app, database, or prompts -- verified
[ ] README.md explains the copyright design decision clearly
[ ] Demo video <=3 min, opens on the Making Of caption, not a feature list
[ ] Repo public + MIT license, or shared with required emails
[ ] /feedback Session ID captured and entered on submission form
[ ] Category selected: Apps for Your Life
[ ] GAP-CLOSING: readiness-score.test.ts run for real, actual pass count in README
[ ] GAP-CLOSING: Lyric Firewall implemented, visible "passed" confirmation
    in UI, named in demo video right after Song Map Builder
[ ] GAP-CLOSING: Challenges section has 2+ entries with exact bug detail
[ ] GAP-CLOSING: Codex/GPT-5.6 coverage checklist filled with real counts
```
