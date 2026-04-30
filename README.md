# Lineup & Position Manager

A web app for youth baseball and softball coaches to plan lineups and manage position rotations with built-in fairness recommendations and safety rules.

## Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Create a `.env` file based on `.env.example` with your Supabase credentials
4. Start the dev server: `pnpm dev`

## Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` in order
3. (Optional) Seed demo data with `supabase/seed.sql`
4. Enable RLS on all tables

## Build Order

1. ✅ Supabase schema & seed data
2. Auth + team setup + roster CRUD
3. Game list and creation
4. Attendance toggle UI
5. Desktop lineup grid
6. Equity engine + warnings
7. Safety rules engine
8. Season equity dashboard
9. Mobile in-game view
10. Real-time sync
11. Print/export
12. PWA wrapper
