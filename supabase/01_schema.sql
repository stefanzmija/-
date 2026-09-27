-- =====================================================================
--  01_schema.sql — tables, enums, seed data, base RLS
--
--  Already applied on the existing project. Kept here so a fresh
--  Supabase project can be set up from scratch:
--    run 01_schema.sql, then 02_rules_and_realtime.sql
-- =====================================================================

-- ---------- enums ----------
create type public.user_role       as enum ('student', 'staff', 'admin');
create type public.ticket_status   as enum ('open', 'in_progress', 'waiting_student', 'resolved', 'closed', 'rejected');
create type public.ticket_priority as enum ('low', 'normal', 'high');

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  student_index text,                           -- e.g. 221234, null for staff
  role          public.user_role not null default 'student',
  created_at    timestamptz not null default now()
);

-- every new auth user gets a profile, filled from the sign-up metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, student_index)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'student_index'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table public.categories (
  id   serial primary key,
  name text not null unique
);

insert into public.categories (name) values
  ('Потврда за редовен студент'),
  ('Запишување / заверка на семестар'),
  ('Пријава на испит'),
  ('Уверение за положени испити'),
  ('Промена на лични податоци'),
  ('Исписување / мирување'),
  ('Финансии'),
  ('Друго');

-- ---------- tickets ----------
create table public.tickets (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text not null,
  category_id int references public.categories (id),
  status      public.ticket_status   not null default 'open',
  priority    public.ticket_priority not null default 'normal',
  created_by  uuid not null references public.profiles (id),
  assigned_to uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- comments ----------
create table public.ticket_comments (
  id         bigint generated always as identity primary key,
  ticket_id  bigint not null references public.tickets (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_comments enable row level security;

-- role of the logged-in user; security definer so it can read profiles without recursing into RLS
create or replace function public.current_role_of_user()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "read categories" on public.categories
  for select using (true);
create policy "admin manages categories" on public.categories
  for all using (public.current_role_of_user() = 'admin');

create policy "update own" on public.profiles
  for update using (id = auth.uid());
create policy "admin updates any" on public.profiles
  for update using (public.current_role_of_user() = 'admin');

create policy "student sees own, staff sees all" on public.tickets
  for select using (created_by = auth.uid() or public.current_role_of_user() in ('staff', 'admin'));
create policy "student creates own" on public.tickets
  for insert with check (created_by = auth.uid());

-- comments are visible when their ticket is visible (the tickets policy filters the subquery)
create policy "see comments of visible tickets" on public.ticket_comments
  for select using (exists (select 1 from public.tickets t where t.id = ticket_id));
create policy "comment on visible tickets" on public.ticket_comments
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.tickets t where t.id = ticket_id)
  );

-- profile SELECT and ticket UPDATE policies live in 02_rules_and_realtime.sql
