"use client";

import { useState } from "react";
import type { ExerciseProgress, ExerciseProgressPoint } from "../../application";
import { Badge } from "@open-sharia-enterprise/ts-ui";

export interface ExerciseProgressCardProps {
  name: string;
  progress: ExerciseProgress;
}

// ---------------------------------------------------------------------------
// SVG chart helpers
// ---------------------------------------------------------------------------

/**
 * Map a value in [min, max] to [0, range].
 * When min === max (single point), return mid-range so the dot is centred.
 */
function normalize(value: number, min: number, max: number, range: number): number {
  if (max === min) return range / 2;
  return ((value - min) / (max - min)) * range;
}

function buildPolylinePoints(points: ExerciseProgressPoint[]): string {
  if (points.length === 0) return "";

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);

  return points
    .map((p, i) => {
      const x = points.length === 1 ? 100 : (i / (points.length - 1)) * 200;
      // SVG y-axis is inverted: high weight → low y
      const y = 76 - normalize(p.weight, minW, maxW, 68);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// ExerciseProgressCard
// ---------------------------------------------------------------------------

export function ExerciseProgressCard({ name, progress }: ExerciseProgressCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { points } = progress;
  if (points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  if (!lastPoint) return null;

  const latestWeight = lastPoint.weight;
  const latestIsPR = lastPoint.isPR;
  const lastEstimated1RM = lastPoint.estimated1RM;
  const lastVolume = lastPoint.weight * lastPoint.reps;

  const firstDate = points[0]?.date ?? "";
  const lastDate = lastPoint.date;
  const dateRange = firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;

  // SVG chart
  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const polylinePoints = buildPolylinePoints(points);

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          gap: 8,
          WebkitTapHighlightColor: "transparent",
        }}
        aria-expanded={expanded}
        aria-label={`${name} progress`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--color-foreground)",
            }}
          >
            {name}
          </span>
          {latestIsPR && (
            <Badge hue="teal" variant="outline" size="sm">
              PR
            </Badge>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--hue-teal-ink)",
            }}
          >
            {latestWeight > 0 ? `${latestWeight}kg` : `${lastPoint.reps} reps`}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* SVG weight chart */}
          <div
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              padding: "10px 8px 6px",
              border: "1px solid var(--color-border)",
            }}
          >
            <svg
              viewBox="0 0 200 80"
              style={{ width: "100%", height: 80, overflow: "visible" }}
              aria-label={`Weight progression chart for ${name}`}
            >
              {/* Polyline */}
              {points.length > 1 && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="var(--hue-teal)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => {
                const x = points.length === 1 ? 100 : (i / (points.length - 1)) * 200;
                const y = 76 - normalize(p.weight, minW, maxW, 68);
                return (
                  <g key={`${p.date}-${i}`}>
                    <circle
                      cx={x.toFixed(1)}
                      cy={y.toFixed(1)}
                      r="4"
                      fill={p.isPR ? "var(--hue-teal)" : "var(--color-card)"}
                      stroke="var(--hue-teal)"
                      strokeWidth="2"
                    />
                    {p.isPR && (
                      <text
                        x={x.toFixed(1)}
                        y={(y - 8).toFixed(1)}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--hue-teal-ink)"
                        fontWeight="bold"
                      >
                        ★
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lastEstimated1RM !== null && (
              <div
                style={{
                  flex: 1,
                  minWidth: 80,
                  background: "var(--hue-teal-wash)",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--hue-teal-ink)",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: 2,
                  }}
                >
                  Est. 1RM
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--hue-teal-ink)" }}>
                  {Math.round(lastEstimated1RM)}kg
                </div>
              </div>
            )}

            {lastVolume > 0 && (
              <div
                style={{
                  flex: 1,
                  minWidth: 80,
                  background: "var(--color-background)",
                  borderRadius: 10,
                  padding: "8px 10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: 2,
                  }}
                >
                  Volume
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-foreground)" }}>
                  {Math.round(lastVolume)}kg
                </div>
              </div>
            )}
          </div>

          {/* Date range */}
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              fontWeight: 500,
            }}
          >
            {dateRange}
          </div>
        </div>
      )}
    </div>
  );
}
