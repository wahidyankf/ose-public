"use client";

import { useState } from "react";
import { Schema } from "effect";
import { EntryName } from "@/lib/journal/schema";
import type { JournalEntry, NewEntryInput, UpdateEntryInput } from "@/lib/journal/types";

const PRESET_NAMES = ["workout", "reading", "meditation"] as const;

interface DraftState {
  name: string;
  payloadText: string;
  error: string | null;
}

function makeEmptyDraft(): DraftState {
  return { name: "", payloadText: "{}", error: null };
}

function validateDraft(
  draft: DraftState,
): { valid: true; name: string; payload: Record<string, unknown> } | { valid: false; error: string } {
  if (draft.name.trim() === "") {
    return { valid: false, error: "Name is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(draft.payloadText);
  } catch {
    return { valid: false, error: "Payload must be valid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { valid: false, error: "Payload must be a JSON object" };
  }

  return { valid: true, name: draft.name.trim(), payload: parsed as Record<string, unknown> };
}

export type EntryFormSheetProps =
  | { open: true; mode: "create"; onSubmit: (drafts: NewEntryInput[]) => void; onCancel: () => void }
  | {
      open: true;
      mode: "edit";
      initial: JournalEntry;
      onSubmit: (patch: UpdateEntryInput) => void;
      onCancel: () => void;
    }
  | { open: false };

export function EntryFormSheet(props: EntryFormSheetProps) {
  const isEdit = props.open && props.mode === "edit";

  const [createDrafts, setCreateDrafts] = useState<DraftState[]>([makeEmptyDraft()]);
  const [editDraft, setEditDraft] = useState<DraftState>({ name: "", payloadText: "{}", error: null });

  // Sync edit draft from initial when opening in edit mode
  const [lastInitialId, setLastInitialId] = useState<string | null>(null);
  if (isEdit) {
    const entry = (props as Extract<EntryFormSheetProps, { open: true; mode: "edit" }>).initial;
    if (entry.id !== lastInitialId) {
      setLastInitialId(entry.id);
      setEditDraft({
        name: entry.name,
        payloadText: JSON.stringify(entry.payload, null, 2),
        error: null,
      });
    }
  }

  if (!props.open) {
    return null;
  }

  const handleCancel = () => {
    setCreateDrafts([makeEmptyDraft()]);
    props.onCancel();
  };

  if (props.mode === "create") {
    const handleAddDraft = () => {
      setCreateDrafts((prev) => [...prev, makeEmptyDraft()]);
    };

    const handleRemoveDraft = (index: number) => {
      setCreateDrafts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDraftChange = (index: number, field: "name" | "payloadText", value: string) => {
      setCreateDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value, error: null } : d)));
    };

    const handlePresetClick = (index: number, preset: string) => {
      setCreateDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, name: preset, error: null } : d)));
    };

    const handleSubmit = () => {
      const results = createDrafts.map(validateDraft);
      const hasError = results.some((r) => !r.valid);

      if (hasError) {
        setCreateDrafts((prev) =>
          prev.map((d, i) => {
            const r = results[i];
            return r && !r.valid ? { ...d, error: r.error } : d;
          }),
        );
        return;
      }

      const validInputs: NewEntryInput[] = results.map((r) => {
        if (!r.valid) throw new Error("Unexpected invalid result");
        return {
          name: Schema.decodeUnknownSync(EntryName)(r.name),
          payload: r.payload,
        };
      });

      setCreateDrafts([makeEmptyDraft()]);
      props.onSubmit(validInputs);
    };

    return (
      <div
        data-testid="entry-form-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Add entries"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(18% 0.018 60 / 0.5)",
        }}
      >
        <div
          style={{
            background: "oklch(99% 0.005 80)",
            borderRadius: 16,
            padding: "28px 32px",
            width: "100%",
            maxWidth: 560,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px oklch(18% 0.018 60 / 0.25)",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 20,
              color: "oklch(18% 0.018 60)",
            }}
          >
            Add entries
          </h2>

          {createDrafts.map((draft, index) => (
            <div
              key={index}
              data-testid="draft-item"
              style={{
                marginBottom: 20,
                padding: "16px 20px",
                border: "1px solid oklch(18% 0.018 60 / 0.18)",
                borderRadius: 12,
                background: "oklch(97% 0.008 80)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "oklch(42% 0.10 80)" }}>Entry {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDraft(index)}
                  disabled={createDrafts.length === 1}
                  aria-label="Remove draft"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: "1px solid oklch(18% 0.018 60 / 0.22)",
                    background: "none",
                    cursor: createDrafts.length === 1 ? "not-allowed" : "pointer",
                    color: createDrafts.length === 1 ? "oklch(60% 0.01 60)" : "#c0392b",
                    opacity: createDrafts.length === 1 ? 0.5 : 1,
                  }}
                >
                  Remove draft
                </button>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  htmlFor={`draft-name-${index}`}
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "oklch(30% 0.018 60)",
                  }}
                >
                  Name
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {PRESET_NAMES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(index, preset)}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                        border: "1px solid #1a7474",
                        background: draft.name === preset ? "#1a7474" : "none",
                        color: draft.name === preset ? "#fff" : "#1a7474",
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  id={`draft-name-${index}`}
                  type="text"
                  value={draft.name}
                  onChange={(e) => handleDraftChange(index, "name", e.target.value)}
                  placeholder="e.g. workout"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid oklch(18% 0.018 60 / 0.22)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label
                  htmlFor={`draft-payload-${index}`}
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "oklch(30% 0.018 60)",
                  }}
                >
                  Payload (JSON object)
                </label>
                <textarea
                  id={`draft-payload-${index}`}
                  value={draft.payloadText}
                  onChange={(e) => handleDraftChange(index, "payloadText", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid oklch(18% 0.018 60 / 0.22)",
                    fontSize: 13,
                    fontFamily: "monospace",
                    background: "#fff",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {draft.error !== null && (
                <div
                  data-testid="field-error"
                  role="alert"
                  style={{
                    fontSize: 13,
                    color: "#c0392b",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {draft.error}
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddDraft}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "#1a7474",
              background: "none",
              border: "1px dashed #1a7474",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            + Add another
          </button>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid oklch(18% 0.018 60 / 0.22)",
                background: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                color: "oklch(30% 0.018 60)",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#1a7474",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  const editProps = props as Extract<EntryFormSheetProps, { open: true; mode: "edit" }>;

  const handleEditChange = (field: "name" | "payloadText", value: string) => {
    setEditDraft((prev) => ({ ...prev, [field]: value, error: null }));
  };

  const handleEditSubmit = () => {
    const result = validateDraft(editDraft);
    if (!result.valid) {
      setEditDraft((prev) => ({ ...prev, error: result.error }));
      return;
    }

    const patch: UpdateEntryInput = {
      name: Schema.decodeUnknownSync(EntryName)(result.name),
      payload: result.payload,
    };
    editProps.onSubmit(patch);
  };

  return (
    <div
      data-testid="entry-form-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Edit entry"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(18% 0.018 60 / 0.5)",
      }}
    >
      <div
        style={{
          background: "oklch(99% 0.005 80)",
          borderRadius: 16,
          padding: "28px 32px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px oklch(18% 0.018 60 / 0.25)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 20,
            color: "oklch(18% 0.018 60)",
          }}
        >
          Edit entry
        </h2>

        <div data-testid="draft-item">
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="edit-name"
              style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "oklch(30% 0.018 60)" }}
            >
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={editDraft.name}
              onChange={(e) => handleEditChange("name", e.target.value)}
              placeholder="e.g. workout"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid oklch(18% 0.018 60 / 0.22)",
                fontSize: 14,
                fontFamily: "inherit",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="edit-payload"
              style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "oklch(30% 0.018 60)" }}
            >
              Payload (JSON object)
            </label>
            <textarea
              id="edit-payload"
              value={editDraft.payloadText}
              onChange={(e) => handleEditChange("payloadText", e.target.value)}
              rows={6}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid oklch(18% 0.018 60 / 0.22)",
                fontSize: 13,
                fontFamily: "monospace",
                background: "#fff",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {editDraft.error !== null && (
            <div
              data-testid="field-error"
              role="alert"
              style={{
                fontSize: 13,
                color: "#c0392b",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {editDraft.error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid oklch(18% 0.018 60 / 0.22)",
              background: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              color: "oklch(30% 0.018 60)",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEditSubmit}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#1a7474",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
