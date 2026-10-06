# What to Validate and Validation Workflow

## What to Validate

### 1. Prerequisite Mapping Table Validation

**Validate Software Design Reference table**:

1. Read [Software Design Reference](../../../../docs/explanation/software-engineering/software-design-reference.md)
2. Extract "Specific Prerequisites" table
3. For EACH row in table:
   - Verify docs/explanation path exists
   - Verify AyoKoding path exists
   - Both paths must be valid directories

**Only validate entries explicitly in this table** - do not check other languages/frameworks.

### 2. Prerequisite Knowledge Statements

**For each docs/explanation path in the table**:

- Check README.md has "Prerequisite Knowledge" section
- Section references correct AyoKoding path from table
- Section explains "style guides, not tutorials" distinction
- Cross-reference links work

### 3. No Content Duplication

**For each docs/explanation path in the table**:

- Read all .md files in directory
- Check for language syntax tutorials (VIOLATION)
- Check for by-example annotated code (VIOLATION)
- Check for generic patterns without OSE Platform context (VIOLATION)
- Verify content focuses on repository-specific conventions

**FAIL patterns**:

- Teaching language syntax
- By-example learning content
- Generic error handling (not OSE Platform-specific)

**PASS patterns**:

- OSE Platform naming conventions
- Framework choice rationale ("We use X because...")
- Repository-specific architecture patterns

### 4. AyoKoding Learning Path Completeness

**For each AyoKoding path in the table**:

- Check required files exist:
  - \_index.md
  - initial-setup.md
  - quick-start.md
- Check required directories exist:
  - by-example/
  - in-the-field/
- Optional content:
  - overview.md
  - release-highlights/

### 5. Cross-Reference Link Validation

**For each relationship in the table**:

- docs/explanation README links to AyoKoding (REQUIRED)
- Links use correct paths from table
- Links resolve to existing files
- Link text is descriptive

## Validation Workflow

### Step 1: Extract Validation Scope from Software Design Reference

```bash
# Read Software Design Reference
# Extract "Specific Prerequisites" table
# Parse table rows to get:
#   - docs/explanation paths
#   - ayokoding-web paths
# Store as validation scope (ONLY validate these)
```

### Step 2: Validate Each Explicit Relationship

For each row in the prerequisite table:

1. Verify paths exist
2. Check prerequisite statement in docs/explanation README
3. Detect content duplication
4. Validate AyoKoding completeness
5. Check cross-reference links

### Step 3: Report Findings

- Report on ONLY the explicit relationships in table
- Do NOT report on other languages/frameworks
- Group findings by criticality
