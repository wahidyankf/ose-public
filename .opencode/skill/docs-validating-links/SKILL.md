---
name: docs-validating-links
description: Comprehensive link validation methodology for markdown links including format requirements, path validation, broken link detection, external link verification, and checker implementation patterns
created: 2025-01-22
updated: 2026-01-25
---

# Validating Markdown Links

This Skill provides comprehensive guidance for validating markdown links across the repository, including internal link validation, external link verification, and checker implementation strategies.

## Purpose

Use this Skill when:

- Implementing link validation in checker agents
- Validating internal documentation links
- Verifying external URL accessibility
- Checking site link formatting
- Implementing link caching strategies
- Understanding link validation patterns

## Link Validation Principles

### Why Link Validation Matters

**Broken links**:

- Break user navigation experience
- Reduce documentation credibility
- Create maintenance burden (hard to find broken links manually)
- Indicate structural issues (moved/deleted files)

**Link validation**:

- Prevents broken links from reaching production
- Catches file renames and moves
- Validates external resources still exist
- Ensures consistent link formatting

### Validation Scope

**What to validate**:

- Internal markdown links (docs/, governance/, plans/)
- Content links (apps/ayokoding-web/, apps/oseplatform-web/)
- External URLs (HTTP/HTTPS)
- Image links (relative paths)
- Anchor links (same-page headings)

**What NOT to validate**:

- Links in code blocks (examples, not actual links)
- Links in quoted text (preserved formatting)
- Commented-out links (intentionally disabled)

## Internal Link Validation

### Required Link Format

**Documentation files** (docs/, governance/, plans/, root .md files):

✅ PASS: [File Naming Convention](../meta/file-naming.md)
✅ PASS: [AI Agents Convention](../../development/agents/ai-agents.md)

❌ FAIL: [File Naming Convention](../meta/file-naming) ← Missing .md extension
❌ FAIL: [[file-naming]] ← Wiki-link syntax (GitHub does not render these)
❌ FAIL: [file-naming.md](../meta/file-naming.md) ← Using filename as link text

**Note**: Both `apps/ayokoding-web/` and `apps/oseplatform-web/` have migrated to Next.js 16. Their content links are validated by their respective CLI tools (`ayokoding-cli links check`, `oseplatform-cli links check`), not by this Skill's Hugo link rules.

### Validation Methodology

**Step 1: Extract Links from Markdown**

Use regex or markdown parser to extract all links

**Step 2: Categorize Links**

Separate into categories:

