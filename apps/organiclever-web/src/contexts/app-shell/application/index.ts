// app-shell context — application layer published API.
//
// Cross-context bootstrap orchestration. The seed routine pre-populates
// the journal, routine, and settings contexts on first launch via each
// context's published `application/index.ts` barrel — the only kind of
// cross-context infrastructure-shaped composition the layer rules permit
// (application → application is allowed across contexts; the seed itself
// is application-layer because it composes use-cases, not because it
// owns persistence).

export { seedIfEmpty } from "./seed";
