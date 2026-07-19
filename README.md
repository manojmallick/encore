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

`v0.4.0` adds deterministic lyric-risk checks for artist-authored notes on top
of the typed Song Map domain. Continuous integration, metadata, and baseline
test tooling support the OpenAI Build Week 2026 Apps for Your Life submission.

## Lyric-risk policy

Encore accepts structural practice notes, not song lyrics or sheet music. A
defense-in-depth heuristic flags long quoted passages, stanza-like multiline
text, and repeated substantive lines before future model requests. Blocked
results include rewrite guidance that helps an artist describe the transition,
register, rhythm, dynamics, or other practice challenge in their own words.

Passing this check is a risk-reduction signal, not proof of copyright status,
non-infringement, or legal compliance. The check cannot provide legal advice.

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
pnpm build
```

## Deploy

Push to a Vercel-linked Git repository or run `vercel deploy`. The generated
deployment configuration lives in [`vercel.ts`](./vercel.ts).

Product-specific logic belongs in `src/logic/`; Next.js pages and route
handlers belong in `app/`.

## License

[MIT](./LICENSE)
