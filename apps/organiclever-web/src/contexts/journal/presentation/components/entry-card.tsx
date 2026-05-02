"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/journal/format-relative-time";
import type { JournalEntry, EntryId } from "../../domain/types";

interface EntryCardProps {
  entry: JournalEntry;
  onEdit: (id: EntryId) => void;
  onDelete: (id: EntryId) => void;
  onBump: (id: EntryId) => void;
}

export function EntryCard({ entry, onEdit, onDelete, onBump }: EntryCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const wasEdited = entry.updatedAt > entry.createdAt;

  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };

  const handleDeleteConfirm = () => {
    setConfirmingDelete(false);
    onDelete(entry.id);
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(false);
  };

  return (
    <li
      data-testid="journal-entry"
      style={{
        listStyle: "none",
        padding: "16px 20px",
        borderRadius: 12,
        border: "1px solid oklch(18% 0.018 60 / 0.18)",
        background: "oklch(99% 0.005 80)",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "oklch(18% 0.018 60)",
            }}
          >
            {entry.name}
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span data-testid="entry-timestamp" style={{ fontSize: 12, color: "oklch(50% 0.01 60)", fontWeight: 500 }}>
              {formatRelativeTime(entry.createdAt)}
            </span>
            {wasEdited && (
              <span
                data-testid="entry-edited-label"
                style={{ fontSize: 12, color: "oklch(50% 0.01 60)", fontWeight: 500 }}
              >
                edited {formatRelativeTime(entry.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <details style={{ marginBottom: 12 }}>
        <summary
          role="button"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#1a7474",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          View payload
        </summary>
        <pre
          data-testid="entry-payload-expanded"
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 8,
            background: "oklch(95% 0.008 80)",
            fontSize: 12,
            fontFamily: "monospace",
            overflow: "auto",
            color: "oklch(25% 0.018 60)",
          }}
        >
          {JSON.stringify(entry.payload, null, 2)}
        </pre>
      </details>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onEdit(entry.id)}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid oklch(18% 0.018 60 / 0.22)",
            background: "none",
            cursor: "pointer",
            color: "oklch(30% 0.018 60)",
            fontFamily: "inherit",
          }}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onBump(entry.id)}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid oklch(18% 0.018 60 / 0.22)",
            background: "none",
            cursor: "pointer",
            color: "oklch(30% 0.018 60)",
            fontFamily: "inherit",
          }}
        >
          Bring to top
        </button>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid oklch(18% 0.018 60 / 0.22)",
              background: "none",
              cursor: "pointer",
              color: "#c0392b",
              fontFamily: "inherit",
            }}
          >
            Delete
          </button>
        ) : (
          <span data-testid="delete-confirm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#c0392b" }}>Are you sure?</span>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#c0392b",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={handleDeleteCancel}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid oklch(18% 0.018 60 / 0.22)",
                background: "none",
                cursor: "pointer",
                color: "oklch(30% 0.018 60)",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </span>
        )}
      </div>
    </li>
  );
}
