# CLAUDE.md — Kronos

> AI-assisted weekly calendar app. "Describe your schedule. Kronos builds it."
> Author: Mario A. Esquivel III | Hackathon prototype

---

## Hackathon focus & Claude behavior

**Active priorities (in rough order):**
1. Fixing bugs & polish
2. Adding new features
3. Supabase persistence for events
4. AI/chat improvements

**Scope rule — STRICT:** Only touch files and logic directly related to what was asked. Do not refactor nearby code, rename things, reorganize imports, or "clean up" anything that wasn't part of the request. If a change in an adjacent area is genuinely required to complete the task, call it out explicitly before making it.

---

## Project overview

Kronos lets users describe their schedule in natural language (and optionally attach a photo), then generates a structured, editable weekly calendar from that input. Users can follow up in chat to add, move, or remove events without starting over.

---

## Repo layout

```
Kronos/                          ← app root (run all commands from here)
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts    ← OpenAI API route (core AI layer)
│   │   ├── home/page.tsx        ← main experience: events state lives here
│   │   ├── login/ signup/ …     ← auth pages
│   │   └── account/page.tsx     ← profile + account deletion
│   ├── components/
│   │   ├── WeekCalendar.*       ← week grid with drag/resize/add
│   │   ├── ComingUp.*           ← home view upcoming events list
│   │   ├── ChatBar.*            ← expandable chat UI
│   │   ├── EditEventModal.*     ← event editing
│   │   └── EventContextMenu.*   ← right-click / long-press actions
│   ├── lib/
│   │   ├── events.ts            ← CalendarEvent type + sampleEvents
│   │   ├── chat.ts              ← ChatMessage types, offline parse helpers
│   │   └── theme.tsx            ← light/dark theme (localStorage: kronos_theme)
│   ├── middleware.ts             ← Supabase session refresh + route guards
│   └── utils/supabase/          ← Supabase client/server/middleware helpers
├── public/
└── package.json
```

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth + DB | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| AI | OpenAI SDK — `gpt-4o-mini` (text), `gpt-4o` (image input) |
| State | React `useState` in `home/page.tsx` (in-memory, not persisted) |

---

## Core data model (`src/lib/events.ts`)

```ts
type EventColor = "blue" | "green" | "red" | "purple" | "orange" | "pink" | "yellow" | "teal";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM (24h)
  endTime: string;     // HH:MM (24h)
  color: EventColor;
  allDay?: boolean;
}
```

Events are initialized from `sampleEvents` on page load. **There is no database persistence for events yet** — all state lives in React memory.

---

## AI layer (`src/app/api/chat/route.ts`)

The API route receives `{ message, events, imageBase64? }` and returns a streamed or JSON response containing an `actions` block.

### Action format the model must return

```json
{
  "actions": [
    {
      "type": "add",
      "event": {
        "id": "unique-id",
        "title": "Team standup",
        "date": "2026-03-30",
        "startTime": "09:00",
        "endTime": "09:30",
        "color": "blue"
      }
    },
    {
      "type": "delete",
      "eventId": "existing-id"
    }
  ]
}
```

- The client in `home/page.tsx` parses this with a regex looking for a fenced JSON block.
- **Move = delete + add** (no dedicated move action type).
- Model selection: `gpt-4o-mini` by default; switches to `gpt-4o` when `imageBase64` is present.

---

## Auth & session model

- Supabase handles auth. Middleware (`src/middleware.ts`) refreshes the session and redirects unauthenticated users away from protected routes.
- **Fallback path:** when no Supabase session exists, the app reads/writes `localStorage` key `kronos_user` for a lightweight guest user object.
- Protected routes: everything except `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/`, and API routes.
- Account page uses `supabase.auth.updateUser()` and mirrors changes to `localStorage` for the fallback path.

---

## Known gaps & gotchas

| Area | Status |
|---|---|
| Event persistence | ❌ In-memory only. `kronos_events` key in localStorage/Supabase is referenced in account deletion but never written on save. |
| Zod validation | ❌ README mentions it; not in `package.json`. Don't add unless scoped. |
| Anthropic SDK | ❌ README mentions it; only OpenAI is used in code. |
| ESLint | ⚠️ ESLint 9 expects a flat config (`eslint.config.*`). `npm run lint` may fail. |
| Recurring events | ❌ Not implemented. |
| Google Calendar sync | ❌ Not implemented. |

---

## Development commands

```bash
# from Kronos/ directory
npm install
npm run dev       # starts on http://localhost:3000
npm run build
npm run lint      # may need eslint flat config fix first
```

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

Place in `Kronos/.env.local`. Never commit this file.

---

## Coding conventions

- **TypeScript everywhere.** No `any` unless absolutely unavoidable; prefer explicit types.
- **Tailwind for all styling.** No inline `style={{}}` objects except for dynamic values (e.g. computed pixel heights in the calendar grid).
- **Server vs client components:** API routes and Supabase server helpers are server-only. Calendar UI components are all client (`"use client"`).
- **Event IDs:** generate with `crypto.randomUUID()` or a timestamp-based string. Keep IDs stable once created.
- **Date/time format:** always `YYYY-MM-DD` for dates and `HH:MM` (24-hour) for times. Do not use 12-hour strings in data — only in display labels.
- **Color values:** must be one of the `EventColor` enum values. Don't pass raw hex to events.

---

## What to keep in mind when making changes

1. **Events state lives in `home/page.tsx`.** Pass events and setters down as props — don't reach into parent state from deep components.
2. **The AI action parser uses regex on a fenced JSON block.** If you change the response format in the API route, update the client parser too.
3. **Supabase clients differ by context.** Use `createClient` from `utils/supabase/server.ts` in Server Components / API routes, and `utils/supabase/client.ts` in client components.
4. **`sampleEvents` is demo data.** It's a good reference for the expected shape but shouldn't be treated as real user data.
5. **The fallback localStorage user is not a Supabase user.** Don't call Supabase user APIs on it — check for session first.
