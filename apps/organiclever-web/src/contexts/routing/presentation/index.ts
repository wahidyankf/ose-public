// routing context — presentation layer published API.
//
// v0 has no authentication and no profile, so no `/login` or `/profile`
// routes exist today. This index is a placeholder for the disabled-route
// 404 guard component that lands when the routing context grows its
// first surface.
//
// When that happens, this file becomes:
//   export { DisabledRoute } from "./components/disabled-route";
//
// Until then, the context is intentionally empty — the bounded-context
// map keeps a slot reserved so the eventual addition is a one-file
// commit, not a structural change.

export {};
