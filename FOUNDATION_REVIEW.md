# Lineup Manager - Foundation Review

## Architecture Overview

### Core Stack
- **Frontend:** React 18 + Vite (fast HMR)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase PostgreSQL + Auth + Realtime
- **State:** React Query (server state) + optional Zustand (local UI)
- **Styling:** Tailwind CSS (utility-first)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation

---

## Component Review (1-5)

### ✅ Component 1: Supabase Schema
**File:** `supabase/migrations/001_init_schema.sql` (387 lines)

**Strengths:**
- Full RLS policies prevent unauthorized access
- 9 tables cover the entire domain (teams, players, games, lineups, positions, pitch_log)
- Proper constraints: UNIQUEs, FKs, CHECKs
- Indexes on common queries (team_id, game_date, player_id)
- UUID PKs everywhere
- Timestamps on all tables (created_at, updated_at)

**Potential Issues:**
- RLS policies are somewhat complex; may need testing for edge cases
- `pitch_log` only logs final count, not per-pitch (v1 design choice is OK)
- Position assignment UNIQUE constraint allows multiple BENCHes (intentional, correct)

**Seed Data:** `supabase/seed.sql`
- Creates 1 team, 12 players, 3 games, attendance, lineups, position assignments
- Good for development/demos

---

### ✅ Component 2: Auth + Team Setup + Roster CRUD

**Services:**
- `authService.ts` — Magic link + session management ✓
- `teamService.ts` — Create team (auto-applies level template) ✓
- `playerService.ts` — CRUD players ✓

**Hooks:**
- `useAuth.ts` — Auth state, sign in/out
- `useTeams.ts` — Teams query + mutations
- `usePlayers.ts` — Players query + mutations

**Pages:**
- `LoginPage.tsx` — Magic link form
- `DashboardPage.tsx` — Team list, logout
- `CreateTeamPage.tsx` — Create team with level selection
- `RosterPage.tsx` — Add/list players per team

**Strengths:**
- Level templates auto-populate team settings (equityWeights, safetyRules, positions)
- Magic link is low-friction auth for coaches
- Form validation ready (react-hook-form + zod setup)
- Protected routes with auth check

**Potential Issues:**
- No email verification UI (magic link auto-handles, but UX could be smoother)
- No team member invitation flow yet (just adds existing users)
- Roster page is basic — could use bulk import CSV

---

### ✅ Component 3: Game Management

**Service:** `gameService.ts`
- Create/read/update/delete games
- Subscribe to realtime updates (set up but not yet consumed in UI)

**Hook:** `useGames.ts` — Query + mutation wrappers

**Pages:**
- `GameListPage.tsx` — List upcoming/past games, status badges
- `CreateGamePage.tsx` — Date, time, opponent, innings, location

**Strengths:**
- Sorts by date (upcoming vs past)
- Defaults innings from team settings
- Realtime ready

**Potential Issues:**
- No "duplicate last game" feature yet (spec mentioned this)
- Status enum not enforced in UI (can only be created as "planned")

---

### ✅ Component 4: Attendance Toggle

**Service:** `attendanceService.ts`
- Set attendance per player per game
- Initialize all players as "attending" when game created

**Hook:** `useAttendance.ts`

**Page:** `AttendancePage.tsx`
- Three buttons per player: Attending / Maybe / Absent
- Shows counts (X attending, Y absent)
- Auto-initializes if first visit

**Strengths:**
- Simple, clear UX
- Realtime ready
- Shows attending count

**Potential Issues:**
- No "mark all absent" or bulk actions
- No warning if too few players attending

---

### ✅ Component 5: Desktop Lineup Grid (Core)

**Services:**
- `lineupService.ts` — Batting order CRUD
- `positionAssignmentService.ts` — Position assignments per inning

**Hooks:**
- `useLineup.ts`
- `usePositionAssignments.ts`

**Page:** `LineupGridPage.tsx`
- **Layout:** 2-column (left = batting order, right = position grid)
- **Grid:** Rows = innings, Columns = positions (battery/infield/outfield/bench)
- **Cells:** Dropdown to select player or "None"
- **Color-coding:** Yellow (battery), Blue (infield), Green (outfield), Gray (bench)
- **Drag-drop ready:** Players marked as draggable

