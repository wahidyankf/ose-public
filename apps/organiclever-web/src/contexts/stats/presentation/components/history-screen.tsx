"use client";

import { useState, useEffect } from "react";
import { Icon } from "@open-sharia-enterprise/ts-ui";
import { getLast7Days } from "../../application";
import { listEntries } from "@/contexts/journal/application";
import type { JournalRuntime } from "@/contexts/journal/application";
import type { JournalEntry } from "@/contexts/journal/application";
import type { DayEntry } from "../../application";
import { WeeklyBarChart } from "./weekly-bar-chart";
import { SessionCard } from "./session-card";

interface HistoryScreenProps {
  runtime: JournalRuntime;
  refreshKey?: number;
}

/**
 * History screen: weekly activity bar chart + reverse-chronological session list.
 *
 * Data is loaded on mount and whenever `refreshKey` changes so that newly
 * logged entries appear immediately after the user returns to this tab.
 */
export function HistoryScreen({ runtime, refreshKey }: HistoryScreenProps) {
  const [last7Days, setLast7Days] = useState<ReadonlyArray<DayEntry>>([]);
  const [entries, setEntries] = useState<ReadonlyArray<JournalEntry>>([]);

  useEffect(() => {
    runtime
      .runPromise(getLast7Days())
      .then(setLast7Days)
      .catch(() => {});

    runtime
      .runPromise(listEntries())
      .then(setEntries)
      .catch(() => {});
  }, [runtime, refreshKey]);

  // listEntries returns newest-first (ORDER BY created_at DESC) — the list is
  // already reverse-chronological. Re-slice into a plain array for mapping.
  const sortedEntries = [...entries];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 16px 96px",
        minHeight: "100%",
      }}
    >
      {/* Heading */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--color-foreground)",
          margin: 0,
        }}
      >
        History
      </h1>

      {/* Weekly bar chart */}
      {last7Days.length > 0 && <WeeklyBarChart last7Days={last7Days} />}

      {/* Session list */}
      {sortedEntries.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedEntries.map((entry) => (
            <SessionCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "48px 16px",
            color: "var(--color-muted-foreground)",
            textAlign: "center",
          }}
        >
          <span style={{ opacity: 0.4 }}>
            <Icon name="clipboard" size={40} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>No sessions yet.</span>
        </div>
      )}
    </div>
  );
}
