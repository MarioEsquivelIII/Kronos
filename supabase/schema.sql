-- Fortress Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Calendars table
create table public.calendars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'My Calendar',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events table
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references public.calendars(id) on delete cascade not null,
  title text not null,
  day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time text not null,
  end_time text not null,
  category text not null default 'Personal',
  description text,
  source_type text not null default 'ai' check (source_type in ('ai', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Revisions table (tracks AI generation history)
create table public.revisions (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references public.calendars(id) on delete cascade not null,
  prompt_used text not null,
  model_response_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_calendars_user_id on public.calendars(user_id);
create index idx_events_calendar_id on public.events(calendar_id);
create index idx_revisions_calendar_id on public.revisions(calendar_id);

-- Row Level Security
alter table public.calendars enable row level security;
alter table public.events enable row level security;
alter table public.revisions enable row level security;

-- Calendars: users can only access their own
create policy "Users can view own calendars"
  on public.calendars for select
  using (auth.uid() = user_id);

create policy "Users can create own calendars"
  on public.calendars for insert
  with check (auth.uid() = user_id);

create policy "Users can update own calendars"
  on public.calendars for update
  using (auth.uid() = user_id);

create policy "Users can delete own calendars"
  on public.calendars for delete
  using (auth.uid() = user_id);

-- Events: users can access events on their calendars
create policy "Users can view own events"
  on public.events for select
  using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

create policy "Users can create events on own calendars"
  on public.events for insert
  with check (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

create policy "Users can update own events"
  on public.events for update
  using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

create policy "Users can delete own events"
  on public.events for delete
  using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

-- Revisions: users can access revisions on their calendars
create policy "Users can view own revisions"
  on public.revisions for select
  using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

create policy "Users can create revisions on own calendars"
  on public.revisions for insert
  with check (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
    )
  );

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger calendars_updated_at
  before update on public.calendars
  for each row execute function public.update_updated_at();

create trigger events_updated_at
  before update on public.events
  for each row execute function public.update_updated_at();
