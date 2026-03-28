# Noted

**You mention it. Noted builds it.**

Noted is an AI-powered calendar companion: when you have an idea, you mention it to the chat — it hears you out, updates your calendar, and your answer is *Noted.* That’s the name.

It turns natural-language descriptions into structured, editable weekly calendars. Instead of manually creating every time block, you describe the schedule you want and Noted generates it for you. You can then visually edit the calendar, refine it with follow-up prompts, and sync with Google Calendar.

---

## Features

- Generate weekly calendars from natural-language descriptions
- Upload an image of a schedule or timetable and have it converted to events
- Voice input via Web Speech API
- Visual weekly, daily, and monthly calendar views
- Drag-to-create, drag-to-move, and resize events
- Inline event editing with a detail panel and edit modal
- Right-click context menu for quick event actions
- Follow-up chat prompts to add, move, or remove events without starting over
- Recurring event support (e.g. "gym every weekday for 4 weeks")
- Google Calendar import with conflict resolution (merge or overwrite)
- Light and dark theme
- Secure authentication with Supabase (email/password and Google OAuth)
- Guest fallback via localStorage when no Supabase session exists

---

## Example Prompt

> Make me a weekly schedule for college. I have classes Monday and Wednesday from 10 AM to 2 PM, want to study 2 hours a day, go to the gym 4 times a week, keep Fridays lighter, and sleep by midnight.

Noted converts that into a structured weekly calendar inside the app.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| AI | OpenAI SDK — `gpt-4o-mini` (text), `gpt-4o` (image input) |
| State | React `useState` in-memory + `sessionStorage` |

---

## How It Works

