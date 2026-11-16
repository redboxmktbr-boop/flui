import { createClient } from "@supabase/supabase-js";
import { cleanText, type Data, type Task } from "./domain";
import { projectUrl, publishableKey } from "./supabase-config";
const url = import.meta.env.VITE_SUPABASE_URL || projectUrl;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  publishableKey;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
function client() {
  if (!supabase) throw new Error("Conecte o Supabase para usar sua conta.");
  return supabase;
}
export async function loadData(): Promise<Data> {
  const result = await Promise.all(
    ["tasks", "notes", "habits", "habit_checkins", "focus_sessions"].map(
      (table) =>
        client()
          .from(table)
          .select("*")
          .order("created_at", { ascending: true }),
    ),
  );
  for (const r of result) if (r.error) throw r.error;
  return {
    tasks: result[0].data ?? [],
    notes: result[1].data ?? [],
    habits: result[2].data ?? [],
    checkins: result[3].data ?? [],
    sessions: result[4].data ?? [],
  } as Data;
}
export async function addTask(
  user_id: string,
  title: string,
  priority: Task["priority"] = "normal",
  due_date: string | null = null,
  parent_id: string | null = null,
) {
  const { error } = await client()
    .from("tasks")
    .insert({
      user_id,
      title: cleanText(title),
      priority,
      due_date,
      parent_id,
    });
  if (error) throw error;
}
export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "done" | "title" | "priority" | "due_date">>,
) {
  if (patch.title !== undefined)
    patch = { ...patch, title: cleanText(patch.title) };
  const { error } = await client().from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}
export async function remove(
  table: "tasks" | "notes" | "habits" | "habit_checkins",
  id: string,
) {
  const { error } = await client().from(table).delete().eq("id", id);
  if (error) throw error;
}
export async function insert(
  table: "notes" | "habits" | "habit_checkins" | "focus_sessions",
  values: Record<string, unknown>,
) {
  const { error } = await client().from(table).insert(values);
  if (error) throw error;
}
