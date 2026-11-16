import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Leaf,
  ListTodo,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Mascot } from "./Brand";
import { today, type Data, type Task } from "./domain";

export function recentDays(now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6 + index,
      12,
    );
    return {
      key: today(date),
      label: date
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      number: date.getDate(),
    };
  });
}

export function QuickActions({
  onGo,
}: {
  onGo: (page: "Tarefas" | "Minha mente" | "Foco" | "Evolução") => void;
}) {
  return (
    <section className="quick-actions" aria-label="O que você precisa agora?">
      {(
        [
          {
            page: "Tarefas",
            title: "Um pequeno passo",
            text: "Adicionar uma tarefa",
            Icon: Plus,
            color: "lilac",
          },
          {
            page: "Minha mente",
            title: "Tirar da cabeça",
            text: "Guardar uma ideia",
            Icon: Brain,
            color: "peach",
          },
          {
            page: "Foco",
            title: "Encontrar meu foco",
            text: "Uma coisa de cada vez",
            Icon: Clock3,
            color: "sky",
          },
          {
            page: "Evolução",
            title: "Ver meus avanços",
            text: "Cada passo conta",
            Icon: Trophy,
            color: "butter",
          },
        ] as const
      ).map((action) => (
        <button
          key={action.page}
          className={`quick-action ${action.color}`}
          onClick={() => onGo(action.page)}
        >
          <span>
            <action.Icon size={23} />
          </span>
          <strong>{action.title}</strong>
          <small>{action.text}</small>
          <ArrowRight className="quick-arrow" size={16} />
        </button>
      ))}
    </section>
  );
}

