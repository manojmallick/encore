# Encore Build Week submission

This file is the canonical source for Devpost copy, the demo runbook, and the
evidence ledger. Update it with final URLs and captured identifiers during the
deployment/release versions; do not replace pending evidence with estimates.

## Submission copy

### One-line pitch

Encore turns an independent cover artist's own lyric-free notes about one song
into a dated practice plan, honest recording readiness, and a Making Of caption
that carries the work from “I want to perform this” to “published.”

### The problem

Music-learning products teach broad skills, but a creator working toward a
specific cover has a different job: identify the hard sections, practice them
before a self-imposed date, decide honestly when to record, and share the story
behind the result. That workflow is usually split across notes, calendars, and
memory.

### What Encore does

The artist starts with one Song Map containing section names and original
structural notes—never lyrics. When configured, GPT-5.6 converts that map into
a validated, dated countdown plan that front-loads difficult sections; the
no-key deployment uses a labeled schema-compatible fixture. Practice entries
track confidence by section; a deterministic readiness calculation exposes
coverage, trends, elapsed time, thresholds, and its recommendation. After the
artist records, GPT-5.6 synthesizes the validated practice history into a short
Making Of caption. The artist publishes externally and confirms the milestone
in Encore.

### OpenAI and Codex

Encore uses GPT-5.6 through the OpenAI Responses API at two narrow, server-only
boundaries: structured countdown planning and structured Making Of caption
generation. Both use low reasoning effort and Zod-backed structured outputs;
the caption request also uses low text verbosity. A reusable Lyric Firewall
runs before outbound prompts, and caption output is checked again on return.
When no API key is configured, the same routes return visibly labeled,
deterministic fixtures that follow the production response schemas.

