import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { emptyData } from "../src/domain";

const fixture = vi.hoisted(() => ({
  loadData: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../src/api", () => ({
  ...fixture,
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session: { user: { id: "owner", user_metadata: { name: "Ana" } } },
        },
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signOut: fixture.signOut,
    },
  },
}));
beforeEach(() => {
  fixture.loadData.mockResolvedValue({ ...emptyData });
  fixture.addTask.mockResolvedValue(undefined);
  fixture.updateTask.mockResolvedValue(undefined);
  fixture.insert.mockResolvedValue(undefined);
  fixture.remove.mockResolvedValue(undefined);
});
describe("Fluxos autenticados com serviço isolado", () => {
  it("envia os dados da nova tarefa e recarrega os dados persistidos", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      screen.getByRole("button", { name: "Tarefas", exact: true }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Tarefa", exact: true }),
      "Separar o material",
    );
    await user.click(
      screen.getByRole("button", { name: "Adicionar", exact: true }),
    );
    await waitFor(() =>
      expect(fixture.addTask).toHaveBeenCalledWith(
        "owner",
        "Separar o material",
        "normal",
        null,
        null,
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Tarefa", exact: true }),
      ).toHaveValue(""),
    );
  });
  it("preserva o texto e mostra o erro se a gravação falhar", async () => {
    fixture.addTask.mockRejectedValueOnce(new Error("Conexão indisponível"));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      screen.getByRole("button", { name: "Tarefas", exact: true }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Tarefa", exact: true }),
      "Minha tarefa",
    );
    await user.click(
      screen.getByRole("button", { name: "Adicionar", exact: true }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Conexão indisponível",
    );
    expect(
      screen.getByRole("textbox", { name: "Tarefa", exact: true }),
    ).toHaveValue("Minha tarefa");
  });
  it("não chama serviço de IA e identifica a fase pendente", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(screen.getByRole("button", { name: /Assistente/ }));
    expect(screen.getByText("Próxima fase")).toBeVisible();
    expect(screen.getByText(/Nenhum pensamento seu é enviado/)).toBeVisible();
  });
  it("oferece modo sobrecarga e permite sair pelo teclado", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(screen.getByRole("button", { name: "Preciso respirar" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Você pode ir devagar.",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
