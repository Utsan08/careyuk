<div align="center">

# 🌿 CareYuk

**Care that comes full circle.**

Connecting volunteers with the clinics, Posyandu and communities across Jakarta that need them most — and turning every hour into verified healthcare experience.

</div>

---

## What it is

Community health posts and clinics in Jakarta are stretched thin: maternal check-ups, elderly screenings and health education go undone for want of hands. **CareYuk** closes that gap by matching willing volunteers — from high schoolers to med students — to the opportunities and neighbourhoods that need them, then verifying and crediting every hour they give.

It has **two sides**:

- **Volunteers** discover matched opportunities on a live map, apply, check in on-site with a QR scan, and build a verified care portfolio (hours + badges) that hospitals and universities can trust.
- **Organisations** post opportunities, review matched applicants, run live QR check-in, and track their community's health-score progress.

---

## Features

| Area | Highlights |
|---|---|
| **About / landing** | Cinematic scroll-driven story with a spinning-logo intro, blurry→sharp reveals, brightening green gradients, and a "skip to end" jump to sign-in |
| **Auth** | Email/password + Google OAuth (Supabase), role-based routing, profile-building onboarding |
| **Onboarding** | Role, field of study, **education level**, interests, and home **region** (the 5 Jakarta kota) |
| **Volunteer dashboard** (`/volunteer`) | Leaflet map (CARTO Positron) with matched opportunity pins, filters, apply flow, editable **profile** (avatar / education / interests), animated **portfolio timeline**, and **QR check-in** |
| **Org dashboard** (`/org`) | Post opportunities, review applicants (accept/reject), **live QR check-in**, and a community-health progress tracker |
| **Matching engine** | Weighted score — interest `0.30` + faculty/level `0.25` + proximity (Haversine) `0.25` + zone priority `0.10` + urgency `0.10`; level gating; templated `match_reason` with optional LLM polish |
| **On-site check-in** | Org shows a real QR (`qrcode`); volunteers scan it (`jsQR`, camera + manual fallback) → hours credited → badges evaluated |
| **Polish** | Themed error & 404 pages, smooth page/tab animations, and a fully **responsive** mobile layout |

---

## Tech stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4 · framer-motion (animation)
- **Backend:** Supabase (Auth + Postgres) via `@supabase/ssr`
- **Map:** Leaflet + CARTO Positron tiles
- **QR:** `qrcode` (generate) · `jsqr` (scan)
- **UI:** lucide-react · sonner · base-ui

---

## Getting started

```bash
# 1. install
npm install

# 2. add your environment variables (see below) into .env.local

# 3. run
npm run dev
```

Open **http://localhost:3000** — the app lands on the About page.

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

### Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server-only, keep secret
ANTHROPIC_API_KEY=<optional — enables the LLM match-reason polish>
```

> **Runs without them.** Every backend call degrades gracefully — with no keys set, the app runs in a self-contained **demo mode** (About intro, signup → dashboard, QR check-in, editable profile all work locally via `localStorage`). Real accounts, matching, and persistence come online once the keys and schema are in place.

---

## Backend setup (Supabase)

The app expects these tables: `user_auth`, `student`, `organization`, `events`, `participants`, `zones`, `badges`, `student_badges`.

Pending migrations to apply in the Supabase SQL editor:

```sql
-- volunteer education level (matcher level-gate)
alter table public.student add column if not exists education_level text;

-- volunteer profile picture
alter table public.student add column if not exists avatar_url text;

-- org's served region
alter table public.organization add column if not exists zone_id uuid references public.zones(zone_id);
```

Also create a **public `avatars` storage bucket** (owner-only write, public read) for profile pictures, and seed the `zones` table with the five Jakarta kota (`Jakarta Pusat / Utara / Barat / Selatan / Timur`). For Google login, enable the Google provider under Supabase → Auth → Providers and add `/auth/callback` to the allowed redirect URLs.

See [`supabase/migrations/`](supabase/migrations) for the versioned SQL.

---

## Project structure

```
app/
  about/            cinematic landing page
  login/            sign in (email + Google)
  signup/           profile-building onboarding
  volunteer/        volunteer dashboard (map, apply, profile, QR, timeline)
  org/              org dashboard (post, applicants, check-in, progress)
  api/              route handlers (auth, opportunities, checkin, portfolio, zones, profile…)
  error.tsx         themed error boundary
  not-found.tsx     themed 404
components/
  volunteer/        profile card, QR scanner, portfolio timeline, welcome tour
  org/              sidebar, tabs (post / applicants / check-in / progress)
  ui/               shared primitives
lib/
  matching.ts       weighted match engine (Haversine, level gate, match_reason)
  matchBlurb.ts     LLM polish for match reasons
  supabase/         browser / route / admin clients
  demoStore.ts      demo application state (localStorage, cross-tab)
  demoProfile.ts    demo profile (name/interests/education) for offline demo
  checkin.ts        demo verified-hours store
  org-api.ts        client seam that falls back to placeholders when the API is down
supabase/migrations/  versioned schema changes
```

---

## API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/signup` · `login` · `logout` · `GET session` | Auth |
| `POST /api/profile/complete` · `GET`/`PATCH /api/profile` | Profile create / read / edit |
| `GET /api/opportunities` | Matched feed for a volunteer (+ `match_score`, `match_reason`) |
| `GET`/`POST /api/applications` · `PATCH /api/applications/[id]` | Apply / decide |
| `POST /api/checkin` | Verify on-site attendance, credit hours, evaluate badges |
| `GET /api/portfolio/[volunteerId]` | Verified hours, sessions, badges |
| `GET /api/zones` · `GET /api/org/dashboard` · `GET /api/notifications` | Supporting data |

---

## Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com/new). Add the environment variables above under **Settings → Environment Variables** (`.env.local` is gitignored and won't ship). Vercel auto-deploys on every push to `main`.

---

## Acknowledgements

Parts of this project were built with the help of **Claude** (Anthropic's AI assistant) — used as a pair programmer across the frontend, animations, matching logic, and integration work.

---

<div align="center">

Built for GarudaHacks 7.0 💚 &nbsp;·&nbsp; CareYuk — care that comes full circle.

</div>
