create or replace function public.current_role_of_user()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "read own or staff reads all" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or role in ('staff', 'admin')
    or public.current_role_of_user() in ('staff', 'admin')
  );

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
      new.status      := 'open';
      new.assigned_to := null;
    end if;
    return new;
  end if;


  if is_student then
    if new.assigned_to is distinct from old.assigned_to
       or new.priority is distinct from old.priority
       or new.created_by is distinct from old.created_by
       or new.category_id is distinct from old.category_id then
      raise exception 'Студентите не можат да го менуваат ова поле.';
    end if;

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

drop trigger if exists tickets_before_update on public.tickets;
drop function if exists public.enforce_status_rules();

drop trigger if exists tickets_enforce_rules on public.tickets;
create trigger tickets_enforce_rules
  before insert or update on public.tickets
  for each row execute function public.enforce_ticket_rules();


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
