export function Brand({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <a
      href="/"
      aria-label="FLUI — início"
      className={`brand brand-logo ${light ? "brand-logo--light" : ""} ${className}`}
    >
      <img src="/brand/flui-logo.png" alt="FLUI" />
      <span className="logo-ink" aria-hidden="true" />
      <img
        className="logo-accent"
        src="/brand/flui-logo.png"
        alt=""
        aria-hidden="true"
      />
    </a>
  );
}

export function Mascot({
  mood = "happy",
}: {
  mood?: "happy" | "calm" | "work";
}) {
  return (
    <img
      className={`mascot mascot--${mood}`}
      src={`/brand/fluizinho-${mood}.png`}
      alt="Fluizinho, o mascote da FLUI"
    />
  );
}

export function BrandWaves() {
  return (
    <div className="brand-waves" aria-hidden="true">
      <svg
        className="brand-wave brand-wave--top"
        viewBox="0 0 440 300"
        preserveAspectRatio="none"
      >
        <path d="M0 0H440V300C312 240 315 160 207 119S49 77 0 0Z" />
        <path
          className="wave-yellow"
          d="M0 0C49 77 112 79 207 119S312 240 440 300"
        />
      </svg>
      <svg
        className="brand-wave brand-wave--bottom"
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
      >
        <path d="M0 58C154-20 191 136 340 135S489 137 600 200H0Z" />
        <path
          className="wave-yellow"
          d="M0 58C154-20 191 136 340 135S489 137 600 200"
        />
      </svg>
      <svg
        className="brand-wave brand-wave--mobile"
        viewBox="0 0 700 130"
        preserveAspectRatio="none"
      >
        <path d="M0 60C148-50 249 152 401 99S591 9 700 70V130H0Z" />
        <path
          className="wave-yellow"
          d="M0 140C151 160 288 153 421 99S596 22 700 70"
        />
      </svg>
    </div>
  );
}
