"use client";

import { Icon } from "@open-sharia-enterprise/ts-ui";
import type { Routine } from "@/lib/journal/routine-store";

interface RoutineCardProps {
  routine: Routine;
  onStart: () => void;
  onEdit: () => void;
}

/**
 * Card displaying a workout routine with start (tap main area) and edit (pencil button) actions.
 */
export function RoutineCard({ routine, onStart, onEdit }: RoutineCardProps) {
  const exerciseCount = routine.groups.reduce((n, g) => n + g.exercises.length, 0);
  const groupCount = routine.groups.length;
  const { hue } = routine;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--color-card)",
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 100ms",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      {/* Main tappable area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }} onClick={onStart}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `var(--hue-${hue})`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="dumbbell" size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {routine.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""} · {groupCount} group{groupCount !== 1 ? "s" : ""}
          </div>
        </div>
        <Icon name="chevron-right" size={18} />
      </div>

      {/* Edit strip */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          width: 48,
          alignSelf: "stretch",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderLeft: "1px solid var(--color-border)",
          cursor: "pointer",
          color: "var(--color-muted-foreground)",
          flexShrink: 0,
        }}
        aria-label={`Edit ${routine.name}`}
      >
        <Icon name="pencil" size={16} />
      </button>
    </div>
  );
}
