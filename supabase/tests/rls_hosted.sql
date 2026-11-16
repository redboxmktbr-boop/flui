-- Runs against the deployed Supabase project. All fixtures roll back.
begin;
do $$
declare
 alice uuid := gen_random_uuid(); bob uuid := gen_random_uuid();
 alice_task uuid := gen_random_uuid(); bob_task uuid := gen_random_uuid();
 alice_habit uuid := gen_random_uuid(); bob_habit uuid := gen_random_uuid();
 tbl text; total integer; denied boolean;
begin
 insert into auth.users(id) values(alice),(bob);
 insert into public.tasks(id,user_id,title) values(alice_task,alice,'RLS test A'),(bob_task,bob,'RLS test B');
 insert into public.notes(user_id,body) values(alice,'A'),(bob,'B');
 insert into public.habits(id,user_id,title) values(alice_habit,alice,'A'),(bob_habit,bob,'B');
 insert into public.habit_checkins(user_id,habit_id,day) values(alice,alice_habit,current_date),(bob,bob_habit,current_date);
 insert into public.focus_sessions(user_id,duration_seconds) values(alice,300),(bob,300);
 perform set_config('request.jwt.claim.sub',alice::text,true);
 set local role authenticated;
 foreach tbl in array array['tasks','notes','habits','habit_checkins','focus_sessions'] loop
  execute format('select count(*) from public.%I',tbl) into total;
  if total <> 1 then raise exception 'Isolation failed for %: % rows',tbl,total; end if;
 end loop;
 update public.tasks set title='Own update' where id=alice_task;
 if not found then raise exception 'Own update failed'; end if;
 update public.tasks set title='Foreign update' where id=bob_task;
 if found then raise exception 'Cross-user update permitted'; end if;
 delete from public.tasks where id=bob_task;
 if found then raise exception 'Cross-user delete permitted'; end if;
 denied := false;
 begin
  insert into public.notes(user_id,body) values(bob,'Spoof');
 exception when insufficient_privilege then denied := true;
 end;
 if not denied then raise exception 'Cross-user insert permitted'; end if;
 denied := false;
 begin
  update public.tasks set user_id=bob where id=alice_task;
 exception when insufficient_privilege then denied := true;
 end;
 if not denied then raise exception 'Ownership reassignment permitted'; end if;
 denied := false;
 begin
  insert into public.tasks(user_id,title,parent_id) values(alice,'Foreign parent',bob_task);
 exception when foreign_key_violation then denied := true;
 end;
 if not denied then raise exception 'Cross-user parent permitted'; end if;
 denied := false;
 begin
  insert into public.habit_checkins(user_id,habit_id,day) values(alice,bob_habit,current_date + 1);
 exception when foreign_key_violation then denied := true;
 end;
 if not denied then raise exception 'Cross-user habit permitted'; end if;
 insert into public.tasks(user_id,title,parent_id) values(alice,'Own subtask',alice_task);
 delete from public.tasks where id=alice_task;
 select count(*) into total from public.tasks;
 if total <> 0 then raise exception 'Own delete/cascade failed'; end if;
 reset role;
 perform set_config('request.jwt.claim.sub',bob::text,true);
 set local role authenticated;
 select count(*) into total from public.tasks;
 if total <> 1 then raise exception 'Bob data changed'; end if;
 reset role;
 set local role anon;
 foreach tbl in array array['tasks','notes','habits','habit_checkins','focus_sessions'] loop
  denied := false;
  begin
   execute format('select count(*) from public.%I',tbl) into total;
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Anonymous access permitted to %',tbl; end if;
 end loop;
 reset role;
end $$;
rollback;
select 'Hosted RLS checks passed; fixtures rolled back' as result;
