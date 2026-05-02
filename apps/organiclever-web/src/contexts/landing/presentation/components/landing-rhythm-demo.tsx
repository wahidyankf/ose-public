const HUE: Record<string, string> = {
  workout: "oklch(56% 0.13 195)",
  reading: "oklch(56% 0.13 310)",
  learning: "oklch(64% 0.15 80)",
  meal: "oklch(60% 0.16 35)",
  focus: "oklch(58% 0.13 235)",
};

const WEEK = [
  {
    day: "Mon",
    segs: [["workout", 45] as [string, number], ["reading", 20] as [string, number], ["meal", 12] as [string, number]],
  },
  {
    day: "Tue",
    segs: [
      ["reading", 30] as [string, number],
      ["learning", 45] as [string, number],
      ["focus", 90] as [string, number],
      ["meal", 10] as [string, number],
    ],
  },
  {
    day: "Wed",
    segs: [["workout", 50] as [string, number], ["focus", 60] as [string, number], ["meal", 14] as [string, number]],
  },
  {
    day: "Thu",
    segs: [["reading", 25] as [string, number], ["learning", 30] as [string, number], ["meal", 12] as [string, number]],
  },
  {
    day: "Fri",
    segs: [
      ["workout", 40] as [string, number],
      ["focus", 120] as [string, number],
      ["reading", 15] as [string, number],
    ],
    today: true,
  },
  {
    day: "Sat",
    segs: [
      ["reading", 45] as [string, number],
      ["meal", 18] as [string, number],
      ["meal", 22] as [string, number],
      ["learning", 25] as [string, number],
    ],
  },
  {
    day: "Sun",
    segs: [
      ["learning", 60] as [string, number],
      ["reading", 30] as [string, number],
      ["focus", 45] as [string, number],
    ],
  },
];

const totalMins = WEEK.reduce((n, d) => n + d.segs.reduce((m, s) => m + s[1], 0), 0);
const totalEvents = WEEK.reduce((n, d) => n + d.segs.length, 0);
const maxDay = Math.max(...WEEK.map((d) => d.segs.reduce((m, s) => m + s[1], 0)));

export function LandingRhythmDemo() {
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
          A week, in colors
        </div>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          See the week,
          <br />
          not just the workout.
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
          Every event becomes a stroke in your weekly rhythm. Colors map to type, height maps to time. Skim it in two
          seconds — or drill into any day for the long version.
        </p>
      </div>

      <div
        style={{
          marginTop: 48,
          background: "oklch(97% 0.008 80)",
          border: "1px solid oklch(18% 0.018 60 / 0.18)",
          borderRadius: 20,
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingBottom: 14,
            borderBottom: "1px solid oklch(18% 0.018 60 / 0.18)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "oklch(18% 0.018 60)",
            }}
          >
            Last 7 days
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "oklch(62% 0.012 70)",
            }}
          >
            Sample · April 14–20
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
            alignItems: "end",
            height: 200,
          }}
        >
          {WEEK.map((d) => {
            const dayTotal = d.segs.reduce((n, s) => n + s[1], 0);
            const h = (dayTotal / maxDay) * 100;
            return (
              <div
                key={d.day}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    height: `${h}%`,
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: 2,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {d.segs.map(([t, m], i) => (
                    <div key={i} title={`${t} · ${m}m`} style={{ flex: m, background: HUE[t] }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
            marginTop: 10,
          }}
        >
          {WEEK.map((d) => (
            <div
              key={d.day}
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: d.today ? "var(--hue-teal)" : "oklch(62% 0.012 70)",
                paddingTop: 10,
                borderTop: "1px solid oklch(18% 0.018 60 / 0.18)",
              }}
            >
              {d.day}
              {d.today && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 2,
                    color: "var(--hue-teal)",
                    letterSpacing: 0,
                    textTransform: "none",
                  }}
                >
                  today
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            marginTop: 22,
            paddingTop: 18,
            borderTop: "1px solid oklch(18% 0.018 60 / 0.18)",
          }}
        >
          {(
            [
              ["workout", "Workout"],
              ["reading", "Reading"],
              ["learning", "Learning"],
              ["meal", "Meal"],
              ["focus", "Focus"],
            ] as [string, string][]
          ).map(([k, l]) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "oklch(42% 0.015 70)",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: HUE[k],
                }}
              />
              {l}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 24,
          }}
          className="[grid-template-columns:repeat(4,1fr)] max-sm:grid-cols-2"
        >
          {(
            [
              [String(totalEvents), "Events logged"],
              [`${Math.round(totalMins / 60)}h`, "Time tracked"],
              ["5/5", "Modules touched"],
              ["7d", "Active streak"],
            ] as [string, string][]
          ).map(([v, l]) => (
            <div
              key={l}
              style={{
                padding: "18px 18px",
                background: "white",
                borderRadius: 14,
                border: "1px solid oklch(18% 0.018 60 / 0.18)",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "oklch(18% 0.018 60)",
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "oklch(62% 0.012 70)",
                  marginTop: 6,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
