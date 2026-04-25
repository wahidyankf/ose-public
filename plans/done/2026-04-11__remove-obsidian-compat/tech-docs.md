# Technical Documentation — Remove Obsidian Compatibility from Docs

This document describes the technical strategy, file inventory, collision handling, link-update approach, and convention rewrite plan.

## 1. Inventory of Obsidian Artifacts

### 1.1 Vault configuration

Located at `docs/.obsidian/` — 9 tracked JSON files:

| File                     | Purpose                             |
| ------------------------ | ----------------------------------- |
| `app.json`               | Workspace app settings              |
| `appearance.json`        | Theme preferences                   |
| `backlink.json`          | Backlink pane configuration         |
| `community-plugins.json` | List of installed community plugins |
| `core-plugins.json`      | Enabled core plugins                |
| `daily-notes.json`       | Daily notes plugin configuration    |
| `graph.json`             | Graph view display settings         |
| `hotkeys.json`           | Custom keybindings                  |
| `page-preview.json`      | Page preview plugin configuration   |

Plus `.gitignore` entries:

```gitignore
# Obsidian - Vault settings and cache (docs/ folder is the vault)
# Track: Core config files (app.json, appearance.json, etc.)
# Ignore: Workspace state, plugins, cache
docs/.obsidian/workspace.json
docs/.obsidian/workspace-mobile.json
docs/.obsidian/plugins/
docs/.obsidian/cache/
docs/.obsidian-git-data
docs/.trash/
docs/.smart-connections/
```

All of this gets deleted.

### 1.2 Prefixed filenames in `docs/`

**Raw counts** (from baseline enumeration):

- Total markdown files in `docs/`: 352
- Files matching `*__*.md`: 304
- Non-prefixed files (README.md, metadata/\*): ~48

**Prefix patterns observed** (from the File Naming Convention doc):

