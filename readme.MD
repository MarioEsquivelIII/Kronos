# Kronos

**Describe your schedule. Kronos builds it.**

Kronos is an AI-powered calendar builder that turns user-provided natural-language descriptions into structured, editable weekly calendars directly inside the application.

Instead of manually creating every time block yourself, you describe the schedule you want, and Kronos generates it for you. You can then visually edit the calendar, refine it with another prompt, and save it for later.

---

## Features

- Generate weekly calendars from natural-language descriptions
- Visual in-app weekly calendar view
- Drag, resize, edit, and delete events
- Add events manually
- Refine an existing calendar with follow-up prompts
- Save and reopen calendars
- Secure authentication with Supabase
- Structured AI schedule generation with validation

---

## Example Prompt

> Make me a weekly schedule for college. I have classes Monday and Wednesday from 10 AM to 2 PM, want to study 2 hours a day, go to the gym 4 times a week, keep Fridays lighter, and sleep by midnight.

Kronos converts that into a structured weekly calendar inside the app.

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API routes / server actions

### Database / Auth
- Supabase PostgreSQL
- Supabase Auth

### AI
- OpenAI or Anthropic
- Structured JSON output
- Zod validation for model responses

---

## How It Works

1. The user enters a natural-language description of the schedule they want.
2. Kronos sends the request to the backend.
3. The backend calls the LLM and asks it to return structured calendar event JSON.
4. The response is validated.
5. The calendar and events are saved to the database.
6. The weekly schedule is rendered visually in the app.
7. The user can manually edit events or refine the schedule with another prompt.

---

## Project Structure

```bash
KRONOS/
├── src/
├── supabase/
│   └── schema.sql
├── .env
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json

Validation and Reliability AI responses are validated before being saved or rendered. 
This helps ensure: correct JSON structure valid times required fields are present safer rendering in the UI 

Future Improvements Google Calendar integration smarter conflict resolution recurring habit templates reminders and notifications mobile optimization schedule analytics multi-calendar support Security Notes Do not commit .env Keep API keys private Use Supabase row-level security to protect user data License This project is for educational and prototype purposes unless otherwise specified. 

Author Built by Mario A. Esquivel III.
