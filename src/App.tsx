import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Home,
  Leaf,
  ListTodo,
  LogOut,
  Menu,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import * as api from "./api";
import {
  cleanText,
  emptyData,
  formatTime,
  nextTask,
  remainingSeconds,
  today,
  type Data,
  type Task,
} from "./domain";

type Page =
  "Início" | "Tarefas" | "Minha mente" | "Foco" | "Hábitos" | "Assistente";
const pages = [
  { name: "Início", icon: Home },
  { name: "Tarefas", icon: ListTodo },
  { name: "Minha mente", icon: Brain },
  { name: "Foco", icon: Clock3 },
  { name: "Hábitos", icon: Leaf },
  { name: "Assistente", icon: Sparkles },
] as const;
function Mascot() {
  return (
    <img
      className="mascot"
      src="/icon.svg"
      alt="Fluizinho, um cérebro sorridente"
    />
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={23} />
      </span>
      <p>{children}</p>
    </div>
  );
}
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não conseguimos salvar agora. Tente novamente.";
}

function Auth({
  recovery,
  onRecovered,
}: {
  recovery: boolean;
  onRecovered: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "password">(
    recovery ? "password" : "login",
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (recovery) setMode("password");
  }, [recovery]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!api.supabase) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await api.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin,
        });
        if (error) throw error;
        setMessage(
          "Se houver uma conta com esse e-mail, enviaremos um link de recuperação.",
        );
      } else if (mode === "password") {
        const { error } = await api.supabase.auth.updateUser({ password });
        if (error) throw error;
        onRecovered();
      } else if (mode === "signup") {
        const { data, error } = await api.supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: cleanText(name, 80) },
            emailRedirectTo: location.origin,
          },
        });
        if (error) throw error;
        if (!data.session)
          setMessage("Verifique seu e-mail para confirmar a conta e entrar.");
      } else {
        const { error } = await api.supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth">
      <section className="auth-story">
        <a className="brand" href="/">
          flui<span>●</span>
        </a>
        <span className="eyebrow">MENOS PRESSÃO. MAIS POSSIBILIDADES.</span>
        <h1>
          Sua mente
          <br />
          tem seu <em>ritmo.</em>
        </h1>
        <p>
          Um lugar para organizar as ideias, encontrar seu foco e dar o próximo
          pequeno passo.
        </p>
        <Mascot />
        <span className="story-caption">Com você, um passo de cada vez.</span>
      </section>
      <section className="auth-form">
        <span className="eyebrow">SEU ESPAÇO PARA RESPIRAR</span>
        <h2>
          {mode === "signup"
            ? "Vamos começar?"
            : mode === "reset"
              ? "Recupere seu acesso"
              : mode === "password"
                ? "Escolha uma nova senha"
                : "Que bom ter você aqui."}
        </h2>
        <p>Você não precisa dar conta de tudo de uma vez.</p>
        {!api.supabase ? (
          <div className="setup" role="status">
            <Brain />
            <h3>A FLUI está ganhando vida</h3>
            <p>
              O aplicativo precisa ser conectado ao Supabase para criar sua
              conta e guardar suas informações.
            </p>
            <p>
              A configuração está explicada no README do projeto. Depois da
              conexão, cadastro e login serão liberados.
            </p>
            <span className="badge">Configuração pendente</span>
          </div>
        ) : (
          <>
            <form onSubmit={submit}>
              {mode === "signup" && (
                <label>
                  Como podemos chamar você?
                  <input
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                  />
                </label>
              )}
              {mode !== "password" && (
                <label>
                  E-mail
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              )}
              {mode !== "reset" && (
                <label>
                  Senha
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
              )}
              <button className="primary" disabled={busy}>
                {busy
                  ? "Só um instante…"
                  : mode === "signup"
                    ? "Criar minha conta"
                    : mode === "reset"
                      ? "Enviar link"
                      : mode === "password"
                        ? "Salvar nova senha"
                        : "Entrar no meu espaço"}
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  <button
                    className="link"
                    onClick={() => {
                      setMode("reset");
                      setMessage("");
                    }}
                  >
                    Esqueci minha senha
                  </button>
                  <br />
                  Primeira vez aqui?{" "}
                  <button
                    className="link"
                    onClick={() => {
                      setMode("signup");
                      setMessage("");
                    }}
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                mode !== "password" && (
                  <button
                    className="link"
                    onClick={() => {
                      setMode("login");
                      setMessage("");
                    }}
                  >
                    Voltar para entrar
                  </button>
                )
              )}
            </p>
            <p role="status">{message}</p>
          </>
        )}
        <footer>Feito para o seu jeito de funcionar. 💜</footer>
      </section>
    </main>
  );
}

