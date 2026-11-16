import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App, { Focus } from "../src/App";
vi.mock("../src/api", () => ({ supabase: null }));
afterEach(() => vi.useRealTimers());
describe("Aplicativo sem credenciais", () => {
  it("explica a configuração sem liberar uma sessão fictícia", () => {
    render(<App />);
    expect(screen.getByText("Configuração pendente")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Entrar no meu espaço" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
describe("Temporizador real", () => {
  it("pausa, retoma e só oferece salvar ao terminar", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(true);
    render(<Focus onComplete={save} history={[]} busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "5 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("timer")).toHaveTextContent("04:00");
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("timer")).toHaveTextContent("04:00");
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    act(() => vi.advanceTimersByTime(240000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(save).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Salvar sessão" })),
    );
    expect(save).toHaveBeenCalledExactlyOnceWith(300);
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
  });
  it("não descarta uma sessão quando a gravação falha", async () => {
    vi.useFakeTimers();
    render(
      <Focus
        onComplete={vi.fn().mockResolvedValue(false)}
        history={[]}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "5 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    act(() => vi.advanceTimersByTime(300000));
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Salvar sessão" })),
    );
    expect(screen.getByRole("button", { name: "Salvar sessão" })).toBeEnabled();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
  });
});