| Prefix shape                 | Example                                   | Target directory                                                                                      |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tu__name.md`                | `tu__getting-started.md`                  | `docs/tutorials/`                                                                                     |
| `hoto__name.md`              | `hoto__organize-work.md`                  | `docs/how-to/`                                                                                        |
| `re__name.md`                | `re__monorepo-structure.md`               | `docs/reference/`                                                                                     |
| `ex__name.md`                | _(rare root-level explanation file)_      | `docs/explanation/`                                                                                   |
| `ex-go-co-st__name.md`       | `ex-go-co-st__file-naming.md`             | `docs/explanation/governance/conventions/structure/` _(historical paths; most now under governance/)_ |
| `ex-soen-prla-ty__name.md`   | `ex-soen-prla-ty__best-practices.md`      | `docs/explanation/software-engineering/programming-languages/typescript/`                             |
| `ex-soen-ar-c4armo__name.md` | `ex-soen-ar-c4armo__tooling-standards.md` | `docs/explanation/software-engineering/architecture/c4-architecture-model/`                           |

**Rename rule**: split basename on the first `__`, discard the left side, keep the right side plus the extension.

### 1.3 Full reference inventory

The inventory expanded significantly after a repo-wide grep for prefix patterns, Obsidian mentions, and prefix-scheme explanations. The sections below are categorized by edit type.

#### 1.3.a Obsidian references in governance and active content

From the baseline `ripgrep -il obsidian` scan (filtering out `plans/done/*`, `.opencode/*`, `.gitignore`, `apps/oseplatform-web/content/updates/*`, and `docs/metadata/external-links-status.yaml`):

| File                                                                                                               | Edit required                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `docs/README.md`                                                                                                   | Remove "optimized for Obsidian" tip block                                            |
| `docs/how-to/hoto__organize-work.md`                                                                               | Remove Obsidian references (file itself will be renamed to `organize-work.md`)       |
| `docs/explanation/software-engineering/architecture/c4-architecture-model/ex-soen-ar-c4armo__tooling-standards.md` | Remove Obsidian references (file will be renamed)                                    |
| `README.md` (root)                                                                                                 | Remove any Obsidian references (TBD — verify with ripgrep)                           |
| `ROADMAP.md`                                                                                                       | Remove Obsidian references                                                           |
| `governance/conventions/README.md`                                                                                 | Remove Obsidian mention in formatting subsection description                         |
| `governance/conventions/structure/file-naming.md`                                                                  | **Rewrite entire file** (see §4)                                                     |
| `governance/conventions/formatting/linking.md`                                                                     | Remove "ensures links work consistently across GitHub web, Obsidian" language        |
| `governance/conventions/formatting/diagrams.md`                                                                    | Remove Obsidian platform mention                                                     |
| `governance/conventions/formatting/emoji.md`                                                                       | Remove Obsidian from "render consistency" list                                       |
| `governance/conventions/formatting/indentation.md`                                                                 | Remove Obsidian references                                                           |
| `governance/conventions/formatting/nested-code-fences.md`                                                          | Remove Obsidian preview recommendation                                               |
| `governance/conventions/formatting/mathematical-notation.md`                                                       | Remove "Obsidian/GitHub dual compatibility" framing                                  |
| `governance/conventions/formatting/color-accessibility.md`                                                         | Remove Obsidian from cross-platform consistency notes                                |
| `governance/conventions/writing/conventions.md`                                                                    | Remove "TAB indentation for Obsidian compatibility" checklist item                   |
| `governance/conventions/tutorials/general.md`                                                                      | Remove Obsidian references                                                           |
| `governance/conventions/hugo/shared.md`                                                                            | Remove Obsidian contrast notes (docs/ vs Hugo)                                       |
| `governance/development/agents/ai-agents.md`                                                                       | Remove wiki-link anti-pattern example and cross-platform Obsidian mention            |
| `governance/workflows/meta/workflow-identifier.md`                                                                 | Remove Obsidian YAML-parser justification (keep the quoting rule, change the reason) |
| `.claude/skills/docs-validating-links/SKILL.md`                                                                    | Remove wiki-link error class                                                         |
| `.claude/agents/docs-maker.md`                                                                                     | Remove "do NOT use Obsidian-only wiki links" language                                |
| `.claude/agents/docs-file-manager.md`                                                                              | Remove "No Obsidian wiki links" rule                                                 |

#### 1.3.b Prefix-scheme references (no Obsidian word, but mention prefix encoding)

From `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-|ex-ru-|ex-wf-|ex-de-|ex-co-)'` across the repo (~150 matching files before filtering). Categorized:

**Governance files that describe or cite the prefix scheme** (~22 files):

- `governance/conventions/README.md`, `structure/README.md`, `tutorials/README.md`
- `governance/conventions/structure/file-naming.md` (full rewrite — §4)
- `governance/conventions/structure/plans.md` — retains a "not applicable to plans/" note; verify it still renders
- `governance/conventions/structure/diataxis-framework.md`
- `governance/conventions/structure/programming-language-docs-separation.md`
- `governance/conventions/formatting/linking.md` (rationale rewrite — §4b)
- `governance/conventions/formatting/diagrams.md`
- `governance/conventions/writing/readme-quality.md`
- `governance/conventions/tutorials/general.md`
- `governance/conventions/tutorials/programming-language-content.md`
- `governance/conventions/hugo/ayokoding.md`
- `governance/principles/general/simplicity-over-complexity.md`
- `governance/principles/software-engineering/README.md`
- `governance/principles/content/documentation-first.md`
- `governance/principles/content/progressive-disclosure.md`
- `governance/development/agents/ai-agents.md`, `skill-context-architecture.md`
- `governance/development/pattern/database-audit-trail.md`
- `governance/development/quality/criticality-levels.md`, `three-level-testing-standard.md`
- `governance/workflows/infra/development-environment-setup.md`

**`.claude/` agents that reference prefixed paths** (16 files):

- `.claude/agents/docs-maker.md`, `docs-file-manager.md`
- `.claude/agents/repo-governance-checker.md`, `repo-governance-fixer.md`
- All 12 `.claude/agents/swe-*-developer.md` — each references prefixed programming-language docs paths (e.g., `docs/explanation/software-engineering/programming-languages/typescript/ex-soen-prla-ty__best-practices.md`)

**`.claude/` skills that reference prefixed paths** (15 files):

- `.claude/skills/docs-validating-links/SKILL.md` — also remove wiki-link error class
- `.claude/skills/docs-validating-factual-accuracy/SKILL.md`
- `.claude/skills/swe-developing-applications-common/SKILL.md`
- `.claude/skills/swe-developing-e2e-test-with-playwright/SKILL.md`
- All 11 `.claude/skills/swe-programming-*/SKILL.md` — each references prefixed language-docs paths
- `.claude/skills/repo-assessing-criticality-confidence/SKILL.md`

**Root navigation and subproject docs** (~40 files):

- `README.md`, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`
- `apps/README.md`, `specs/README.md`
- Subproject `apps/*/README.md` (a-demo-be-_, a-demo-fe-_, rhino-cli, organiclever-_) — most cite `docs/how-to/hoto\_\_add-new-_.md`
- Subproject `apps/*/playwright.config.ts` (several E2E configs link to `docs/how-to/hoto__*.md`)
- `docs/README.md`
- `docs/how-to/README.md` and similar category indexes (list children by prefixed name)
- `docs/how-to/hoto__add-new-lib.md`, `hoto__add-new-app.md`, `hoto__add-new-a-demo-backend.md`, `hoto__setup-development-environment.md`, `hoto__organize-work.md` (these are docs being renamed; their content may also reference other prefixed files)
- `docs/reference/re__monorepo-structure.md`, `re__project-dependency-graph.md`
- `docs/explanation/software-engineering/licensing/ex-soen-li__dependency-compatibility.md`
- `docs/explanation/software-engineering/platform-web/tools/fe-nextjs/ex-soen-plwe-to-fene__styling.md`

