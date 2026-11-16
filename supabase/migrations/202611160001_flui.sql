-- FLUI v1. Apply to a NEW Supabase project, before exposing the frontend.
begin;
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 1 and 240),
 done boolean not null default false,
 priority text not null default 'normal' check (priority in ('low','normal','high')),
 due_date date,
 parent_id uuid,
 created_at timestamptz not null default now(),
 unique(id,user_id),
 constraint own_parent foreign key (parent_id,user_id) references public.tasks(id,user_id) on delete cascade,
 check (parent_id is distinct from id)
);
-- Single level of subtasks, no cycles; parent cannot become a child later.
create function public.validate_task_parent() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.parent_id is not null and exists(select 1 from public.tasks t where t.id=new.parent_id and t.user_id=new.user_id and t.parent_id is not null) then
  raise exception 'Uma subtarefa deve pertencer a uma tarefa principal.';
 end if;
 if new.parent_id is not null and exists(select 1 from public.tasks t where t.parent_id=new.id and t.user_id=new.user_id) then
  raise exception 'Uma tarefa com subtarefas não pode virar subtarefa.';
 end if;
 return new;
end $$;
create trigger validate_task_parent before insert or update on public.tasks for each row execute function public.validate_task_parent();
create table public.notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(btrim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create table public.habits (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(btrim(title)) between 1 and 240),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.habit_checkins (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 habit_id uuid not null,
 day date not null,
 created_at timestamptz not null default now(),
 unique(habit_id,day),
 constraint own_habit foreign key(habit_id,user_id) references public.habits(id,user_id) on delete cascade
);
create table public.focus_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 duration_seconds integer not null check(duration_seconds between 60 and 10800),
 created_at timestamptz not null default now()
);
do $$
declare tbl text;
begin
 foreach tbl in array array['tasks','notes','habits','habit_checkins','focus_sessions'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from anon, authenticated',tbl);
  execute format('grant select, insert, update, delete on public.%I to authenticated',tbl);
  execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)',tbl);
  execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',tbl);
  execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',tbl);
  execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',tbl);
  execute format('create index on public.%I (user_id,created_at)',tbl);
 end loop;
end $$;
create index tasks_parent_idx on public.tasks(parent_id,user_id);
create index habit_checkins_habit_idx on public.habit_checkins(habit_id,user_id);
commit;
