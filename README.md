# Студентска служба · ФИНКИ

Ticketing system for FINKI's student services office. Students file requests
(потврди, заверка на семестар, пријава на испит…) and follow them online; staff
(референти) pick them up, reply, and change their status.

Course project for **Интернет програмирање на клиентска страна**.

**Stack:** Angular 22 (standalone components, signals, zoneless) · Tailwind CSS v4 ·
Supabase (Postgres, Auth, Row Level Security, Realtime)

## Features

| Student | Staff (референт) | Admin |
|---|---|---|
| Register / log in with student index | Dashboard of all tickets | Everything staff can do |
| Create a ticket (category, priority) | Filter: unassigned, mine, priority, category | Manage user roles |
| See own tickets and their status | Take over (assign to self) | |
| Conversation with the office | Change status and priority | |
| Withdraw / close own ticket | Reply to students | |

- Live updates via Supabase Realtime: lists and conversations refresh on their own
- Access rules live in the database (RLS + triggers), not just in the UI
- Keyboard shortcuts: `/` search, `N` new ticket, `Ctrl+Enter` send

## Setup

1. **Supabase** → SQL Editor, run in order:
   - `supabase/01_schema.sql` — tables, enums, categories, base policies (fresh project only)
   - `supabase/02_rules_and_realtime.sql` — role protection, student rules, Realtime
2. **Authentication → Providers → Email**: turn off *Confirm email* for development.
3. Put your project URL and **anon** key in `src/environments/environment.ts`.
   (The anon key is meant to be public; RLS protects the data. Never commit the `service_role` key.)
4. Install and run:
   ```bash
   npm install
   npm start
   ```
5. Register, then promote yourself in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where student_index = '<your index>';
   ```

## Project structure

```
src/app/
  core/       auth + profiles + toast services, guards, models
  layout/     navbar, footer
  shared/     icon, avatar, status badge, priority icon, relative-time pipe, toaster
  features/
    home/  contact/  page404/
    auth/     login, register, shared split layout
    tickets/  list (student + staff), create, detail, tickets.service
    admin/    users (role management)
supabase/     SQL for the database
```