export function Focus({
  onComplete,
  history,
  busy,
}: {
  onComplete: (seconds: number) => Promise<boolean>;
  history: Data["sessions"];
  busy: boolean;
}) {
  const [minutes, setMinutes] = useState(25),
    [remaining, setRemaining] = useState(1500),
    [running, setRunning] = useState(false),
    [completed, setCompleted] = useState(false);
  const deadline = useRef(0);
  const announced = useRef(false);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = remainingSeconds(deadline.current);
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        setCompleted(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);
  function toggle() {
    if (running) {
      setRemaining(remainingSeconds(deadline.current));
      setRunning(false);
    } else {
      deadline.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }
  function reset() {
    setRunning(false);
    setCompleted(false);
    setRemaining(minutes * 60);
    announced.current = false;
  }
  return (
    <>
      <div className="focus-layout">
        <section className="card focus-card">
          <span className="eyebrow">UMA COISA DE CADA VEZ</span>
          <h2>Agora é o seu momento.</h2>
          <p>Escolha um tempo confortável. Pausar também faz parte.</p>
          <div className="duration">
            {[5, 15, 25, 45].map((n) => (
              <button
                key={n}
                className={minutes === n ? "selected" : ""}
                disabled={running || completed || remaining !== minutes * 60}
                onClick={() => {
                  setMinutes(n);
                  setRemaining(n * 60);
                }}
              >
                {n} min
              </button>
            ))}
          </div>
          <div
            className="timer"
            role="timer"
            aria-label={`${formatTime(remaining)} restantes`}
            style={
              {
                "--progress": `${(1 - remaining / (minutes * 60)) * 100}%`,
              } as React.CSSProperties
            }
          >
            <strong>{formatTime(remaining)}</strong>
            <span>
              {completed
                ? "Você fez espaço para focar."
                : running
                  ? "No seu ritmo"
                  : "Pronto quando você estiver"}
            </span>
          </div>
          <div className="actions">
            <button className="primary" disabled={completed} onClick={toggle}>
              {running ? <Pause size={18} /> : <Play size={18} />}{" "}
              {running ? "Pausar" : "Começar"}
            </button>
            <button
              className="icon-button"
              onClick={reset}
              aria-label="Reiniciar temporizador"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          {completed && (
            <div role="status">
              <p>Sessão concluída! Que tal uma pausa?</p>
              <button
                className="primary"
                disabled={busy || announced.current}
                onClick={async () => {
                  if (await onComplete(minutes * 60)) {
                    announced.current = true;
                    reset();
                  }
                }}
              >
                Salvar sessão
              </button>
            </div>
          )}
        </section>
        <aside className="card focus-tip">
          <Mascot />
          <h3>Um pequeno combinado?</h3>
          <p>
            Deixe por perto só o que você precisa agora. O resto pode esperar um
            pouquinho.
          </p>
          <div className="mint-note">
            <Wind size={22} />
            <p>
              Solte os ombros.
              <br />
              Respire no seu ritmo.
            </p>
          </div>
        </aside>
      </div>
      <section className="card">
        <h3>Seus momentos de foco</h3>
        {history.length ? (
          <ul className="simple-list">
            {history
              .slice(-5)
              .reverse()
              .map((s) => (
                <li key={s.id}>
                  <Clock3 size={18} />
                  {Math.round(s.duration_seconds / 60)} minutos
                  <span>
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <Empty>Suas sessões concluídas e salvas vão aparecer aqui.</Empty>
        )}
      </section>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    [authLoading, setAuthLoading] = useState(!!api.supabase),
    [recovery, setRecovery] = useState(location.hash.includes("type=recovery"));
  const [page, setPage] = useState<Page>("Início"),
    [data, setData] = useState<Data>(emptyData),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [overload, setOverload] = useState(false),
    [menu, setMenu] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [update, setUpdate] = useState(false);
  const [taskTitle, setTaskTitle] = useState(""),
    [priority, setPriority] = useState<Task["priority"]>("normal"),
    [due, setDue] = useState(""),
    [note, setNote] = useState(""),
    [habit, setHabit] = useState(""),
    [filter, setFilter] = useState("open"),
    [parent, setParent] = useState<string | null>(null),
    [editId, setEditId] = useState<string | null>(null),
    [editTitle, setEditTitle] = useState("");
  const userId = useRef<string | null>(null);
  userId.current = session?.user.id ?? null;
  useEffect(() => {
    if (!api.supabase) return;
    let active = true;
    api.supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(data.session);
        setAuthLoading(false);
        if (error) setError(error.message);
      }
    });
    const {
      data: { subscription },
    } = api.supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setAuthLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (!s) setData(emptyData);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    let active = true;
    setData(emptyData);
    setLoading(true);
    api
      .loadData()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false),
      upd = () => setUpdate(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("flui-update", upd);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("flui-update", upd);
    };
  }, []);
  async function mutate(action: () => Promise<void>): Promise<boolean> {
    if (busy || !online) return false;
    const owner = userId.current;
    setBusy(true);
    setError("");
    try {
      await action();
      const d = await api.loadData();
      if (owner === userId.current) setData(d);
      return true;
    } catch (e) {
      if (owner === userId.current) setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (authLoading)
    return (
      <main className="loading" role="status">
        <Brain /> Preparando seu espaço…
      </main>
    );
  if (!session || recovery)
    return <Auth recovery={recovery} onRecovered={() => setRecovery(false)} />;
  const uid = session.user.id,
    firstName = (session.user.user_metadata.name || "você").split(" ")[0];
  const roots = data.tasks.filter((t) => !t.parent_id),
    pending = roots.filter((t) => !t.done),
    done = roots.filter((t) => t.done),
    next = nextTask(data.tasks),
    day = today();
  const disabled = busy || loading || !online;
  async function saveTask(e: FormEvent) {
    e.preventDefault();
    if (
      await mutate(() =>
        api.addTask(uid, taskTitle, priority, due || null, parent),
      )
    ) {
      setTaskTitle("");
      setDue("");
      setParent(null);
      setPriority("normal");
    }
  }
  function go(p: Page) {
    setPage(p);
    setMenu(false);
    setError("");
  }
  function taskRow(t: Task, child = false): ReactNode {
    return (
      <div
        className={`task-row ${child ? "child" : ""} ${t.done ? "is-done" : ""}`}
        key={t.id}
      >
        <button
          className="check"
          aria-label={`${t.done ? "Reabrir" : "Concluir"} ${t.title}`}
          disabled={disabled}
          onClick={() => mutate(() => api.updateTask(t.id, { done: !t.done }))}
        >
          {t.done ? <CheckCircle2 /> : <Circle />}
        </button>
        <div className="task-content">
          {editId === t.id ? (
            <form
              className="edit-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await mutate(() => api.updateTask(t.id, { title: editTitle }))
                )
                  setEditId(null);
              }}
            >
              <input
                aria-label="Editar título"
                required
                maxLength={240}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <button disabled={disabled} aria-label="Salvar título">
                <Check size={18} />
              </button>
              <button
                type="button"
                aria-label="Cancelar edição"
                onClick={() => setEditId(null)}
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              className="task-title"
              onClick={() => {
                setEditId(t.id);
                setEditTitle(t.title);
              }}
            >
              {t.title}
            </button>
          )}
          <div className="task-meta">
            <span className={`priority ${t.priority}`}>
              {t.priority === "high"
                ? "Prioridade alta"
                : t.priority === "low"
                  ? "Com calma"
                  : "No seu ritmo"}
            </span>
            {t.due_date && (
              <span>
                <Clock3 size={12} />
                {new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
        {!child && (
          <button
            className="icon-button"
            disabled={disabled}
            aria-label={`Adicionar subtarefa a ${t.title}`}
            onClick={() => {
              setParent(t.id);
              go("Tarefas");
            }}
          >
            <Plus size={17} />
          </button>
        )}
        <button
          className="icon-button delete"
          disabled={disabled}
          aria-label={`Excluir ${t.title}`}
          onClick={() => {
            if (
              window.confirm(
                child
                  ? "Excluir esta subtarefa?"
                  : "Excluir esta tarefa e suas subtarefas?",
              )
            )
              void mutate(() => api.remove("tasks", t.id));
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="app">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a href="/" className="brand">
          flui<span>●</span>
        </a>
        <span className="brand-caption">Sua mente tem seu ritmo.</span>
        <nav aria-label="Navegação principal">
          {pages.map((p) => (
            <button
              key={p.name}
              className={page === p.name ? "active" : ""}
              onClick={() => go(p.name)}
            >
              <p.icon size={20} />
              {p.name}
              {p.name === "Assistente" && <small>Em breve</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="soft-callout">
            <Wind />
            <h4>Está tudo muito?</h4>
            <p>Vamos deixar as coisas mais leves.</p>
            <button onClick={() => setOverload(true)}>
              Ativar modo sobrecarga <ArrowRight size={16} />
            </button>
          </div>
          <button
            className="logout"
            onClick={async () => {
              const { error } = await api.supabase!.auth.signOut();
              if (error) setError(error.message);
            }}
          >
            <LogOut size={17} /> Sair da conta
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <span>
            Seu espaço, seu ritmo <span className="header-star">✧</span>
          </span>
          <div className="profile">
            <span className="status-dot" />
            {online ? "Conectado" : "Sem conexão"}
            <span className="avatar">{firstName[0].toUpperCase()}</span>
          </div>
        </header>
        <main className="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <h1>
                {page === "Início"
                  ? `Oi, ${firstName}. Vamos com calma?`
                  : page}
              </h1>
              <p>
                {page === "Início"
                  ? "Você não precisa fazer tudo. Só começar por algo."
                  : page === "Tarefas"
                    ? "Tire as ideias da cabeça. Um pequeno passo de cada vez."
                    : page === "Minha mente"
                      ? "Uma ideia solta também merece um lugar."
                      : page === "Foco"
                        ? "Menos distrações, mais presença."
                        : page === "Hábitos"
                          ? "Pequenos cuidados que cabem no seu dia."
                          : "Mais clareza para transformar ideias em ação."}
              </p>
            </div>
            <button
              className="overload-button"
              onClick={() => setOverload(true)}
            >
              <Wind size={18} /> Preciso respirar
            </button>
          </div>
          {!online && (
            <div className="notice" role="status">
              Você está sem conexão. O temporizador continua funcionando;
              conecte-se para consultar ou salvar alterações.
            </div>
          )}
          {update && (
            <div className="notice">
              Há uma nova versão da FLUI. Reabra o aplicativo depois de salvar
              seu trabalho para atualizar.
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button
                className="link"
                onClick={() => void mutate(async () => {})}
              >
                Tentar carregar novamente
              </button>
            </div>
          )}
          {loading && <p role="status">Buscando suas informações…</p>}
          {page === "Início" && (
            <>
              <section className="welcome">
                <div>
                  <span className="pill">
                    <Sparkles size={14} /> CADA PASSO CONTA
                  </span>
                  <h2>
                    O seu melhor muda.
                    <br />E está tudo bem.
                  </h2>
                  <p>
                    Vamos encontrar espaço para o que importa hoje,
                    <br className="desktop-break" /> sem deixar você para
                    depois.
                  </p>
                  <button className="primary" onClick={() => go("Tarefas")}>
                    Organizar meu dia <ArrowRight size={17} />
                  </button>
                </div>
                <div className="welcome-mascot">
                  <span className="spark s1">✦</span>
                  <Mascot />
                  <span className="spark s2">✧</span>
                  <span className="mascot-bubble">
                    Um passinho já é um passo.
                  </span>
                </div>
              </section>
              <div className="stats">
                <div className="stat">
                  <span className="stat-icon purple">
                    <ListTodo />
                  </span>
                  <div>
                    <strong>{pending.length}</strong>
                    <span>Tarefas em aberto</span>
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-icon mint">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <strong>{done.length}</strong>
                    <span>Tarefas concluídas</span>
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-icon blue">
                    <Clock3 />
                  </span>
                  <div>
                    <strong>
                      {Math.round(
                        data.sessions
                          .filter((s) => today(new Date(s.created_at)) === day)
                          .reduce((sum, s) => sum + s.duration_seconds, 0) / 60,
                      )}{" "}
                      <small>min</small>
                    </strong>
                    <span>Seu foco hoje</span>
                  </div>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="card">
                  <div className="section-title">
                    <h3>Um próximo passo</h3>
                    <button className="link" onClick={() => go("Tarefas")}>
                      Ver tarefas <ChevronRight size={16} />
                    </button>
                  </div>
                  {next ? (
                    <>
                      {taskRow(next)}
                      <p className="gentle">
                        Você pode dividir essa tarefa em passos menores.
                      </p>
                    </>
                  ) : (
                    <Empty>
                      Seu dia pode começar com uma pequena tarefa.
                      <br />
                      <button className="link" onClick={() => go("Tarefas")}>
                        Adicionar meu primeiro passo <Plus size={15} />
                      </button>
                    </Empty>
                  )}
                </section>
                <section className="card quick-capture">
                  <div className="section-title">
                    <h3>
                      <Brain size={20} /> Tire da cabeça
                    </h3>
                  </div>
                  <p>Teve uma ideia? Guarde aqui e volte depois.</p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await mutate(() =>
                          api.insert("notes", {
                            user_id: uid,
                            body: cleanText(note, 4000),
                          }),
                        )
                      )
                        setNote("");
                    }}
                  >
                    <textarea
                      aria-label="Captura rápida"
                      placeholder="O que está passando pela sua mente?"
                      maxLength={4000}
                      required
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button className="capture-button" disabled={disabled}>
                      Guardar ideia <Plus size={16} />
                    </button>
                  </form>
                </section>
                <section className="card">
                  <div className="section-title">
                    <h3>Seus pequenos avanços</h3>
                    <span className="badge">Sem cobranças</span>
                  </div>
                  <p>
                    {roots.length
                      ? `${done.length} de ${roots.length} tarefas concluídas. Cada avanço tem valor.`
                      : "Quando você adicionar tarefas, seus avanços aparecerão aqui."}
                  </p>
                  <progress
                    max={Math.max(roots.length, 1)}
                    value={done.length}
                    aria-label="Progresso das tarefas"
                  />
                  <div className="gentle">
                    Pausas também fazem parte do caminho. 💜
                  </div>
                </section>
                <section className="card focus-shortcut">
                  <span className="stat-icon blue">
                    <Clock3 />
                  </span>
                  <div>
                    <h3>Um tempo só para focar</h3>
                    <p>Escolha uma coisa. O resto pode esperar.</p>
                    <button className="link" onClick={() => go("Foco")}>
                      Entrar no modo foco <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "Tarefas" && (
            <>
              <section className="card">
                <h3>
                  {parent
                    ? `Adicionar passo a: ${data.tasks.find((t) => t.id === parent)?.title}`
                    : "Qual é o próximo pequeno passo?"}
                </h3>
                <form className="task-form" onSubmit={saveTask}>
                  <label className="grow">
                    Tarefa
                    <input
                      placeholder="Ex.: separar o material de estudo"
                      required
                      maxLength={240}
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Prioridade
                    <select
                      value={priority}
                      onChange={(e) =>
                        setPriority(e.target.value as Task["priority"])
                      }
                    >
                      <option value="normal">No meu ritmo</option>
                      <option value="high">Alta</option>
                      <option value="low">Com calma</option>
                    </select>
                  </label>
                  <label>
                    Prazo opcional
                    <input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={disabled}>
                    <Plus size={18} /> Adicionar
                  </button>
                  {parent && (
                    <button
                      type="button"
                      className="link"
                      onClick={() => setParent(null)}
                    >
                      Cancelar
                    </button>
                  )}
                </form>
              </section>
              <section className="card">
                <div className="tabs" aria-label="Filtrar tarefas">
                  {[
                    ["open", "Em aberto"],
                    ["done", "Concluídas"],
                    ["all", "Todas"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      aria-pressed={filter === v}
                      className={filter === v ? "selected" : ""}
                      onClick={() => setFilter(v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {roots
                  .filter(
                    (t) =>
                      filter === "all" ||
                      (filter === "done" ? t.done : !t.done),
                  )
                  .map((t) => (
                    <div key={t.id}>
                      {taskRow(t)}
                      {data.tasks
                        .filter((s) => s.parent_id === t.id)
                        .map((s) => taskRow(s, true))}
                    </div>
                  ))}
                {!roots.some(
                  (t) =>
                    filter === "all" || (filter === "done" ? t.done : !t.done),
                ) && (
                  <Empty>
                    {filter === "done"
                      ? "Cada pequeno avanço vai encontrar espaço aqui."
                      : "Nenhuma tarefa por aqui. Comece com algo que caiba no seu dia."}
                  </Empty>
                )}
              </section>
            </>
          )}
          {page === "Minha mente" && (
            <>
              <section className="card">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      await mutate(() =>
                        api.insert("notes", {
                          user_id: uid,
                          body: cleanText(note, 4000),
                        }),
                      )
                    )
                      setNote("");
                  }}
                >
                  <label>
                    O que você quer tirar da cabeça?
                    <textarea
                      required
                      maxLength={4000}
                      rows={4}
                      placeholder="Uma ideia, um lembrete, algo para pensar depois…"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={disabled}>
                    <Plus size={18} /> Guardar pensamento
                  </button>
                </form>
              </section>
              <div className="notes-grid">
                {data.notes
                  .slice()
                  .reverse()
                  .map((n) => (
                    <article className="card note" key={n.id}>
                      <p>{n.body}</p>
                      <footer>
                        <small>
                          {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </small>
                        <button
                          className="icon-button delete"
                          aria-label="Excluir pensamento"
                          disabled={disabled}
                          onClick={() => {
                            if (window.confirm("Excluir este pensamento?"))
                              void mutate(() => api.remove("notes", n.id));
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </footer>
                    </article>
                  ))}
              </div>
              {!data.notes.length && (
                <Empty>
                  Um espaço livre para as suas ideias. Sem precisar organizar
                  tudo agora.
                </Empty>
              )}
            </>
          )}
          <div hidden={page !== "Foco"}>
            <Focus
              busy={disabled}
              history={data.sessions}
              onComplete={(seconds) =>
                mutate(() =>
                  api.insert("focus_sessions", {
                    user_id: uid,
                    duration_seconds: seconds,
                  }),
                )
              }
            />
          </div>
          {page === "Hábitos" && (
            <>
              <section className="card">
                <h3>Um cuidado para repetir</h3>
                <form
                  className="task-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      await mutate(() =>
                        api.insert("habits", {
                          user_id: uid,
                          title: cleanText(habit),
                        }),
                      )
                    )
                      setHabit("");
                  }}
                >
                  <label className="grow">
                    Hábito
                    <input
                      required
                      maxLength={240}
                      placeholder="Ex.: beber um copo de água ao acordar"
                      value={habit}
                      onChange={(e) => setHabit(e.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={disabled}>
                    <Plus size={18} /> Adicionar hábito
                  </button>
                </form>
              </section>
              <section className="card">
                <h3>Hoje, no seu ritmo</h3>
                {data.habits.map((h) => {
                  const checkin = data.checkins.find(
                    (c) => c.habit_id === h.id && c.day === day,
                  );
                  return (
                    <div className="task-row" key={h.id}>
                      <button
                        className="check"
                        disabled={disabled}
                        aria-label={`${checkin ? "Desmarcar" : "Registrar"} ${h.title}`}
                        onClick={() =>
                          mutate(() =>
                            checkin
                              ? api.remove("habit_checkins", checkin.id)
                              : api.insert("habit_checkins", {
                                  user_id: uid,
                                  habit_id: h.id,
                                  day,
                                }),
                          )
                        }
                      >
                        {checkin ? <CheckCircle2 /> : <Circle />}
                      </button>
                      <div className="task-content">
                        <strong>{h.title}</strong>
                        <p className="gentle">
                          {checkin
                            ? "Você cuidou de você hoje."
                            : "Quando couber no seu dia."}
                        </p>
                      </div>
                      <button
                        className="icon-button delete"
                        aria-label={`Excluir hábito ${h.title}`}
                        disabled={disabled}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Excluir este hábito e seus registros?",
                            )
                          )
                            void mutate(() => api.remove("habits", h.id));
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
                {!data.habits.length && (
                  <Empty>
                    Escolha um hábito pequeno o suficiente para começar.
                  </Empty>
                )}
                <p className="gentle">
                  Sem sequências perdidas. Você pode recomeçar quantas vezes
                  precisar.
                </p>
              </section>
            </>
          )}
          {page === "Assistente" && (
            <section className="card assistant">
              <span className="stat-icon purple">
                <Sparkles />
              </span>
              <span className="badge">Próxima fase</span>
              <h2>Um apoio para organizar as ideias.</h2>
              <p>
                O assistente FLUI vai ajudar a dividir tarefas e transformar
                pensamentos em pequenos planos.
              </p>
              <p>
                A integração com modelos de IA ainda não está ativada. Nenhum
                pensamento seu é enviado a provedores de IA nesta versão.
              </p>
              <div className="mint-note">
                <MessageCircle />
                <span>
                  Por enquanto, você já pode guardar ideias em “Minha mente” e
                  criar seus próximos passos em “Tarefas”.
                </span>
              </div>
              <button className="primary" onClick={() => go("Minha mente")}>
                Guardar uma ideia <ArrowRight size={18} />
              </button>
            </section>
          )}
          <footer className="main-footer">
            Feito para dias reais. No seu ritmo.{" "}
            <span>FLUI © {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
      {overload && (
        <div
          className="overload"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overload-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOverload(false);
            if (e.key === "Tab") {
              const elements = Array.from(
                e.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              );
              const idx = elements.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              if (e.shiftKey && idx <= 0) {
                e.preventDefault();
                elements.at(-1)?.focus();
              } else if (!e.shiftKey && idx === elements.length - 1) {
                e.preventDefault();
                elements[0]?.focus();
              }
            }
          }}
        >
          <button
            autoFocus
            className="exit-overload"
            onClick={() => setOverload(false)}
          >
            <X size={18} /> Voltar ao meu espaço
          </button>
          <section>
            <Wind size={40} />
            <span className="eyebrow">SÓ ESTE MOMENTO</span>
            <h1 id="overload-title">Você pode ir devagar.</h1>
            <p>
              Não precisa resolver tudo agora.
              <br />
              Solte os ombros. Respire de um jeito confortável.
            </p>
            <div className="breathing-orb">
              <Brain size={56} />
            </div>
            <h3>Uma coisa pequena já basta.</h3>
            {next ? (
              <div className="overload-task">
                <p>{next.title}</p>
                <button
                  className="primary"
                  disabled={disabled}
                  onClick={() =>
                    mutate(() => api.updateTask(next.id, { done: true }))
                  }
                >
                  <Check size={18} /> Concluí este passo
                </button>
              </div>
            ) : (
              <p>
                Talvez só beber água ou fazer uma pausa.
                <br />
                Seu espaço continua aqui quando você voltar.
              </p>
            )}
            <p className="gentle">Sem pressa. Sem cobrança.</p>
          </section>
        </div>
      )}
    </div>
  );
}
