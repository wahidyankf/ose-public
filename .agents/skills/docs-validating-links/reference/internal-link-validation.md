# Internal Link Validation

## Internal Link Validation

## Required Link Format

**Documentation files** (docs/, repo-governance/, plans/, root .md files):

✅ PASS: [File Naming Convention](../meta/file-naming.md)
✅ PASS: [AI Agents Convention](../../development/agents/ai-agents.md)

❌ FAIL: [File Naming Convention](../meta/file-naming) ← Missing .md extension
❌ FAIL: [[file-naming]] ← Wiki-link syntax (GitHub does not render these)
❌ FAIL: [file-naming.md](../meta/file-naming.md) ← Using filename as link text

**Note**: Both `apps/ayokoding-www/` and `apps/ose-www/` have migrated to Next.js 16. Their `content/` trees are listed under `policies.markdown.internal-link.exclude-sources` in `repo-config.yml`, so `./rhino md internal-link validate` skips them as sources; they are also outside this Skill's link validation rules.

## Validation Methodology

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
3. Validate format (has .md extension for docs/, repo-governance/, plans/ files)
4. Check link text quality (descriptive, not filename-based)

## Common Internal Link Errors

**Error 1: Missing .md extension**

❌ FAIL: [File Naming](../meta/file-naming)
✅ PASS: [File Naming](../meta/file-naming.md)

**Criticality**: HIGH - Breaks GitHub web navigation
**Detection**: Check link ends with .md (docs/ files only)

**Error 2: Wrong relative path depth**

From: repo-governance/conventions/formatting/linking.md (3 levels deep)
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
