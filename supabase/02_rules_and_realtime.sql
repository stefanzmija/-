-- =====================================================================
--  02_rules_and_realtime.sql — RUN THIS in Supabase → SQL Editor
--
--  Safe to run more than once. It:
--    1. lets students see staff names on replies
--    2. stops anyone from making themselves admin
--    3. locks down what students can change on a ticket
--    4. reopens a "waiting for student" ticket when the student replies
--    5. turns on Realtime for tickets + comments (live updates)
-- =====================================================================

-- keep the helper schema-qualified (older version had no search_path)
create or replace function public.current_role_of_user()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- ---------------------------------------------------------------------
-- 1. profiles: who can read whom
--    own profile + all staff/admin profiles (so students see who replied),
--    staff/admin read everyone (names + index on tickets)
-- ---------------------------------------------------------------------
drop policy if exists "read own or staff reads all" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or role in ('staff', 'admin')
    or public.current_role_of_user() in ('staff', 'admin')
  );


-- ---------------------------------------------------------------------
-- 2. only admins may change roles
--    Without this, the "update own" policy would let a student run
--    update profiles set role = 'admin' where id = auth.uid()
--    auth.uid() is null in the SQL editor, so you can still promote
--    yourself from here:  update profiles set role = 'admin' where ...
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(public.current_role_of_user()::text, '') <> 'admin' then
    raise exception 'Само администратор може да менува улоги.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();


-- ---------------------------------------------------------------------
-- 3. tickets: update policies + rules for students
-- ---------------------------------------------------------------------
drop policy if exists "owner or staff updates" on public.tickets;
drop policy if exists "staff updates any ticket" on public.tickets;
drop policy if exists "student updates own ticket" on public.tickets;
drop policy if exists "tickets_update_staff" on public.tickets;
drop policy if exists "tickets_update_owner" on public.tickets;

create policy "tickets_update_staff" on public.tickets
  for update to authenticated
  using (public.current_role_of_user() in ('staff', 'admin'));

create policy "tickets_update_owner" on public.tickets
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- RLS decides WHICH rows; this trigger decides WHAT a student may change
create or replace function public.enforce_ticket_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_student boolean :=
    auth.uid() is not null
    and coalesce(public.current_role_of_user()::text, 'student') = 'student';
begin
  if tg_op = 'INSERT' then
    if is_student then
      new.status      := 'open';   -- a new ticket always starts open
      new.assigned_to := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if is_student then
    if new.assigned_to is distinct from old.assigned_to
       or new.priority is distinct from old.priority
       or new.created_by is distinct from old.created_by
       or new.category_id is distinct from old.category_id then
      raise exception 'Студентите не можат да го менуваат ова поле.';
    end if;

    -- allowed: close/withdraw own ticket, or reply to "waiting_student" (see trigger 4)
    if new.status is distinct from old.status
       and not (new.status = 'closed'
                or (old.status = 'waiting_student' and new.status = 'in_progress')) then
      raise exception 'Студентите не можат да го менуваат статусот.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- remove the earlier version of this trigger if it exists
drop trigger if exists tickets_before_update on public.tickets;
drop function if exists public.enforce_status_rules();

drop trigger if exists tickets_enforce_rules on public.tickets;
create trigger tickets_enforce_rules
  before insert or update on public.tickets
  for each row execute function public.enforce_ticket_rules();


-- ---------------------------------------------------------------------
-- 4. a new comment bumps updated_at, and a student's reply moves
--    "waiting_student" back to "in_progress"
-- ---------------------------------------------------------------------
create or replace function public.on_comment_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets
     set status = case
                    when status = 'waiting_student' and created_by = new.author_id
                      then 'in_progress'::public.ticket_status
                    else status
                  end
   where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists ticket_comments_after_insert on public.ticket_comments;
create trigger ticket_comments_after_insert
  after insert on public.ticket_comments
  for each row execute function public.on_comment_inserted();


-- ---------------------------------------------------------------------
-- 5. Realtime: broadcast changes so open pages refresh by themselves
--    (RLS still applies — students only receive their own tickets)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets') then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_comments') then
    alter publication supabase_realtime add table public.ticket_comments;
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. (optional) make yourself admin — replace the index with yours
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin' where student_index = '241156';
