# Israel News

English-language Israeli news aggregator MVP. The homepage is a mobile-first live feed of **headlines and short summaries** — not full articles.

This version runs on **sample stories** in the repo. No Supabase credentials, auth, or payments are required.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- In-repo mock data with types that match a future `articles` table
- Optional schema: `supabase/schema.sql` (for later)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## What you can do

- Browse the live feed
- Filter by category
- Open a story for source, original time, and outbound link
- Preview empty / loading / error states:
  - [/demo/empty](http://localhost:3000/demo/empty)
  - [/demo/loading](http://localhost:3000/demo/loading)
  - [/demo/error](http://localhost:3000/demo/error)

## Project layout

- `lib/types.ts` — article, category, importance
- `lib/mock-articles.ts` — sample feed
- `lib/articles.ts` — read/sort helpers (swap for Supabase later)
- `components/` — card, badge, category filter, nav, empty/loading/error
- `app/` — homepage, article page, demo state routes
- `supabase/schema.sql` — planned Postgres schema

## Importance labels

UI labels only: **BREAKING** (red), **MAJOR** (orange), **UPDATE** (yellow), **OTHER** (gray).
