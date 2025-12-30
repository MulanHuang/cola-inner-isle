create table if not exists public.users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  history_meta jsonb default '{}'::jsonb,
  record_meta jsonb default '{}'::jsonb
);