**Go source and tests in `apps/rhino-cli/`** (15+ files):

- All `internal/docs/{prefix_rules,validator,fixer,scanner,reporter,link_updater,types}*.go` — deleted in §6
- All `cmd/docs_validate_naming*.go` — deleted in §6
- `internal/docs/testdata/` — audit; keep only fixtures used by `links_*`
- `cmd/docs.go` — no edit required; `validate-naming` registration is in `docs_validate_naming.go`'s `init()`, removed by that file's deletion

#### 1.3.c Known false positives — DO NOT edit

The prefix-pattern grep will match these files, but they are intentional and must be preserved:

- `apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/sed/by-example/**.md` — sed tutorial content that uses `hoto__` as example input text
- `apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/jq/by-example/**.md` — jq tutorial content that uses similar patterns as example input
- `apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/gh-cli/by-example/**.md` — similar
- `apps/ayokoding-web/content/en/learn/software-engineering/data/databases/datomic/by-example/**.md` — contains strings that coincidentally match
- `apps/ayokoding-web/content/en/learn/software-engineering/data/tools/clojure-migratus/by-example/advanced.md` — coincidental match
- `apps/ayokoding-web/content/en/learn/software-engineering/data/tools/spring-data-jpa/by-example/**.md` — coincidental match
- `apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/by-example/advanced.md` — coincidental match
- `apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/fe-nextjs/by-example/overview.md` — coincidental match
- `apps/a-demo-be-python-fastapi/tests/*/*.py` — Python tests containing coincidental prefix-like strings in test data
- `apps/a-demo-be-rust-axum/Cargo.toml` — package metadata; false positive on hyphenated names
- `apps/a-demo-be-clojure-pedestal/test/step_definitions/steps.clj` — step definition strings

**Resolution**: Phase 1 inventory step must spot-check each false-positive file and add it to the exclusion list before Phase 5 runs the bulk sed. Any genuine reference in a false-positive-flagged file must be edited manually after the bulk pass.

**Explicitly NOT touched** (historical):

- `plans/done/*`
- `apps/oseplatform-web/content/updates/2025-12-14-phase-0-week-4-initial-commit.md`
- `docs/metadata/external-links-status.yaml` (regenerable cache)
- `.opencode/` mirrors (regenerated by sync script)

## 2. Rename Strategy

### 2.1 Mapping generation

Generate a deterministic mapping file before touching the repo:

```bash
# From repo root
find docs -type f -name '*__*.md' \
  | while read -r old; do
      dir=$(dirname "$old")
      base=$(basename "$old")
      new_base=${base#*__}
      new="$dir/$new_base"
      printf '%s\t%s\n' "$old" "$new"
    done > local-temp/obsidian-rename-mapping.tsv
```

This produces a TSV with `old_path<TAB>new_path` per line. The mapping is the single source of truth for both the `git mv` loop and the `sed` link-update loop.

### 2.2 Collision detection

Before executing any `git mv`, run a collision check:

```bash
awk -F'\t' '{ print $2 }' local-temp/obsidian-rename-mapping.tsv \
  | sort \
  | uniq -d
```

If this produces any output, each duplicate new-path is a collision inside a directory. Resolve by editing the mapping file to give each collided file a descriptive suffix (e.g., `overview.md` vs `overview-process.md`). **Never** reintroduce a hierarchical prefix to resolve a collision.

### 2.3 Git mv execution

```bash
while IFS=$'\t' read -r old new; do
  git mv "$old" "$new"
done < local-temp/obsidian-rename-mapping.tsv
```

Commit in a dedicated commit with message `refactor(docs): rename prefixed files to kebab-case` so reviewers see it as a pure rename. Git's rename detection threshold handles 100% identical files trivially.

### 2.4 History verification

After the rename commit, sample 5–10 files and confirm history continuity:

```bash
git log --follow --oneline docs/how-to/organize-work.md
git log --follow --oneline docs/explanation/software-engineering/programming-languages/typescript/best-practices.md
```

