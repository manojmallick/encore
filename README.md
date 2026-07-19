# Encore

Encore helps independent cover artists move one specific song from
"I want to perform this" to "published."

Instead of teaching a generic music curriculum, Encore organizes the artist's
own notes about difficult song sections into a dated practice plan, tracks
section-level progress, gives a transparent recording-readiness signal, and
turns the completed practice history into a Making Of caption.

## Build Week scope

The submission's golden path is:

> Map one song -> plan the hard parts -> practice -> assess readiness ->
> record -> publish.

Version `v0.0.1` defines the target user, must-ship scope, exclusions, release
gates, and ordered commit roadmap. See the
[Apps for Your Life plan](./ENCORE_APPS_FOR_LIFE_PLAN.md) for the complete
product and delivery specification.

## Current release

`v0.13.0` hardens Encore's calendar, validation, and generation failure
boundaries. Countdown and readiness dates now share strict UTC calendar-day
arithmetic, invalid browser inputs are rejected before a request, and API
responses use stable, sanitized 400, 422, 500, and 502 contracts for invalid
data, lyric risk, missing configuration, and generation failures.
Continuous integration, metadata, and baseline test tooling support the OpenAI
Build Week 2026 Apps for Your Life submission.

## Lyric-risk policy

Encore accepts structural practice notes, not song lyrics or sheet music. A
defense-in-depth heuristic flags long quoted passages, stanza-like multiline
text, and repeated substantive lines before model requests. Blocked
results include rewrite guidance that helps an artist describe the transition,
register, rhythm, dynamics, or other practice challenge in their own words.

Passing this check is a risk-reduction signal, not proof of copyright status,
non-infringement, or legal compliance. The check cannot provide legal advice.

## Practice-plan API

`POST /api/practice-plan` accepts a complete typed Song Map plus an integer
`sessionsPerWeek` from 1 through 7. The server validates the request, blocks
lyric-like notes, calculates a maximum of 24 sessions, and asks `gpt-5.6` for a
strictly structured countdown plan. The model call uses the Responses API with
explicit low reasoning and never requests lyrics, tablature, or sheet music.

Set the server-only `OPENAI_API_KEY` value in `.env.local` before calling the
live route. Tests inject a model double and never make billable API requests.

The home page calls this route for the lyric-safe demo Song Map and validates
the response again before display or persistence. The latest valid plan is
stored under a versioned, Song Map-specific key in browser-local storage.
Malformed plans, changed target dates, and unavailable storage are handled
without preventing a fresh generation attempt. Cross-device persistence remains
outside the Build Week golden-path scope.

Date-only targets use UTC calendar days consistently in the plan API and
browser readiness calculation. Equivalent timezone-offset instants therefore
produce the same countdown, while impossible dates and invalid clocks fail
closed. A target on the current UTC day is too late for a new plan; readiness
clamps current or past targets to zero remaining days.

Both generation APIs reject malformed JSON, unknown fields, empty required
data, and invalid confidence or frequency values before model invocation.
Relationship and lyric-risk failures remain actionable, while configuration,
provider, refusal, and malformed-output details are sanitized before reaching
the browser.

## Practice logs and mastery trends

Valid practice entries are stored in a separate versioned browser-local key for
the active Song Map. Entries link a mapped section to a countdown session,
timestamp, confidence level, and optional structural note. Malformed entries,
unknown sections, and lyric-like notes are rejected before persistence.

Trends are deterministic: fewer than two section entries yields
`insufficient_data`; otherwise Encore orders entries chronologically, takes the
most recent three, and compares the first confidence level with the last. A
positive delta is `improving`, zero is `flat`, and a negative delta is
`declining`. These outputs form the input for the later recording-readiness
release.

## Recording readiness

Readiness is recalculated from the current countdown and practice logs; it is
never separately persisted. Encore withholds the numeric score until every
mapped section has at least one confidence rating. This prevents missing
sections from silently appearing as zero confidence or, worse, being ignored.

With complete coverage, the score starts with average confidence as a
percentage and subtracts eight points for every declining section. `behind`
takes precedence when confidence is more than 1.2 points below the level
expected from elapsed plan time or when at least two sections decline. `ready`
requires at least 4/5 average confidence, no declining sections, and no more
than two days remaining. Every result displays the coverage, average, elapsed
time, expected confidence, gap, decline count, and threshold reasons used.

## Creator dashboard and recording decision

The dashboard is derived from the current plan, logs, trends, and readiness
result. It shows the next unlogged session and ranks up to three weak sections
with unrated sections first, then declining sections, then lower confidence;
Song Map order breaks ties. Readiness maps to one explained recommendation:
gather data, adjust the plan, keep practicing, or record.

Recording remains the artist's decision. Marking a not-ready song recorded
requires an explicit acknowledgement, but Encore never blocks that choice. The
latest validated decision is stored in a separate versioned browser-local key.
A recorded decision freezes plan generation and practice logging while keeping
all history available for the Making Of caption; returning to practice is
reversible until the artist confirms the publish milestone.

## Making Of captions

Recorded songs unlock a caption workspace backed by the OpenAI Responses API
and strict structured output. The request uses GPT-5.6 with explicit low
reasoning effort and low text verbosity. Encore derives the prompt from the
artist's Song Map, section confidence history, trends, and optional structural
practice observations.

Every Song Map note and practice observation is lyric-risk checked before the
request. The returned caption is schema-validated and checked again before it
reaches the browser. Successful captions display the same lyric-risk
confirmation as practice plans and can be copied or regenerated. This is a
defense-in-depth product safeguard, not a copyright determination or legal
advice.

## Record-to-publish lifecycle

Encore never claims to publish to an external service. After the artist posts
the recorded cover and caption themselves, an explicit confirmation creates a
validated local publication record containing the Song Map ID, publish time,
and exact caption snapshot. A matching recorded decision and valid generated
caption are required.

The versioned publication record restores after reload only while its recorded
decision remains valid. Published state keeps practice controls frozen, shows
the completed five-step golden path, and keeps the final caption copyable. An
artist can reopen the recorded step without deleting the plan, practice logs,
recording decision, or current caption. Cross-platform publishing integrations
remain intentionally outside the Build Week scope.

## Requirements

- Node.js 24 (matching CI)
- pnpm 10.33.2

## Environment

Copy the checked-in example and add local values as later features require:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_SITE_URL` is safe for the browser. `OPENAI_API_KEY` is server-only
and must never use a `NEXT_PUBLIC_` prefix.

## Develop

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The recorded `v0.13.0` baseline is **126 passing unit/integration tests across
20 files plus 1 passing Chromium golden-path test**. CI installs Chromium and
runs both suites; API and model behavior is replaced with deterministic test
doubles, so verification never requires an OpenAI API key.

## Deploy

Push to a Vercel-linked Git repository or run `vercel deploy`. The generated
deployment configuration lives in [`vercel.ts`](./vercel.ts).

Product-specific logic belongs in `src/logic/`; Next.js pages and route
handlers belong in `app/`.

## License

[MIT](./LICENSE)
