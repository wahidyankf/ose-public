# HIGH-Confidence Validation Checks

Re-implements validation checks from `docs-tutorial-checker` using standardized patterns from
[Repository Validation Methodology Convention](../../../../repo-governance/development/quality/repository-validation.md)
and
[Tutorial Convention](../../../../repo-governance/conventions/tutorials/general.md). Use the
EXACT SAME patterns as the checker — consistency is critical; report any differences (they
indicate checker issues).

## 1. Required Section Check

**What to check**: Introduction, Prerequisites, Learning Objectives, and Next Steps/Conclusion
sections exist.

```bash
grep -iE "^## .*(introduction|getting started)" tutorial.md
grep -iE "^## .*(prerequisites|requirements|before you begin)" tutorial.md
grep -iE "^## .*(learning objectives|what you'll learn|goals)" tutorial.md
grep -iE "^## .*(next steps|conclusion|summary|where to go)" tutorial.md
```

**Confidence**: HIGH (sections present or missing). **Fix**: Add missing section with
placeholder content.

## 2. LaTeX Delimiter Check

**What to check**: Display equations use `$$...$$` (not single `$...$`); multi-line equations
use `\begin{aligned}...\end{aligned}` (not `\begin{align}`).

```bash
grep -n "^\\$$" tutorial.md               # single $ on its own line — wrong for display math
grep -n "\\\\begin{align}" tutorial.md    # should be \begin{aligned} for KaTeX
```

**Confidence**: HIGH (delimiter patterns are objective). **Fix**: Replace single `$` with `$$`
for display equations; replace `\begin{align}` with `\begin{aligned}`.

## 3. Tutorial Type Naming Check

**What to check**: Title follows the naming pattern for its stated tutorial type — Initial
Setup: "[Topic] Initial Setup"; Quick Start: "[Topic] Quick Start"; Beginner: "Tutorial: [Topic]
for Beginners"; Intermediate: "Tutorial: Intermediate [Topic]"; Advanced: "Tutorial: Advanced
[Topic]"; Cookbook: "[Topic] Cookbook".

```bash
title=$(awk '/^---$/,/^---$/ {if (/^title:/) print}' tutorial.md | cut -d: -f2- | tr -d '"' | xargs)
```

**Confidence**: HIGH (title patterns are convention-defined). **Fix**: Update frontmatter title
to match convention.

## 4. Frontmatter Field Check

**What to check**: Required fields present (`title`, `description`, `category`, `tags`);
`category` is "tutorials"; file follows kebab-case naming.

```bash
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' tutorial.md | \
  grep -E "^(title|description|category|tags):"
```

**Confidence**: HIGH (fields present or missing). **Fix**: Add missing frontmatter fields with
placeholder values.
