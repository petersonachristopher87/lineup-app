# Claude Code Extension Integration Guide

## What is Claude Code Extension?

Claude in VS Code allows AI-assisted development directly in your editor. There are a few ways to use Claude with this codebase:

1. **Claude in VS Code (Copilot)** — GitHub Copilot integration
2. **Claude AI Chat Extension** — Separate extension for chat/code generation
3. **Custom MCP (Model Context Protocol)** — Advanced: route Claude through specialized servers

---

## Option 1: Use GitHub Copilot (Recommended for Most)

### Setup

1. **Install Copilot Extension:**
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X)
   - Search "GitHub Copilot"
   - Install (requires GitHub Copilot subscription)

2. **Open the Codebase:**
   ```bash
   cd /Users/christinepeterson/Desktop/petersonbuild/lineup-app
   code .
   ```

3. **Copilot will index your project** — Takes ~30 seconds on first load

### How to Use with This Project

**For understanding code:**
```
Open a file → Cmd+I → Ask:
  "Explain how useLineup hook works"
  "What does attendanceService.ts do?"
  "Walk me through the RLS policy for games table"
```

**For code generation:**
```
Highlight a component → Cmd+I → Ask:
  "Add error boundary to this page"
  "Add loading skeleton loaders"
  "Generate test cases for equityEngine"
```

**For explaining architecture:**
```
Cmd+I (chat) → Ask:
  "Explain the data flow from LoginPage to LineupGridPage"
  "What are the main differences between RLS policies?"
  "How does the position assignment system work?"
```

**For finding bugs:**
```
Cmd+I → Ask:
  "Find potential N+1 queries in this file"
  "Are there any TypeScript errors I should fix?"
  "What security issues do you see in authService?"
```

---

## Option 2: Claude AI Chat Extension (Custom)

If you want to use Claude directly (not GitHub Copilot):

### Setup

1. **Install from VS Code Extensions:**
   - Search "Claude" in extensions
   - Look for official Anthropic extension (if available)
   - Or use **"Continue.dev"** (free, supports Claude API)

2. **Get Claude API Key:**
   - Go to claude.ai/api
   - Generate API key
   - Paste into VS Code extension settings

3. **Configure for This Project:**
   - Create `.claude/config.json` in project root:
   ```json
   {
     "codebaseContext": {
       "ignore": ["node_modules", "dist", ".git"],
       "maxTokens": 8000,
       "includeTests": false
     },
     "tools": ["codeSearch", "fileRead", "fileWrite"]
   }
   ```

### Using Claude Chat

**Ask questions about the project:**
```
"What's the architecture of the attendance system?"
"How do I add a new service? Walk me through an example."
"Explain the level templates system"
```

**Generate code:**
```
"Create a new hook called useEquityWarnings that tracks season playing time"
"Write the equityEngine.ts file based on the spec"
"Generate TypeScript types for the equity calculation system"
```

**Get help with components:**
```
"What should Component 6 (Equity Engine) look like?"
"Generate the starter code for the safety rules engine"
"Create the equity sidebar component"
```

---

## Option 3: Create `.instructions.md` for Claude (Advanced)

This allows you to give Claude long-form context about your project for better responses.

### Create `.instructions.md`

```bash
cd /Users/christinepeterson/Desktop/petersonbuild/lineup-app
cat > .instructions.md << 'EOF'
# Lineup Manager Development Guide

## Project Overview
Youth baseball/softball lineup planning app with equity tracking and safety rules.
Built with React 18, TypeScript, Supabase, Tailwind CSS.

## Architecture

### Data Model
- Teams: created by head coach, multiple sports/levels
- Players: roster per team, positions, restrictions
- Games: per team, opponent, date, innings
- Lineups: batting order per game
- Position Assignments: player position per inning
- Pitch Log: track pitcher safety rules

### Key Patterns
1. **Services** (src/lib/supabase/*Service.ts) — Supabase wrappers
2. **Hooks** (src/hooks/*) — React Query + mutations
3. **Pages** (src/pages/*) — Route components
4. **Router** (src/lib/router.tsx) — Protected routes

### Components Done
1. ✅ Supabase schema + RLS + seed data
2. ✅ Auth (magic link) + team setup + roster CRUD
3. ✅ Game list + creation
4. ✅ Attendance UI
5. ✅ Desktop lineup grid (core)

### Components TODO
6. Equity engine + warnings
7. Safety rules (pitch count) + hard blocks
8. Season equity dashboard
9. Mobile in-game view
10. Real-time sync
11. Print/export
12. PWA

## Code Standards
- TypeScript strict mode
- React Query for server state
- Zod for validation (setup, not yet used)
- Tailwind for styling
- No component libraries yet (using plain HTML)

## Common Tasks

### Add a new service
1. Create src/lib/supabase/newService.ts
2. Export functions (query + mutations)
3. Create src/hooks/useNew.ts with React Query hooks
4. Import in pages and use

### Add a new page
1. Create src/pages/NewPage.tsx
2. Add route in src/lib/router.tsx
3. Use hooks to fetch data
4. Add navigation link

### Add a new database table
1. Create migration in supabase/migrations/XXX_name.sql
2. Add RLS policies
3. Update src/types/supabase.ts
4. Create service layer
5. Create hooks

## Spec Reference
See: /Users/christinepeterson/Desktop/petersonbuild/Project Lineup VS Code/lineup-app-spec_1.md

## Level Templates
- Single-A: coach pitch, continuous batting, high equity
- AA: kid pitch, continuous batting, high equity
- AAA: kid pitch, continuous batting, medium equity
- Coast/Majors: standard 9-batter order, low equity, specialization

## Safety Rules
Little League pitch counts (hard blocks):
- 7-8yrs: max 50 pitches/day
- 9-10yrs: max 75 pitches/day
- 11-12yrs: max 85 pitches/day

Rest day ladder (based on pitches thrown):
- 1-20: 0 days rest
- 21-35: 1 day rest
- 36-50: 2 days rest
- 51-65: 3 days rest
- 66+: 4 days rest

## Equity Tracking
Per-season per-player:
- Total innings by category (battery/infield/outfield/bench)
- Pitch count if pitcher
- Batting order positions occupied
- Benching streaks (warn if 2+ consecutive)
- Same position streaks (warn if 3+ consecutive)

Weights (low/medium/high) modulate which warnings fire.

## Realtime Updates
Supabase channels set up in services (not yet consumed in UI):
- attendance:gameId
- lineup:gameId
- positions:gameId
- Show "X coaches editing" indicator

## Next Steps
1. Review foundation (FOUNDATION_REVIEW.md)
2. Test Components 1-5 end-to-end
3. Build Component 6: Equity Engine
4. Build Component 7: Safety Rules Engine
5. Deploy to staging

## Useful URLs
- Supabase Dashboard: [your-project].supabase.co
- Spec Document: /Users/christinepeterson/Desktop/petersonbuild/Project Lineup VS Code/lineup-app-spec_1.md
- Build Order: FOUNDATION_REVIEW.md
EOF
```