export function TaskProgress({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: () => void;
}) {
  const roots = tasks.filter((task) => !task.parent_id),
    completed = roots.filter((task) => task.done).length;
  const percentage = roots.length
    ? Math.round((completed / roots.length) * 100)
    : 0;
  return (
    <div className="visual-task-progress">
      <div
        className="progress-orbit"
        role="img"
        aria-label={`${completed} de ${roots.length} tarefas concluídas`}
        style={{ "--fill": `${percentage}%` } as React.CSSProperties}
      >
        <div>
          <strong>{percentage}%</strong>
          <span>no seu ritmo</span>
        </div>
      </div>
      <div>
        <span className="eyebrow">CADA PASSO CONTA</span>
        <h3>
          {completed
            ? `${completed} ${completed === 1 ? "pequena vitória" : "pequenas vitórias"}`
            : "Seu primeiro passo cabe aqui."}
        </h3>
        <p>
          {roots.length
            ? `${completed} de ${roots.length} tarefas concluídas. O próximo passo pode ser pequeno.`
            : "Adicione uma tarefa para começar a ver seus avanços."}
        </p>
        <button className="link" onClick={onOpen}>
          Ver meu progresso <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function HabitWeek({
  habitId,
  title,
  checkins,
  disabled,
  onToggle,
}: {
  habitId: string;
  title: string;
  checkins: Data["checkins"];
  disabled: boolean;
  onToggle: (day: string) => void;
}) {
  const days = recentDays();
  const count = days.filter((day) =>
    checkins.some(
      (checkin) => checkin.habit_id === habitId && checkin.day === day.key,
    ),
  ).length;
  return (
    <div className="habit-week">
      <div className="habit-week-days">
        {days.map((day) => {
          const checked = checkins.some(
            (checkin) =>
              checkin.habit_id === habitId && checkin.day === day.key,
          );
          return (
            <button
              key={day.key}
              disabled={disabled}
              aria-pressed={checked}
              aria-label={`${checked ? "Desmarcar" : "Registrar"} ${title} em ${day.key}`}
              className={`${checked ? "checked" : ""} ${day.key === today() ? "is-today" : ""}`}
              onClick={() => onToggle(day.key)}
            >
              <span>{day.label}</span>
              <i>{checked ? <Check size={17} /> : day.number}</i>
              <small>{day.key === today() ? "hoje" : "\u00a0"}</small>
            </button>
          );
        })}
      </div>
      <p>
        {count
          ? `${count} ${count === 1 ? "registro" : "registros"} nos últimos 7 dias. Cada cuidado tem valor.`
          : "Um cuidado pequeno, quando couber no seu dia."}
      </p>
    </div>
  );
}

export function Evolution({
  data,
  onGo,
}: {
  data: Data;
  onGo: (page: "Tarefas" | "Minha mente" | "Foco" | "Hábitos") => void;
}) {
  const days = recentDays();
  const [selectedDay, setSelectedDay] = useState(today());
  const completed = data.tasks.filter(
    (task) => task.done && !task.parent_id,
  ).length;
  const focusMinutes = Math.round(
    data.sessions.reduce((sum, session) => sum + session.duration_seconds, 0) /
      60,
  );
  const dayFocus = (day: string) =>
    Math.round(
      data.sessions
        .filter((session) => today(new Date(session.created_at)) === day)
        .reduce((sum, session) => sum + session.duration_seconds, 0) / 60,
    );
  const dayHabits = (day: string) =>
    data.checkins.filter((checkin) => checkin.day === day).length;
  const maxMinutes = Math.max(1, ...days.map((day) => dayFocus(day.key)));
  const achievements = [
    {
      title: "Meu primeiro passo",
      detail: "Concluir uma tarefa",
      value: completed,
      goal: 1,
      Icon: CheckCircle2,
      page: "Tarefas",
    },
    {
      title: "Espaço na minha mente",
      detail: "Guardar um pensamento",
      value: data.notes.length,
      goal: 1,
      Icon: Brain,
      page: "Minha mente",
    },
    {
      title: "Meu momento de foco",
      detail: "Concluir e salvar uma sessão",
      value: data.sessions.length,
      goal: 1,
      Icon: Clock3,
      page: "Foco",
    },
    {
      title: "Um cuidado comigo",
      detail: "Registrar um hábito",
      value: data.checkins.length,
      goal: 1,
      Icon: Leaf,
      page: "Hábitos",
    },
    {
      title: "Passo a passo",
      detail: "Dividir uma tarefa em subtarefas",
      value: data.tasks.filter((task) => task.parent_id).length,
      goal: 1,
      Icon: Flag,
      page: "Tarefas",
    },
    {
      title: "Encontrei meu ritmo",
      detail: "Salvar cinco sessões de foco",
      value: data.sessions.length,
      goal: 5,
      Icon: Sparkles,
      page: "Foco",
    },
  ] as const;
  const unlocked = achievements.filter(
    (achievement) => achievement.value >= achievement.goal,
  ).length;
  return (
    <div className="evolution">
      <section className="evolution-hero">
        <div>
          <span className="pill">
            <Trophy size={15} /> SUAS PEQUENAS VITÓRIAS
          </span>
          <h2>Olha o caminho que você já fez.</h2>
          <p>
            Sem comparação. Sem pontos para perder.
            <br />
            Só espaço para reconhecer o seu ritmo.
          </p>
          <span className="achievement-total">
            {unlocked} de {achievements.length} marcos alcançados
          </span>
        </div>
        <Mascot />
      </section>
      <section className="evolution-totals" aria-label="Seus registros">
        <div>
          <CheckCircle2 />
          <strong>{completed}</strong>
          <span>tarefas concluídas</span>
        </div>
        <div>
          <Clock3 />
          <strong>
            {focusMinutes}
            <small> min</small>
          </strong>
          <span>de foco registrado</span>
        </div>
        <div>
          <Leaf />
          <strong>{data.checkins.length}</strong>
          <span>cuidados registrados</span>
        </div>
      </section>
      <section className="card week-overview">
        <div className="section-title">
          <div>
            <span className="eyebrow">OS ÚLTIMOS 7 DIAS</span>
            <h3>Seu ritmo aparece nos detalhes.</h3>
          </div>
          <span className="badge">Toque em um dia</span>
        </div>
        <div className="week-chart">
          {days.map((day) => (
            <button
              key={day.key}
              className={selectedDay === day.key ? "selected" : ""}
              aria-pressed={selectedDay === day.key}
              aria-label={`${day.label}, ${day.number}: ${dayFocus(day.key)} minutos de foco e ${dayHabits(day.key)} registros de hábitos`}
              onClick={() => setSelectedDay(day.key)}
            >
              <span className="chart-column">
                <i
                  style={{
                    height: `${Math.max(3, (dayFocus(day.key) / maxMinutes) * 100)}%`,
                  }}
                  className={dayFocus(day.key) ? "has-focus" : ""}
                />
              </span>
              <strong>{day.label}</strong>
              <small>{day.number}</small>
              {dayHabits(day.key) > 0 && <b aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className="selected-day-detail" role="status">
          <span>
            <Clock3 size={17} />
            <strong>{dayFocus(selectedDay)} min</strong> de foco
          </span>
          <span>
            <Leaf size={17} />
            <strong>{dayHabits(selectedDay)}</strong> cuidados registrados
          </span>
        </div>
        <p className="gentle">
          As barras mostram o tempo de foco salvo. O ponto verde indica um
          hábito registrado.
        </p>
      </section>
      <section className="achievements">
        <div className="section-title">
          <h3>Pequenas conquistas, grandes significados.</h3>
        </div>
        <div className="achievement-grid">
          {achievements.map((achievement) => {
            const reached = achievement.value >= achievement.goal;
            return (
              <article
                key={achievement.title}
                className={`achievement-card ${reached ? "unlocked" : ""}`}
              >
                <span className="achievement-icon">
                  <achievement.Icon />
                </span>
                <span className="badge">
                  {reached ? "Você chegou aqui" : "No seu tempo"}
                </span>
                <h4>{achievement.title}</h4>
                <p>{achievement.detail}</p>
                <progress
                  aria-label={achievement.title}
                  max={achievement.goal}
                  value={Math.min(achievement.goal, achievement.value)}
                />
                <div className="achievement-bottom">
                  <small>
                    {Math.min(achievement.goal, achievement.value)}/
                    {achievement.goal}
                  </small>
                  {reached ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <button
                      className="link"
                      onClick={() => onGo(achievement.page)}
                    >
                      Dar um passo <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function TaskEditor({
  task,
  disabled,
  onSave,
  onCancel,
}: {
  task: Task;
  disabled: boolean;
  onSave: (patch: Pick<Task, "title" | "priority" | "due_date">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title),
    [priority, setPriority] = useState(task.priority),
    [due, setDue] = useState(task.due_date || "");
  return (
    <form
      className="task-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title, priority, due_date: due || null });
      }}
    >
      <label>
        Título da tarefa
        <input
          autoFocus
          required
          maxLength={240}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className="task-editor-options">
        <label>
          Prioridade da tarefa
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as Task["priority"])
            }
          >
            <option value="normal">No meu ritmo</option>
            <option value="high">Alta</option>
            <option value="low">Com calma</option>
          </select>
        </label>
        <label>
          Prazo da tarefa
          <input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
          />
        </label>
      </div>
      <div className="actions">
        <button className="primary" disabled={disabled}>
          Salvar ajustes
        </button>
        <button type="button" className="link" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