Each command must show commits from before the rename.

## 3. Link-Update Strategy

### 3.1 What to update

After the rename, two classes of references become stale:

1. **Markdown links**: links using old filenames → links using new filenames
2. **Bare filename mentions**: `See \`hoto\_\_organize-work.md\``→ `` See`organize-work.md` ``

### 3.2 Driver: the same mapping file

Use the TSV from §2.1 to drive updates:

```bash
# For each mapping, rewrite references to the OLD BASENAME (not full path — paths vary by caller depth)
while IFS=$'\t' read -r old new; do
  old_base=$(basename "$old")
  new_base=$(basename "$new")
  if [ "$old_base" != "$new_base" ]; then
    ripgrep -l --fixed-strings "$old_base" \
      --glob '!plans/done/**' \
      --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**' \
      --glob '!local-temp/**' \
      --glob '!.opencode/**' \
      --glob '!apps/oseplatform-web/content/updates/**' \
      --glob '!docs/metadata/external-links-status.yaml' \
      | while read -r file; do
          # Escape dots in old_base so sed treats them as literal characters (not any-char in BRE)
          escaped_old=$(echo "$old_base" | sed 's/\./\\./g')
          sed -i '' "s|$escaped_old|$new_base|g" "$file"
        done
  fi
done < local-temp/obsidian-rename-mapping.tsv
```

**Rationale for basename-only rewriting**: Full paths vary based on the caller's directory depth (`../../../docs/...` vs `./docs/...` vs `../explanation/...`). Basename-level substitution correctly handles all callers without needing per-caller path arithmetic.

**Safety**: Basename matches are tight (old prefixes like `ex-soen-prla-ty__` have near-zero false-positive risk), but after the loop, run a second ripgrep for leftover prefixed strings as a sanity check:

```bash
ripgrep -g '!plans/done/**' -g '!local-temp/**' '__[a-z0-9-]+\.md'
```

Any matches outside historical files indicate a missed rewrite.

### 3.3 Verification

1. `npm run lint:md` — markdown formatting and link-format linting
2. `ripgrep` for each old prefixed basename — should return zero hits outside allowed historical paths
3. Manual spot-check of `CLAUDE.md`, `AGENTS.md`, root `README.md`, and governance index pages
4. `ayokoding-cli links check` over `docs/` (if supported) — zero broken internal links

## 4. File Naming Convention Rewrite

The new `governance/conventions/structure/file-naming.md` should be short, directive, and explicitly anchored on **standard markdown + GitHub compatibility** as its sole rationale. The rule exists because files are viewed and linked through GitHub web and standard markdown tooling — not because of any specific authoring tool.

Outline:

````markdown
---
title: "File Naming Convention"
description: Standard markdown + GitHub-compatible kebab-case naming for all files
category: explanation
subcategory: conventions
tags:
  - naming
  - files
  - conventions
  - github
created: 2025-11-19
---

# File Naming Convention

Files in `docs/`, `governance/`, and similar repository locations follow a single rule designed for **standard markdown and GitHub compatibility**.

## Why This Rule Exists

Files in this repository are read through two primary surfaces: GitHub web (which renders markdown and turns filenames into URL slugs) and standard markdown tooling (VS Code, markdown linters, static site generators). Both surfaces have the same expectations:

- Lowercase URL slugs (GitHub URLs are case-sensitive on Linux hosting)
- ASCII-only filenames (avoid mojibake in URLs and cross-OS clones)
- No shell or URL metacharacters (prevents link breakage and quoting bugs)
- Case-insensitive uniqueness inside a directory (so clones to macOS/Windows filesystems do not collide)

Picking a rule that satisfies both surfaces keeps the documentation portable and the tooling simple.

## The Rule

**Lowercase kebab-case with a standard extension.**

```text
file-naming.md
three-level-testing-standard.md
monorepo-structure.md
```

### What this means

- Lowercase ASCII letters (`a`–`z`), digits (`0`–`9`), and hyphens (`-`) only in the basename
- Words separated by single hyphens
- One standard file extension (`.md`, `.png`, `.svg`, `.mmd`, `.excalidraw`, `.drawio`)
- No spaces, no uppercase, no camelCase, no underscores in the basename
- No leading or trailing hyphens
- No characters that break GitHub URLs or shell quoting: `:` `?` `*` `<` `>` `|` `"` backslash
- Filenames in the same directory must be unique after lowercasing (for macOS/Windows clone safety)

## Exceptions

### Index files

Each directory's index file is named `README.md`. This exception exists because GitHub automatically renders `README.md` as the directory landing page on the web.

