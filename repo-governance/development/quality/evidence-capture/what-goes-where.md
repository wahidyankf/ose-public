---
description: "Which evidence type goes in which file/folder, and what delivery.md must reference."
when_to_use: "Use when unsure which evidence file to save a specific artifact into."
---

# What Goes Where

## Inline in `delivery.md` (under the implementation-notes block)

Short text evidence that fits naturally in the notes:

- **Short API wire results** — paste the command, status/result metadata, and serialized response as
  fenced blocks. HTTP uses `rtk curl`; non-HTTP RPC/events use the protocol-native client:

  ````markdown
  - [x] [AI] Verify `/api/health` returns 200 — acceptance: status 200, `{"status":"ok"}`
    > **Evidence** (2026-06-20): `rtk curl http://localhost:8202/api/health`
    >
    > ```json
    > { "status": "ok", "version": "1.2.3" }
    > ```
  ````

- **Console output** — relevant lines from `browser_console_messages`:

  ```markdown
  > **Evidence** (2026-06-20): No JS errors. Console clean on `/en/tools` and `/id/tools`.
  ```

- **Network summary** — which endpoints were hit, what status codes returned.

- **Screenshot reference** — path to the file in `evidence/`:

  ```markdown
  > **Evidence** (2026-06-20): `![Desktop EN homepage](./evidence/phase-2-desktop-en.png)`,
  > `![Mobile 375px EN](./evidence/phase-2-mobile-en.png)`,
  > `![Mobile 375px ID](./evidence/phase-2-mobile-id.png)`
  ```

## In `evidence/` subfolder

File-based artifacts that would bloat `delivery.md` if inlined:

- **Screenshots** — one per breakpoint per locale tested; filename encodes context:
  `phase-{N}-{description}-{locale}-{breakpoint}px.png`
  Example: `phase-2-tools-page-en-1280px.png`, `phase-2-tools-page-id-375px.png`
- **Long API wire results** — if a response exceeds ~20 lines, save to
  `evidence/phase-{N}-{operation-slug}.txt` and reference it from `delivery.md`
- **Lighthouse reports** — `evidence/phase-{N}-lighthouse-{locale}.json`
- **Test coverage HTML** — `evidence/phase-{N}-coverage-report.html` (if exported)

## NOT in evidence/ (use local-tmp/ for ephemeral work)

- Intermediate screenshots taken for the agent's own orientation that are not cited in delivery.md
- Scratch Playwright scripts used during testing
- Draft findings not committed to the plan
