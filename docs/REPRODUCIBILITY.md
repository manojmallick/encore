# Reproduce Encore

This guide rebuilds and verifies Encore `v0.15.0` from a clean clone. The
deterministic checks use model doubles and do not require an OpenAI API key.
Only the two live GPT-5.6 demo requests require a key.

## Prerequisites

- Git
- Node.js 24.x, matching GitHub Actions
- pnpm 10.33.2, matching the `packageManager` field
- Chromium installed by Playwright for the browser check

Confirm the toolchain before continuing:

```bash
node --version
pnpm --version
```

If pnpm is unavailable, install the pinned version with Corepack when it is
available in the Node distribution:

```bash
corepack enable
corepack prepare pnpm@10.33.2 --activate
```

## Clean-room setup

```bash
git clone https://github.com/manojmallick/encore.git
cd encore
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>. The checked-in Song Map fixture is immediately
visible; no seeded database or account is required. Browser state is local to
that origin, so use a clean browser profile or clear the four `encore:*` local
storage keys when repeating the flow.

## Environment modes

For deterministic UI inspection, leave `OPENAI_API_KEY` empty. The automated
tests intercept or inject both model boundaries and never make billable calls.

For a live demo, set a real server-only key in `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=replace-with-a-local-secret
```

Restart `pnpm dev` after changing the environment. Never paste the key into a
`NEXT_PUBLIC_*` variable, terminal transcript, screenshot, issue, or commit.

## Deterministic verification

Run the same quality gate used for this release:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The end-to-end command starts the app through Playwright's configured web
server. A separately running development server is not required.

To check the production server manually:

```bash
pnpm build
pnpm start
```

Open <http://localhost:3000> and confirm the landing page renders. Stop the
server with `Ctrl+C`.

## Verified test baseline

The `v1.0.0` release gate records these real Vitest and Playwright results:

| Scope | Command | Expected result |
|---|---|---:|
| Unit and integration | `pnpm test` | 140 tests in 23 files |
| Recording readiness | `pnpm exec vitest run src/logic/recording-readiness.test.ts --reporter=json` | 11 tests |
| Lyric Firewall | `pnpm exec vitest run src/logic/lyric-risk.test.ts --reporter=json` | 12 tests |
| Browser golden path | `pnpm test:e2e` | 1 Chromium test |

Vitest expands `it.each` and `test.each` cases, so the JSON reporter's
`numTotalTests` is the source of truth—not a count of `it(` strings. The
readiness and Lyric Firewall suites can also be run together; their combined
total is 23.

The browser test completes map-to-publish with deterministic API responses,
performs axe WCAG 2.0/2.1/2.2 A/AA scans in empty and published states, verifies
keyboard focus behavior, and checks horizontal overflow at 320, 390, 768, and
1440 pixels.

## Live GPT-5.6 smoke flow

Use this only with a configured key and network access:

1. Generate the countdown plan and wait for the dated sessions to appear.
2. Log at least one confidence rating for every Song Map section. Add only
   original structural observations—not lyrics.
3. Choose the recording decision. If readiness is not `ready`, acknowledge the
   explicit override.
4. Generate the Making Of caption and confirm it displays the lyric-risk pass.
5. Copy the caption, externally post it if desired, then confirm the local
   publish milestone.

The live plan and caption calls are evidence to capture in the submission
video. They are not part of the deterministic release baseline.

## Production deployment smoke test

The verified production origin is <https://encore-sigma-ten.vercel.app>.

The production runner does not start a local server and fails before opening a
browser unless `ENCORE_SMOKE_BASE_URL` is an absolute HTTPS origin on a
non-local host. Configure Vercel first:

1. Link the public GitHub repository to a Vercel project or deploy it with the
   Vercel CLI.
2. Select Node.js 24 and keep the repository root as the project root.
3. Set `NEXT_PUBLIC_SITE_URL` to the final production origin, without a path,
   query, or fragment.
4. Set the server-only `OPENAI_API_KEY` for live GPT-5.6 features.
5. Deploy the exact commit intended for submission.

Then run:

```bash
ENCORE_SMOKE_BASE_URL=https://encore-sigma-ten.vercel.app pnpm test:smoke
```

The smoke test verifies HTTPS delivery, canonical metadata, security headers,
immutable `/_next/static/` caching, and the complete map-to-publish flow in a
clean Chromium context. Plan and caption requests are intercepted with the same
deterministic fixtures as the local golden path; this proves the deployed UI
contract without spending API credits. Capture separate live GPT-5.6 plan and
caption requests for the demo evidence gate.

If Vercel Deployment Protection is enabled, keep the automation secret outside
the repository:

```bash
export VERCEL_AUTOMATION_BYPASS_SECRET=replace-with-local-secret
ENCORE_SMOKE_BASE_URL=https://encore.example.com pnpm test:smoke
```

GitHub Actions also exposes a manual `production-smoke` workflow. Supply the
production origin as its required input and configure
`VERCEL_AUTOMATION_BYPASS_SECRET` as a repository or environment secret only
when protection is enabled. Record the successful workflow URL and tested
commit in the evidence ledger.

## Troubleshooting

- A configuration error from either generation route means the development
  process cannot read `OPENAI_API_KEY`; update `.env.local` and restart it.
- A stale target-date or malformed saved record is rejected. Clear site data
  and reload to restore the checked-in demo fixture.
- If Chromium is missing, rerun `pnpm exec playwright install chromium`.
- If counts differ, verify the checked-out revision and run
  `pnpm install --frozen-lockfile` before treating the baseline as changed.
