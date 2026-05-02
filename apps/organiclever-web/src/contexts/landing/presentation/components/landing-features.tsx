const MODULES = [
  {
    hue: "oklch(56% 0.13 195)",
    bg: "oklch(56% 0.13 195 / 0.10)",
    name: "Workouts",
    ic: "🏋️",
    desc: "Sets, reps, PRs, rest timer.",
    ex: "Kettlebell · 12 sets · 42 min",
  },
  {
    hue: "oklch(56% 0.13 310)",
    bg: "oklch(56% 0.13 310 / 0.10)",
    name: "Reading",
    ic: "📚",
    desc: "Books, pages, time read.",
    ex: "Atomic Habits · 28 pages",
  },
  {
    hue: "oklch(64% 0.15 80)",
    bg: "oklch(64% 0.15 80 / 0.10)",
    name: "Learning",
    ic: "🧠",
    desc: "Courses, languages, notes.",
    ex: "React patterns · 35 min",
  },
  {
    hue: "oklch(60% 0.16 35)",
    bg: "oklch(60% 0.16 35 / 0.10)",
    name: "Meals",
    ic: "🍽️",
    desc: "What you ate, when.",
    ex: "Nasi goreng · breakfast",
  },
  {
    hue: "oklch(58% 0.13 235)",
    bg: "oklch(58% 0.13 235 / 0.10)",
    name: "Focus",
    ic: "⏱️",
    desc: "Deep work, pomodoros.",
    ex: "Deep work · 90 min",
  },
];

export function LandingFeatures() {
  return (
    <section
      data-reveal
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingTop: 60,
        paddingBottom: 100,
        borderTop: "1px solid oklch(18% 0.018 60 / 0.18)",
      }}
      className="px-10 max-sm:px-5 max-sm:py-12"
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
          Five event types · plus your own
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Out of the box,
          <br />
          or roll your own.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            lineHeight: 1.65,
            color: "oklch(42% 0.015 70)",
            maxWidth: 560,
            marginTop: 18,
          }}
        >
          Each built-in type has its own structure, color, and analytics. Reading tracks pages and books. Workouts track
          sets and PRs. Meals track what you ate. They all stack into one weekly rhythm.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 2,
          marginTop: 48,
          border: "1px solid oklch(18% 0.018 60 / 0.20)",
          borderRadius: 20,
          overflow: "hidden",
        }}
        className="[grid-template-columns:repeat(5,1fr)] max-sm:grid-cols-1"
      >
        {MODULES.map((m) => (
          <div
            key={m.name}
            style={{
              padding: "28px 22px",
              background: "oklch(97% 0.008 80)",
              borderRight: "1px solid oklch(18% 0.018 60 / 0.18)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 18,
                background: m.bg,
              }}
            >
              {m.ic}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                marginBottom: 10,
                color: m.hue,
              }}
            >
              {m.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                lineHeight: 1.6,
                color: "oklch(42% 0.015 70)",
              }}
            >
              {m.desc}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid oklch(18% 0.018 60 / 0.18)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                color: "oklch(62% 0.012 70)",
                letterSpacing: ".02em",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: m.hue,
                  flexShrink: 0,
                }}
              />
              {m.ex}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "22px 28px",
          border: "1px dashed oklch(18% 0.018 60 / 0.18)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: "oklch(97% 0.008 80)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1.5px solid oklch(18% 0.018 60)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 900,
            color: "oklch(18% 0.018 60)",
            flexShrink: 0,
          }}
        >
          +
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "oklch(42% 0.015 70)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "oklch(18% 0.018 60)", fontWeight: 700 }}>Plus your own.</strong> Spin up a custom
          event type for anything else — meditation, sleep, journaling, screen time, water — with your own fields and
          color.
        </div>
      </div>
    </section>
  );
}
