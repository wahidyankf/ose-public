---
title: "Timestamp Format Convention"
description: Standard timestamp format using UTC+7 (Indonesian WIB Time)
category: explanation
subcategory: conventions
tags:
  - conventions
  - timestamps
  - timezone
  - formatting
created: 2025-11-30
---

# Timestamp Format Convention

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Uses ISO 8601 format with explicit timezone (`2025-12-15T22:08:00+07:00`). No ambiguous dates like "12/11/2025" (is that December 11 or November 12?). Timezone is always stated, never assumed.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: One universal format for all contexts (cache files, metadata, logs, frontmatter). No juggling multiple date formats or converting between systems.

## Purpose

This convention establishes UTC+7 timezone with ISO 8601 format as the standard for all timestamps in the repository. It ensures consistent time representation across cache files, metadata, logs, and frontmatter, enabling reliable date-based operations and avoiding timezone confusion.

## Scope

### What This Convention Covers

- **Timestamp format** - ISO 8601 with UTC+7: `YYYY-MM-DDTHH:MM:SS+07:00`
- **Where to use** - Cache files, metadata, agent reports, logs
- **Date-only format** - `YYYY-MM-DD` for frontmatter dates
- **Timestamp generation** - How to create compliant timestamps
- **Timezone rationale** - Why UTC+7 is the standard

### What This Convention Does NOT Cover

- **User-facing date display** - UI date formatting (implementation detail)
- **Relative timestamps** - "2 hours ago" style formatting
- **Date parsing** - How applications parse timestamps
- **Historical timezone migration** - Converting old timestamps (one-time operation)

## Overview

All timestamps in this repository use **UTC+7 (WIB - Western Indonesian Time)** by default with ISO 8601 format.

## Standard Format

**Format:** `YYYY-MM-DDTHH:MM:SS+07:00`

**Examples:**

- `2025-11-30T22:45:00+07:00` (10:45 PM on November 30, 2025)
- `2025-01-15T09:30:00+07:00` (9:30 AM on January 15, 2025)

## Why UTC+7?

**Reasons for standardizing on Indonesian time:**

1. **Team location** - Development team operates in Indonesian timezone
2. **Business context** - Enterprise platform serves Indonesian market
3. **Clarity** - Eliminates timezone confusion in logs and cache files
4. **Consistency** - Single timezone across all project artifacts

## Where This Applies

**Use UTC+7 timestamps in:**

- Cache files (e.g., `docs/metadata/external-links-status.yaml`)
- Metadata files (any operational data files)
- Log files (application logs, build logs)
- Documentation timestamps (frontmatter `created` field)
- Manual timestamps in code comments (when needed)
- Configuration files requiring timestamps

## Exceptions

**Do NOT use UTC+7 in:**

- **Git commits** - Git uses its own timestamp format (UTC with author timezone), leave as-is
- **ISO 8601 UTC** - When integrating with external APIs that require UTC (use `Z` suffix)
- **User-facing timestamps** - Use user's local timezone in UI/UX
- **Database timestamps** - Follow database conventions (usually UTC for storage, convert on display)

## Implementation Examples

### Cache Files

```yaml
version: 1.0.0
lastFullScan: 2025-11-30T22:45:00+07:00
lastChecked: 2025-11-30T07:00:00+07:00
```

### Documentation Frontmatter

```yaml
---
created: 2025-11-30
---
```

**Note**: Documentation frontmatter uses date-only format (YYYY-MM-DD) for simplicity. Full timestamps with time component should use the standard format above. Per the [No Manual Date Metadata Convention](../structure/no-date-metadata.md), non-website markdown files must not include an `updated:` field — use `git log --follow -- <file>` to find the authoritative last-changed date.

### Code Comments (when needed)

```typescript
// Last verified: 2025-11-30T22:45:00+07:00
const API_ENDPOINT = "https://example.com";
```

### Log Files

```
[2025-11-30T22:45:00+07:00] INFO: Application started
[2025-11-30T22:45:15+07:00] DEBUG: Database connection established
```

## Generating Current Timestamps

**For AI Agents and Scripts:**

When generating timestamps programmatically, use these bash commands to get the current time in UTC+7.

**CRITICAL REQUIREMENT:** You MUST execute the bash command to get the actual current time. NEVER use placeholder values like "00-00" or hardcoded timestamps.

### Full Timestamp (ISO 8601)

```bash
TZ='Asia/Jakarta' date +"%Y-%m-%dT%H:%M:%S+07:00"
```

