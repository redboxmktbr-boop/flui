import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { emptyData } from "../src/domain";
import { recentDays } from "../src/ProgressExperience";

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
  vi.clearAllMocks();
  fixture.loadData.mockResolvedValue({ ...emptyData });
  fixture.addTask.mockResolvedValue(undefined);
  fixture.updateTask.mockResolvedValue(undefined);
  fixture.insert.mockResolvedValue(undefined);
  fixture.remove.mockResolvedValue(undefined);
});

const taskFixture = {
  id: "task-1",
  user_id: "owner",
  title: "Separar documentos",
  done: false,
  priority: "normal",
  due_date: null,
  parent_id: null,
  created_at: new Date().toISOString(),
};
describe("Novas interações do espaço pessoal", () => {
  it("salva título, prioridade e prazo da tarefa juntos", async () => {
    fixture.loadData.mockResolvedValue({ ...emptyData, tasks: [taskFixture] });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      screen.getByRole("button", { name: "Tarefas", exact: true }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Separar documentos",
        exact: true,
      }),
    );
    await user.selectOptions(
      screen.getByLabelText("Prioridade da tarefa"),
      "high",
    );
    fireEvent.change(screen.getByLabelText("Prazo da tarefa"), {
      target: { value: "2026-12-15" },
    });
    await user.click(screen.getByRole("button", { name: "Salvar ajustes" }));
    await waitFor(() =>
      expect(fixture.updateTask).toHaveBeenCalledWith("task-1", {
        title: "Separar documentos",
        priority: "high",
        due_date: "2026-12-15",
      }),
    );
  });
  it("só transforma um pensamento em tarefa após a confirmação do usuário", async () => {
    fixture.loadData.mockResolvedValue({
      ...emptyData,
      notes: [
        {
          id: "note-1",
          user_id: "owner",
          body: "Organizar a mochila",
          created_at: new Date().toISOString(),
        },
      ],
    });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      screen.getByRole("button", { name: "Minha mente", exact: true }),
    );
    await user.click(
      await screen.findByRole("button", { name: /Transformar em tarefa/ }),
    );
    expect(
      screen.getByRole("textbox", { name: "Tarefa", exact: true }),
    ).toHaveValue("Organizar a mochila");
    expect(fixture.addTask).not.toHaveBeenCalled();
    expect(fixture.remove).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Adicionar", exact: true }),
    );
    await waitFor(() =>
      expect(fixture.addTask).toHaveBeenCalledWith(
        "owner",
        "Organizar a mochila",
        "normal",
        null,
        null,
      ),
    );
  });
  it("registra o dia escolhido no histórico de hábitos", async () => {
    fixture.loadData.mockResolvedValue({
      ...emptyData,
      habits: [
        {
          id: "habit-1",
          user_id: "owner",
          title: "Beber água",
          created_at: new Date().toISOString(),
        },
      ],
    });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      screen.getByRole("button", { name: "Hábitos", exact: true }),
    );
    const day = recentDays()[0].key;
    await user.click(
      await screen.findByRole("button", {
        name: `Registrar Beber água em ${day}`,
      }),
    );
    await waitFor(() =>
      expect(fixture.insert).toHaveBeenCalledWith("habit_checkins", {
        user_id: "owner",
        habit_id: "habit-1",
        day,
      }),
    );
  });
  it("leva a tarefa selecionada para o modo foco", async () => {
    fixture.loadData.mockResolvedValue({ ...emptyData, tasks: [taskFixture] });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Oi, Ana. Vamos com calma?");
    await user.click(
      await screen.findByRole("button", {
        name: "Focar em Separar documentos",
      }),
    );
    expect(screen.getByText("Um passo de cada vez:")).toBeVisible();
    expect(screen.getByText("Separar documentos")).toBeVisible();
    expect(fixture.updateTask).not.toHaveBeenCalled();
  });
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
