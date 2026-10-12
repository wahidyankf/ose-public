# Course Status and Path Model

Rules PM1–PM3 from plan `ayokoding-learn-revamp-02-path-model`: the durable content-author
obligations behind the outline marker, core closure, and the prerequisite rubric. The temporary
`restructurePendingIn` marker is not a rule: it is a closed, code-owned exception owned by plans
06 and 07 and enforced by the skills-restructure allowlist and marker-usage tests.

## PM1 — Courses under 1,000 words carry the outline marker

A course whose Markdown files total fewer than 1,000 words MUST carry `status: outline` in its
`apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`; a course that reaches the
definition of done MUST drop it.

- **Reason**: readers and the Outline badge must tell skeleton courses from complete ones.
- **Violating**: a 508-word course whose `_index.md` has no `status` key.
- **Conforming**: the same course with `status: outline` directly after `prerequisites`.
- **Enforcement**: `gated` by
  `apps/ayokoding-www/tests/unit/features/content/course-frontmatter.unit.test.ts`
  (guard "marks every course under 1000 words with status outline").

## PM2 — Core closure holds and `assumes` lists nothing else

A path manifest's core MUST list every prerequisite of each core course earlier in the path or
in `assumes`, and `assumes` MUST list nothing else. This binds every manifest without the skills
restructure marker.

- **Reason**: core closure guarantees each core course's prerequisites are met earlier or
  explicitly assumed; an exact `assumes` keeps the "Before you start" note truthful.
- **Violating**: a core course whose prerequisite is neither earlier in the path nor in `assumes`.
- **Conforming**: the same course with that prerequisite listed in `assumes`.
- **Enforcement**: `gated` by
  `apps/ayokoding-www/tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts`
  (zero violations over the 8 real manifests with real frontmatter).

## PM3 — Prerequisites list only true conceptual dependencies (rubric judgement)

A course's `prerequisites` MUST list only true conceptual dependencies, judged by the rubric in
`tech-docs/003-prerequisite-rubric-and-evidence.md` of plan `ayokoding-learn-revamp-02-path-model`
(under `plans/in-progress/` during execution, archived under `plans/done/`).

- **Reason**: prerequisites must reflect real conceptual dependencies, otherwise closure and
  ordering checks certify a meaningless graph.
- **Violating**: `just-enough-python` listing `capstone-forge-ready` (the rubric's R-OPTIONAL
  row: "recommended but not required" is not a dependency).
- **Conforming**: `just-enough-python` listing no prerequisite.
- **Disposition**: `unenforced by decision` — "true conceptual dependency" is rubric judgement
  no mechanical check can settle without reading intent (ruled unfalsifiable by design in the
  placement record); the closure and ordering tests catch only its effects.