1. The user enters a natural-language description or uploads a schedule image.
2. The request is sent to the Next.js API route with the current event context.
3. The API route calls OpenAI and returns structured JSON calendar actions.
4. The frontend parses the actions (add, delete, recurring) and updates the calendar.
5. The weekly schedule is rendered visually in the app.
6. The user can manually edit events or refine the schedule with another prompt.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A [Supabase](https://supabase.com/) project (for authentication)
- An [OpenAI](https://platform.openai.com/) API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/MarioEsquivelIII/Kronos.git
   cd Kronos
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
Kronos/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts        # OpenAI API route (AI layer)
│   │   ├── home/page.tsx            # Main experience: events state lives here
│   │   ├── login/page.tsx           # Email/password + Google OAuth sign-in
│   │   ├── signup/page.tsx          # Registration with email verification
│   │   ├── forgot-password/page.tsx # Password reset request
│   │   ├── reset-password/page.tsx  # Set new password
│   │   ├── account/page.tsx         # Profile, theme toggle, Google Calendar sync
│   │   └── auth/callback/page.tsx   # Supabase OAuth callback (client)
│   ├── components/
│   │   ├── WeekCalendar.tsx         # Week/day/month grid with drag/resize/create
│   │   ├── ComingUp.tsx             # Upcoming events list (home view)
│   │   ├── ChatBar.tsx              # Expandable chat UI with voice + image input
│   │   ├── EditEventModal.tsx       # Event editing modal
│   │   ├── EventContextMenu.tsx     # Right-click event actions
│   │   ├── EventDetailPanel.tsx     # Notion-style inline event editor
│   │   └── GoogleCalendarSyncFlow.tsx # Multi-step Google Calendar import dialog
│   ├── lib/
│   │   ├── events.ts               # CalendarEvent type + sample data
│   │   ├── chat.ts                  # Chat types + offline parse helpers
│   │   ├── gcalSync.ts             # Google Calendar fetch, parse, conflict resolution
│   │   └── theme.tsx               # Light/dark theme provider
│   ├── middleware.ts                # Supabase session refresh + route guards
│   └── utils/supabase/             # Supabase client/server/middleware helpers
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

*(The repository folder may still be named `Kronos` on disk; the product name is **Noted**.)*

---

## Deploying to Vercel

[Vercel](https://vercel.com) is the recommended host for this Next.js app: **API routes**, **middleware**, and **server-side auth** all work without the static-export limits of GitHub Pages.

### 1. Create a project

1. Push your repo to GitHub (or GitLab / Bitbucket).
2. In [Vercel](https://vercel.com/dashboard) → **Add New… → Project** → import the repository.

### 2. Set the app root (important)

This repo keeps the Next.js app inside the **`Kronos/`** folder. In the import screen, open **Root Directory** → **Edit** → set it to **`Kronos`** (not the repo root).  
If you skip this, builds will fail because `package.json` lives under `Kronos/`.

### 3. Configure build

- **Framework Preset:** Next.js (auto-detected).
- **Build Command:** `npm run build` (default).
- **Output:** Next.js default (no `output: 'export'`).

Do **not** set `STATIC_EXPORT` on Vercel. Leave **`NEXT_PUBLIC_BASE_PATH`** unset unless you deliberately serve the app under a subpath.

### 4. Environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | All |
| `OPENAI_API_KEY` | OpenAI API key (for `/api/chat`) | Production, Preview, Development |

Redeploy after saving variables (**Deployments → … → Redeploy**), or trigger a new deploy from a commit.

### 5. Supabase auth URLs

In **Supabase → Authentication → URL configuration**:

- **Site URL:** your production Vercel URL, e.g. `https://your-project.vercel.app` (or your custom domain).
- **Redirect URLs:** include at least:
  - `https://your-project.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (local dev)
  - Optional: `https://your-project-*.vercel.app/**` for **Preview** deployments (wildcard preview URLs), or add each preview URL as needed.

### 6. Google OAuth (optional)

If you use Google sign-in / Calendar: in **Google Cloud Console** OAuth client, **Authorized redirect URIs** must still include Supabase’s callback, e.g. `https://<project-ref>.supabase.co/auth/v1/callback` (unchanged). Your **app** URL on Vercel must be allowed in **Supabase** redirect URLs as above.

### 7. Deploy

Commit and push to your default branch, or click **Deploy** in the dashboard. Production URL: `https://<project>.vercel.app`.

---

## Deploying to GitHub Pages

The repo includes a workflow (`.github/workflows/deploy-github-pages.yml`) that builds a **static export** from the `Kronos/` directory and publishes it with **GitHub Actions**.

### One-time setup

1. In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**, add repository secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(optional)* `NEXT_PUBLIC_CHAT_API_URL` — full URL to a hosted chat API (see below). If omitted, the chat UI will call `/api/chat`, which **does not exist** on GitHub Pages static hosting.

3. In **Supabase → Authentication → URL configuration**, add the site URL and redirect URLs, e.g.  
   `https://<user>.github.io/<repo>/` and  
   `https://<user>.github.io/<repo>/auth/callback`  
   (For a **user/org site** whose repo is named `<name>.github.io`, the path has **no** extra `/repo` segment.)

4. Push to `main` (or run the workflow manually). The site appears at `https://<user>.github.io/<repo>/`.

### AI chat on static hosting

Static export **cannot** run `src/app/api/chat`. Options:

- Deploy the same app (or only the API route) on **Vercel** / another host and set `NEXT_PUBLIC_CHAT_API_URL` to that `/api/chat` URL, **or**
- Run `npm run dev` / `npm run build` + `npm start` locally or on Vercel for full stack (recommended for full features).

### Local static build

```bash
cd Kronos
NEXT_PUBLIC_BASE_PATH=/your-repo-name npm run build:gh-pages
```

Output is in `out/`. Use `NEXT_PUBLIC_BASE_PATH=` (empty) for a site root at `username.github.io`.

---

## Current Limitations

| Area | Status |
|---|---|
| Event persistence | In-memory + sessionStorage only. No database storage for events yet. |
| Google Calendar sync | Import flow is built; requires OAuth token from Supabase Google provider. |
| Recurring events | Supported via AI chat (expanded to individual events), no native recurrence rules. |
| Mobile optimization | Not yet optimized for mobile viewports. |

---

## Security Notes

- Do not commit `.env` — it is included in `.gitignore`.
- Keep API keys private.
- Supabase handles auth; the app falls back to localStorage for guest sessions.

---

## Author

Built by Mario A. Esquivel III.
