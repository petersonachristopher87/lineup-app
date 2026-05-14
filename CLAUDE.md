# Lineup & Position Manager

Web app for youth baseball / softball coaches to plan lineups, rotate defensive positions fairly, and stay within pitch-count rules.

## Target users

Little League rec coaches at the **Single-A through Majors** levels. Most users are volunteer parents, not technical — UX must be obvious and forgiving. Two primary surfaces:

- **Desktop** — pre-game planning (roster, lineup grid, position assignments, templates).
- **Mobile** — in-game / dugout use (attendance, mark complete, pitch log, quick reference).

Both surfaces must work; do not regress one for the other.

## Core features

- **Roster & attendance** — per-team players, per-game attendance toggle.
- **Lineup grid** — drag-and-drop batting order and inning-by-inning defensive assignments.
- **Equity engine** ([src/lib/equityEngine.ts](src/lib/equityEngine.ts)) — flags unfair distribution of positions / bench time across a game and across the season.
- **Defensive rotation** — position assignments per inning with auto-fill ([src/lib/autoFillEngine.ts](src/lib/autoFillEngine.ts)) and level-based templates ([src/lib/levelTemplates.ts](src/lib/levelTemplates.ts), [src/lib/templateOverrides.ts](src/lib/templateOverrides.ts)).
- **Safety rules** ([src/lib/safetyRulesEngine.ts](src/lib/safetyRulesEngine.ts)) — pitch-count enforcement and required rest per Little League rules. Pitch log is stamped with the game date on completion.
- **Season stats** — aggregate equity dashboard per team.
- **Team / coaches** — multi-coach invitation flow (migration `002_team_invitations.sql`).
- **Print/export** — [PrintableLineup.tsx](src/components/PrintableLineup.tsx) for paper handoff in the dugout.

## Stack

- **React 18 + TypeScript**, **Vite 5**, **React Router v6**.
- **TanStack Query v5** for server state; **Zustand** for client state.
- **React Hook Form + Zod** for forms.
- **Supabase** (Postgres + Auth + RLS) — anon key only, all access goes through RLS.
- **Tailwind CSS** + **Radix UI** primitives (shadcn-ui patterns) + **dnd-kit** for drag-and-drop.
- **pnpm 8** package manager.
- Path alias: `@/*` → `src/*` (configured in [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts)).
- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters` are on — dead code fails the build.

## Scripts

```
pnpm dev          # vite dev server on :5173, opens browser
pnpm build        # tsc && vite build
pnpm preview      # preview production build
pnpm type-check   # tsc --noEmit
```

## Current phase

**Deployment + auth hardening.** The feature set from the original build order is largely implemented (despite what the README checklist suggests). Current focus:

- Deploying to **Vercel** (preferred — [vercel.json](vercel.json) already has the SPA rewrite) or **Netlify** as fallback.
- Validating **Supabase RLS policies** end-to-end: a coach can only see/mutate their own teams, players, games, lineups, pitch logs; team-invitation flow respects roles.
- Validating **Supabase Auth** flow: signup, login, password reset, session persistence, redirect after auth.

When working in this phase, treat RLS and auth as load-bearing — never bypass RLS with a service role key from the client, and never weaken policies to make a query work. If a query fails because of RLS, the policy is the thing to fix, not the query.

## Conventions

### File layout
- `src/pages/<Name>Page.tsx` — route components, named export (not default).
- `src/components/` — shared UI; subfolders by domain (`equity/`, `safety/`).
- `src/hooks/use<Domain>.ts` — TanStack Query hooks, one file per domain.
- `src/lib/supabase/<entity>Service.ts` — thin async wrappers over `supabase.from(...)`. One service per table. Hooks call services; components call hooks — components never call Supabase directly.
- `src/lib/<engine>.ts` — pure domain logic (equity, safety, auto-fill, templates). No Supabase calls inside engines.
- `src/types/supabase.ts` — generated DB types. Pull row types via `Database['public']['Tables']['<table>']['Row']`.
- `supabase/migrations/NNN_<name>.sql` — numbered, append-only. Never edit a migration after it's been run in any environment; add a new one.

### TanStack Query
- Query keys are arrays starting with the entity name, then ids: `['games', teamId]`, `['game', gameId]`, `['pitchLog', gameId]`.
- Mutations invalidate by those keys in `onSuccess`. When a mutation affects multiple domains (e.g. updating a game changes its pitch log), invalidate each — see [useGames.ts:48-50](src/hooks/useGames.ts:48).
- `enabled: !!id` guards against undefined ids on first render.

### Routing
- All app routes are wrapped in `<ProtectedRoute>` ([src/lib/router.tsx:21](src/lib/router.tsx:21)), which redirects unauthenticated users to `/login`.
- URL params are unpacked via `TeamRouteWrapper` / `GameRouteWrapper` and passed as props — pages receive `teamId` / `gameId` as props, they do not call `useParams` themselves.
- Unknown routes redirect to `/`.

### Data model notes
- `pitch_log` rows are stamped with `game_date` on mark-complete and cascaded when a game's date changes. Don't introduce code paths that write pitch_log without a date.
- "Mark complete" uses a centered modal ([MarkCompleteDialog.tsx](src/components/MarkCompleteDialog.tsx)), not `window.confirm`. Follow that pattern for any destructive or finalizing action.

### Style
- Tailwind utility classes inline; merge with `clsx` + `tailwind-merge` via [src/lib/utils.ts](src/lib/utils.ts) (`cn()`).
- No emojis in UI unless explicitly requested by the user.
- Keep components small and feature-scoped; lift to `src/components/` only when reused.

## Environment

`.env` (gitignored) with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The anon key is the only credential the client sees. Anything that needs the service role belongs in a Supabase Edge Function or a server, not in this repo.

## Related docs in the repo

- [README.md](README.md) — setup steps. Build-order checklist is stale; trust the code, not the checklist.
- [FOUNDATION_REVIEW.md](FOUNDATION_REVIEW.md) — early architecture review.
- [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) — pre-deploy checks.
- [CLAUDE_EXTENSION_GUIDE.md](CLAUDE_EXTENSION_GUIDE.md) — how the project plans to extend Claude integrations.
