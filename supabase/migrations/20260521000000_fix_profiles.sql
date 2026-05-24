-- ─────────────────────────────────────────────────────────────────────────────
-- Add missing focus-domain columns to profiles table
-- These columns are already referenced by useProfile.ts and focusStore.ts
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists streak integer not null default 0;
alter table public.profiles add column if not exists focus_score integer not null default 0;
alter table public.profiles add column if not exists total_sessions integer not null default 0;
alter table public.profiles add column if not exists total_focus_minutes integer not null default 0;
alter table public.profiles add column if not exists longest_streak integer not null default 0;

-- ── Ensure focus_sessions table exists with correct columns ──────────────────

create table if not exists public.focus_sessions (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references auth.users(id) on delete cascade not null,
    duration_minutes integer not null default 0,
    apps_avoided    integer not null default 0,
    xp_earned       integer not null default 0,
    focus_score     integer not null default 0,
    distraction_warnings integer not null default 0,
    started_at      timestamptz not null default now(),
    created_at      timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;

create policy "Users can read own sessions"
    on public.focus_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own sessions"
    on public.focus_sessions for insert with check (auth.uid() = user_id);

-- ── Ensure daily_logs table exists ───────────────────────────────────────────

create table if not exists public.daily_logs (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references auth.users(id) on delete cascade not null,
    date            date not null,
    focus_minutes   integer not null default 0,
    sessions_completed integer not null default 0,
    score           integer not null default 0,
    created_at      timestamptz not null default now(),
    unique(user_id, date)
);

alter table public.daily_logs enable row level security;

create policy "Users can read own daily_logs"
    on public.daily_logs for select using (auth.uid() = user_id);

create policy "Users can insert own daily_logs"
    on public.daily_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own daily_logs"
    on public.daily_logs for update using (auth.uid() = user_id);

-- ── Ensure daily_goals table exists ──────────────────────────────────────────

create table if not exists public.daily_goals (
    id              text primary key,
    user_id         uuid references auth.users(id) on delete cascade not null,
    text            text not null,
    completed       boolean not null default false,
    created_at      timestamptz not null default now()
);

alter table public.daily_goals enable row level security;

create policy "Users can read own goals"
    on public.daily_goals for select using (auth.uid() = user_id);

create policy "Users can insert own goals"
    on public.daily_goals for insert with check (auth.uid() = user_id);

create policy "Users can update own goals"
    on public.daily_goals for update using (auth.uid() = user_id);

create policy "Users can delete own goals"
    on public.daily_goals for delete using (auth.uid() = user_id);

-- ── Ensure achievements table exists ─────────────────────────────────────────

create table if not exists public.achievements (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references auth.users(id) on delete cascade not null,
    achievement_id  text not null,
    unlocked_at     timestamptz,
    created_at      timestamptz not null default now(),
    unique(user_id, achievement_id)
);

alter table public.achievements enable row level security;

create policy "Users can read own achievements"
    on public.achievements for select using (auth.uid() = user_id);

create policy "Users can insert own achievements"
    on public.achievements for insert with check (auth.uid() = user_id);
