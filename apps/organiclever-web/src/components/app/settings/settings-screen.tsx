"use client";

import { useState, useCallback } from "react";
import { Input, Toggle, Alert, AlertDescription, InfoTip } from "@open-sharia-enterprise/ts-ui";
import type { JournalRuntime } from "@/lib/journal/runtime";
import { useSettings } from "@/lib/journal/use-settings";
import { saveSettings } from "@/lib/journal/settings-store";
import type { RestSeconds, Lang } from "@/lib/journal/settings-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsScreenProps {
  runtime: JournalRuntime;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

// ---------------------------------------------------------------------------
// Rest chip configuration
// ---------------------------------------------------------------------------

const REST_CHIPS: Array<{ value: RestSeconds; label: string }> = [
  { value: "reps", label: "Per reps" },
  { value: "reps2", label: "Per reps \xD72" },
  { value: 0, label: "Off" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
];

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------

export function SettingsScreen({ runtime, darkMode, onToggleDarkMode }: SettingsScreenProps) {
  const { state, update } = useSettings(runtime);
  const [savedToast, setSavedToast] = useState(false);

  const showSaved = useCallback(() => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  }, []);

  const handleNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.value.trim();
      if (state.status === "ready" && name !== state.settings.name) {
        update({ name })
          .then(() => showSaved())
          .catch(() => {});
      }
    },
    [state, update, showSaved],
  );

  const handleRestChipClick = useCallback(
    (value: RestSeconds) => {
      update({ restSeconds: value })
        .then(() => showSaved())
        .catch(() => {});
    },
    [update, showSaved],
  );

  const handleLangClick = useCallback(
    (lang: Lang) => {
      runtime
        .runPromise(saveSettings({ lang }))
        .then(() => window.location.reload())
        .catch(() => {});
    },
    [runtime],
  );

  // Derive display values — fall back to defaults during load
  const name = state.status === "ready" ? state.settings.name : "";
  const restSeconds: RestSeconds = state.status === "ready" ? state.settings.restSeconds : 60;
  const lang: Lang = state.status === "ready" ? state.settings.lang : "en";
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <div data-testid="settings-screen" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Page heading */}
      <div style={{ padding: "20px 20px 4px" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            color: "var(--color-foreground)",
          }}
        >
          Settings
        </div>
      </div>

      <div
        style={{
          padding: "12px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Profile hero */}
        <div
          style={{
            background: "var(--warm-50)",
            borderRadius: 20,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-foreground)",
              color: "var(--color-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {initial}
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.01em",
                color: "var(--color-foreground)",
              }}
            >
              {name || "—"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-muted-foreground)",
                marginTop: 2,
              }}
            >
              OrganicLever · local
            </div>
          </div>
        </div>

        {/* Profile section */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
            }}
          >
            Profile
          </div>
          <div>
            <label
              htmlFor="settings-name"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--color-foreground)",
              }}
            >
              Your name
            </label>
            <Input
              id="settings-name"
              data-testid="settings-name-input"
              defaultValue={name}
              key={name}
              placeholder="e.g. Wahid"
              onBlur={handleNameBlur}
            />
          </div>
        </div>

        {/* Workout defaults section */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
            }}
          >
            Workout defaults
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                }}
              >
                Rest between sets
              </span>
              <InfoTip
                title="Rest between sets"
                text={
                  'How long to rest between sets. "Per reps" uses each exercise\'s rep count as seconds — e.g. 20 reps → 20 s rest. Can be overridden per exercise in the routine editor.'
                }
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} data-testid="rest-chips">
              {REST_CHIPS.map(({ value, label }) => {
                const isActive = restSeconds === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    data-testid={`rest-chip-${String(value)}`}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => handleRestChipClick(value)}
                    style={{
                      minHeight: 36,
                      padding: "0 12px",
                      borderRadius: 10,
                      fontFamily: "inherit",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 150ms",
                      border: isActive ? "2px solid var(--hue-teal)" : "1px solid var(--color-border)",
                      background: isActive ? "var(--hue-teal-wash)" : "var(--color-card)",
                      color: isActive ? "var(--hue-teal-ink)" : "var(--color-foreground)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted-foreground)",
                marginTop: 8,
              }}
            >
              &quot;Per reps&quot; uses each exercise&apos;s rep count as the rest duration in seconds. Can be
              overridden per exercise in routine settings.
            </div>
          </div>
        </div>

        {/* Language section */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
            }}
          >
            Language / Bahasa
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(
              [
                ["en", "English"],
                ["id", "Bahasa"],
              ] as Array<[Lang, string]>
            ).map(([code, label]) => {
              const isActive = lang === code || (code === "en" && !lang);
              return (
                <button
                  key={code}
                  type="button"
                  data-testid={`lang-btn-${code}`}
                  data-active={isActive ? "true" : "false"}
                  onClick={() => handleLangClick(code)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 12,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    transition: "all 150ms",
                    border: "1px solid",
                    borderColor: isActive ? "var(--hue-teal)" : "var(--color-border)",
                    background: isActive ? "var(--hue-teal-wash)" : "var(--color-card)",
                    color: isActive ? "var(--hue-teal-ink)" : "var(--color-foreground)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance section */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
            }}
          >
            Appearance
          </div>
          <Toggle value={darkMode} onChange={onToggleDarkMode} label="Dark mode" />
        </div>

        {/* Data section */}
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
            }}
          >
            Data
          </div>
          <Alert variant="info">
            <AlertDescription>
              All data is stored on this device only (local PGlite/IndexedDB). Nothing leaves your device.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Saved toast */}
      {savedToast && (
        <div
          data-testid="saved-toast"
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--hue-sage-wash)",
            color: "var(--hue-sage-ink)",
            border: "1px solid var(--hue-sage)",
            borderRadius: 10,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: "none",
            zIndex: 9999,
            animation: "fadeIn 150ms ease-out",
          }}
        >
          Saved
        </div>
      )}
    </div>
  );
}