**Output example:** `2025-12-14T16:23:00+07:00`

**Use for:**

- Cache file `lastFullScan` and `lastChecked` fields
- Audit report headers
- Log timestamps
- Any full timestamp requirement

### Date Only

```bash
TZ='Asia/Jakarta' date +"%Y-%m-%d"
```

**Output example:** `2025-12-14`

**Use for:**

- Documentation frontmatter (`created` field)
- Date-only requirements

### Filename Format (with double dash)

```bash
TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"
```

**Output example:** `2025-12-14--16-23`

**Use for:**

- Report filenames (e.g., `repo-rules__2025-12-14--16-23__audit.md`)
- Any filename requiring timestamp

**CRITICAL:** This command MUST be executed via Bash tool to get the real current time. Never hardcode or use placeholder values.

### Common Format Patterns

| Use Case           | Command                                             | Output Example               |
| ------------------ | --------------------------------------------------- | ---------------------------- |
| Full ISO 8601      | `TZ='Asia/Jakarta' date +"%Y-%m-%dT%H:%M:%S+07:00"` | `2025-12-14T16:23:00+07:00`  |
| Date only          | `TZ='Asia/Jakarta' date +"%Y-%m-%d"`                | `2025-12-14`                 |
| Filename timestamp | `TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M"`         | `2025-12-14--16-23`          |
| Human readable     | `TZ='Asia/Jakarta' date +"%B %d, %Y at %H:%M"`      | `December 14, 2025 at 16:23` |

**Note:** All commands use `TZ='Asia/Jakarta'` to ensure UTC+7 timezone regardless of system timezone.

### Anti-Patterns - NEVER Do This

**FAIL: WRONG - Using placeholder timestamps:**

```bash
# DO NOT hardcode placeholder values
filename="repo-rules__2025-12-14--00-00__audit.md"  # WRONG!
timestamp="2025-12-14--00-00"  # WRONG!
```

**Problem:** Using "00-00" or any placeholder defeats the purpose of timestamping. Files will have incorrect creation times and cannot be sorted chronologically.

**PASS: CORRECT - Execute bash command for real time:**

```bash
# Execute the command to get actual current time
timestamp=$(TZ='Asia/Jakarta' date +"%Y-%m-%d--%H-%M")
filename="repo-rules__${timestamp}__audit.md"
# Example output: repo-rules__2025-12-14--16-43__audit.md
```

**Why this matters:**

- Timestamps track when operations actually occurred
- Enable chronological sorting and comparison
- Critical for audit trails and debugging
- Placeholder values render timestamps useless

**For AI agents:** You MUST use the Bash tool to execute the timestamp command. Never generate filenames with hardcoded or placeholder times.

## Format Specification

**Components:**

- `YYYY` - 4-digit year
- `MM` - 2-digit month (01-12)
- `DD` - 2-digit day (01-31)
- `T` - Separator between date and time
- `HH` - 2-digit hour (00-23) in 24-hour format
- `MM` - 2-digit minute (00-59)
- `SS` - 2-digit second (00-59)
- `+07:00` - Timezone offset from UTC (UTC+7 for WIB)

**Standards compliance:**

- ISO 8601 compliant
- RFC 3339 compliant
- Parseable by standard libraries (JavaScript Date, Python datetime, etc.)

## Converting from UTC

If you have a UTC timestamp and need to convert to WIB:

**UTC to WIB:** Add 7 hours

**Examples:**

- `2025-11-30T15:45:00Z` (UTC) → `2025-11-30T22:45:00+07:00` (WIB)
- `2025-11-30T00:00:00Z` (UTC) → `2025-11-30T07:00:00+07:00` (WIB)

## Validation

**Valid timestamps:**

- `2025-11-30T22:45:00+07:00`
- `2025-01-01T00:00:00+07:00`
- `2025-12-31T23:59:59+07:00`

**Invalid timestamps:**

- `2025-11-30T22:45:00Z` (wrong timezone - this is UTC)
- `2025-11-30T22:45:00` (missing timezone offset)
- `2025-11-30 22:45:00+07:00` (space instead of T separator)
- `30-11-2025T22:45:00+07:00` (wrong date format)

## Related Conventions

- [File Naming Convention](../structure/file-naming.md) - Date format in filenames

## See Also

- **ISO 8601**: International standard for date and time representation
- **RFC 3339**: Internet timestamp format specification
- **WIB**: Western Indonesian Time (Waktu Indonesia Barat)
