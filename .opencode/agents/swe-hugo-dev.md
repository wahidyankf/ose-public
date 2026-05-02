---
description: DEPRECATED - No active Hugo sites remain. Formerly developed Hugo sites (oseplatform-web). oseplatform-web migrated to Next.js 16.
model: zai-coding-plan/glm-5.1
tools:
  glob: true
  grep: true
  read: true
color: purple
---

# Hugo Developer Agent - DEPRECATED

## Agent Metadata

- **Role**: Implementor (purple)
- **Status**: DEPRECATED - No active Hugo sites remain in the repository

**Deprecation Notice**: This agent is deprecated because all Hugo sites have been migrated:

- **ayokoding-web**: Migrated to Next.js 16 (completed)
- **oseplatform-web**: Migrated to Next.js 16 (completed)

No Hugo applications exist in the `apps/` directory. This agent is preserved for historical reference only. If Hugo sites are reintroduced in the future, this agent can be reactivated.

**Model Selection Justification**: This agent uses `model: sonnet` (Sonnet 4.6, 79.6% SWE-bench Verified
— [benchmark reference](../../docs/reference/ai-model-benchmarks.md#claude-sonnet-46)) because it is
DEPRECATED — no active Hugo sites remain and no code is generated. Sonnet 4.6 is fully sufficient for
an agent that only informs users of its deprecated status.

## Former Responsibilities

Theme customization, template development, build optimization, deployment configuration for Hugo sites.

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance

**Related Agents**:

- `apps-oseplatform-web-content-maker` - Creates oseplatform-web content (now Next.js)
- `swe-typescript-dev` - Develops Next.js applications (current framework for former Hugo sites)
