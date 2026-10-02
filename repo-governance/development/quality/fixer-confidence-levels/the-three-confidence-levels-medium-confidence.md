---
description: "MEDIUM_CONFIDENCE: skip, manual review needed."
when_to_use: "Use when deciding whether a finding is MEDIUM_CONFIDENCE."
---

# MEDIUM_CONFIDENCE → Skip (Manual Review Needed)

**Criteria:**

- Re-validation is unclear or ambiguous
- Issue is SUBJECTIVE (requires human judgment)
- Multiple valid interpretations possible
- Context-dependent decision
- Requires domain expertise or creative judgment
- Fix could harm quality in certain contexts

**Decision:** Skip fix, flag for manual review with explanation.

**Examples Across Domains:**

**repo-workflow-fixer:**

- Content duplication between AGENTS.md and convention file (context differs, may be intentional)
- Link target unclear (file missing, but can't determine correct target automatically)
- Field value could be valid in specific context (non-standard but potentially intentional)

**content-fixer:**

- Description length borderline (145 chars vs 150-160 optimal - functional but could improve)
- Line length slightly over 100 characters (breaking might harm readability)
- Alt text could be more descriptive but not completely missing
- Content structure acceptable but could be improved

**docs-tutorial-fixer:**

- Narrative flow issues (too list-heavy, needs better storytelling)
- Diagram placement suggestions (section would benefit from visual aid)
- Writing style critiques (too dry, needs more engaging voice)
- Content balance assessments (theory vs practice ratio)
- Example quality assessments (examples work but could be better)

**content-fixer:**

- Summary length is short but functional (85 chars vs 150-160 optimal)
- Image alt text vague but not missing ("screenshot" - need image context to improve)
- Line length exceeds limit but breaking would harm readability
- Broken link with unclear correct target (file missing, multiple possibilities)

**readme-fixer:**

- Engagement quality ("opening paragraph not engaging enough" - subjective tone judgment)
- Tone improvements ("sounds too corporate" - style preference)
- Benefits framing ("not benefits-focused enough" - messaging choice)
- Word choice preferences ("utilize" vs "use" when both are clear)
- Section length borderline (25 lines - depends on README philosophy)

**docs-fixer:**

- Contradiction that may be context-dependent (HTTP for local, HTTPS for production)
- Outdated information where "outdated" is subjective or requires judgment
- Content duplication where duplication may be intentional for clarity
- Narrative flow issues or writing style critiques (subjective quality)
- Terminology inconsistency where both terms are technically correct

**docs-fixer:**

- Scope decisions ("plan scope too broad" - requires business judgment)
- Technology choices ("should use PostgreSQL instead of MongoDB" - architectural expertise)
- Approach critiques ("microservices approach not suitable" - domain knowledge)
- Timeline assessments ("timeline unrealistic" - team capacity knowledge)
- Implementation strategies ("should use different design pattern" - technical judgment)

**Common Pattern:** MEDIUM confidence issues involve **human judgment, subjective quality assessment, or context-dependent decisions**.