**Strengths:**
- Core feature implemented end-to-end
- Position color-coding per spec
- Attends to RLS (only shows attending players)
- Saves to DB
- Layout is responsive (needs minor tweaks for mobile)

**Potential Issues:**
- Batting order drag-drop UI not fully implemented (marked draggable but no drop handler)
- No "duplicate from previous game" button yet
- No auto-balance button yet
- No equity warnings overlay yet
- Position cells are basic dropdowns (not a full modal/popover)
- No visual feedback for unsaved changes

---

## Data Flow

```
LoginPage
  ↓ (sets auth context)
DashboardPage (lists teams)
  ↓
  ├─→ CreateTeamPage (creates team + auto-populates settings from template)
  │
  └─→ GameListPage (lists games per team)
      ├─→ CreateGamePage (new game)
      ├─→ AttendancePage (mark who's coming)
      │   ↓
      └─→ LineupGridPage (build lineup + positions)
          ├─→ Save batting order → lineups table
          └─→ Save positions → position_assignments table
```

---

## Known Limitations & TODOs

### High Priority (for production readiness)
1. **Equity warnings** — Warnings overlay not implemented (spec: yellow dots for equity issues)
2. **Safety rules** — No pitch count validation (spec: red blocks for violations)
3. **Form validation** — react-hook-form + zod configured but not used in pages
4. **Error handling** — Basic console.error; should use toast notifications
5. **Loading states** — Some pages show "Loading..." but no skeleton loaders
6. **Mobile responsive** — Lineup grid needs mobile view (spec: separate mobile in-game view)

### Medium Priority
7. **Duplicate game** — Button to copy last game's lineup
8. **Auto-balance** — Greedy algorithm to fill equity gaps
9. **Real-time sync indicators** — "X coaches editing" badge
10. **Print lineup** — Native print stylesheet
11. **Realtime subscriptions** — Not yet consuming Supabase realtime channels in UI

### Low Priority (v2+)
12. **PWA** — vite-plugin-pwa defer until v1 works
13. **Advanced equity dashboard** — Season totals, outlier highlighting
14. **GameChanger/TeamSnap integration** — Out of scope for prototype

---

## Code Quality

**Good:**
- Consistent file structure (services → hooks → pages)
- TypeScript strict mode ✓
- React Query abstractions clean
- Supabase types auto-generated
- No prop drilling (React Query + Router)

**Areas to Improve:**
- Add error boundaries
- Add toast notifications (react-hot-toast or similar)
- Extract form validation schemas to constants
- Add unit tests (none yet)
- Add integration tests (none yet)
- Document complex functions (equity engine will need docs)

---

## Security Review

**RLS Policies:**
- Users can only access teams they created or are members of ✓
- Head coaches can edit settings; assistants can only edit lineups ✓
- All queries filtered by team membership ✓

**Auth:**
- Magic link: no password leaks ✓
- PKCE flow enabled ✓
- Session auto-refreshed ✓

**TODO:**
- Add rate limiting on auth endpoints
- Log sensitive actions (coach changes to roster)
- Audit trail for lineup changes

---

## Performance Considerations

- React Query caching: 5min staleTime, 10min gcTime
- No N+1 queries (single request per resource)
- Lazy-load pages via React Router
- Realtime subscriptions set up but not yet used (low volume for prototype)

**TODO:**
- Virtualize long lists (50+ players)
- Memoize grid cells to prevent re-renders

---

## Deployment Readiness

- ✓ TypeScript strict
- ✓ Vite build optimized
- ✓ Environment variables via .env
- ✓ Supabase schema migrated
- ✓ RLS policies active

**Before Deploy:**
- Run `pnpm build` to check for TS errors
- Set Supabase env vars in Vercel/production
- Test magic link redirect URL
- Verify CORS on Supabase (allow frontend domain)
- Backup database before first deployment

---

## Recommended Next Steps

1. **Review & test Components 1-5** — Manually walk through auth → create team → add players → schedule game → set attendance → build lineup
2. **Add equity warnings (Component 6)** — Overlay sidebar with warnings logic
3. **Add safety rules (Component 7)** — Pitch count validation (hard blocks)
4. **Add error handling** — Toast notifications for failures
5. **Add tests** — Unit tests for equityEngine, safetyRules logic
6. **Mobile in-game view (Component 9)** — Separate route for real-time edits
7. **Deploy to staging** — Vercel + Supabase staging environment
