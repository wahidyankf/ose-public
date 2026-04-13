---
title: "Overview"
date: 2026-04-14T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Hermes Agent through 80 heavily annotated examples: CLI basics, YAML configuration, memory, skills, messaging, delegation, security, and production patterns (95% coverage)"
tags: ["hermes-agent", "by-example", "tutorial", "ai-agent", "automation", "nous-research"]
---

**Learn the Hermes Agent AI platform by doing.** This by-example tutorial teaches Hermes Agent — the open-source, self-improving AI agent by Nous Research — through 80 heavily annotated, self-contained examples achieving 95% coverage. Master CLI usage, YAML configuration, persistent memory, skill authoring, messaging gateway integration, subagent delegation, security hardening, and production deployment patterns.

## What is By Example?

By Example is a **code-first learning approach** designed for experienced developers who want to master Hermes Agent efficiently. Instead of lengthy explanations followed by examples, you'll see complete, runnable configurations and commands with inline annotations explaining what each element does and why it matters.

**Target audience**: Developers and DevOps engineers with command-line experience who want to deploy and orchestrate self-improving AI agents using Hermes Agent.

## What is Hermes Agent?

Hermes Agent is a **free, open-source, self-improving AI agent** built by Nous Research. It connects large language models (Claude, GPT, Gemini, DeepSeek, Llama, and 200+ models via OpenRouter) to messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, and more) and enables AI to take real actions — shell commands, file management, browser automation, web scraping, scheduling, delegation, and more.

**Key differentiator**: Hermes Agent has a built-in learning loop — it creates skills from experience, improves them during use, persists knowledge across sessions, and builds a deepening model of who you are.

**Key architectural components**:

- **CLI**: Python-based terminal UI (`hermes`) with multiline editing, autocomplete, streaming, and token/cost tracking
- **Gateway**: Multi-platform messaging server connecting Telegram, Discord, Slack, WhatsApp, Signal, Email, and more
- **Tools**: 47 built-in capabilities across 19 toolsets (terminal, file, browser, web, vision, delegation, memory, cron, and more)
- **Memory**: Persistent MEMORY.md and USER.md files injected into every session, with FTS5 session search
- **Skills**: Self-improving procedural memory (SKILL.md format) — agent autonomously creates and refines skills after complex tasks
- **Delegation**: Spawn isolated subagents for parallel workstreams (up to 3 concurrent, depth limit 2)
- **Terminal Backends**: 6 execution environments — local, Docker, SSH, Modal, Daytona, Singularity

## How This Tutorial Works

### Structure

- **[Beginner](/en/learn/software-engineering/automation-tools/hermes-agent/by-example/beginner)** (Examples 1-27): Installation, CLI commands, YAML configuration, basic tools, memory fundamentals — 0-40% coverage
- **[Intermediate](/en/learn/software-engineering/automation-tools/hermes-agent/by-example/intermediate)** (Examples 28-54): Skills system, messaging channels, delegation, scheduling, browser automation, code execution — 40-75% coverage
- **[Advanced](/en/learn/software-engineering/automation-tools/hermes-agent/by-example/advanced)** (Examples 55-80): Terminal backends, security hardening, MCP integration, voice mode, production deployment, scaling — 75-95% coverage

### Example Format

Each example follows a five-part structure:

1. **Brief explanation** (2-3 sentences) — What is this pattern and why does it matter?
2. **Diagram** (when appropriate) — Visual representation of architecture or data flow
3. **Heavily annotated configuration/commands** — Complete, runnable examples with inline `# =>` annotations
4. **Key takeaway** (1-2 sentences) — The essential insight distilled
5. **Why it matters** (50-100 words) — Production relevance and real-world impact

### Example: Annotation Style

```yaml
# ~/.hermes/config.yaml — Main configuration file
model:
  provider:
    "anthropic" # => LLM provider selection
    # => Options: anthropic, openrouter, nous, copilot, custom
  model:
    "claude-sonnet-4-6" # => Model identifier within provider
    # => Format varies by provider
```

## What You'll Learn

### Coverage: 95% of Hermes Agent for Production Work

**Included**:

- Core CLI commands (hermes, hermes model, hermes tools, hermes setup, hermes doctor)
- YAML configuration (model, terminal, memory, compression, security, TTS)
- Built-in tools (terminal, read_file, write_file, patch, search_files, web_search, web_extract, browser, vision, delegation)
- Memory system (MEMORY.md, USER.md, session_search, external providers)
- Skill authoring (SKILL.md format, progressive disclosure, autonomous creation, Skills Hub)
- Messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal, Email)
- Delegation and subagents (delegate_task, batch parallelism)
- Scheduling (cronjob tool, natural language, multi-platform delivery)
- Terminal backends (local, Docker, SSH, Modal, Daytona, Singularity)
- Security (approvals, secret redaction, Tirith scanning, checkpoints)
- MCP server integration
- Voice mode (TTS, STT, push-to-talk)
- Production deployment (daemon management, monitoring, scaling)

**Excluded (the 5% edge cases)**:

- Atropos RL training environment internals
- Third-party memory provider plugin development
- ACP IDE integration protocol details
- Internal AIAgent class Python API
- WhatsApp Baileys protocol implementation

## Prerequisites

- **Required**: Command-line proficiency (terminal, shell basics)
- **Required**: Git installed (only system prerequisite — installer handles everything else)
- **Required**: Basic understanding of YAML syntax
- **Helpful**: Familiarity with at least one LLM API (Anthropic, OpenAI, etc.)
- **Helpful**: Experience with messaging platform bots (Telegram, Slack, Discord)
- **Not required**: Prior Hermes Agent or OpenClaw experience — this tutorial starts from zero

## Learning Path Comparison

| Aspect       | By Example (this tutorial)           | By Concept (narrative)                              |
| ------------ | ------------------------------------ | --------------------------------------------------- |
| **Approach** | Code-first, 80 annotated examples    | Explanation-first, conceptual chapters              |
| **Pace**     | Fast — copy, run, modify             | Moderate — read, understand, apply                  |
| **Best for** | Experienced devs switching to Hermes | Developers wanting deep architectural understanding |
| **Coverage** | 95% through working examples         | 95% through conceptual explanations                 |

## Installation Quick Start

```bash
# Install Hermes Agent (Linux/macOS/WSL2/Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
                                        # => Only prerequisite: Git
                                        # => Auto-installs: Python 3.11, Node.js v22,
                                        # =>   uv, ripgrep, ffmpeg

# Reload shell
source ~/.bashrc                        # => Makes `hermes` command available

# Run first-time setup
hermes setup                            # => Interactive wizard
                                        # => Configures model provider and API key
                                        # => Creates ~/.hermes/ directory structure

# Verify installation
hermes doctor                           # => Checks system requirements
                                        # => Validates config, connectivity
```

## Migrating from OpenClaw

If you're currently using OpenClaw, Hermes Agent provides a built-in migration tool:

```bash
hermes claw migrate --dry-run           # => Preview what will be migrated
hermes claw migrate --preset full       # => Full migration including API keys
                                        # => Converts JSON5 config to YAML
                                        # => Imports memory, skills, sessions
```

See [Example 27](/en/learn/software-engineering/automation-tools/hermes-agent/by-example/beginner) for the complete migration guide.

## Next Steps

Start with **[Beginner Examples (1-27)](/en/learn/software-engineering/automation-tools/hermes-agent/by-example/beginner)** to learn CLI fundamentals and YAML configuration.
