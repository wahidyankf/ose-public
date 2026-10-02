---
description: "Overview of the criticality-level system."
when_to_use: "Use to orient to the criticality-level system."
---

# Overview

This convention establishes a universal **four-level criticality system** (CRITICAL/HIGH/MEDIUM/LOW) for categorizing validation findings across all checker agents. Criticality measures **importance and urgency** of fixing an issue, answering "how soon must this be fixed?"

## Why This Convention Exists

**Problem**: Seven different severity classification systems existed across checker agents, causing confusion and inconsistency:

- `rules-checker`: Critical/Important/Minor
- `content-checker`: Must Fix/Warnings/Suggestions
- `readme-checker`: High/Medium/Low Priority
- `docs-checker`: [Verified]/[Error]/[Outdated] (verification-based, NOT severity)
- `docs-link-checker`: [OK]/[BROKEN]/[REDIRECT] (status-based, NOT severity)
- `plan-checker`: Critical/Warnings/Recommendations

**Solution**: Universal 4-level system that works orthogonally with existing confidence levels.

## Relationship to Confidence Levels

**Criticality and confidence are orthogonal dimensions**:

- **Criticality** (CRITICAL/HIGH/MEDIUM/LOW) → **Importance/Urgency** - "How critical is this issue?"
- **Confidence** (HIGH/MEDIUM/FALSE_POSITIVE) → **Certainty/Fixability** - "How certain are we it needs fixing?"

See [Fixer Confidence Levels Convention](.././fixer-confidence-levels.md) for complete confidence system details.

**Example showing both dimensions**:

```markdown
## CRITICAL Issues (Must Fix)

### 1. Missing Required Field Breaks Content Validation

**File**: `apps/ayokoding-www/content/en/programming/python/_index.md:3`
**Criticality**: CRITICAL - Breaks Next.js content validation
**Confidence**: HIGH - Field objectively missing from frontmatter

**Finding**: Required `draft` field missing from frontmatter
**Impact**: Content validation fails with "required field missing" error
```

---
