interface LandingHeroProps {
  onGoApp: () => void;
}

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.37c1.29.07 2.18.74 2.93.8 1.12-.21 2.19-.91 3.39-.84 1.44.12 2.53.66 3.22 1.67-2.99 1.77-2.45 5.77.34 6.95-.63 1.52-1.42 3.01-1.88 4.33M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="m3.18 23.76 9.13-9.13-9.05-9.05a2.5 2.5 0 0 0-.08 18.18zM21.28 10.5l-2.41-1.38-2.57 2.57 2.66 2.66 2.32-1.34a1.75 1.75 0 0 0 0-3.51zM2.1 1.5a2.5 2.5 0 0 0-.43 1.39v18.23a2.5 2.5 0 0 0 .43 1.39l.11.1L13 12.72v-.24L2.21 1.4zM13.31 13l2.91-2.91 3.67 2.1-3.67 2.1z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function LandingHero({ onGoApp }: LandingHeroProps) {
  return (
    <section
      style={{
        padding: "80px 40px 100px",
        display: "grid",
        gridTemplateColumns: "1fr",
        maxWidth: 900,
        margin: "0 auto",
      }}
      className="max-sm:px-6 max-sm:pt-12 max-sm:pb-20"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--hue-teal)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "block",
              width: 28,
              height: 2,
              background: "var(--hue-teal)",
              borderRadius: 1,
            }}
          />
          Personal life-event tracker
        </div>

        <h1
          style={{
            fontSize: "clamp(3rem, 6vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
          }}
        >
          Your life,
          <br />
          <span className="ac">tracked.</span>
          <br />
          <span className="ac2">Analyzed.</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            lineHeight: 1.65,
            color: "#3d3630",
            maxWidth: 620,
          }}
        >
          Life is a collection of events that shape who you become. OrganicLever is a personal journal for everything
          you do — workouts, reading, learning, meals, focus blocks — plus anything else you&apos;d like to track.
          Logged on your device, quietly analyzed.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button
            onClick={onGoApp}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 32px",
              borderRadius: 14,
              backgroundColor: "#1a7474",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: 17,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              alignSelf: "flex-start",
            }}
          >
            <PlayIcon /> Open the app
          </button>

          <div
            style={{
              fontSize: 13,
              color: "#3d3630",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚡</span> Free · works offline · no sign-up
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid oklch(18% 0.018 60 / 0.12)",
                background: "oklch(97% 0.008 80)",
                fontSize: 12,
                fontWeight: 700,
                color: "#3d3630",
              }}
            >
              <AppleIcon /> iOS — coming soon
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid oklch(18% 0.018 60 / 0.12)",
                background: "oklch(97% 0.008 80)",
                fontSize: 12,
                fontWeight: 700,
                color: "#3d3630",
              }}
            >
              <AndroidIcon /> Android — coming soon
            </span>
            <a
              href="https://github.com/wahidyankf/ose-public"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid oklch(18% 0.018 60 / 0.12)",
                background: "oklch(97% 0.008 80)",
                fontSize: 12,
                fontWeight: 700,
                color: "#3d3630",
              }}
            >
              <GithubIcon /> Open source
            </a>
            <a
              href="https://github.com/wahidyankf/ose-public/fork"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid oklch(18% 0.018 60 / 0.12)",
                background: "oklch(97% 0.008 80)",
                fontSize: 12,
                fontWeight: 700,
                color: "#3d3630",
              }}
            >
              <GithubIcon /> Fork &amp; make it yours
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
