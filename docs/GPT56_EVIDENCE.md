# GPT-5.6 and Codex evidence

This record separates the model used to build Encore from the model path
available inside the product.

## Verified Codex build session

| Field | Evidence |
|---|---|
| `/feedback` session ID | `019f74c9-756b-7421-a9e2-68d08be3bb63` |
| Workspace | `/Users/manojmallick/Documents/encore` |
| Recorded Codex model | `gpt-5.6-sol` |
| First recorded GPT-5.6 core turn | `2026-07-19T08:26:39Z` |
| Verification source | Local Codex session metadata and per-turn context for the supplied session ID |

The session record contains GPT-5.6 Sol turns for the core implementation from
the `v0.4.0` Lyric Firewall through the `v1.0.0` release. The public repository
provides the reviewable output of those turns:

| Contribution | Public evidence |
|---|---|
| Lyric-risk checks and structured countdown planning | [PR #8](https://github.com/manojmallick/encore/pull/8), [PR #10](https://github.com/manojmallick/encore/pull/10) |
| Plan persistence, practice logging, and mastery trends | [PR #12](https://github.com/manojmallick/encore/pull/12), [PR #14](https://github.com/manojmallick/encore/pull/14) |
| Explainable readiness and creator decision flow | [PR #16](https://github.com/manojmallick/encore/pull/16), [PR #18](https://github.com/manojmallick/encore/pull/18) |
| Lyric-safe caption and record-to-publish flow | [PR #20](https://github.com/manojmallick/encore/pull/20), [PR #22](https://github.com/manojmallick/encore/pull/22) |
| Failure coverage, accessibility, deployment, and release | [PR #24](https://github.com/manojmallick/encore/pull/24) through [PR #34](https://github.com/manojmallick/encore/pull/34) |

## Precise contribution statement

GPT-5.6 Sol was used through Codex to implement, test, review, document, and
release Encore's core workflow. Codex translated the version plan into issues
and pull requests, edited the application and domain logic, added deterministic
and browser tests, diagnosed failures, and verified builds and deployments.

Encore also contains two OpenAI Responses API adapters configured for
`gpt-5.6`: structured countdown planning and Making Of caption generation.
Those adapters require a server-only `OPENAI_API_KEY`. The public deployment
does not have that key and returns prominently labeled deterministic fixtures
instead. A mock response is evidence of the testable fallback contract, not
evidence of a live GPT-5.6 API call.

## Judge verification

1. Use the session ID above in the Build Week `/feedback` field.
2. Review the linked pull requests for the incremental implementation trail.
3. Open the [production demo](https://encore-sigma-ten.vercel.app) without
   credentials and confirm that fixture-backed results are labeled as mock.
4. Inspect `src/server/model-runtime.ts` for live-versus-fixture selection and
   the two `src/server/openai-*.ts` files for the GPT-5.6 request boundaries.
5. Run the documented test commands to reproduce the checked-in behavior.
