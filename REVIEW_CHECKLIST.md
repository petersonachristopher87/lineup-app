# Foundation Review Checklist

Use this to validate Components 1-5 before continuing to Components 6+

## Component 1: Supabase Schema

- [ ] **Tables Created**
  - [ ] `teams` with level enum
  - [ ] `team_members` with head_coach/assistant_coach roles
  - [ ] `players` with preferred/restricted positions
  - [ ] `team_settings` with equity weights & position categories
  - [ ] `games` with status tracking
  - [ ] `game_attendance` with attending/absent/maybe
  - [ ] `lineups` with batting_order array
  - [ ] `position_assignments` with game/inning/position unique constraints
  - [ ] `pitch_log` for safety rule tracking

- [ ] **RLS Policies**
  - [ ] Users can only view teams they created or are members of
  - [ ] Head coaches can edit team settings and roster
  - [ ] Assistants can only edit lineups and attendance
  - [ ] Position assignments & pitch_log properly scoped

- [ ] **Indexes**
  - [ ] `position_assignments(game_id, inning)`
  - [ ] `games(team_id, game_date)`
  - [ ] `pitch_log(player_id)`

- [ ] **Seed Data**
  - [ ] 1 team (Issaquah AA Mariners)
  - [ ] 12 players with varied positions
  - [ ] 3 past games with lineups
  - [ ] Attendance records

---

## Component 2: Auth & Team Setup

- [ ] **Auth**
  - [ ] Magic link sign-in works
  - [ ] User can receive email with link
  - [ ] Session persists across page reload
  - [ ] Sign out clears session

- [ ] **Team Creation**
  - [ ] Form accepts team name, level, sport, season year
  - [ ] Selecting level pre-fills team settings from template
  - [ ] Position categories match level (e.g., Single-A hides pitcher)
  - [ ] Equity weights match level template

- [ ] **Roster CRUD**
  - [ ] Can add player with first/last name
  - [ ] Can select preferred positions (multi-select)
  - [ ] Can set jersey number (optional)
  - [ ] Players list shows sorted by last name
  - [ ] Can delete player (soft delete, marked inactive)

---

## Component 3: Game List & Creation

- [ ] **Game List**
  - [ ] Shows upcoming games first
  - [ ] Shows past games below
  - [ ] Displays opponent name, date, time
  - [ ] Shows game status (planned/in_progress/complete/cancelled)
  - [ ] "Create Game" button present

- [ ] **Game Creation**
  - [ ] Form accepts opponent name, date, time, location, innings count
  - [ ] Innings defaults from team settings
  - [ ] Creates game with status = "planned"
  - [ ] Redirects to game detail after creation

---

## Component 4: Attendance Toggle

- [ ] **Attendance UI**
  - [ ] Lists all active players on team
  - [ ] Each player has 3 buttons: Attending / Maybe / Absent
  - [ ] Buttons are color-coded (green/yellow/red)
  - [ ] Shows counts: "X Attending, Y Absent"

- [ ] **Attendance Logic**
  - [ ] First visit auto-marks all as "attending"
  - [ ] Changes save immediately to DB
  - [ ] Realtime: if another coach changes it, UI updates

---

## Component 5: Desktop Lineup Grid

- [ ] **Grid Layout**
  - [ ] Left panel: Batting order list (draggable)
  - [ ] Right panel: Position grid
  - [ ] Rows = innings (1 to game.innings_count)
  - [ ] Columns = all positions (P, C, 1B, 2B, 3B, SS, LF, CF, RF, BENCH)

- [ ] **Position Cells**
  - [ ] Show player name or "-" if empty
  - [ ] Click to open dropdown
  - [ ] Dropdown lists all attending players
  - [ ] Color-coded: battery (yellow), infield (blue), outfield (green), bench (gray)

- [ ] **Data Binding**
  - [ ] Cells populated from position_assignments table
  - [ ] Can add/update assignments
  - [ ] Can clear assignments (set to "-")

- [ ] **Save**
  - [ ] "Save Lineup" button saves batting order
  - [ ] Position changes auto-save
  - [ ] Loading state shows while saving

---

## End-to-End Test

Follow this flow to validate everything works together:

1. **Auth & Team Setup**
   - [ ] Sign in with magic link
   - [ ] Create team (AA, baseball, 2024)
   - [ ] Add 3 test players (positions: P/SS, C, 1B)

2. **Game Management**
   - [ ] Create a game (opponent: "Test Team", date: tomorrow, 6 innings)
   - [ ] Verify game appears in list

3. **Attendance**
   - [ ] Click "Set Attendance" on the game
   - [ ] Mark 2 players as attending, 1 as absent
   - [ ] Verify counts update

4. **Lineup Planning**
   - [ ] Click "Plan Lineup"
   - [ ] Should see 2 attending players in left panel
   - [ ] Should see empty grid (6 innings × positions)
   - [ ] Assign players to Inning 1 (one to P, one to C, etc.)
   - [ ] Click Save
   - [ ] Verify assignments persist

---

## Known Issues (Expected)

✗ **Not yet implemented (for v1):**
- Equity warnings overlay
- Safety rules (pitch count validation)
- Auto-balance button
- Duplicate game feature
- Real-time coach editing indicator
- Print lineup
- Mobile view
- Season equity dashboard

---

## Performance Check

- [ ] App loads in < 3 seconds
- [ ] Game list renders instantly
- [ ] Switching between pages is smooth
- [ ] No console errors on full flow

---

## Code Quality

- [ ] All TypeScript strict mode ✓
- [ ] No `any` types ✓
- [ ] Proper error handling (try/catch) ✓
- [ ] React Query configured ✓
- [ ] Router protected properly ✓

---

## What to Fix Before Component 6

1. **Add toast notifications** — Replace console.error with toast
2. **Add loading skeletons** — Replace "Loading..." text
3. **Add error boundaries** — Catch rendering errors
4. **Test RLS policies** — Manually verify authorization
5. **Document APIs** — Add JSDoc comments to services

---

## Validation Sign-Off

When you've verified all checkboxes above, it's safe to move to Components 6+.

**Date Reviewed:** ___________
**Reviewer:** ___________
**Issues Found:** ___________