- Internal links (start with ./, ../, or /)
- External links (start with http://, https://)
- Anchor links (start with #)
- Image links (extensions: .png, .jpg, .svg, etc.)

**Step 3: Validate Internal Links**

For each internal link:

1. Resolve relative path from current file location
2. Check target file exists using filesystem
3. Validate format (has .md extension for docs/, governance/, plans/ files)
4. Check link text quality (descriptive, not filename-based)

### Common Internal Link Errors

**Error 1: Missing .md extension**

❌ FAIL: [File Naming](../meta/file-naming)
✅ PASS: [File Naming](../meta/file-naming.md)

**Criticality**: HIGH - Breaks GitHub web navigation
**Detection**: Check link ends with .md (docs/ files only)

**Error 2: Wrong relative path depth**

From: governance/conventions/formatting/linking.md (3 levels deep)
❌ FAIL: [Documentation Home](../README.md) ← Only 1 ../, need 3
✅ PASS: [Documentation Home](../../../README.md)

**Criticality**: CRITICAL - Link points to wrong file or 404
**Detection**: Resolve path and check file exists

**Error 3: Wiki-link syntax**

❌ FAIL: [[file-naming-convention]]
❌ FAIL: [[file-naming-convention|File Naming]]
✅ PASS: [File Naming Convention](../meta/file-naming.md)

**Criticality**: HIGH - GitHub does not render wiki-style links
**Detection**: Regex match for wiki-style links

**Error 4: Filename as link text**

❌ FAIL: [file-naming.md](../meta/file-naming.md)
✅ PASS: [File Naming Convention](../meta/file-naming.md)

**Criticality**: MEDIUM - Poor accessibility and readability
**Detection**: Check if link text matches filename pattern or contains file extension

_(Note: Hugo-specific error examples (Error 5, Error 6) removed — both oseplatform-web and ayokoding-web have migrated to Next.js 16. See Historical section below.)_

## External Link Validation

### Verification Strategy

**Challenge**: External links can be slow to verify (network requests)

**Recommended approach**:

1. Cache results - Store validation results in cache file
2. Respect cache TTL - Re-verify after 7 days (configurable)
3. Batch verification - Verify multiple URLs in parallel
4. Handle failures gracefully - Network errors != broken link

### HTTP Request Pattern

**Verification steps**:

1. HEAD request first - Faster than GET, checks if URL accessible
2. Follow redirects - HTTP 301/302 are OK (but report for info)
3. Check status codes:
   - 200-299: OK
   - 300-399: REDIRECT (report but don't fail)
   - 400-499: BROKEN (client error, link is wrong)
   - 500-599: SERVER_ERROR (temporary, re-verify later)
   - Timeout: UNREACHABLE (network issue, re-verify later)

### Link Caching Strategy

**Cache file format** (JSON):

{
"https://diataxis.fr/": {
"status": "OK",
"http_code": 200,
"last_checked": "2026-01-25T13:30:00+07:00",
"ttl": 604800
}
}

**Cache TTL recommendations**:

- OK links: 7 days
- BROKEN links: 1 day
- REDIRECT links: 7 days
- SERVER_ERROR: 1 hour
- UNREACHABLE: 1 hour

### Common External Link Errors

**Error 1: Link returns 404**

**Criticality**: HIGH - Link is dead, user gets 404
**Action**: Update or remove link

**Error 2: Link redirects (301/302)**

**Criticality**: LOW - Link works but could be updated to final URL
**Action**: Consider updating to final destination (optional)

**Error 3: Link times out**

**Criticality**: MEDIUM - May be temporary network issue
**Action**: Re-verify after TTL expires, flag if persistent

## Historical: Hugo-Specific Link Validation (DEPRECATED)

**Note**: Both `oseplatform-web` and `ayokoding-web` have migrated to Next.js 16. Hugo-specific link rules no longer apply to either site. This section is preserved for historical reference only.

Both sites' content links are validated by their respective CLI tools, not by Hugo link rules:

- `ayokoding-cli links check` — validates ayokoding-web content links
- `oseplatform-cli links check` — validates oseplatform-web content links

For active sites, apply standard docs/ linking rules: relative paths with `.md` extension.

## Checker Implementation Patterns

### Link Validation Workflow

Standard 5-step checker workflow:

Step 0: Initialize Report
Step 1: Discover Files (glob for \*.md)
Step 2: Extract Links (parse markdown, categorize)
Step 3: Validate Internal Links (file exists, format correct)
Step 4: Validate External Links (HTTP request, cache results)
Step 5: Finalize Report (summary, grouped by criticality)

### Progressive Writing Requirement

**CRITICAL**: Write findings to report file immediately after discovery (don't buffer in memory)

**Why**: Context compaction can lose buffered findings during long validation runs

### Tool Requirements for Link Checkers

**Required tools**:

- Read: Read markdown files to extract links
- Glob: Find all markdown files in scope
- Grep: Extract link patterns
- Bash: File existence checks, path resolution, HTTP requests
- Write: Initialize and update report file

### Categorization by Criticality

**CRITICAL** (Must fix before publication):

- Broken internal links (404, file not found)
- Wiki-link syntax (GitHub does not render `[[...]]` links)

**HIGH** (Should fix before publication):

- Missing .md extension in docs/ links
- Broken external links (404, 410)
- Filename as link text (poor accessibility)

**MEDIUM** (Fix when convenient):

- External link redirects (works but suboptimal)
- External link timeouts (may be temporary)
- Suboptimal link text (not descriptive enough)

**LOW** (Optional improvements):

- Consider updating redirect to final URL
- Suggest alternative link text

### Dual-Label Pattern for Link Checkers

Link checkers use both verification status AND criticality:

Finding: [BROKEN] - Internal Link to Non-Existent File

**Verification**: [BROKEN] - Target file does not exist
**Criticality**: CRITICAL - Breaks user navigation

**Verification labels**:

- [OK] - Link is valid
- [BROKEN] - Link target doesn't exist (404)
- [REDIRECT] - External link redirects (informational)
- [FORMAT_ERROR] - Wrong format (missing .md, etc.)

**Why dual labels?**

- Verification describes FACTUAL STATE
- Criticality describes URGENCY/IMPORTANCE
- Complementary information for fixer decision-making

## Related Conventions

**Linking Standards**:

- Linking Convention - Complete linking standards
- Hugo Content Convention - Historical Hugo linking patterns (DEPRECATED — both sites now on Next.js 16)

**Validation Standards**:

- Repository Validation Methodology - Standard validation patterns
- Criticality Levels Convention - Criticality classification

**Quality Standards**:

- Content Quality Principles - Link text quality requirements

## Related Skills

**Validation Skills**:

- repo-assessing-criticality-confidence - Criticality and confidence levels
- repo-applying-maker-checker-fixer - Checker workflow patterns
- repo-generating-validation-reports - Report format and progressive writing

**Domain Skills**:

- apps-ayokoding-web-developing-content - ayokoding-web content linking patterns (Next.js)

## Related Agents

**Link Validation Agents**:

- docs-link-general-checker - Validates links in docs/, governance/, plans/
- apps-ayokoding-web-link-checker - Validates links in ayokoding-web content
