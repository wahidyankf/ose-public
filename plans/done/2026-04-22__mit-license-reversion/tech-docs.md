# Technical Documentation

## Architecture

The `ose-public` licensing architecture uses a layered model:

- **Root `LICENSE`**: Default license for all files in the repository unless overridden by a
  subdirectory `LICENSE` file.
- **Per-directory `LICENSE` files**: Each app directory and `specs/` carries its own `LICENSE`
  file. These override the root default for files in that subtree. After this plan executes, all
  per-directory `LICENSE` files will contain the same MIT text — the override mechanism is
  preserved for future maintainers who may want to add a differently-licensed subdirectory.
- **`package.json` `license` field**: Machine-readable metadata consumed by npm, GitHub, and
  tooling. Must match the root `LICENSE`.
- **`package-lock.json` `license` field**: Mirrors `package.json` for the root package entry.
  Kept in sync manually (single field, line 11) rather than regenerated.
- **Documentation cascade**: `LICENSING-NOTICE.md` is the human-readable canonical description.
  `CLAUDE.md`, `README.md`, and governance docs reference or repeat this.

Document dependency graph for this plan:
`libs/ts-ui/LICENSE` → canonical MIT text → copied to all 9 FSL `LICENSE` files.
`brd.md` → narrative content → adapted into `docs/explanation/software-engineering/licensing/mit-license-rationale.md`.

## Design Decisions

**Decision 1: Prefer manual `package-lock.json` patch over `npm install`**

Manual patching is preferred over running `npm install` in a worktree. Running `npm install`
downloads all packages, rewrites `package-lock.json` in full, and risks introducing unintended
dependency changes. The license field in `package-lock.json` is a single entry at line 11:
`"license": "FSL-1.1-MIT"` — a trivial manual edit. Rationale: minimal blast radius, no network
dependency, no risk of package drift.

**Decision 2: Treat `plans/done/` as frozen historical records**

Files in `plans/done/` must not be retroactively edited. They are accurate records of decisions
made at the time they were written. FSL references in historical plan files are accurate historical
context, not errors. The Phase 6 grep validation explicitly excludes `plans/done/` for this reason.

**Decision 3: Exclude `plans/in-progress/2026-04-22__mit-license-reversion/` from FSL grep**

The plan's own documents (`brd.md`, `tech-docs.md`) intentionally reference FSL-1.1-MIT as the
prior license. The Phase 6 grep must exclude this directory to avoid false positives.

**Decision 4: Keep per-directory `LICENSE` overrides even though all values are now identical**

Removing per-directory `LICENSE` files would simplify the tree but eliminates the ability for
future maintainers to relicense specific subdirectories independently. The override structure is
preserved. Per-directory files now hold identical MIT text — harmless redundancy.

**Decision 5: Create `mit-license-rationale.md` as a new Diátaxis explanation document**

The strategic rationale for MIT is a permanent, referenceable piece of institutional knowledge.
Rather than embedding it only in the BRD (a planning artifact that moves to `done/`), it deserves
a permanent home in `docs/explanation/software-engineering/licensing/`. The BRD content is adapted
to third-person prose for the explanation document.

## Rollback

If the relicensing needs to be reverted, close the draft PR without merging. The original
FSL-1.1-MIT state is preserved in `main`. No additional rollback steps are required — the worktree
branch holds all changes; abandoning it restores the prior state automatically.

## MIT License Text

Standard MIT text to use in all LICENSE files:

