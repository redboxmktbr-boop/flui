import { useEffect, useState, type FormEvent } from "react";
import { Brain, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import * as api from "./api";
import { cleanText } from "./domain";
import { Brand, BrandWaves } from "./Brand";

export default function Auth({
  recovery,
  onRecovered,
}: {
  recovery: boolean;
  onRecovered: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "password">(
    recovery ? "password" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (recovery) setMode("password");
  }, [recovery]);
  function changeMode(next: typeof mode) {
    setMode(next);
    setMessage("");
    setShowPassword(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
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
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não conseguimos entrar agora. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`auth auth--${mode}`}>
      <BrandWaves />
      <Brand className="auth-brand" />
      <section className="auth-story" aria-label="Boas-vindas à FLUI">
        <picture className="auth-mascot">
          <source
            media="(max-width: 760px)"
            srcSet="/brand/fluizinho-happy.png"
          />
          <img
            src="/brand/fluizinho-calm.png"
            alt="Fluizinho, o mascote da FLUI, convida você a ir no seu ritmo"
          />
        </picture>
        <p className="story-message">
          Organize sua mente.
          <br />
          <strong>Flua no seu ritmo.</strong>
          <span aria-hidden="true" />
        </p>
      </section>
      <section className="auth-form" aria-labelledby="auth-title">
        <h1 id="auth-title">
          {mode === "signup"
            ? "Vamos começar?"
            : mode === "reset"
              ? "Recupere seu acesso"
              : mode === "password"
                ? "Sua nova senha"
                : "Que bom ver você"}
        </h1>
        <p className="auth-slogan">Sua mente tem seu ritmo.</p>
        {!api.supabase ? (
          <div className="setup" role="status">
            <Brain />
            <h3>A FLUI está ganhando vida</h3>
            <p>
              Conecte o Supabase para criar sua conta e guardar suas
              informações.
            </p>
            <span className="badge">Configuração pendente</span>
          </div>
        ) : (
          <>
            <form onSubmit={submit}>
              {mode === "signup" && (
                <label htmlFor="auth-name">
                  Como podemos chamar você?
                  <span className="auth-input">
                    <UserRound aria-hidden="true" />
                    <input
                      id="auth-name"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Seu nome"
                      autoComplete="given-name"
                    />
                  </span>
                </label>
              )}
              {mode !== "password" && (
                <label htmlFor="auth-email">
                  E-mail
                  <span className="auth-input">
                    <Mail aria-hidden="true" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                    />
                  </span>
                </label>
              )}
              {mode !== "reset" && (
                <label htmlFor="auth-password">
                  Senha
                  <span className="auth-input">
                    <LockKeyhole aria-hidden="true" />
                    <input
                      id="auth-password"
                      aria-label="Senha"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={
                        mode === "signup"
                          ? "Crie uma senha com 8 ou mais caracteres"
                          : "Digite sua senha"
                      }
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </span>
                </label>
              )}
              <button className="primary auth-submit" disabled={busy}>
                {busy
                  ? "Só um instante…"
                  : mode === "signup"
                    ? "Criar minha conta"
                    : mode === "reset"
                      ? "Enviar link"
                      : mode === "password"
                        ? "Salvar nova senha"
                        : "Entrar"}
              </button>
            </form>
            <div className="auth-switch">
              {mode === "login" ? (
                <>
                  <button onClick={() => changeMode("signup")}>
                    Criar conta
                  </button>
                  <span className="auth-switch-divider" aria-hidden="true" />
                  <button onClick={() => changeMode("reset")}>
                    Esqueci a senha
                  </button>
                </>
              ) : (
                mode !== "password" && (
                  <button onClick={() => changeMode("login")}>
                    Voltar para entrar
                  </button>
                )
              )}
            </div>
            <p className="auth-feedback" role="status" aria-live="polite">
              {message}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
