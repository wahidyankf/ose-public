const PRINCIPLES: [string, string][] = [
  ["Local-first", "Your data lives on your device. No accounts required, no cloud lock-in. Sync is opt-in, later."],
  [
    "Yours to take",
    "Data export and import are on the roadmap — your history belongs to you, in a format you can read.",
  ],
  [
    "Flexible",
    "Five built-in event types, plus custom types you define. Track meditation, sleep, journaling — whatever matters.",
  ],
  ["Quiet", "Patterns surface in the background. The app gets out of the way until you need it."],
  ["Open", "Source on GitHub. Fork it, run it, make it yours. We build in the open."],
  ["Multilingual", "Full UI in English and Bahasa Indonesia. Toggle in Settings."],
];

export function LandingPrinciples() {
  return (
    <section
      data-reveal
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingBottom: 100,
      }}
      className="px-10 max-sm:px-5 max-sm:pb-20"
    >
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--hue-teal)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "block",
              width: 20,
              height: 2,
              background: "var(--hue-teal)",
              borderRadius: 1,
            }}
          />
          Principles
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Built for people who
          <br />
          want to pay attention.
        </h2>
      </div>

      <div
        style={{
          marginTop: 48,
          border: "1px solid oklch(18% 0.018 60 / 0.20)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {PRINCIPLES.map(([title, desc], i) => (
          <div
            key={title}
            style={{
              display: "grid",
              gap: 20,
              padding: "24px 28px",
              background: "oklch(97% 0.008 80)",
              borderBottom: i < PRINCIPLES.length - 1 ? "1px solid oklch(18% 0.018 60 / 0.18)" : "none",
              alignItems: "baseline",
            }}
            className="[grid-template-columns:72px_1fr_1.5fr] max-sm:grid-cols-1 max-sm:gap-2"
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--hue-teal)",
                letterSpacing: ".04em",
              }}
            >
              № {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "oklch(18% 0.018 60)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                lineHeight: 1.6,
                color: "oklch(42% 0.015 70)",
              }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
