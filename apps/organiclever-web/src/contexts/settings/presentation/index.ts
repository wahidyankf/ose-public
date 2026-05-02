// settings context — presentation layer published API.
//
// Consumers (e.g. `src/app/app/settings/page.tsx`, app shell) import the
// `SettingsScreen` component and the `useSettings` hook from here. Internal
// hook state types stay private to this layer.

export { useSettings } from "./use-settings";
export type { SettingsState } from "./use-settings";
export { SettingsScreen } from "./components/settings-screen";
export type { SettingsScreenProps } from "./components/settings-screen";