Codex carried the ordered product plan through scoped GitHub issues, isolated
branches, tests, commits, and reviewed pull requests. The public sequence from
[issue #1](https://github.com/manojmallick/encore/issues/1) through
[PR #34](https://github.com/manojmallick/encore/pull/34) is reproducible
evidence of that iteration. One concrete design correction was recording
readiness: the final deterministic algorithm withholds incomplete coverage and
penalizes declining sections instead of relying on a reassuring average alone.
The primary `/feedback` session is
`019f74c9-756b-7421-a9e2-68d08be3bb63`. Its local metadata records
`gpt-5.6-sol` across the core implementation turns; the public PR trail is
mapped in the [GPT-5.6 evidence record](./GPT56_EVIDENCE.md).

### Accomplishments

- A complete map-to-publish browser workflow with no account or seed database.
- Two GPT-5.6 features behind strict schemas, safe server boundaries, and
  deterministic test seams.
- Transparent readiness that can say “insufficient data,” “behind,” “on
  track,” or “ready,” while preserving artist agency.
- Defense-in-depth lyric-risk checks with actionable rewrite guidance.
- 140 unit/integration tests and one accessible, responsive Chromium golden
  path that run without an OpenAI key.

### Challenges and learning

The hardest tradeoffs were scope, safe free text, and honest decision support.
Keeping one song and one creator made the full lifecycle demonstrable. Treating
all notes and model output as untrusted made validation a product behavior, not
only a backend concern. Separating a deterministic readiness calculation from
generative planning made the recommendation explainable and testable. See the
[challenge diary](./CHALLENGE_DIARY.md) for the evidence trail.

### What is next

Encore is deployed and the production origin passes the clean-browser release
smoke. The `v1.0.0` release and Codex GPT-5.6 evidence are frozen. The remaining
Build Week work is to record and publish the demo video, attach it to the
Devpost draft, and submit. Accounts,
cross-device sync, audio analysis, and direct publishing remain deliberately
out of scope.

## Demo video plan — target 2:40

Prepare a clean browser profile, stable network, and 1080p screen recording.
Use the public deployment without credentials. Keep the mock labels visible
and never describe a fixture as live model output.

| Time | Screen and action | Narration goal | Evidence captured |
|---|---|---|---|
| 0:00–0:12 | Open on the final caption/dashboard, then return to the Song Map | “Encore takes one cover from structural notes to a publish decision.” | Outcome-first hook |
| 0:12–0:30 | Show the five-section Song Map and target date | Explain the specific cover-artist problem and that no lyrics are stored. | User, problem, bounded input |
| 0:30–0:50 | Generate the countdown and pause on the highlighted mock notice | “The production adapter targets GPT-5.6. This no-key demo uses the same validated schema and labels the fixture honestly.” | Working plan plus honest runtime boundary |
| 0:50–1:05 | Show the Lyric Firewall result | Explain the quotation, stanza-shape, and repeated-line checks. | Safety behavior |
| 1:05–1:30 | Log practice and show section history/trends | Explain section-level confidence and browser persistence. | Core interaction and state |
| 1:30–1:52 | Show readiness factors and save the recording decision | “Readiness is deterministic and explainable; Encore recommends, the artist decides.” | Key product decision |
| 1:52–2:10 | Generate the labeled mock caption and confirm publication | Explain output validation, the second lyric check, and the external-publish boundary. | Completed golden path |
| 2:10–2:31 | Show README evidence and the merged PR sequence | Name session `019f74c9-756b-7421-a9e2-68d08be3bb63`; explain GPT-5.6 Sol in Codex built the core from the Lyric Firewall through release. | Required Codex and GPT-5.6 evidence |
| 2:31–2:40 | Hold the deployed URL and Encore wordmark | “Encore: for the space between picking a song and hitting publish.” | Memorable close and test URL |

### Recording and upload checklist

- Rehearse once and target `2:40`; reject any export at or above `3:00`.
- Record readable 1080p video with cursor emphasis and spoken narration.
- Do not show environment files, request headers, email, or local Codex logs.
- Suggested title: `Encore — OpenAI Build Week 2026 Demo`.
- Put the production URL, repository, `v1.0.0` release, and session ID in the
  YouTube description.
- Set YouTube visibility to **Public**, wait for HD processing, then test the
  URL in an incognito window with captions and audio enabled.
- Watch the complete uploaded video once before adding its URL to Devpost.

## Evidence ledger

Status meanings: **verified** is reproducible from the public repository;
**capture** requires a real external or live-session artifact before submission.

| Evidence | Status | Source or capture instruction |
|---|---|---|
| Public source repository | verified | <https://github.com/manojmallick/encore> |
| Relevant license | verified | [MIT license](../LICENSE) |
| Ordered implementation history | verified | [issues](https://github.com/manojmallick/encore/issues?q=is%3Aissue) and [merged PRs](https://github.com/manojmallick/encore/pulls?q=is%3Apr+is%3Amerged) |
| Reproducible setup and architecture | verified | [reproducibility](./REPRODUCIBILITY.md) and [architecture](./ARCHITECTURE.md) |
| Unit/integration baseline | verified | 140 tests across 23 files; rerun `pnpm test` |
| Recording-readiness count | verified | 11 expanded tests; run the JSON-reporter command in the reproducibility guide |
| Lyric Firewall count | verified | 12 expanded tests; run the JSON-reporter command in the reproducibility guide |
| Chromium golden path | verified | 1 test; rerun `pnpm test:e2e` |
| Runtime GPT-5.6 requests | unavailable | No API key is configured; the public deployment visibly labels schema-compatible plan and caption fixtures as mock data |
| Timestamped Codex task/session evidence | verified | `019f74c9-756b-7421-a9e2-68d08be3bb63`; local metadata records `gpt-5.6-sol`, with public outputs mapped in [GPT56_EVIDENCE.md](./GPT56_EVIDENCE.md) |
| Production URL | verified | <https://encore-sigma-ten.vercel.app>; clean-browser production smoke passed locally against the v0.16 release candidate |
| Demo video URL | capture | Add only after the final under-three-minute recording is uploaded and reviewed |
| Devpost project URL and submitted timestamp | draft | <https://devpost.com/software/encore-8q7zfw>; add the public video and submission timestamp before the deadline |

## Final consistency check

Before submission, confirm all four surfaces describe the same commit and
workflow:

- public repository and README;
- deployed application;
- under-three-minute video;
- Devpost copy.

Replace every **capture** row with a verified URL, identifier, or timestamp—or
state honestly that the artifact is unavailable. Never expose an API key or
estimate test counts, model calls, session IDs, or completion times.
