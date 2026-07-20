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
structural notes—never lyrics. GPT-5.6 converts that map into a validated,
dated countdown plan that front-loads difficult sections. Practice entries
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
[PR #28](https://github.com/manojmallick/encore/pull/28) is reproducible
evidence of that iteration. One concrete design correction was recording
readiness: the final deterministic algorithm withholds incomplete coverage and
penalizes declining sections instead of relying on a reassuring average alone.
The final timestamped Codex task/session artifact is intentionally left pending
in the evidence ledger until captured from the product UI.

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
smoke. The remaining Build Week work is to record the live GPT-5.6 plan and
caption requests, capture the Codex session evidence, and freeze matching
repository, video, deployment, and Devpost descriptions. Accounts,
cross-device sync, audio analysis, and direct publishing remain deliberately
out of scope.

## Demo runbook — target 2:45

Prepare a clean browser profile, a working `OPENAI_API_KEY`, stable network, and
screen recording before starting. Keep DevTools Network visible only when it
does not expose request headers or secrets.

| Time | Screen and action | Narration goal | Evidence captured |
|---|---|---|---|
| 0:00–0:12 | Open on the final Making Of caption, then return to the top | “This came from my own practice history—not a generic template.” | Outcome-first hook |
| 0:12–0:28 | Show the five-section Song Map and structural notes | Define the independent cover artist and the one-song problem; point out that no lyrics are entered | Target user and bounded input |
| 0:28–0:48 | Trigger a real **Generate countdown plan** request and wait for sessions | Explain that GPT-5.6 returns validated dated sessions and front-loads hard sections | Live plan request and rendered result |
| 0:48–1:04 | Briefly show a lyric-risk rejection or the pass confirmation | Explain the three transparent heuristics and rewrite guidance | Lyric Firewall behavior |
| 1:04–1:30 | Log confidence for sections and show mastery/readiness update | Explain complete coverage, declining-section penalty, and visible thresholds | Deterministic readiness factors |
| 1:30–1:47 | Save the recording decision; acknowledge override only if shown | “Encore recommends; the artist decides.” | Artist-agency flow |
| 1:47–2:07 | Trigger a real **Generate Making Of caption** request | Explain that GPT-5.6 uses validated practice history and the output is lyric-checked again | Live caption request and rendered result |
| 2:07–2:22 | Copy the caption and confirm the external publish milestone | Clarify that Encore does not impersonate an external publishing integration | Completed golden path |
| 2:22–2:37 | Show the GitHub PR sequence, tests, and timestamped Codex task/session evidence | Name the readiness iteration and real test counts | Codex + repository evidence |
| 2:37–2:45 | Hold the deployed URL and Encore wordmark | “Encore: for the space between picking a song and hitting publish.” | Legible final URL |

Do one unrecorded rehearsal. If either live request fails, fix the configuration
or network and restart; do not substitute intercepted test data while calling
the request live.

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
| Live GPT-5.6 practice-plan request | capture | Record the request action and rendered dated plan in the final demo |
| Live GPT-5.6 caption request | capture | Record the request action, rendered caption, and pass confirmation in the final demo |
| Timestamped Codex task/session evidence | capture | Use `/feedback` in the relevant Codex task, then record the exact session ID here and in Devpost |
| Production URL | verified | <https://encore-sigma-ten.vercel.app>; clean-browser production smoke passed locally against the v0.16 release candidate |
| Demo video URL | capture | Add only after the final under-three-minute recording is uploaded and reviewed |
| Devpost project URL and submitted timestamp | capture | Add after submission; retain confirmation before the stated deadline |

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
