import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Evolution, HabitWeek, recentDays } from "../src/ProgressExperience";
import { emptyData, today } from "../src/domain";

describe("Evolução baseada nos registros", () => {
  it("não inventa conquistas para uma conta sem dados", () => {
    render(<Evolution data={emptyData} onGo={vi.fn()} />);
    expect(screen.getByText("0 de 6 marcos alcançados")).toBeVisible();
    expect(screen.getAllByText("No seu tempo")).toHaveLength(6);
    for (const bar of screen.getAllByRole("progressbar"))
      expect(bar).toHaveAttribute("value", "0");
  });
  it("soma o tempo efetivamente salvo e reconhece só o marco correspondente", () => {
    render(
      <Evolution
        data={{
          ...emptyData,
          sessions: [
            {
              id: "focus-1",
              user_id: "owner",
              duration_seconds: 300,
              created_at: new Date().toISOString(),
            },
          ],
        }}
        onGo={vi.fn()}
      />,
    );
    expect(screen.getByText("1 de 6 marcos alcançados")).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Seus registros" })).getByText(
        "5",
      ),
    ).toBeVisible();
    expect(screen.getAllByText("Você chegou aqui")).toHaveLength(1);
  });
  it("mostra o hábito marcado apenas depois de receber o registro persistido", () => {
    const props = {
      habitId: "habit-1",
      title: "Água",
      disabled: false,
      onToggle: vi.fn(),
    };
    const view = render(<HabitWeek {...props} checkins={[]} />);
    expect(
      screen.getByRole("button", { name: `Registrar Água em ${today()}` }),
    ).toHaveAttribute("aria-pressed", "false");
    view.rerender(
      <HabitWeek
        {...props}
        checkins={[
          {
            id: "check-1",
            user_id: "owner",
            habit_id: "habit-1",
            day: today(),
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: `Desmarcar Água em ${today()}` }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("mantém sete dias consecutivos ao atravessar o fim do mês", () => {
    const days = recentDays(new Date(2026, 2, 1, 12));
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe("2026-02-23");
    expect(days[6].key).toBe("2026-03-01");
  });
});