### Operational metadata

Files under `docs/metadata/` are operational artifacts (caches, validation data). The directory itself provides the context, so only machine-parseability matters.

### Assets co-located with documentation

Images and diagrams co-located with a markdown file follow the same kebab-case rule:

```text
diagrams.md
diagrams-example.png
```

### Date-based files

Date-prefixed files use ISO 8601 (`YYYY-MM-DD`) and remain kebab-case overall:

```text
2025-12-14-phase-0-week-4-initial-commit.md
```

## Related Documentation

- [Linking Convention](../formatting/linking.md)
- [Diátaxis Framework](./diataxis-framework.md)
- [Conventions Index](../README.md)

---
````

**Target size**: ≤120 lines including frontmatter and code fences. The old file is ~540 lines.

## 4b. Linking Convention Rewrite

The existing `governance/conventions/formatting/linking.md` is already GitHub-compatible in substance — the rules (`.md` extension, relative paths, descriptive link text, no wiki links) are correct. What changes is the **rationale framing**: today it justifies GitHub-compatibility as "works consistently across GitHub web, Obsidian, and other markdown viewers"; the rewrite reframes the same rules as "standard markdown + GitHub web is where links are followed, so links must render there".

### What to change

- **Opening paragraph** (current line 17): remove "and Obsidian" from the cross-compat list.
- **"Why GitHub-Compatible Links?" section** (current lines 48–55): rewrite the numbered list to drop Obsidian as a rendering target. The rationale should be:
  1. **GitHub web is the primary reading surface** — rules must produce URLs GitHub renders.
  2. **Standard markdown tooling** — VS Code preview, markdownlint, and static site generators all speak the same syntax as GitHub.
  3. **Explicit relative paths** — unambiguous target resolution in CI link checkers.
  4. **No wiki links** — GitHub does not render `[[...]]`, so they silently break on the web.
- **Principles section** (current line 23): the example `[[filename]]` anti-pattern stays, but the justification moves from "implicit wiki-style" to "GitHub does not render wiki-link syntax".
- **Anchor-link rules**: add an explicit note (if not already present) that anchor slugs follow GitHub's heading-slugification rule — lowercase, spaces-to-hyphens, strip punctuation — because that is the slug GitHub generates.

### What to keep

- The entire link syntax table and required format (`[Display Text](./relative/path.md)`).
- The `.md` extension requirement for docs links.
- The relative-vs-absolute path rules.
- Descriptive link text requirement.
- Cross-directory linking examples.
- External link formatting.
- The two-tier rule-reference formatting (first mention = markdown link, subsequent = inline code).

### What NOT to add

- A "list of supported markdown viewers" — the rule is "standard markdown renders on GitHub", not a platform-support matrix.
- A separate "Obsidian migration" section — the convention should not acknowledge Obsidian at all after the rewrite.

### Verification

```bash
ripgrep -i obsidian governance/conventions/formatting/linking.md   # expect zero hits
ripgrep -n 'standard markdown' governance/conventions/formatting/linking.md  # expect at least one hit
ripgrep -n 'GitHub' governance/conventions/formatting/linking.md  # expect multiple hits
```

## 5. Broader Reference Scrub Strategy

This step has two subparts: (5a) **Obsidian word scrub** — remove every mention of Obsidian as a tool; (5b) **prefix-scheme explanation scrub** — remove narrative that describes the `[hierarchical-prefix]__[content-identifier]` encoding. The bulk sed loop in §3.2 handles filename substitutions automatically for every file in the repo; this step covers the text that basename substitution cannot fix.

### 5a. Obsidian word scrub

For each file in §1.3.a, the edit is a surgical removal — not a rewrite. The pattern is:

1. Read the specific line(s) flagged by `ripgrep -n obsidian <file>`.
2. Decide whether the surrounding sentence survives without the Obsidian clause:
   - **Removable clause**: `"ensures links work consistently across GitHub web, Obsidian, and other markdown viewers"` → `"ensures links work consistently across GitHub web and other markdown viewers"`.
   - **Removable bullet**: `"- Uses TAB indentation for bullet items (Obsidian compatibility)"` → delete the bullet.
   - **Removable example**: the Obsidian wiki-link example in `ai-agents.md` → delete the example line.
3. For `workflow-identifier.md`, replace the Obsidian-specific reason with "some YAML parsers" as the justification.
4. For `.claude/skills/docs-validating-links/SKILL.md`, remove the "Error 3: Obsidian wiki links" block and any references to wiki links in the error classification table.
5. For `.claude/agents/docs-maker.md` and `.claude/agents/docs-file-manager.md`, delete the wiki-link anti-pattern bullet.

