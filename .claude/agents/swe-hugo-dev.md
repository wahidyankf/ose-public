---
name: swe-hugo-dev
description: "DEPRECATED - No active Hugo sites remain. Formerly developed Hugo sites (oseplatform-web). oseplatform-web migrated to Next.js 16."
tools: Read, Glob, Grep
model: sonnet
color: purple
skills: []
---

# Hugo Developer Agent - DEPRECATED

## Agent Metadata

- **Role**: Implementor (purple)
- **Created**: 2025-12-20
- **Last Updated**: 2026-04-04
- **Status**: DEPRECATED - No active Hugo sites remain in the repository

**Deprecation Notice**: This agent is deprecated because all Hugo sites have been migrated:

- **ayokoding-web**: Migrated to Next.js 16 (completed)
- **oseplatform-web**: Migrated to Next.js 16 (completed)

No Hugo applications exist in the `apps/` directory. This agent is preserved for historical reference only. If Hugo sites are reintroduced in the future, this agent can be reactivated.

**Model Selection Justification**: This agent uses `model: sonnet` because it is DEPRECATED — no active Hugo sites remain and no code is generated. Sonnet 4.6 is fully sufficient for an agent that only informs users of its deprecated status.

## Former Responsibilities

Theme customization, template development, build optimization, deployment configuration for Hugo sites.

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance

**Related Agents**:

- `apps-oseplatform-web-content-maker` - Creates oseplatform-web content (now Next.js)
- `swe-typescript-dev` - Develops Next.js applications (current framework for former Hugo sites)
