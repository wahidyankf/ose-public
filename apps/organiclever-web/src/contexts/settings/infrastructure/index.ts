// settings context — infrastructure layer published API.
//
// Re-exports the PGlite-backed use-case implementations. Application-layer
// callers should normally import from `@/contexts/settings/application`,
// not directly from infrastructure. This barrel exists so the application
// layer can wire up the implementation without reaching into a private file
// path; consumers outside the context should not import from here.

export { getSettings, saveSettings } from "./settings-store";