### 5b. Prefix-scheme explanation scrub

For files in §1.3.b that **describe** the prefix encoding (not just reference a prefixed filename), the edit is narrative cleanup. The basename sed loop rewrites `tu__getting-started.md` → `getting-started.md` in descriptive text, but that leaves sentences like "files follow the `[prefix]__[name]` pattern" broken. For each such file:

1. Grep for residual pattern-description strings: `hierarchical-prefix`, `subdirectory code`, `\[prefix\]`, `prefix__`, `prefix encoding`.
2. Where a sentence explains the scheme, either delete the sentence or rewrite it to describe the new rule (lowercase kebab-case, GitHub-compatible).
3. Where a table enumerates prefix codes (e.g., "Tutorials → `tu__`"), delete the table.
4. Where an example shows a prefixed filename as an illustration of the scheme, replace it with a kebab-case example.

**High-touch files for 5b** (likely to need narrative rewrites, not just basename substitution):

- `governance/conventions/structure/file-naming.md` (full rewrite — §4)
- `governance/conventions/structure/README.md`
- `governance/conventions/structure/diataxis-framework.md`
- `governance/conventions/structure/programming-language-docs-separation.md`
- `governance/conventions/structure/plans.md` (retain the "not applicable to plans/" note, but confirm it still makes sense)
- `governance/conventions/README.md`
- `governance/conventions/tutorials/README.md`, `general.md`, `programming-language-content.md`
- `governance/development/agents/ai-agents.md` (may explain prefix encoding to agent authors)
- `governance/development/agents/skill-context-architecture.md`
- `.claude/agents/docs-maker.md`, `docs-file-manager.md`, `repo-governance-checker.md`, `repo-governance-fixer.md`
- `CLAUDE.md`, `AGENTS.md`, `docs/README.md` (any narrative referring to the scheme)

### 5c. README index files in `docs/`

`docs/tutorials/README.md`, `docs/how-to/README.md`, `docs/reference/README.md`, `docs/explanation/README.md`, and all subdirectory `README.md` files list their children by filename. After Phase 4 (rename), these lists become stale because the basename sed loop replaces individual filename strings but may miss bulleted lists formatted as inline code. Action:

1. For each `docs/**/README.md`, re-generate the "contents" section listing children files.
2. Where the list includes descriptions, preserve the descriptions and only update filenames and link paths.
3. Verify every link in every updated index file resolves.

### 5d. Tooling constraint

Tool choice is a craft decision, not a rule: use `Edit` / `Write` for targeted single-file edits (including under `.claude/` and `.opencode/` — both paths are pre-authorized in `.claude/settings.json`), and use `Bash` `sed` / `heredoc` for bulk mechanical substitutions across many files. Source Go edits in `apps/rhino-cli/` use `Edit`.

After all edits, the final check is:

```bash
ripgrep -i obsidian \
  --glob '!plans/done/**' \
  --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**' \
  --glob '!local-temp/**' \
  --glob '!.opencode/**' \
  --glob '!apps/oseplatform-web/content/updates/**' \
  --glob '!docs/metadata/external-links-status.yaml'
```

This must return zero matches.

## 6. rhino-cli Removal Strategy

`apps/rhino-cli/` ships a `docs validate-naming` command and its supporting Go packages that enforce the Obsidian-era prefix scheme. The command's docstring (from `apps/rhino-cli/cmd/docs_validate_naming.go`) explicitly states it "validates that all files in docs/ follow the hierarchical prefix" with pattern `[hierarchical-prefix]__[content-identifier].md`. This is a hard blocker: the pre-push hook runs `nx affected -t test:quick` which includes `rhino-cli`, so any unprefixed docs file would fail validation.

### 6.1 Files to delete

**Cmd layer** (`apps/rhino-cli/cmd/`):

```text
docs_validate_naming.go
docs_validate_naming_test.go
docs_validate_naming.integration_test.go
```

**Internal naming logic** (`apps/rhino-cli/internal/docs/`):

```text
prefix_rules.go
prefix_rules_test.go
validator.go
validator_test.go
fixer.go
fixer_test.go
scanner.go
scanner_test.go
reporter.go
reporter_test.go
link_updater.go
link_updater_test.go
```

**Conditional deletes**:

- `apps/rhino-cli/internal/docs/types.go` — delete only if no remaining file in the package (including `links_*.go`) imports its types. Run `go build ./apps/rhino-cli/...` after removal to confirm.
- `apps/rhino-cli/internal/docs/testdata/` — keep fixtures referenced by `links_*_test.go`; delete fixtures referenced only by removed tests. Determine by `ripgrep` from each test file.

