// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";

// Real PostgreSQL policies run in PGlite. Only Supabase's Auth schema/UID helper
// are supplied by the fixture; the migration and database RLS execute unchanged.
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const aliceTask = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bobTask = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const aliceHabit = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
async function asUser(id: string) {
  await db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
beforeAll(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('${alice}'),('${bob}');`);
  await db.exec(
    readFileSync(
      new URL("../supabase/migrations/202611160001_flui.sql", import.meta.url),
      "utf8",
    ),
  );
}, 30000);
afterAll(() => db.close());
beforeEach(async () => {
  await db.exec(`reset role; truncate public.tasks, public.notes, public.habits, public.habit_checkins, public.focus_sessions cascade;
 insert into public.tasks(id,user_id,title) values ('${aliceTask}','${alice}','Alice'),('${bobTask}','${bob}','Bob');
 insert into public.habits(id,user_id,title) values ('${aliceHabit}','${alice}','Água');`);
  await asUser(alice);
});
describe("RLS executada em PostgreSQL", () => {
  it("cada conta só consulta as próprias tarefas", async () => {
    expect(
      (await db.query<{ title: string }>("select title from public.tasks"))
        .rows,
    ).toEqual([{ title: "Alice" }]);
    await asUser(bob);
    expect(
      (await db.query<{ title: string }>("select title from public.tasks"))
        .rows,
    ).toEqual([{ title: "Bob" }]);
  });
  it("não permite inserir dados em nome de outro usuário nem transferir propriedade", async () => {
    await expect(
      db.query("insert into public.notes(user_id,body) values ($1,$2)", [
        bob,
        "Não permitido",
      ]),
    ).rejects.toThrow(/row-level security/i);
    await expect(
      db.query("update public.tasks set user_id=$1 where id=$2", [
        bob,
        aliceTask,
      ]),
    ).rejects.toThrow(/row-level security/i);
  });
  it("não altera nem exclui tarefas de outra pessoa", async () => {
    expect(
      (
        await db.query(
          "update public.tasks set title=$1 where id=$2 returning id",
          ["Intrusão", bobTask],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("delete from public.tasks where id=$1 returning id", [
          bobTask,
        ])
      ).rows,
    ).toHaveLength(0);
  });
  it("impede subtarefas e registros de hábitos de outro usuário", async () => {
    await expect(
      db.query(
        "insert into public.tasks(user_id,title,parent_id) values ($1,$2,$3)",
        [alice, "Inválida", bobTask],
      ),
    ).rejects.toThrow(/foreign key/i);
    await asUser(bob);
    await expect(
      db.query(
        "insert into public.habit_checkins(user_id,habit_id,day) values ($1,$2,$3)",
        [bob, aliceHabit, "2026-11-16"],
      ),
    ).rejects.toThrow(/foreign key/i);
  });
  it("aceita gravações próprias e impede check-in duplicado no mesmo dia", async () => {
    await db.query("insert into public.notes(user_id,body) values ($1,$2)", [
      alice,
      "Minha ideia",
    ]);
    await db.query(
      "insert into public.tasks(user_id,title,parent_id) values ($1,$2,$3)",
      [alice, "Primeiro passo", aliceTask],
    );
    await db.query(
      "insert into public.habit_checkins(user_id,habit_id,day) values ($1,$2,$3)",
      [alice, aliceHabit, "2026-11-16"],
    );
    await expect(
      db.query(
        "insert into public.habit_checkins(user_id,habit_id,day) values ($1,$2,$3)",
        [alice, aliceHabit, "2026-11-16"],
      ),
    ).rejects.toThrow(/unique constraint/i);
    expect((await db.query("select * from public.notes")).rows).toHaveLength(1);
  });
  it("bloqueia todas as tabelas para visitantes sem login", async () => {
    await db.exec("reset role; set role anon;");
    for (const table of [
      "tasks",
      "notes",
      "habits",
      "habit_checkins",
      "focus_sessions",
    ])
      await expect(db.query(`select * from public.${table}`)).rejects.toThrow(
        /permission denied/i,
      );
  });
  it("protege pensamentos, hábitos, check-ins e foco com o mesmo isolamento", async () => {
    await db.query("insert into public.notes(user_id,body) values ($1,$2)", [
      alice,
      "Ideia privada",
    ]);
    await db.query(
      "insert into public.focus_sessions(user_id,duration_seconds) values ($1,300)",
      [alice],
    );
    await db.query(
      "insert into public.habit_checkins(user_id,habit_id,day) values ($1,$2,$3)",
      [alice, aliceHabit, "2026-11-16"],
    );
    await asUser(bob);
    for (const table of ["notes", "habits", "habit_checkins", "focus_sessions"])
      expect(
        (await db.query(`select * from public.${table}`)).rows,
      ).toHaveLength(0);
  });
});
