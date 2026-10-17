/**
 * The one permanent (308) redirect this plan adds: the retired Learn Overview page moves to the
 * Learn home (decision 38d, [tech-docs/003](../../../../plans/in-progress/ayokoding-learn-revamp-04-learning-experience/tech-docs/003-active-path-and-navigation.md#overview-removal-and-redirect)).
 *
 * **Exact source, no `:path*`.** `source` is the bare `/en/learn/overview` only, so a deeper
 * address under it (`/en/learn/overview/anything`) matches no rule and keeps answering 404 (S31a),
 * and the three-bucket module's blanket-source ban stays true — no rule here can swallow the
 * `courses/` or `paths/` buckets.
 *
 * Spread into `next.config.ts` `redirects()` **after** `courseRehomeRedirects` and **before**
 * `learnThreeBucketRedirects`: the per-course rehome rules must win first, and the six-domain
 * bucket wildcards must stay last (the order the module's own header documents).
 */
export const learnHomeRedirects: Array<{ source: string; destination: string; permanent: boolean }> = [
  { source: "/en/learn/overview", destination: "/en/learn", permanent: true },
];
