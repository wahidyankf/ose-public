---
title: "Overview"
date: 2026-04-13T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn OpenClaw through 80 heavily annotated examples: CLI basics, configuration, skills, channels, Lobster workflows, plugins, and production patterns (95% coverage)"
tags: ["openclaw", "by-example", "tutorial", "ai-agent", "automation", "local-first"]
---

**Learn the OpenClaw AI agent platform by doing.** This by-example tutorial teaches OpenClaw — the open-source, local-first AI agent gateway — through 80 heavily annotated, self-contained examples achieving 95% coverage. Master CLI usage, JSON5 configuration, skill authoring, messaging channel integration, Lobster workflows, plugin development, and production deployment patterns.

## What is By Example?

By Example is a **code-first learning approach** designed for experienced developers who want to master OpenClaw efficiently. Instead of lengthy explanations followed by examples, you'll see complete, runnable configurations and commands with inline annotations explaining what each element does and why it matters.

**Target audience**: Developers and DevOps engineers with command-line experience who want to deploy and orchestrate AI agents locally using OpenClaw.

## What is OpenClaw?

OpenClaw is a **free, open-source, local-first AI agent platform** that connects large language models (Claude, GPT, DeepSeek, Gemini, local models via Ollama) to messaging platforms (WhatsApp, Telegram, Discord, Slack, Signal, and more) and enables AI to take real actions — file management, browser automation, shell commands, web scraping, scheduling, and more.

**Key architectural components**:

- **Gateway**: WebSocket control plane (`ws://127.0.0.1:18789`) routing messages between channels, models, and tools
- **Channels**: Messaging platform connectors (Telegram, WhatsApp, Slack, Discord, Signal, IRC, Matrix, etc.)
- **Tools**: Built-in capabilities (exec, browser, web_search, web_fetch, read/write/edit, cron, canvas, media generation)
- **Skills**: Markdown instruction files (`SKILL.md`) that teach the agent how to combine tools for specific tasks
- **Lobster**: Companion workflow engine for composable, typed automation pipelines
- **Plugins**: Extension packages registering additional tools, skills, channels, or model providers

## How This Tutorial Works

### Structure

- **[Beginner](/en/learn/software-engineering/automation-tools/openclaw/by-example/beginner)** (Examples 1-27): Installation, CLI commands, JSON5 configuration, basic tools, simple skills — 0-40% coverage
- **[Intermediate](/en/learn/software-engineering/automation-tools/openclaw/by-example/intermediate)** (Examples 28-54): Channel integration, multi-agent patterns, advanced skills, Lobster workflows, tool groups — 40-75% coverage
- **[Advanced](/en/learn/software-engineering/automation-tools/openclaw/by-example/advanced)** (Examples 55-80): Plugin development, security hardening, production deployment, scaling, monitoring, custom model providers — 75-95% coverage

### Example Format

Each example follows a five-part structure:

1. **Brief explanation** (2-3 sentences) — What is this pattern and why does it matter?
2. **Diagram** (when appropriate) — Visual representation of architecture or data flow
3. **Heavily annotated configuration/commands** — Complete, runnable examples with inline `# =>` or `// =>` annotations
4. **Key takeaway** (1-2 sentences) — The essential insight distilled
5. **Why it matters** (50-100 words) — Production relevance and real-world impact

### Example: Annotation Style

```json5
// openclaw.json — Main configuration file
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        // => Default LLM for all agents
        // => Format: provider/model-name
        fallbacks: ["openai/gpt-4o"], // => Fallback if primary unavailable
        // => Tried in order until one succeeds
      },
    },
  },
}
```

## What You'll Learn

### Coverage: 95% of OpenClaw for Production Work

**Included**:

- Core CLI commands (onboard, gateway, agent, doctor, config, dashboard)
- JSON5 configuration (agents, channels, tools, models, security)
- Built-in tools (exec, browser, web_search, web_fetch, read/write/edit, cron, canvas)
- Skill authoring (SKILL.md format, metadata gates, OS filtering, tool guidance)
- Channel integration (Telegram, WhatsApp, Slack, Discord, Signal, IRC)
- Lobster workflows (steps, pipelines, approval gates, data passing, conditionals)
- Multi-agent patterns (subagents, session management, delegation)
- Plugin development (custom tools, channels, model providers)
- Security (sandboxing, tool allow/deny, channel access control)
- Production deployment (daemon management, monitoring, scaling)

**Excluded (the 5% edge cases)**:

- Internal Gateway WebSocket protocol implementation details
- Third-party plugin ecosystem (5,700+ ClawHub packages)
- Platform-specific mobile deployment (OpenClaw Android internals)
- Cloudflare MoltWorker serverless runtime specifics
- Source-level Gateway architecture and contribution workflow

## Prerequisites

- **Required**: Command-line proficiency (terminal, shell basics)
- **Required**: Node.js 22.16+ or 24+ (recommended) installed
- **Required**: Basic understanding of JSON/JSON5 syntax
- **Helpful**: Familiarity with at least one LLM API (Anthropic, OpenAI, etc.)
- **Helpful**: Experience with messaging platform bots (Telegram, Slack, Discord)
- **Not required**: Prior OpenClaw experience — this tutorial starts from zero

## Learning Path Comparison

| Aspect       | By Example (this tutorial)             | By Concept (narrative)                              |
| ------------ | -------------------------------------- | --------------------------------------------------- |
| **Approach** | Code-first, 80 annotated examples      | Explanation-first, conceptual chapters              |
| **Pace**     | Fast — copy, run, modify               | Moderate — read, understand, apply                  |
| **Best for** | Experienced devs switching to OpenClaw | Developers wanting deep architectural understanding |
| **Coverage** | 95% through working examples           | 95% through conceptual explanations                 |

## Installation Quick Start

```bash
# Install OpenClaw CLI globally
npm install -g openclaw@latest          # => Installs openclaw command
                                        # => Requires Node.js 22.16+ or 24+ (recommended)

# Run interactive onboarding
openclaw onboard --install-daemon       # => Walks through initial setup
                                        # => Configures default model provider
                                        # => Installs system daemon
                                        # => Creates ~/.openclaw/ directory

# Verify installation
openclaw --version                      # => Shows: openclaw X.Y.Z
openclaw doctor                         # => Checks system requirements
                                        # => Validates config, connectivity
```

## Next Steps

Start with **[Beginner Examples (1-27)](/en/learn/software-engineering/automation-tools/openclaw/by-example/beginner)** to learn CLI fundamentals and JSON5 configuration.
