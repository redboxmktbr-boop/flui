export type Task = {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  priority: "low" | "normal" | "high";
  due_date: string | null;
  parent_id: string | null;
  created_at: string;
};
export type Note = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};
export type Habit = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};
export type Checkin = {
  id: string;
  user_id: string;
  habit_id: string;
  day: string;
};
export type FocusSession = {
  id: string;
  user_id: string;
  duration_seconds: number;
  created_at: string;
};
export type Data = {
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  checkins: Checkin[];
  sessions: FocusSession[];
};
export const emptyData: Data = {
  tasks: [],
  notes: [],
  habits: [],
  checkins: [],
  sessions: [],
};
export function today(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function cleanText(value: string, max = 240) {
  const text = value.trim();
  if (!text) throw new Error("Escreva algo antes de salvar.");
  if (text.length > max) throw new Error(`Use até ${max} caracteres.`);
  return text;
}
export function nextTask(tasks: Task[]) {
  return tasks
    .filter((t) => !t.done && !t.parent_id)
    .sort(
      (a, b) =>
        ({ high: 0, normal: 1, low: 2 })[a.priority] -
          { high: 0, normal: 1, low: 2 }[b.priority] ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        a.created_at.localeCompare(b.created_at),
    )[0];
}
export function remainingSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