**Additional deletions and edits** (stale references that become orphaned after the above deletions):

- `specs/apps/rhino/cli/gherkin/docs-validate-naming.feature` — Gherkin feature file consumed by `docs_validate_naming.integration_test.go`; orphaned after that test file is deleted.
- `apps/rhino-cli/cmd/steps_common_test.go` lines containing the `Docs validate-naming step patterns` const block — the constants `stepDeveloperRunsValidateDocsNaming`, `stepDeveloperRunsValidateDocsNamingWithFix`, `stepDeveloperRunsValidateDocsNamingWithFixAndApply` and all other constants in that block become orphaned after `docs_validate_naming.integration_test.go` is deleted. Remove the entire `// Docs validate-naming step patterns.` const block (lines ~126–141).
- `apps/rhino-cli/cmd/testable.go` — delete the `// docs validate-naming command delegation.` comment and its two variable declarations (`docsValidateAllFn`, `docsFixFn`) on lines ~41–43; these delegations are used only by the removed command files.

### 6.2 Files to preserve

**Link validation** — the GitHub-compatible link checker remains valuable and survives the refactor:

```text
apps/rhino-cli/internal/docs/links_scanner.go           + _test.go
apps/rhino-cli/internal/docs/links_validator.go         + _test.go
apps/rhino-cli/internal/docs/links_categorizer.go       + _test.go
apps/rhino-cli/internal/docs/links_reporter.go          + _test.go
apps/rhino-cli/internal/docs/links_types.go
apps/rhino-cli/cmd/docs_validate_links.go               + _test.go + .integration_test.go
```

### 6.3 Edits required

1. **`apps/rhino-cli/cmd/docs.go`** — no edit required. The `validate-naming` registration (`docsCmd.AddCommand(validateDocsNamingCmd)`) is in `docs_validate_naming.go`'s `init()` function; it is automatically removed when that file is deleted. The `validate-links` registration remains intact.
2. **`apps/rhino-cli/README.md`** — delete the section describing `validate-naming`, its flags (`--staged-only`, `-o json`, `-o markdown`, `--fix`, `--apply`, `--no-update-links`), and any example outputs.
3. **`apps/rhino-cli/internal/docs/README.md` (if present)** — update the package-level docs to describe only the `links_*` surface.
4. **Any agent or skill that documents the `validate-naming` command** — grep `.claude/` and `governance/` for `validate-naming` and remove instructions pointing at it.

### 6.4 Coverage verification

rhino-cli enforces ≥90% Go test coverage via `rhino-cli test-coverage validate` in `test:quick`. Deletions must keep the ratio intact. Procedure:

1. Delete the files listed in §6.1.
2. Run `go build ./apps/rhino-cli/...` — must succeed.
3. Run `nx run rhino-cli:test:quick` — must pass, including the coverage gate.
4. If coverage drops below 90%, identify uncovered lines in the surviving `links_*` code via `go tool cover -func=cover.out` and add targeted tests.

### 6.5 Sequencing constraint

This step MUST land **before** Phase 4 (docs rename). Otherwise `test:quick` fails on the first unprefixed file committed during Phase 4. The delivery checklist enforces this ordering via Phase 3b.

## 7. .claude → .opencode sync

After all `.claude/` edits are complete:

```bash
npm run sync:claude-to-opencode
```

Then verify with:

```bash
git diff .opencode/agent/
git diff .opencode/skill/
```

Every updated `.claude/` source should have a matching mirror change. The pre-commit hook's dual-format validation (described in CLAUDE.md) will catch any semantic drift before commit. Expect diffs in: all updated `docs-*`, `repo-governance-*`, `swe-*-developer` agents and the `swe-programming-*`, `docs-*`, `swe-developing-*`, `repo-assessing-criticality-confidence` skills.

## 8. Validation Matrix

