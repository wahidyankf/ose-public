// app-shell context — presentation layer published API.
//
// app-shell is the shared-kernel context for cross-cutting UI primitives:
// i18n keys, the UI shell xstate machine, top-level navigation chrome
// (TabBar / SideNav / OverlayTree), the runtime React context that bridges
// PGlite + xstate into React, the entry-logger sheet family, and the home
// page chrome that aggregates views from journal/stats/routine.
//
// Cross-context callers must import only from this barrel; deep imports
// into individual files are forbidden by ESLint boundaries (Phase 8 flip).

export { TRANSLATIONS } from "./translations";
export type { TranslationKey, Lang } from "./translations";

export { useT } from "./use-t";

export { appMachine } from "./app-machine";
export type { ActiveLoggerKind, CompletedSession } from "./app-machine";

export { AppRuntimeProvider, useAppRuntime } from "./app-runtime-context";
export type { AppRuntimeContextValue, AppRuntimeProviderProps } from "./app-runtime-context";

export { TabBar } from "./components/tab-bar";
export { SideNav } from "./components/side-nav";
export { OverlayTree } from "./components/overlay-tree";

export { HomeScreen } from "./components/home/home-screen";
export { KIND_HUE, KIND_ICON, ENTRY_MODULES, kindToHue, kindToIcon } from "./components/home/kind-hue";
