import { describe, it, expect } from "vitest";
import {
  cleanText,
  today,
  nextTask,
  remainingSeconds,
  formatTime,
  type Task,
} from "../src/domain";
const task = (
  id: string,
  priority: Task["priority"],
  due_date: string | null = null,
): Task => ({
  id,
  priority,
  due_date,
  user_id: "owner",
  title: id,
  done: false,
  parent_id: null,
  created_at: "2026-11-16",
});
describe("Próximo pequeno passo", () => {
  it("prioriza tarefas importantes, depois prazo, ignorando concluídas e subtarefas", () => {
    const result = nextTask([
      task("normal", "normal"),
      task("late", "high", "2026-12-01"),
      task("early", "high", "2026-11-17"),
      { ...task("done", "high", "2026-11-01"), done: true },
      { ...task("child", "high", "2026-11-01"), parent_id: "normal" },
    ]);
    expect(result?.id).toBe("early");
  });
  it("aceita a lista vazia", () => expect(nextTask([])).toBeUndefined());
});
describe("Dados de entrada", () => {
  it("remove espaços externos e rejeita entradas vazias ou longas", () => {
    expect(cleanText("  beber água  ")).toBe("beber água");
    expect(() => cleanText("  ")).toThrow();
    expect(() => cleanText("a".repeat(241))).toThrow();
  });
  it("usa a data local sem deslocar para UTC", () =>
    expect(today(new Date(2026, 10, 16, 23, 30))).toBe("2026-11-16"));
});
describe("Foco", () => {
  it("calcula a partir do horário, sem depender da frequência do intervalo", () => {
    expect(remainingSeconds(100000, 72500)).toBe(28);
    expect(remainingSeconds(100000, 120000)).toBe(0);
  });
  it("formata os minutos", () => {
    expect(formatTime(1500)).toBe("25:00");
    expect(formatTime(9)).toBe("00:09");
  });
});