| Validation                                                                                 | Tool                        | Phase         |
| ------------------------------------------------------------------------------------------ | --------------------------- | ------------- |
| `docs/.obsidian/` absent                                                                   | `find`                      | After P2      |
| `.gitignore` has no Obsidian lines                                                         | `ripgrep`                   | After P2      |
| rhino-cli `validate-naming` cmd and internal files deleted                                 | `find`                      | After P3b     |
| rhino-cli `links_*` files preserved                                                        | `find`                      | After P3b     |
| `nx run rhino-cli:build` passes                                                            | `go build`                  | After P3b     |
| `nx run rhino-cli:test:quick` passes with coverage ≥90%                                    | rhino-cli test-coverage     | After P3b     |
| `apps/rhino-cli/README.md` does not mention `validate-naming`                              | `ripgrep`                   | After P3b     |
| Zero `*__*.md` files in `docs/`                                                            | `find`                      | After P4      |
| No collisions in mapping                                                                   | `awk + uniq -d`             | Before P4     |
| `git log --follow` shows history for sampled renames                                       | `git log`                   | After P4      |
| All renamed filenames match `^[a-z0-9-]+\.[a-z]+$` and contain no GitHub-unsafe characters | `find` + regex              | After P4      |
| No case-only filename collisions inside any directory                                      | shell script                | After P4      |
| `npm run lint:md` passes                                                                   | `markdownlint-cli2` via npm | After P5      |
| Zero stale prefixed references outside allowed paths                                       | `ripgrep`                   | After P5      |
| All rewritten links use `[Text](./path.md)` form with `.md` extension                      | `ripgrep`                   | After P5      |
| `governance/conventions/structure/file-naming.md` ≤120 lines                               | `wc -l`                     | After P3      |
| `governance/conventions/structure/file-naming.md` cites "standard markdown" and "GitHub"   | `ripgrep`                   | After P3      |
| `governance/conventions/formatting/linking.md` cites "standard markdown" and "GitHub"      | `ripgrep`                   | After P6      |
| `governance/conventions/formatting/linking.md` has zero Obsidian mentions                  | `ripgrep -i`                | After P6      |
| Zero "Obsidian" matches outside allowed paths                                              | `ripgrep -i`                | After P6      |
| Prefix-pattern grep returns zero matches outside allowed false-positive paths              | `ripgrep`                   | After P6      |
| All 12 `swe-*-developer` agents link to existing (unprefixed) docs files                   | link resolver               | After P6      |
| All 11 `swe-programming-*` skills link to existing (unprefixed) docs files                 | link resolver               | After P6      |
| All 16+ `docs/**/README.md` index files list children by new filenames                     | manual + lint               | After P6      |
| `.opencode/` mirrors match `.claude/` sources                                              | `git diff` + sync script    | After P7      |
| Pre-push hook passes (`typecheck`, `lint`, `test:quick`)                                   | Husky                       | Before commit |
| `nx affected -t test:quick` passes (catches rhino-cli and any other downstream)            | Nx                          | Before commit |
| `ayokoding-cli links check` or equivalent passes (if applicable)                           | `nx` target                 | After P5      |

## 9. Rollback Plan

The plan is structured so that each phase is committed separately (see `delivery.md`). If a phase fails validation:

1. **Phase 2 (vault config removal)** — revert the single commit; vault config returns.
2. **Phase 3 (convention rewrite)** — revert and revise the rewrite before re-applying.
3. **Phase 3b (rhino-cli removal)** — revert the commit. rhino-cli's prefix validation returns; the plan cannot proceed past Phase 3b until this succeeds.
4. **Phase 4 (rename)** — revert. This is the largest single commit; reverting is safe because the rename is atomic and mechanical. Requires Phase 3b to stay reverted simultaneously, since rhino-cli would again fail on unprefixed files.
5. **Phase 5 (link updates)** — revert and regenerate the mapping-based rewrite with tighter filters.
6. **Phase 6 (broader reference scrub)** — revert individual file edits as needed; split by subphase (5a, 5b, 5c) if only one subphase is faulty.
7. **Phase 7 (.opencode sync)** — re-run `npm run sync:claude-to-opencode` from a known-good `.claude/` state.

No phase rollback requires more than a single `git revert` because commits are split by domain. Phase 3b and Phase 4 are coupled: if Phase 4 fails, Phase 3b must also revert to restore a consistent state.

## 10. Open Questions

| Question                                                                                    | Resolution path                                                                       |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Are any external tools (CI, deploy scripts) depending on the prefix pattern?                | Grep all workflow files, package.json scripts, and `nx.json`. Resolve during Phase 1. |
| Does `ayokoding-cli links check` cover `docs/` or only `apps/ayokoding-web/content/`?       | Read the CLI's README during Phase 1.                                                 |
| Are any `apps/*/content/` files referencing docs filenames via the prefix?                  | Ripgrep during Phase 1.                                                               |
| Should Obsidian mentions in `governance/conventions/hugo/shared.md` be removed or reframed? | Remove — Hugo convention can describe its rules without contrasting against Obsidian. |

## 11. Non-Goals

- Preserving any form of prefix-based uniqueness scheme.
- Maintaining Obsidian wiki-link detection in link-checkers for defensive reasons.
- Migrating, reorganizing, or splitting Diátaxis categories.
- Altering `governance/` filename conventions (they already follow kebab-case).
