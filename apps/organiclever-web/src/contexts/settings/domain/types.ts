// settings context — domain layer.
//
// Pure types only — no `effect`, no IO, no infrastructure imports.
// `RestSeconds` and `Lang` are value-typed enumerations of allowed
// preference values; `AppSettings` is the singleton aggregate that
// represents the user's persisted preferences.
//
// `RestSeconds`:
//   - "reps"  — rest equals the set's rep count, in seconds
//   - "reps2" — rest equals 2 x the set's rep count, in seconds
//   - 0 / 30 / 60 / 90 — fixed-duration rest, in seconds
//
// `Lang`:
//   - "en" — English (default)
//   - "id" — Bahasa Indonesia

export type RestSeconds = "reps" | "reps2" | 0 | 30 | 60 | 90;
export type Lang = "en" | "id";

export interface AppSettings {
  name: string;
  restSeconds: RestSeconds;
  darkMode: boolean;
  lang: Lang;
}
