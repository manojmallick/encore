# Encore

**A one-song countdown studio that turns structural practice notes into a focused plan, an explainable recording decision, and a Making Of caption.**

[![License: MIT](https://img.shields.io/badge/license-MIT-2563eb.svg)](./LICENSE)
[![Language: TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000.svg?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![OpenAI Responses API](https://img.shields.io/badge/OpenAI-Responses_API-412991.svg?logo=openai&logoColor=white)](https://platform.openai.com/docs/api-reference/responses)
[![OpenAI Build Week 2026](https://img.shields.io/badge/context-OpenAI_Build_Week_2026-0f766e.svg)](./ENCORE_APPS_FOR_LIFE_PLAN.md)

Independent cover artists often manage one recording deadline across scattered notes, calendars, and memory. Encore connects that work into one path: a GPT-5.6 countdown plan, section-level practice logs, deterministic readiness, and a lyric-risk-checked caption. It was built by [Manoj Mallick](https://github.com/manojmallick) for OpenAI Build Week, with the implementation history, automated checks, and production smoke workflow kept in the public repository.

[Open the production demo](https://encore-sigma-ten.vercel.app) · [Read the Build Week submission](./docs/BUILD_WEEK_SUBMISSION.md)

## Table of Contents

- [Why Encore](#why-encore)
- [Honest Status](#honest-status)
- [Architecture](#architecture)
- [How it works](#how-it-works)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Privacy and data handling](#privacy-and-data-handling)
- [Roadmap](#roadmap)
- [License](#license)

## Why Encore

Encore is designed for the gap between choosing a cover song and publishing the finished performance.

| The artist's problem | Encore's implemented response |
|---|---|
| Practice notes are disconnected from the recording date | GPT-5.6 returns a validated, session-by-session countdown plan |
| Progress feels subjective | Confidence is logged per section on a 1–5 scale and reduced to explicit trends |
| A single average can hide missing or declining sections | Readiness withholds incomplete scores and exposes every threshold and penalty |
| Free-text notes can accidentally become lyric storage | A transparent heuristic blocks long quotations, stanza-shaped text, and repeated substantive lines |
| The story behind the recording is lost | GPT-5.6 drafts a short caption from validated practice history after the song is marked recorded |
| “Published” is easy to overstate | Encore records an artist-confirmed local milestone; it does not post to an external platform |

## Honest Status

Encore is a deployed Build Week prototype with a complete demonstration path, not a general-purpose music platform.

| Area | Current reality |
|---|---|
| Song input | The UI uses one checked-in, read-only Song Map for “Dreams” by Fleetwood Mac. There is no Song Map editor or multi-song library. |
| Target date | The fixture target is `2026-08-15`. Live plan generation rejects it after that date because past targets fail closed. |
| AI features | With `OPENAI_API_KEY`, the two server routes call GPT-5.6. Without it, they return deterministic schema-compatible fixtures that the UI prominently labels as mock data. Automated browser tests also use deterministic responses. |
| Persistence | Plans, practice logs, recording decisions, and publication milestones use versioned `localStorage` keys. There is no account, database, or cross-device sync. |
| Readiness | The score is deterministic application logic, not an AI prediction or an assessment of vocal or instrumental audio. |
| Publishing | The artist posts externally, then confirms the milestone in Encore. No publishing-service integration exists. |
| Lyric safety | The Lyric Firewall is a risk-reduction heuristic. It is not a copyright determination or legal advice. |
| Measurement | No performance benchmark is claimed. Run the commands in [Quick Start](#verify-the-build) to measure the current test and build results on your machine. |

## Architecture

```mermaid
flowchart TD
  subgraph Browser["🖥️ Browser layer"]
    SongMap["Preloaded Song Map"]
    Frequency["Sessions per week · default 2"]
    Log["Section log · confidence 1–5"]
    Error["Validation feedback"]
    ArtistChoice{"Artist recording choice"}
    LocalStore[("Versioned localStorage")]
    ExternalPost["External post by the artist"]
  end

  subgraph Domain["⚙️ Deterministic domain layer"]
    InputSchema["Zod input and relationship validation"]
    Firewall{"Lyric Firewall passes?"}
    Blocked["Actionable validation error"]
    Trends["Recent section trends"]
    Readiness["Transparent readiness calculation"]
    OutputSchema["Zod structured-output validation"]
  end

  subgraph Server["🔒 Next.js server layer"]
    PlanAPI["POST /api/practice-plan"]
    CaptionAPI["POST /api/making-of-caption"]
    OpenAI["OpenAI Responses API · GPT-5.6"]
  end

  subgraph Outputs["🎯 Artist-facing outputs"]
    Plan["Countdown practice plan"]
    Dashboard["Trends, weak sections, readiness"]
    Caption["Making Of caption"]
    Published["Local published milestone"]
  end

  SongMap --> InputSchema
  Frequency --> InputSchema
  InputSchema --> PlanAPI
  PlanAPI --> Firewall
  Firewall -- "blocked" --> Blocked
  Blocked --> Error
  Firewall -- "passed" --> OpenAI
  OpenAI --> OutputSchema
  OutputSchema --> Plan
  Plan --> LocalStore
  Plan --> Log
  Log --> LocalStore
  Log --> Trends
  Trends --> Readiness
  Readiness --> Dashboard
  Dashboard --> ArtistChoice
  ArtistChoice --> LocalStore
  ArtistChoice -- "keep practicing" --> Log
  ArtistChoice -- "recorded; acknowledge if not ready" --> CaptionAPI
  SongMap --> CaptionAPI
  Log --> CaptionAPI
  CaptionAPI --> Firewall
  Firewall -- "passed" --> OpenAI
  OpenAI --> OutputSchema
  OutputSchema --> Caption
  Caption --> ExternalPost
  ExternalPost --> Published
  Published --> LocalStore
```

The model boundary is intentionally narrow. API routes validate unknown JSON, apply lyric-risk checks before outbound requests, request Zod-backed structured output, validate the response again, and return sanitized errors to the browser.

## How it works

1. **Load the demo Song Map.** The client renders the checked-in song metadata, five ordered sections, structural difficulty notes, and target date.
2. **Generate a countdown.** Choose 1–7 sessions per week. The plan route validates the request, rejects lyric-risky notes, calculates UTC calendar days, caps the plan at 24 sessions, and asks GPT-5.6 for contiguous structured sessions.
3. **Log practice.** Each entry records one known section, one plan session, confidence from 1–5, and an optional lyric-checked note of up to 280 characters.
4. **Calculate trends.** Fewer than two entries for a section yields `insufficient_data`. Otherwise, Encore compares the first and last confidence values among the three most recent entries to produce `improving`, `flat`, or `declining`.
5. **Calculate readiness.** No score is shown until every section has a confidence rating. The score starts from average confidence as a percentage and subtracts 8 points per declining section. Every factor and threshold is displayed.
6. **Make the recording call.** Encore recommends gathering data, adjusting the plan, continuing practice, or recording. The artist can record before `ready`, but must acknowledge the override.
7. **Generate the Making Of caption.** After recording and at least one valid practice entry, the caption route sends validated history to GPT-5.6. The returned caption must be 40–500 characters and pass the Lyric Firewall again.
8. **Confirm publication.** The artist copies and posts the caption outside Encore, then explicitly records the local publish milestone. The action is reversible without deleting practice history.

## Quick Start

### Prerequisites

- Git
- Node.js 24.x
- pnpm 10.33.2
- An OpenAI API key only for live plan and caption generation; the labeled mock flow works without one

### Run locally

```bash
git clone https://github.com/manojmallick/encore.git
cd encore
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

Without an API key, plan and caption actions return highlighted deterministic fixtures shaped like the production GPT-5.6 responses. They are explicitly labeled as mock data. To call the live GPT-5.6 routes, edit `.env.local` and restart the development server:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=replace-with-your-server-only-key
```

Never expose the key through a `NEXT_PUBLIC_*` variable or commit `.env.local`.

### Verify the build

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

`pnpm test:e2e` starts the local Next.js development server on `127.0.0.1:3100` and uses deterministic API responses. The production smoke suite requires an explicit HTTPS origin and does not start localhost:

```bash
ENCORE_SMOKE_BASE_URL=https://encore-sigma-ten.vercel.app pnpm test:smoke
```

See [docs/REPRODUCIBILITY.md](./docs/REPRODUCIBILITY.md) for clean-room setup, current measured test counts, and Vercel instructions.

## Configuration

| Variable or constant | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Runtime fallback: `https://example.com`; `.env.example`: `http://localhost:3000` | Canonical metadata origin. Set it to the final HTTPS origin in production. |
| `OPENAI_API_KEY` | None | Server-only credential for both GPT-5.6 routes. When absent or blank, both routes use visibly labeled deterministic demo fixtures. |
| `ENCORE_SMOKE_BASE_URL` | None | Required HTTPS origin for `pnpm test:smoke`; localhost, paths, queries, and fragments are rejected. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | None | Optional test-only header value for protected Vercel deployments. |
| `PRACTICE_PLAN_MODEL` / `MAKING_OF_CAPTION_MODEL` | `gpt-5.6` | Model used by the plan and caption adapters. |
| Plan/caption reasoning effort | `low` | Responses API reasoning setting for both model calls. |
| Caption text verbosity | `low` | Responses API text verbosity for caption generation. |
| `DEFAULT_SESSIONS_PER_WEEK` | `2` | Initial selection in the countdown UI. Valid request range is 1–7. |
| `MAX_PRACTICE_SESSIONS` | `24` | Maximum calculated or generated countdown length. |
| Song Map sections | 1–12 | Schema-enforced section count. Each section name is at most 80 characters and its structural note at most 500. |
| Practice confidence | 1–5 | Integer confidence recorded for one mapped section and plan session. |
| Practice note | Empty; maximum 280 characters | Optional structural observation checked for lyric risk before storage or model use. |
| Caption | 40–500 characters | Structured GPT output range before the returned caption is lyric-checked. |
| Recent trend window | Latest 3 entries | Window used after a section has at least two entries. |
| Readiness penalties | 8 points per declining section | Applied after average confidence is converted to a percentage. |
| Behind thresholds | Confidence gap greater than 1.2, or at least 2 declining sections | Either condition produces `behind`. |
| Ready thresholds | Average confidence at least 4/5, 0 declining sections, and at most 2 days remaining | All conditions are required for `ready`. |
| Browser storage versions | `1` | Separate versioned records for plans, logs, recording decisions, and publication milestones. |
| Maximum saved practice logs | `500` | Schema limit for one Song Map's local practice-log record. |

## Project Structure

```text
encore/
├── app/
│   ├── page.tsx                         # Next.js entry point
│   ├── countdown-workspace.tsx          # Client orchestration and local persistence
│   ├── creator-dashboard.tsx            # Recommendation and recording decision UI
│   ├── making-of-caption.tsx            # Caption, copy, and publish-confirmation UI
│   └── api/
│       ├── practice-plan/route.ts       # Validated countdown API boundary
│       └── making-of-caption/route.ts   # Validated caption API boundary
├── src/
│   ├── logic/
│   │   ├── fixtures/demo-song-map.ts    # The read-only demonstration song
│   │   ├── practice-plan.ts             # Plan schemas, calendar facts, prompts, validation
│   │   ├── lyric-risk.ts                # Explainable text-risk heuristic
│   │   ├── section-mastery.ts           # Practice-entry validation and trends
│   │   ├── recording-readiness.ts       # Deterministic readiness calculation
│   │   ├── creator-dashboard.ts         # Weak-section ranking and recommendation
│   │   └── *-storage.ts                 # Versioned localStorage adapters
│   └── server/
│       ├── openai-practice-plan.ts      # Responses API plan adapter
│       └── openai-making-of-caption.ts  # Responses API caption adapter
├── tests/
│   ├── e2e/golden-path-flow.ts          # Reusable deterministic browser flow
│   └── smoke/production.spec.ts         # HTTPS deployment contract
├── docs/                                # Architecture, reproduction, diary, submission
├── playwright.config.ts                 # Local Chromium configuration
├── playwright.smoke.config.ts           # Existing-deployment smoke configuration
├── vercel.ts                            # Install, build, cache, and security headers
└── package.json                         # Pinned package manager and task scripts
```

## Privacy and data handling

- Song metadata, structural notes, practice history, and decisions remain in the current browser's `localStorage` unless a live AI feature is requested.
- Live plan requests send song metadata and structural notes to the OpenAI Responses API. For captions, the browser sends the Song Map, practice logs, and recording decision to Encore's server; the model prompt contains song metadata and derived practice history after the decision is validated.
- `OPENAI_API_KEY` is read only by server modules. It is never required by browser code.
- Encore does not collect audio, retrieve lyrics, create accounts, or write to a project database.
- Browser storage is origin-scoped but not an encrypted vault. Anyone with access to the same browser profile may be able to inspect it.
- Malformed or mismatched persisted records are ignored and removed when storage access permits.
- The Lyric Firewall reduces the chance of sending lyric-like text. It cannot determine copyright status or provide legal advice.

## Roadmap

Only the v1.0 submission freeze is currently tracked. The other items below come from the project's documented post-prototype exclusions and have no promised date.

| Item | Status | Evidence or boundary |
|---|---|---|
| Freeze the Build Week v1.0 submission | Tracked in [issue #33](https://github.com/manojmallick/encore/issues/33) | Waiting on live GPT evidence, demo video, Devpost confirmation, and Codex session evidence |
| Editable and multiple Song Maps | Candidate | The current UI imports one fixed fixture |
| Accounts and cross-device persistence | Candidate | Current persistence is browser-local only |
| Audio recording, pitch analysis, or transcription | Research only | Explicitly excluded from the Build Week release |
| Direct publishing integrations | Candidate | Current publishing is an artist-confirmed local milestone |

## License

Encore is available under the [MIT License](./LICENSE). Copyright © 2026 Manoj Mallick.
