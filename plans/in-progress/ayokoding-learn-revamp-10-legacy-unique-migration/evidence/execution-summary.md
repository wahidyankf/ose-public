# Execution summary — plan 10 legacy-unique migration (DU-10)

Reviewable index of the 48-course rollout: one row per course with mode,
counts, gate verdicts, and harness result. Draft PR: #725 (opened at Wave 1's
gate; every later wave's push updates it).

Per-course checklist boxes live once in delivery.md's wave template; they are
ticked there only when the final wave closes. Until then this file plus the
ledger (`local-tmp/ayokoding-learn/execution-ledger.md`) are the gate record.

## Wave 1 — claude-code-for-engineers, hermes-agent-for-engineers, openclaw-for-engineers

- **Gate:** EX-VALIDATE exit 0 (no findings); CORPUS-GUARD failures name only
  the 45 not-yet-DONE courses plus the commit-pending References-dating rows
  for the 3 new courses (no content problems); 3 per-course commits
  (`277a53d`, `53ee00e`, `bd38a3c8` after the safety-gate history surgery —
  see below); branch pushed; draft PR #725 opened.
- **Coordinator repairs inside the wave (makers already DONE):** 9
  markdownlint findings in hermes files (trailing periods, blank lines);
  154 md-mermaid a11y insertions across hermes/openclaw (accTitle/accDescr
  derived from diagram content, `classDef default`, 10 long labels shortened);
  10 fictional absolute workspace paths in openclaw → `/srv/notes`
  (EX-CHECK re-verified 87/87 after).
- **History surgery (unpushed stack only, backup `backup-wave1-pre-surgery`
  deleted after the push):** the pre-push `public-safety-range` gate screens
  every in-range commit's own additions, so fixup commits cannot clear
  findings. The stack was rebuilt via cherry-pick onto current origin/main
  with the 3 repairs folded into their origin commits (wasm 1-byte rodata
  patch verified printing `miracle` under node WASI; pedestal reword;
  openclaw paths). Rebuilt tree verified byte-identical to the pre-surgery
  tree; range re-screened clean before the push.

| Course                     | Mode       | Words  | Examples      | Katas | Diagrams | Capstone              | Harness        | Verdict |
| -------------------------- | ---------- | ------ | ------------- | ----- | -------- | --------------------- | -------------- | ------- |
| claude-code-for-engineers  | By Example | 39,127 | 78 (25/28/25) | 8     | 38       | 800+ words, run.yaml  | EX-CHECK 87/87 | DONE    |
| hermes-agent-for-engineers | By Example | 39,237 | 78 (25/28/25) | 8     | 40       | 1,401 words, run.yaml | EX-CHECK 87/87 | DONE    |
| openclaw-for-engineers     | By Example | 34,992 | 78 (25/28/25) | 8     | 34       | 800+ words, run.yaml  | EX-CHECK 87/87 | DONE    |
