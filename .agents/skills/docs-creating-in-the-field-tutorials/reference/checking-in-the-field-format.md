# Checking In-the-Field Format

Validation checklist for `tutorial-in-the-field-checker`.

## 1. Guide Count

Target 20-40 production guides per language/framework. Flag if <20 (insufficient coverage) or >40
(maintenance burden).

## 2. Annotation Density

Target 1.0-2.25 comment lines per code line, upper bound 2.5 (flag if exceeded), measured per code
block. Comments explain production implications.

## 3. Standard Library First (CRITICAL)

Every guide MUST follow standard library → framework progression. Check each guide: standard library
section present and comes first; limitations section explains why standard library is insufficient;
framework section includes justification (not just "industry standard"); trade-offs section compares
complexity vs. capability. Anti-patterns to flag: framework introduced without standard library first
(CRITICAL), no limitations section (HIGH), no trade-off discussion (HIGH), generic justifications
like "everyone uses it" (MEDIUM).

## 4. Production Code Quality

Full error handling present (try-with-resources, proper exceptions), security practices included
(input validation, secret management), logging at appropriate levels, configuration externalized (no
hardcoded values), integration testing examples present.

## 5. Framework Introduction Quality

For each framework introduced: installation steps present (Maven/Gradle dependency with version),
configuration shown, production-grade example (not simplified), comparison with standard library
approach, "when to use" guidance present.

## 6. Diagram Count

Target 10-20 diagrams total (25-50% of 20-40 guides). Progression diagrams show standard library →
framework → production flows. Color-blind palette compliance. Appropriate for production topics
(architecture, deployment, flows).

## 7. ayokoding-web Compliance

Per `apps-ayokoding-www-developing-content`: bilingual content (id/en), content structure and
metadata, linking conventions.

## Step-by-Step Validation Order

Count guides (flag <20/>40) → validate standard library first per guide (CRITICAL/HIGH/MEDIUM per
above) → validate annotation density per code block (`comment_count ÷ code_count`) → validate
production code quality per guide → validate framework introduction per framework → count and
validate diagrams → validate ayokoding-web compliance → finalize report with prioritized summary.
