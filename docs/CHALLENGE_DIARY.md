# Build Week challenge diary

This diary records decisions that are visible in Encore's ordered issues, pull
requests, implementation, and tests. It does not reconstruct private prompts or
claim uncaptured Codex session identifiers.

## July 19 — Turn a broad idea into one proof

The initial product idea could have expanded into lessons, audio analysis,
rights management, collaboration, and publishing integrations. The first issue
instead defined one judgeable path for one independent cover artist and one
song: map, plan, practice, assess, record, publish. Every later version follows
that ordered roadmap.

Evidence: [issue #1](https://github.com/manojmallick/encore/issues/1),
[PR #2](https://github.com/manojmallick/encore/pull/2), and
[`ENCORE_APPS_FOR_LIFE_PLAN.md`](../ENCORE_APPS_FOR_LIFE_PLAN.md).

## July 19 — Keep artist notes useful without inviting lyrics

A blanket text ban would make practice planning useless, while sending
unbounded notes to a model would undermine the product's lyric-safe claim. The
solution was a small, explainable firewall: detect long quotations,
stanza-shaped multiline text, and repeated substantive lines; identify the
affected section; then suggest a structural rewrite. Later plan and caption
work reused the same gate before model calls, and caption output gained a second
check.

Evidence: [issue #7](https://github.com/manojmallick/encore/issues/7),
[PR #8](https://github.com/manojmallick/encore/pull/8),
[issue #19](https://github.com/manojmallick/encore/issues/19), and
[PR #20](https://github.com/manojmallick/encore/pull/20).

## July 19 — Make readiness honest about missing and worsening data

Average confidence alone can hide two problems: an unpracticed section and a
section that is actively declining. Readiness therefore withholds the score
until every mapped section is rated, subtracts for declining trends, and
compares progress with elapsed plan time. The UI shows every factor and reason,
while the artist can still record early through an explicit acknowledgement.

Evidence: [issue #15](https://github.com/manojmallick/encore/issues/15),
[PR #16](https://github.com/manojmallick/encore/pull/16),
[issue #17](https://github.com/manojmallick/encore/issues/17), and
[PR #18](https://github.com/manojmallick/encore/pull/18).

## July 19 — Define “publish” without pretending to be an integration

Encore does not have authorization to post to an artist's channel. The golden
path therefore separates external action from local evidence: the artist
records and posts elsewhere, then confirms the milestone. The publication
record requires a recording decision and valid caption, snapshots the exact
caption, restores only against the matching decision, and remains reversible.

Evidence: [issue #21](https://github.com/manojmallick/encore/issues/21) and
[PR #22](https://github.com/manojmallick/encore/pull/22).

## July 19 — Test the failure states, not only the demo

The first full path was not enough evidence by itself. The release suite added
route, storage, reducer, readiness, recording, publication, and browser tests;
then hardened impossible calendar dates, timezone-equivalent instants, unknown
JSON fields, invalid confidence/frequency values, model refusals, and sanitized
provider failures. The resulting baseline is 126 Vitest cases plus one
Chromium golden-path case.

Evidence: [issue #23](https://github.com/manojmallick/encore/issues/23),
[PR #24](https://github.com/manojmallick/encore/pull/24),
[issue #25](https://github.com/manojmallick/encore/issues/25), and
[PR #26](https://github.com/manojmallick/encore/pull/26).

## July 19 — Make accessibility part of the release contract

The judge-facing demo needed more than a visually polished desktop state. The
responsive pass added keyboard focus management, an early skip link, semantic
status/list structure, reduced motion, comfortable touch targets, AA contrast,
and small-screen layout changes. Playwright now checks axe in empty and
published states, focus transitions, and overflow at four viewport widths.

Evidence: [issue #27](https://github.com/manojmallick/encore/issues/27) and
[PR #28](https://github.com/manojmallick/encore/pull/28).

## July 19 — Make deployment a testable release boundary

A successful local build did not prove that Vercel used the pinned package
manager, emitted the intended headers, served canonical metadata, or supported
the complete browser workflow. The deployment release added a separate runner
that refuses implicit localhost, checks the HTTPS response and immutable assets,
and reuses the exact local golden path against the production origin. The real
deployment at <https://encore-sigma-ten.vercel.app> passed that smoke before the
URL was marked verified.

Evidence: [issue #31](https://github.com/manojmallick/encore/issues/31),
[`vercel.ts`](../vercel.ts), and the manual `production-smoke` workflow.

## What remains before submission

Repository history proves the ordered implementation and review trail. It does
not prove a live GPT-5.6 request, recorded video, or a Codex `/feedback` session
identifier. Those artifacts must be captured during the final demo release and
recorded in the
[Build Week evidence ledger](./BUILD_WEEK_SUBMISSION.md#evidence-ledger).