Then Claude can reference this with:
```
@.instructions.md — tells Claude to look at your instructions file
```

---

## Option 4: Move to VS Code Workspace

### Create Workspace File

```bash
cat > /Users/christinepeterson/Desktop/petersonbuild/lineup-workspace.code-workspace << 'EOF'
{
  "folders": [
    {
      "path": "lineup-app",
      "name": "Lineup Manager"
    },
    {
      "path": "Project Lineup VS Code",
      "name": "Spec & Docs"
    }
  ],
  "settings": {
    "typescript.tsdk": "lineup-app/node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true
    },
    "[json]": {
      "editor.formatOnSave": true
    }
  },
  "extensions": {
    "recommendations": [
      "GitHub.copilot",
      "GitHub.copilot-chat",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "dsznajder.es7-react-js-snippets"
    ]
  }
}
EOF
```

Then open it:
```bash
code /Users/christinepeterson/Desktop/petersonbuild/lineup-workspace.code-workspace
```

---

## Best Practices for Claude Development

### 1. Give Claude Context
```
"I'm building a lineup planner for youth baseball.
The spec is in /Users/christinepeterson/Desktop/petersonbuild/Project Lineup VS Code/lineup-app-spec_1.md

I've completed components 1-5. Now I need to build Component 6: Equity Engine.

The equity engine should:
- Track season innings by position category
- Show warnings (yellow) if player hasn't played certain positions
- Modulate warnings based on team settings weights

Here's the interface I want:
interface EquityWarning {
  playerId: string
  type: 'bench_streak' | 'position_repeat' | 'category_gap' | 'playing_time_gap'
  inning: number
  severity: 'warning' | 'info'
  message: string
}

Can you generate the equityEngine.ts service?"
```

### 2. Ask for Patterns
```
"Show me how to structure the Component 6 files following the pattern of Component 2
(service → hook → page). Use the same patterns."
```

### 3. Ask for Tests
```
"Generate test cases for equityEngine.ts that cover:
- Player with zero infield innings warning
- Bench streak detection
- Position repeat detection
- Weights filtering warnings"
```

### 4. Ask for Refactoring
```
"The LineupGridPage.tsx is getting large. How should I split it into smaller components?
Show me the component tree and which props each needs."
```

### 5. Ask for Bug Fixes
```
"I'm getting a TypeScript error in LineupGridPage.tsx line 45.
Here's the code: [paste code]
What's wrong and how do I fix it?"
```

---

## Workflow Suggestion

### Week 1: Review & Test
1. Open workspace in VS Code
2. Use Copilot to review Components 1-5
3. Manually test auth → game → attendance → lineup flow
4. Document findings

### Week 2: Component 6 (Equity)
1. Ask Copilot to generate equityEngine.ts
2. Ask for EquitySidebar component
3. Integrate into LineupGridPage

### Week 3: Component 7 (Safety)
1. Ask Copilot to generate safetyRulesEngine.ts
2. Integrate pitch count validation
3. Add hard block UI (red warnings)

### Week 4: Polish & Deploy
1. Add error handling (toast notifications)
2. Add loading skeletons
3. Test thoroughly
4. Deploy to Vercel

---

## Troubleshooting Claude Responses

**If Claude doesn't understand context:**
```
"Read this file and summarize it: @src/lib/supabase/lineupService.ts"
```

**If Claude's code has TS errors:**
```
"I'm getting a TypeScript error. Can you fix it?
Error: Type 'string | undefined' is not assignable to type 'string'"
```

**If Claude creates code not matching your patterns:**
```
"This doesn't follow the pattern. 
Look at src/hooks/useTeams.ts for the pattern, then regenerate useEquity.ts the same way."
```

---

## Quick Start

**Right now, today:**

1. Open VS Code:
   ```bash
   code /Users/christinepeterson/Desktop/petersonbuild/lineup-app
   ```

2. Install Copilot extension

3. Ask Copilot:
   ```
   "Summarize the architecture of this project in 5 bullet points"
   ```

4. Tell me what it says, and we can adjust from there!

