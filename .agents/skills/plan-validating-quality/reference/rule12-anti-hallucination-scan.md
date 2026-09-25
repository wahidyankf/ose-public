# Rule 12: Anti-Hallucination Scan

## 12. Anti-Hallucination Scan (Step 5f — MANDATORY HARD RULE)

After Step 5e, scan the whole plan for unverified factual claims matching the
[Plan Anti-Hallucination Convention §Anti-Pattern Catalog](../../../../repo-governance/development/quality/plan-anti-hallucination/anti-pattern-catalog-ap-1-through-ap-4.md#anti-pattern-catalog).

**A. Confidence-label coverage** — every non-trivial claim about a file path, Nx target, package
version, API signature, agent/skill name, behaviour, external standard, or numeric KPI carries
`[Repo-grounded]`, `[Web-cited]`, `[Judgment call]`, or `[Unverified]` inline, or appears inside a
repo-file-quoting code fence. Bare unlabeled claims default to `[Unverified]`: **MEDIUM** per claim.

**B. Anti-Pattern Catalog scan**:

- **AP-1** version cited without `package.json`/lockfile evidence: **HIGH**
- **AP-2** file path cited that doesn't exist and isn't marked `_New file_`: **HIGH**
- **AP-3** Nx target cited absent from the project's `project.json`: **HIGH**
- **AP-4** function/method name cited without import-path evidence or web citation: **HIGH**
- **AP-5** numeric KPI presented as measured fact with no baseline: **HIGH**
- **AP-6** test name cited that doesn't exist and isn't marked `_New test_`: **HIGH**
- **AP-7** agent/skill name cited that doesn't resolve via `.agents/agents/<name>.md`
  (flat canonical directory) or `.agents/skills/<name>/SKILL.md`: **HIGH**
- **AP-8** CLI flag cited without `<cmd> --help` evidence or repo-doc reference: **MEDIUM**
- **AP-9** behaviour claim cited without a source: **MEDIUM**
- **AP-10** cross-link target resolving to a non-existent file: **HIGH**

(all per occurrence)

**C. Suggested-executor annotation validity** — where a checkbox carries `_Suggested executor:
<agent-name>_`: `test -f .agents/agents/<agent-name>.md` succeeds (missing: **HIGH**,
counts as AP-7); the agent's role suits the action (e.g. `swe-fsharp-dev` for a `.fs` edit, not
`swe-typescript-dev`; mismatch: **MEDIUM**).

**D. Web-citation completeness** — every `[Web-cited]` claim includes URL, access date, and excerpt
inline; missing any element: **MEDIUM** per occurrence; URL-only citation is forbidden.

**How to audit**: read each file top-to-bottom; for every sentence asserting a file path, Nx target,
version, API surface, agent/skill name, behaviour, or metric, check the corresponding recipe row from
[Plan Anti-Hallucination Convention §Repo-Grounding Rule](../../../../repo-governance/development/quality/plan-anti-hallucination/repo-grounding-rule-hard.md#repo-grounding-rule-hard);
run the recipe (`Bash test -f`, `Glob`, `Grep`, `jq` against `project.json`, etc.); file a finding
under the matching Anti-Pattern on failure. For external claims, verify URL/access-date/excerpt; if
multi-page research was warranted, verify `web-researcher` delegation is documented.

**Re-validation caching (iterations 2+)**: `[Repo-grounded]` claims re-run only if the file changed;
`[Web-cited]` claims trusted unless newly invalidated; new claims from fixer edits verified normally.

**Finding severity**: AP-1/2/3/4/5/6/7/10: **HIGH** per occurrence. AP-8/9, missing `[Web-cited]`
excerpt, executor mismatch: **MEDIUM** per occurrence. Bare unlabeled claim (defaults
`[Unverified]`): **MEDIUM** per claim. Missing `web-researcher` delegation when the multi-page
threshold was crossed: **MEDIUM**.
