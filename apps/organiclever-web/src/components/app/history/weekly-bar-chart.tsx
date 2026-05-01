"use client";

import type { DayEntry } from "@/lib/journal/stats";

interface WeeklyBarChartProps {
  last7Days: ReadonlyArray<DayEntry>;
}

/**
 * 7-day activity bar chart displayed at the top of the History screen.
 *
 * Each column renders a proportionally scaled bar whose height is derived
 * from durationMins relative to the weekly maximum. Today's column uses the
 * accent teal colour; prior days use the lighter teal-wash. An empty day
 * renders a minimal placeholder stub.
 */
export function WeeklyBarChart({ last7Days }: WeeklyBarChartProps) {
  const today = new Date().toDateString();
  const maxMins = Math.max(...last7Days.map((d) => d.durationMins), 1);

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 20,
        padding: "16px 16px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        This week
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {last7Days.map((d, i) => {
          const isToday = d.date.toDateString() === today;
          const hasActivity = d.sessions > 0;
          // Scale: active days get min 4px, empty days get 0px
          const barHeight = hasActivity ? Math.max(4, Math.round((d.durationMins / maxMins) * 72)) : 0;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              {/* Bar area: fixed 72px inner height + 8px for label */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  height: 72,
                }}
              >
                {/* Duration label above bar */}
                {hasActivity && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: barHeight + 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: isToday ? "var(--hue-teal-ink)" : "var(--color-muted-foreground)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Math.round(d.durationMins)}m
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{
                    width: "70%",
                    height: `${hasActivity ? barHeight : 3}px`,
                    borderRadius: 6,
                    background: hasActivity
                      ? isToday
                        ? "var(--hue-teal)"
                        : "var(--hue-teal-wash)"
                      : "var(--warm-100)",
                    border: hasActivity ? "none" : "1px solid var(--warm-200)",
                    transition: "height 400ms ease-out",
                  }}
                />
              </div>

              {/* Day label */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? "var(--hue-teal-ink)" : "var(--color-muted-foreground)",
                }}
              >
                {d.label}
              </div>

              {/* Multiple-session dot indicator */}
              {d.sessions > 1 && (
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--hue-teal)",
                    marginTop: -4,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
