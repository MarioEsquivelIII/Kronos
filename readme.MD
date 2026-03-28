# Noted

**You name it. Noted builds it.**

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
│   │   └── auth/callback/route.ts   # Supabase OAuth callback
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