```
MIT License

Copyright (c) 2025-2026 wahidyankf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

This text already exists verbatim in `libs/ts-ui/LICENSE` and `libs/ts-ui-tokens/LICENSE` — use
those as the canonical source when copying.

## File-by-File Changes

### LICENSE files (9 files)

Replace full FSL-1.1-MIT text with the MIT text above. No heading changes needed since `libs/`
LICENSE files use the plain MIT format without a markdown heading.

### package.json

Single field change: `"license": "FSL-1.1-MIT"` → `"license": "MIT"`.

`package-lock.json` mirrors the `package.json` `license` field for the root package. Prefer
manual patch over `npm install` to avoid downloading all packages. Edit line 11:
`"license": "FSL-1.1-MIT"` → `"license": "MIT"`. The pre-commit hook will run Prettier over it.

### LICENSING-NOTICE.md

Rewrite to describe uniform MIT. Remove:

- All FSL-specific sections (Permitted Purpose, Competing Use, per-version rolling conversion)
- The split-license table
- The "What You Cannot Do" section
- References to `specs/LICENSE` as FSL

Keep:

- Third-party code table (archived/ayokoding-web-hugo MIT, Xin 2023)
- Simple "all code MIT unless a subdirectory LICENSE says otherwise" statement

### CLAUDE.md

Update line:

```
**License**: FSL-1.1-MIT for product apps and behavioral specs (WHAT); MIT for libs and demo implementation code (HOW)
```

→

```
**License**: MIT
```

### README.md

Rewrite the `## 📜 License` section. Remove FSL competing-use explanation, per-version rolling
conversion table, and the split-license rationale. Replace with a short MIT section.

### governance/vision/README.md

Find and update the license reference from `Source-available (FSL-1.1-MIT)` back to
`Open source (MIT)`.

### governance/conventions/structure/licensing.md

This file likely documents the per-directory FSL/MIT split. Rewrite to describe uniform MIT.

### governance/conventions/writing/oss-documentation.md

Remove or update FSL badge examples and FSL template references.

### governance/conventions/writing/readme-quality.md

Update example text that shows `license: FSL-1.1-MIT` in YAML to `license: MIT`.

### governance/principles/general/simplicity-over-complexity.md

Update YAML code example that shows `license: FSL-1.1-MIT`.

### docs/how-to/add-new-lib.md

Update new-lib README template if it specifies FSL-1.1-MIT as the default license.

### docs/explanation/software-engineering/licensing/mit-license-rationale.md (NEW)

Create this file to document why the project uses MIT. Diátaxis category: **explanation** (conceptual
understanding, not a how-to). Structure:

1. **The Decision** — uniform MIT across the entire repository.
2. **Risks Accepted** — competitor cloning, self-hosting/lost revenue, amplified security exposure,
   fork instability. Acknowledge these are real but manageable.
3. **Why the Benefits Outweigh the Risks** — four arguments:
   - Escaping the feature-paradox trap (niche feature burden)
   - Outsourced R&D via community forks
   - AI agents structurally prefer open, well-documented tools
   - Product stickiness via open frontend + paid backend
4. **Market Context** — the shift from feature-monopoly model (AWS/Salesforce/Retool) to the
   building-block economy (Vercel as prime example). Future market winners provide minimal,
   reliable building blocks, not monolithic feature sprawl.
5. **Sources** — cite Theo (t3.gg), "A letter to tech CEOs",
   https://www.youtube.com/watch?v=G1xqTjoihfo

Content can be derived from `plans/in-progress/2026-04-22__mit-license-reversion/brd.md` — the
brd already contains all the substance; adapt it to third-person explanation prose.

Also update `docs/explanation/software-engineering/licensing/README.md` to add a link entry for
the new file.

### apps/oseplatform-web/content/about.md

Update the license section to describe MIT.

### apps/oseplatform-web/content/updates/2026-04-05-phase-1-week-8-wide-to-learn-narrow-to-ship.md

Update any reference to FSL as the current license (can be contextualized as historical note
if the update post is about the FSL migration itself).

## Validation

After all changes:

```bash
# Should return zero results (plans/done/ and the current plan directory are excluded)
grep -r "FSL\|Functional Source License" --include="*.md" . \
  | grep -v "^./plans/done/" \
  | grep -v "^./plans/in-progress/2026-04-22__mit-license-reversion/"

# package.json check
grep '"license"' package.json   # expect "MIT"

# Spot-check LICENSE files
head -3 LICENSE
head -3 apps/organiclever-fe/LICENSE
```
