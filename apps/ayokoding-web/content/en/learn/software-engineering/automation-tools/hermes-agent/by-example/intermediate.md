---
title: "Intermediate"
date: 2026-04-14T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 28-54: Hermes Agent skills, messaging channels, delegation, scheduling, browser automation, and code execution (40-75% coverage)"
tags: ["hermes-agent", "intermediate", "by-example", "tutorial", "skills", "channels", "delegation", "scheduling"]
---

This tutorial provides 27 intermediate examples covering Hermes Agent's skills system (Examples 28-34), messaging channel integration (Examples 35-42), delegation and scheduling (Examples 43-48), and browser automation and code execution (Examples 49-54).

## Skills System (Examples 28-34)

### Example 28: Skills System Overview

Skills are Hermes Agent's procedural memory — reusable instructions the agent loads contextually to perform tasks correctly. The system uses progressive disclosure to minimize token usage: Level 0 injects only a compact skill list (~3k tokens), Level 1 loads a full skill on demand, and Level 2 fetches specific files within a skill.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    subgraph L0["Level 0: Skills List (~3k tokens)"]
        style L0 fill:#0173B2,color:#fff
        SL["skills_list()"]
        SL -->|"Returns"| META["name, description, version\nfor ALL skills"]
    end

    subgraph L1["Level 1: Full Skill View"]
        style L1 fill:#DE8F05,color:#fff
        SV1["skill_view(name)"]
        SV1 -->|"Returns"| FULL["Complete SKILL.md\n+ file listing"]
    end

    subgraph L2["Level 2: Specific File"]
        style L2 fill:#029E73,color:#fff
        SV2["skill_view(name, path)"]
        SV2 -->|"Returns"| FILE["Single reference file\nor template content"]
    end

    L0 -->|"Agent needs details"| L1
    L1 -->|"Agent needs file"| L2
```

```bash
# Progressive disclosure in action
# Level 0 — injected into every session automatically
hermes tools list skills                # => Shows skills_list tool
                                        # => Agent sees ~3k token summary of all skills
                                        # => Enough to know WHAT skills exist

# Level 1 — agent calls when it needs a skill
# skills_list() output (injected at session start):
# => deploy-docker: "Deploy apps via Docker Compose" (v1.2)
# => fix-linting: "Auto-fix ESLint and Prettier issues" (v1.0)
# => ...30 more skills, each one line

# Level 2 — agent drills into specific file
# skill_view("deploy-docker", "references/compose-patterns.md")
# => Returns only the specific reference file content
# => Minimal token cost for targeted knowledge
```

```yaml
# ~/.hermes/skills/ directory structure
# => Top-level categories organize skills by domain
skills/
  devops/                               # => Category directory
    deploy-docker/                      # => Individual skill directory
      SKILL.md                          # => Skill definition (required)
      references/                       # => Supporting reference docs
        compose-patterns.md             # => Loaded via skill_view(name, path)
      templates/                        # => Reusable templates
        docker-compose.yml              # => Template files for the skill
      scripts/                          # => Executable scripts
        healthcheck.sh                  # => Scripts the skill can invoke
  coding/                               # => Another category
    fix-linting/                        # => Skills are self-contained
      SKILL.md                          # => Each skill has its own SKILL.md
```

**Key Takeaway**: The three-level progressive disclosure system keeps base token cost at ~3k tokens regardless of how many skills exist, loading full skill content only when the agent determines it needs specific knowledge.

**Why It Matters**: Without progressive disclosure, injecting 50 skills at full resolution would consume 100k+ tokens per session — most of it irrelevant to the current task. Level 0 gives the agent a menu; Level 1 loads the recipe; Level 2 fetches a specific ingredient. This architecture scales to hundreds of skills without degrading session quality or increasing cost. The agent decides what to load, not the user.

### Example 29: Viewing Skills

The `/skills` slash command in a Hermes session displays available skills interactively. Programmatically, the agent uses `skills_list()` for metadata and `skill_view()` for full content. These tools form the read path of the skills system.

```bash
# Interactive skill browsing in a Hermes session
hermes                                  # => Start a session
# Type /skills in the session:
/skills                                 # => Lists all installed skills
                                        # => Shows: name, description, version
                                        # => Grouped by category

# Programmatic access (what the agent calls internally):
# skills_list() returns JSON metadata for all skills
# => [
# =>   {
# =>     "name": "deploy-docker",
# =>     "description": "Deploy apps via Docker Compose",
# =>     "version": "1.2",
# =>     "platforms": ["linux", "macos"],
# =>     "category": "devops"
# =>   },
# =>   {
# =>     "name": "fix-linting",
# =>     "description": "Auto-fix ESLint and Prettier issues",
# =>     "version": "1.0",
# =>     "platforms": ["linux", "macos", "windows"],
# =>     "category": "coding"
# =>   }
# => ]

# skill_view(name) returns the full SKILL.md content
# skill_view("deploy-docker")
# => Returns complete SKILL.md with frontmatter + body
# => Plus listing of all files in the skill directory

# skill_view(name, path) returns a specific file
# skill_view("deploy-docker", "references/compose-patterns.md")
# => Returns only that file's content
# => Targeted retrieval — minimal token cost
```

**Key Takeaway**: Use `/skills` for interactive browsing and `skills_list()` / `skill_view()` for programmatic access. The agent automatically calls these tools when it needs skill knowledge.

**Why It Matters**: The read path is intentionally split into three granularity levels so the agent can make cost-effective decisions about what knowledge to load. In practice, the agent reads the skill list at session start, identifies relevant skills by name/description, and loads full content only for the 1-2 skills it actually needs. This self-regulating behavior means you can install dozens of skills without worrying about token bloat — the agent manages its own context window.

### Example 30: SKILL.md Format

Every skill is defined by a `SKILL.md` file containing YAML frontmatter (metadata, config, environment variables) and a markdown body (procedure, pitfalls, verification steps). This format is both human-readable and machine-parseable.

```yaml
# ~/.hermes/skills/devops/deploy-docker/SKILL.md
---
# YAML frontmatter — parsed by skills_list()
name: deploy-docker                     # => Unique skill identifier
                                        # => Used in skill_view("deploy-docker")
description: >-                         # => Short description for Level 0 listing
  Deploy applications using Docker      # => Shown in skills_list() output
  Compose with health checks            # => Keep under 80 chars
version: "1.2"                          # => Semantic version for tracking changes
                                        # => Agent sees this in skill list

platforms:                              # => OS restrictions
  - linux                               # => Skill only loads on these platforms
  - macos                               # => Omit for cross-platform skills

metadata:
  hermes:
    fallback_for_toolsets: []           # => Conditional activation (see Example 33)
    requires_toolsets: []               # => Conditional activation (see Example 33)

config:
  compose_version: "3.8"               # => Skill-specific configuration
                                        # => Accessible in skill body as variables
  default_timeout: 300                  # => Custom config for this skill

required_environment_variables:
  - DOCKER_HOST                         # => Agent warns if these are missing
  - REGISTRY_URL                        # => Before attempting the skill procedure
---

## When to Use

# => Section: conditions that trigger this skill
# => Agent reads this to decide relevance
Deploy this skill when the user asks to containerize an application,
set up Docker Compose, or troubleshoot container deployments.

## Procedure

# => Section: step-by-step instructions
# => Agent follows these as a recipe
1. Check Docker daemon is running: `docker info`
2. Validate compose file: `docker compose config`
3. Build images: `docker compose build`
4. Start services: `docker compose up -d`
5. Verify health: `docker compose ps`

## Pitfalls

# => Section: common failure modes
# => Agent checks these proactively
- Port conflicts: check `lsof -i :PORT` before starting
- Volume permissions: ensure host directories exist with correct ownership
- Network isolation: services in different compose files need explicit networks

## Verification

# => Section: how to confirm success
# => Agent runs these after completing procedure
- All containers show "healthy" in `docker compose ps`
- Application responds on expected port
- Logs show no error-level entries
```

**Key Takeaway**: SKILL.md combines machine-parseable YAML frontmatter with human-readable markdown procedure documentation. The four body sections (When to Use, Procedure, Pitfalls, Verification) give the agent a complete decision-and-execution framework.

**Why It Matters**: The structured format serves dual purposes — the YAML frontmatter enables programmatic filtering (platform restrictions, conditional activation, environment validation) while the markdown body provides the agent with actionable instructions it can follow autonomously. The Pitfalls section is particularly valuable: it encodes hard-won operational knowledge that prevents the agent from repeating mistakes. Over time, skills accumulate institutional knowledge that outlasts any single session.

### Example 31: Creating Skills Manually

You can create skills manually by writing a `SKILL.md` file in the appropriate directory under `~/.hermes/skills/`. The `skill_manage` tool provides programmatic CRUD operations for creating, editing, and deleting skills and their supporting files.

```bash
# Manual skill creation — create the directory structure
mkdir -p ~/.hermes/skills/coding/format-code
                                        # => Category: coding
                                        # => Skill name: format-code
                                        # => Directory is the skill boundary

# Write the SKILL.md file
cat > ~/.hermes/skills/coding/format-code/SKILL.md << 'SKILL'
---
name: format-code
description: "Format source code using project-specific formatters"
version: "1.0"
platforms:
  - linux
  - macos
required_environment_variables: []
---

## When to Use

Apply when the user asks to format code, fix style issues,
or prepare files for a commit with consistent formatting.

## Procedure

1. Detect project type from config files (package.json, pyproject.toml, etc.)
2. Run the appropriate formatter (prettier, black, gofmt, rustfmt)
3. Report files changed

## Pitfalls

- Check for .editorconfig and respect its settings
- Some formatters modify files in-place — warn before bulk formatting

## Verification

- Run formatter in check mode to confirm no remaining changes
SKILL
                                        # => SKILL.md written
                                        # => Skill is immediately available

# Add supporting files
mkdir -p ~/.hermes/skills/coding/format-code/references
                                        # => references/ for documentation
mkdir -p ~/.hermes/skills/coding/format-code/templates
                                        # => templates/ for reusable configs
mkdir -p ~/.hermes/skills/coding/format-code/scripts
                                        # => scripts/ for executable helpers
mkdir -p ~/.hermes/skills/coding/format-code/assets
                                        # => assets/ for images, data files
```

```bash
# Programmatic skill management via skill_manage tool
# (agent calls these internally, shown here for reference)

# Create a new skill
# skill_manage(action="create", name="format-code", category="coding")
# => Creates directory structure + skeleton SKILL.md

# Edit skill content
# skill_manage(action="edit", name="format-code", content="...")
# => Overwrites SKILL.md with new content

# Patch skill (partial update)
# skill_manage(action="patch", name="format-code", section="Procedure", content="...")
# => Updates only the specified section

# Write a supporting file
# skill_manage(action="write_file", name="format-code",
#              path="references/prettier-config.md", content="...")
# => Creates or updates file within skill directory

# Remove a supporting file
# skill_manage(action="remove_file", name="format-code",
#              path="references/outdated.md")
# => Deletes file from skill directory

# Delete entire skill
# skill_manage(action="delete", name="format-code")
# => Removes skill directory and all contents
```

**Key Takeaway**: Skills can be created manually by writing files or programmatically via the `skill_manage` tool. The directory structure (SKILL.md + references/ + templates/ + scripts/ + assets/) is a convention, not enforced — only SKILL.md is required.

**Why It Matters**: Manual skill creation gives you full control over the agent's procedural knowledge. Unlike prompt engineering (which is ephemeral), skills persist across sessions and can be version-controlled alongside your codebase. Teams can share skills through git repositories, ensuring every team member's agent has the same operational playbook. The `skill_manage` tool enables the agent to maintain its own skills autonomously — the foundation for self-improvement.

### Example 32: Autonomous Skill Creation

Hermes Agent automatically creates skills when it detects reusable patterns during a session. Triggers include 5+ tool calls for a task, successful error recovery, user corrections that teach new patterns, and non-trivial multi-step workflows. The agent nudges itself to persist knowledge and self-improves skills during subsequent use.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    subgraph Session["Current Session"]
        style Session fill:#0173B2,color:#fff
        T1["5+ tool calls"]
        T2["Error recovery"]
        T3["User correction"]
    end

    subgraph Trigger["Skill Creation Trigger"]
        style Trigger fill:#DE8F05,color:#fff
        D["Agent detects\nreusable pattern"]
    end

    subgraph Persist["Skill Persisted"]
        style Persist fill:#029E73,color:#fff
        S["SKILL.md written\nto ~/.hermes/skills/"]
    end

    subgraph Improve["Self-Improvement"]
        style Improve fill:#CC78BC,color:#fff
        I["Skill refined\nin later sessions"]
    end

    T1 --> D
    T2 --> D
    T3 --> D
    D --> Persist
    Persist --> Improve
    Improve -->|"Next use"| Persist
```

```bash
# Scenario: You ask the agent to deploy a Next.js app to Vercel
# The agent performs these steps (first time):
# => 1. Check for vercel.json
# => 2. Validate build command
# => 3. Set environment variables
# => 4. Run vercel deploy --prod
# => 5. Verify deployment URL
# => 6. Check build logs for errors
# => 7. Confirm DNS resolution

# After completing the task (7 tool calls > threshold of 5):
# Agent internally reasons:
# => "This was a non-trivial workflow with 7 steps."
# => "I should persist this as a skill for future use."
# => "Creating skill: deploy-vercel"

# Agent calls:
# skill_manage(action="create", name="deploy-vercel", category="devops")
# => Writes SKILL.md with the procedure it just executed
# => Includes the pitfalls it encountered
# => Adds verification steps it used

# Next time you ask "deploy to Vercel":
# => Agent loads deploy-vercel skill (Level 1)
# => Follows the persisted procedure
# => Skips trial-and-error from first attempt

# Self-improvement: if the agent encounters a new pitfall
# (e.g., monorepo root detection), it patches the skill:
# skill_manage(action="patch", name="deploy-vercel",
#              section="Pitfalls",
#              content="- Monorepo: set rootDirectory in vercel.json")
# => Skill gets better with each use
```

**Key Takeaway**: The agent autonomously creates skills after complex tasks (5+ tool calls, error recovery, user corrections) and refines them during subsequent use, building an ever-improving procedural knowledge base.

**Why It Matters**: Autonomous skill creation is Hermes Agent's core differentiator — the agent learns from experience without explicit training. The first time you solve a complex problem, the agent watches and records. Every subsequent invocation benefits from that recorded knowledge. Over weeks of use, your agent accumulates operational expertise specific to your infrastructure, your codebase, and your preferences. This compounds: a skill created from deploying app A improves when deploying app B, which further refines for app C.

### Example 33: Skill Conditional Activation

Skills can be conditionally shown or hidden based on available toolsets and platform. `fallback_for_toolsets` hides a skill when the specified toolsets are present (the skill is a fallback). `requires_toolsets` hides a skill when the specified toolsets are absent (the skill needs them). Platform restrictions filter by OS.

```yaml
# ~/.hermes/skills/devops/manual-deploy/SKILL.md
---
name: manual-deploy
description: "Step-by-step manual deployment when CI/CD is unavailable"
version: "1.0"

metadata:
  hermes:
    fallback_for_toolsets:
      - terminal # => This skill is HIDDEN when terminal
        # =>   toolset is available
        # => Shown only when terminal is disabled
        # => Use case: fallback instructions when
        # =>   agent can't run commands directly

    requires_toolsets: [] # => No toolset requirements
      # => (skill works without tools)

platforms:
  - linux # => Only shown on Linux
  - macos # => Only shown on macOS
    # => Hidden on Windows/other
---
```

```yaml
# ~/.hermes/skills/devops/docker-deploy/SKILL.md
---
name: docker-deploy
description: "Deploy via Docker Compose with health checks"
version: "1.0"

metadata:
  hermes:
    fallback_for_toolsets: [] # => Not a fallback — always eligible

    requires_toolsets:
      - terminal # => HIDDEN when terminal toolset is absent
        # => Agent needs shell access for this skill
      - file # => Also requires file toolset
        # => Needs to read/write compose files

platforms: [] # => Empty = all platforms
  # => No OS restriction
---
```

```bash
# How conditional activation works at runtime:

# Scenario 1: Agent has terminal + file toolsets enabled
# => manual-deploy: HIDDEN (fallback_for_toolsets includes "terminal")
# => docker-deploy: SHOWN (requires_toolsets satisfied)

# Scenario 2: Agent has no terminal toolset (restricted mode)
# => manual-deploy: SHOWN (fallback activated — terminal absent)
# => docker-deploy: HIDDEN (requires terminal, which is absent)

# Scenario 3: Agent on Windows with terminal toolset
# => manual-deploy: HIDDEN (platform restriction — not in [linux, macos])
# => docker-deploy: SHOWN (no platform restriction, toolsets satisfied)
```

**Key Takeaway**: Use `fallback_for_toolsets` for skills that should only appear when the agent is restricted, and `requires_toolsets` for skills that need specific capabilities. Platform restrictions add OS-level filtering.

**Why It Matters**: Conditional activation prevents the agent from seeing irrelevant skills — a deployment skill requiring terminal access is noise when the agent is in read-only mode. Conversely, fallback skills provide alternative instructions when capabilities are restricted (e.g., guiding a user through manual steps when the agent cannot execute commands). This keeps the skill list contextually relevant and prevents the agent from attempting procedures it lacks the tools to complete.

### Example 34: Skills Hub Integration

The Skills Hub is a curated marketplace for discovering and installing pre-built skills from multiple sources. Sources include official Nous Research skills, community repositories, and external directories. Installed skills are scanned for security before activation.

```bash
# Browse available skills from the hub
hermes skills hub browse                # => Lists skills from all configured sources
                                        # => Shows: name, description, source, version
                                        # => Sources: official, skills-sh, well-known,
                                        # =>   github, clawhub, lobehub, claude-marketplace

# Search for specific skills
hermes skills hub search "docker"       # => Searches across all sources
                                        # => Returns matching skills with descriptions
                                        # => Shows compatibility info (platforms, toolsets)

# Install a skill from the hub
hermes skills hub install deploy-k8s    # => Downloads skill to ~/.hermes/skills/
                                        # => Runs security scan on SKILL.md and scripts
                                        # => Validates frontmatter format
                                        # => Reports: "Installed deploy-k8s v2.1 (official)"

# Install from a specific source
hermes skills hub install --source github user/repo/skill-name
                                        # => Fetches from GitHub repository
                                        # => Validates directory structure
                                        # => Copies to local skills directory
```

```yaml
# ~/.hermes/config.yaml — external skill directories
skills:
  external_dirs: # => Additional directories to scan for skills
    - /opt/team-skills # => Shared team skills (e.g., NFS mount)
      # => Hermes scans these alongside ~/.hermes/skills/
    - ~/projects/my-skills # => Personal skill repository
      # => Can be a git repo for version control

  hub:
    sources: # => Configure which hub sources to query
      official: true # => Nous Research official skills
      skills_sh: true # => skills.sh community registry
      well_known: true # => Well-known GitHub repositories
      github: true # => Arbitrary GitHub repos
      clawhub: true # => ClawHub marketplace
      lobehub: true # => LobeHub skill store
      claude_marketplace: true # => Claude marketplace skills

    auto_update:
      false # => Manual updates only (recommended)
      # => true: auto-update on session start
    security_scan:
      true # => Scan installed skills for suspicious patterns
      # => Checks: shell injection, data exfiltration,
      # =>   obfuscated code, excessive permissions
```

**Key Takeaway**: The Skills Hub provides a curated marketplace with multiple sources for discovering skills, while `external_dirs` enables team-shared skill repositories. Security scanning validates installed skills before activation.

**Why It Matters**: No agent operates in isolation — the Skills Hub lets you leverage community expertise instead of building every workflow from scratch. A team deploying to Kubernetes can install a battle-tested `deploy-k8s` skill rather than encoding deployment knowledge from memory. External directories enable enterprise patterns: mount a shared NFS volume or clone a team git repo, and every team member's agent gains identical capabilities. Security scanning is critical because skills can contain executable scripts — the scan catches common attack patterns before they reach your system.

## Messaging Channel Integration (Examples 35-42)

### Example 35: Gateway Architecture

The Hermes gateway is a persistent process that bridges messaging platforms to the agent. A single `hermes gateway` process handles all configured channels simultaneously, routing incoming messages to the LLM and delivering responses back to each platform.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    subgraph Platforms["Messaging Platforms"]
        style Platforms fill:#0173B2,color:#fff
        TG["Telegram"]
        DC["Discord"]
        SL["Slack"]
        WA["WhatsApp"]
        SIG["Signal"]
        EM["Email"]
    end

    subgraph Gateway["hermes gateway"]
        style Gateway fill:#DE8F05,color:#fff
        RT["Router"]
        AUTH["Auth / ACL"]
        SM["Session Manager"]
    end

    subgraph Agent["Hermes Agent"]
        style Agent fill:#029E73,color:#fff
        LLM["LLM Provider"]
        TOOLS["Tool Execution"]
        MEM["Memory"]
    end

    TG --> RT
    DC --> RT
    SL --> RT
    WA --> RT
    SIG --> RT
    EM --> RT
    RT --> AUTH
    AUTH --> SM
    SM --> LLM
    LLM --> TOOLS
    TOOLS --> MEM
    SM -->|"Response"| RT
    RT -->|"Reply"| TG
    RT -->|"Reply"| DC
    RT -->|"Reply"| SL
```

```bash
# Gateway lifecycle commands
hermes gateway start                    # => Starts the gateway process
                                        # => Connects to all enabled channels
                                        # => Runs as foreground process (Ctrl+C to stop)
                                        # => Output: "Gateway started. Channels: telegram, slack"

hermes gateway start --daemon           # => Runs in background (detached)
                                        # => PID stored in ~/.hermes/gateway.pid
                                        # => Logs to ~/.hermes/logs/gateway.log

hermes gateway stop                     # => Stops the background gateway
                                        # => Gracefully disconnects all channels
                                        # => Output: "Gateway stopped"

hermes gateway status                   # => Shows gateway health
                                        # => Output: "Running (PID 12345)"
                                        # => Lists connected channels and uptime
                                        # => Shows message counts per channel

hermes gateway restart                  # => Stop + start (reloads config)
                                        # => Use after changing channel configuration
```

**Key Takeaway**: The gateway is a single process managing all platform connections. Use `start --daemon` for production, `status` to monitor health, and `restart` after configuration changes.

**Why It Matters**: The unified gateway architecture means you configure one process, not six separate bots. Adding a new platform is a config change and a restart — no new services to deploy or monitor. The gateway handles authentication, session routing, and platform-specific message formatting internally, so the agent sees a uniform interface regardless of whether the message came from Telegram or Slack. This dramatically simplifies operations: one log file, one PID, one health check.

### Example 36: Telegram Channel Setup

Telegram is the most popular channel for Hermes Agent. Setup requires a bot token from BotFather, user whitelisting via Telegram user IDs, and a DM pairing policy. The interactive `hermes gateway setup` wizard can guide you through configuration.

```bash
# Step 1: Create a Telegram bot via BotFather
# Open Telegram, message @BotFather
# /newbot → choose name → receive token
# Token format: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"

# Step 2: Get your Telegram user ID
# Message @userinfobot on Telegram
# It replies with your numeric user ID
```

```yaml
# ~/.hermes/config.yaml — Telegram channel configuration
channels:
  telegram:
    enabled:
      true # => Activates Telegram channel
      # => Gateway connects on start

# .env — Telegram credentials
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
#                                       # => From @BotFather
#                                       # => Never commit to version control

# TELEGRAM_ALLOWED_USERS=123456789,987654321
#                                       # => Comma-separated Telegram user IDs
#                                       # => Only these users can interact
#                                       # => Empty = no one can use the bot
```

```bash
# Alternative: interactive setup wizard
hermes gateway setup                    # => Walks through channel configuration
                                        # => Prompts for bot token
                                        # => Prompts for allowed users
                                        # => Writes config and .env automatically

# DM pairing policy
# When an unknown user messages the bot:
# => "pair" mode: bot sends pairing request to admin
# =>   Admin approves/denies new users interactively
# => "ignore" mode: bot silently ignores unknown users

# Start gateway with Telegram
hermes gateway start                    # => Output: "Telegram channel connected"
                                        # => Bot appears online in Telegram
                                        # => Responds to allowed users only
```

**Key Takeaway**: Telegram setup requires a BotFather token, user IDs in `TELEGRAM_ALLOWED_USERS`, and gateway restart. The DM pairing policy controls how unknown users are handled.

**Why It Matters**: Telegram's lightweight clients across mobile, desktop, and web make it the most accessible channel for interacting with your AI agent anywhere. The allowlist-based access control is essential — without it, anyone who discovers your bot's username can consume your API tokens. The pairing policy adds flexibility: teams can use "pair" mode to let new members request access without sharing user IDs out-of-band, while "ignore" mode provides stricter security for personal bots.

### Example 37: Discord Channel Setup

Discord integration connects Hermes Agent to Discord servers (guilds). The bot responds when mentioned or in designated channels. Configuration supports auto-threading for organized conversations and free-response channels where the bot speaks without being mentioned.

```yaml
# ~/.hermes/config.yaml — Discord channel configuration
channels:
  discord:
    enabled:
      true # => Activates Discord channel
      # => Gateway connects on start

    require_mention:
      true # => Bot only responds when @mentioned
      # => Prevents noise in busy channels
      # => false: responds to every message

    auto_thread:
      true # => Creates a thread for each conversation
      # => Keeps main channel clean
      # => Thread named after first message

    free_response_channels:
      - "ai-sandbox" # => Channels where bot responds to ALL messages
      - "bot-testing" # => No @mention required in these channels
        # => Useful for dedicated bot interaction spaces

# .env — Discord credentials
# DISCORD_BOT_TOKEN=MTIzNDU2Nzg5.Abc123.xyz789
#                                       # => From Discord Developer Portal
#                                       # => Bot > Token section
#                                       # => Requires MESSAGE_CONTENT intent enabled

# DISCORD_ALLOWED_USERS=123456789012345678,987654321098765432
#                                       # => Discord user IDs (18-digit snowflakes)
#                                       # => Only these users trigger responses
```

```bash
# Discord bot setup steps:
# 1. Go to discord.com/developers/applications
# 2. New Application → name it
# 3. Bot section → Reset Token → copy token
# 4. Enable MESSAGE CONTENT intent (required)
# 5. OAuth2 > URL Generator:
#    Scopes: bot, applications.commands
#    Permissions: Send Messages, Read Message History,
#                 Create Public Threads, Manage Threads
# 6. Copy invite URL → open in browser → select server

hermes gateway start                    # => Output: "Discord channel connected"
                                        # => Bot appears online in Discord server
                                        # => Responds to @mentions from allowed users
```

**Key Takeaway**: Discord requires a bot token with MESSAGE_CONTENT intent, user whitelist via `DISCORD_ALLOWED_USERS`, and supports `auto_thread` for organized conversations and `free_response_channels` for dedicated bot spaces.

**Why It Matters**: Discord is the default communication platform for many open-source communities and gaming-adjacent tech teams. Auto-threading prevents the bot from cluttering shared channels — each conversation gets its own thread, making it easy to follow and reference later. Free-response channels provide dedicated spaces where the bot is always listening, ideal for "ask the AI" channels that teams use for quick questions without the friction of typing @mentions.

### Example 38: Slack Channel Setup

Slack integration uses Socket Mode for secure, tunnel-free communication. Two tokens are required: a bot token (xoxb-) for sending messages and an app token (xapp-) for the WebSocket connection. Socket Mode eliminates the need for public URLs or ngrok.

```yaml
# ~/.hermes/config.yaml — Slack channel configuration
channels:
  slack:
    enabled:
      true # => Activates Slack channel
      # => Uses Socket Mode (WebSocket)

# .env — Slack credentials
# SLACK_BOT_TOKEN=xoxb-YOUR-BOT-TOKEN-HERE
#                                       # => From Slack App > OAuth & Permissions
#                                       # => Required scopes: chat:write, channels:history,
#                                       # =>   groups:history, im:history, mpim:history,
#                                       # =>   app_mentions:read
#                                       # => Prefix: xoxb- (bot token)

# SLACK_APP_TOKEN=xapp-YOUR-APP-TOKEN-HERE
#                                       # => From Slack App > Basic Information
#                                       # =>   > App-Level Tokens > Generate Token
#                                       # => Scope: connections:write
#                                       # => Prefix: xapp- (app-level token)
#                                       # => Enables Socket Mode (no public URL needed)

# SLACK_ALLOWED_USERS=U1234567890,U9876543210
#                                       # => Slack user IDs (format: UXXXXXXXXXX)
#                                       # => Find via: click user profile > "..." > Copy member ID
#                                       # => Only these users trigger bot responses
```

```bash
# Slack app setup steps:
# 1. Go to api.slack.com/apps → Create New App
# 2. From scratch → name + workspace
# 3. Socket Mode → Enable (generates xapp- token)
# 4. Event Subscriptions → Enable
#    Subscribe to bot events: app_mention, message.im
# 5. OAuth & Permissions → Add bot scopes listed above
# 6. Install App to Workspace → copy xoxb- token

hermes gateway start                    # => Output: "Slack channel connected (Socket Mode)"
                                        # => Bot appears online in Slack workspace
                                        # => No public URL or tunnel required
                                        # => Responds to @mentions and DMs from allowed users
```

**Key Takeaway**: Slack requires two tokens — `SLACK_BOT_TOKEN` (xoxb-) for messaging and `SLACK_APP_TOKEN` (xapp-) for Socket Mode. Socket Mode eliminates the need for public URLs, making local development seamless.

**Why It Matters**: Most engineering teams already live in Slack, making it a natural home for AI assistance alongside code reviews, incident response, and team coordination. Socket Mode is the key advantage: traditional Slack bots require a public HTTPS endpoint (meaning ngrok in development, load balancers in production), but Socket Mode uses an outbound WebSocket — the bot connects to Slack, not the other way around. This means the agent running on your local machine or behind a NAT can serve a Slack workspace without any network configuration.

### Example 39: WhatsApp Channel Setup

WhatsApp integration uses the Baileys library to connect to WhatsApp Web via QR code pairing. This provides unofficial but functional WhatsApp access. Node.js is required for the Baileys WebSocket connection.

```yaml
# ~/.hermes/config.yaml — WhatsApp channel configuration
channels:
  whatsapp:
    enabled:
      true # => Activates WhatsApp channel
      # => Uses Baileys library (unofficial API)
      # => Requires Node.js installed

# .env — WhatsApp credentials
# WHATSAPP_ALLOWED_USERS=1234567890,0987654321
#                                       # => Phone numbers without "+" prefix
#                                       # => Country code included (e.g., 1234567890 for US)
#                                       # => Only these numbers can interact with the bot
```

```bash
# WhatsApp setup process:
hermes gateway start                    # => Starts gateway with WhatsApp enabled
                                        # => Displays QR code in terminal
                                        # => Scan QR code with WhatsApp mobile app:
                                        # =>   Settings > Linked Devices > Link a Device

# After QR scan:
# => Output: "WhatsApp channel connected"
# => Session persisted in ~/.hermes/whatsapp-session/
# => Subsequent starts skip QR code (session cached)
# => Re-scan required if session expires (~14 days)

# Important considerations:
# => Uses your personal WhatsApp number (not a business API)
# => One WhatsApp account per gateway instance
# => Node.js required (Baileys is a Node.js library)
# => Unofficial API — may break with WhatsApp updates
# => Not recommended for production/business use
```

**Key Takeaway**: WhatsApp uses QR code pairing via Baileys (requires Node.js). Sessions are cached locally but require periodic re-authentication. This is an unofficial integration — use for personal convenience, not production.

**Why It Matters**: WhatsApp is the dominant messaging platform globally (2+ billion users), and many users find it the most convenient way to interact with AI from their phone. The Baileys integration makes this possible without WhatsApp Business API costs or Meta developer account requirements. However, the unofficial nature means WhatsApp can break compatibility at any time. The practical value is personal productivity — message your agent from your phone to check server status, trigger deployments, or ask questions while away from your desk.

### Example 40: Signal and Email Channels

Signal provides end-to-end encrypted messaging via the Signal CLI. Email integration uses standard SMTP/IMAP protocols for sending and receiving messages. Each platform has distinct configuration requirements.

```yaml
# ~/.hermes/config.yaml — Signal channel configuration
channels:
  signal:
    enabled:
      true # => Activates Signal channel
      # => Uses signal-cli (Java-based)

# .env — Signal credentials
# SIGNAL_ACCOUNT=+1234567890
#                                       # => Your Signal phone number
#                                       # => Must be registered with signal-cli first
#                                       # => Run: signal-cli -a +1234567890 register
#                                       # =>       signal-cli -a +1234567890 verify CODE

# SIGNAL_HTTP_URL=http://localhost:8080
#                                       # => signal-cli REST API endpoint
#                                       # => Run signal-cli in JSON-RPC mode:
#                                       # => signal-cli daemon --http localhost:8080
```

```yaml
# ~/.hermes/config.yaml — Email channel configuration
channels:
  email:
    enabled:
      true # => Activates Email channel
      # => Uses SMTP for sending, IMAP for receiving

# .env — Email credentials
# EMAIL_SMTP_HOST=smtp.gmail.com
# EMAIL_SMTP_PORT=587
# EMAIL_SMTP_USER=agent@example.com
# EMAIL_SMTP_PASS=app-specific-password
#                                       # => For Gmail: use App Password, not account password
#                                       # => Generate at: myaccount.google.com/apppasswords

# EMAIL_IMAP_HOST=imap.gmail.com
# EMAIL_IMAP_PORT=993
# EMAIL_IMAP_USER=agent@example.com
# EMAIL_IMAP_PASS=app-specific-password
#                                       # => Same credentials as SMTP typically

# EMAIL_ALLOWED_SENDERS=user@example.com,admin@example.com
#                                       # => Only process emails from these addresses
#                                       # => Prevents spam from triggering the agent
```

```bash
# Signal setup requires signal-cli:
# Install: https://github.com/AsamK/signal-cli
# Register your number, verify, start daemon

hermes gateway start                    # => Connects to signal-cli HTTP API
                                        # => Output: "Signal channel connected"

# Email setup:
hermes gateway start                    # => Connects to SMTP and IMAP servers
                                        # => Polls IMAP inbox for new messages
                                        # => Replies via SMTP
                                        # => Output: "Email channel connected"
```

**Key Takeaway**: Signal requires `signal-cli` running as a daemon with HTTP API. Email uses standard SMTP/IMAP with sender whitelisting. Both are configured via environment variables in `.env`.

**Why It Matters**: Signal provides the highest-security option for agent communication — end-to-end encrypted messages that not even Nous Research can read. This matters for teams handling sensitive data (healthcare, finance, legal) where Telegram or Slack may not meet compliance requirements. Email, while less interactive, enables asynchronous workflows: schedule a cron job to email a daily report, or forward alerts to the agent's inbox for automated triage. The sender whitelist prevents the agent from processing spam or phishing emails as legitimate requests.

### Example 41: Multi-Platform Message Delivery

The `send_message` tool lets the agent proactively deliver messages to any configured platform. Combined with cron jobs, this enables scheduled reports, alerts, and notifications delivered to whichever platform the user prefers.

```bash
# The agent uses send_message tool internally:
# send_message(platform="telegram", user_id="123456789",
#              message="Build completed successfully")
# => Delivers to specific Telegram user
# => Platform must be configured and connected

# send_message(platform="slack", channel="#dev-ops",
#              message="Deployment to production complete")
# => Sends to a Slack channel
# => Bot must be invited to the channel

# send_message(platform="discord", channel_id="1234567890",
#              message="CI pipeline failed — check logs")
# => Sends to a Discord channel by ID
# => Bot must have Send Messages permission

# Cross-platform delivery from a cron job:
# "Every morning at 9am, send server status to Telegram and Slack"
# => Agent creates cron job (see Example 47)
# => Cron job runs: checks server status
# => Calls send_message twice:
# =>   1. send_message(platform="telegram", ...)
# =>   2. send_message(platform="slack", ...)
# => Same report, two platforms
```

````yaml
# Platform-specific formatting considerations:
# Telegram:
# => Supports Markdown formatting (bold, italic, code blocks)
# => Max message length: 4096 characters
# => Long messages auto-split into multiple sends

# Slack:
# => Uses mrkdwn format (different from standard Markdown)
# => *bold* _italic_ `code` ```code block```
# => Supports Block Kit for rich layouts

# Discord:
# => Standard Markdown (bold, italic, code, spoilers)
# => Max message length: 2000 characters
# => Embeds available for structured data

# Email:
# => HTML or plain text body
# => Subject line auto-generated from first line
# => Attachments supported via file paths
````

**Key Takeaway**: The `send_message` tool provides a uniform interface for delivering messages to any configured platform. Platform-specific formatting differences are handled automatically by the gateway.

**Why It Matters**: Multi-platform delivery decouples the agent's actions from where you receive notifications. A single cron job can send morning status reports to Telegram (for your phone), Slack (for the team), and email (for stakeholders who don't use chat). This is the foundation for building notification pipelines — the agent generates content once and distributes it across channels. Without this, you would need separate notification scripts for each platform, each with its own authentication and formatting logic.

### Example 42: DM Policies and Access Control

Hermes Agent enforces layered access control for messaging channels. Each platform has a user whitelist, an unauthorized DM behavior policy, and optional per-user session isolation. These controls prevent unauthorized access to your agent and API tokens.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    MSG["Incoming Message"] --> PLATFORM{"Platform\nConfigured?"}
    style MSG fill:#0173B2,color:#fff

    PLATFORM -->|"No"| DROP1["Drop"]
    PLATFORM -->|"Yes"| ALLOW{"User in\nAllowlist?"}
    style ALLOW fill:#DE8F05,color:#fff

    ALLOW -->|"Yes"| SESSION["Route to\nSession"]
    style SESSION fill:#029E73,color:#fff
    ALLOW -->|"No"| POLICY{"DM Policy?"}
    style POLICY fill:#CC78BC,color:#fff

    POLICY -->|"pair"| PAIR["Send Pairing\nRequest to Admin"]
    POLICY -->|"ignore"| DROP2["Silently Drop"]
    style PAIR fill:#CA9161,color:#fff

    SESSION --> ISOLATE{"Per-User\nSessions?"}
    ISOLATE -->|"Yes"| OWN["Own Session\n(isolated context)"]
    ISOLATE -->|"No"| SHARED["Shared Session\n(group context)"]
```

```yaml
# ~/.hermes/config.yaml — access control configuration
gateway:
  unauthorized_dm_behavior:
    pair # => "pair": unknown users get pairing prompt
    # =>   Admin receives approval request
    # =>   Approved users added to allowlist
    # => "ignore": unknown users silently ignored
    # =>   No response, no notification

  group_sessions_per_user:
    true # => true: each user gets isolated session
    # =>   User A's context separate from User B
    # =>   Memory and conversation history isolated
    # => false: all users share one session
    # =>   Suitable for team channels

# Per-platform allowlists (in .env):
# TELEGRAM_ALLOWED_USERS=123,456       # => Telegram user IDs
# DISCORD_ALLOWED_USERS=789,012        # => Discord user IDs
# SLACK_ALLOWED_USERS=U123,U456        # => Slack member IDs
# WHATSAPP_ALLOWED_USERS=1555123,1555456  # => Phone numbers
# EMAIL_ALLOWED_SENDERS=a@x.com,b@x.com  # => Email addresses
```

```bash
# Access control in action:

# Unknown user messages bot on Telegram:
# With unauthorized_dm_behavior: pair
# => Bot replies: "I don't recognize you. Sending pairing request..."
# => Admin receives: "User 555666777 wants to pair. /approve or /deny"
# => Admin types: /approve
# => User added to allowlist, can now interact

# With unauthorized_dm_behavior: ignore
# => No response sent
# => No notification to admin
# => User's message silently discarded

# Per-user sessions:
# With group_sessions_per_user: true
# => User A asks: "Remember my name is Alice"
# => User B asks: "What's my name?"
# => Agent to B: "I don't know your name yet."
# => Contexts are isolated — A's data invisible to B

# With group_sessions_per_user: false
# => All users share context in group channels
# => User A's statements visible to User B's session
```

**Key Takeaway**: Layer access control with platform allowlists, DM policies (pair/ignore), and per-user session isolation. The pairing flow enables controlled onboarding without sharing user IDs out-of-band.

**Why It Matters**: Every messaging channel is a potential attack surface — an unprotected bot on Telegram can be discovered and abused by anyone, consuming your API tokens (at your cost) or executing commands on your system. The three-layer defense (platform allowlist + DM policy + session isolation) provides defense-in-depth. The pairing flow is particularly useful for teams: instead of collecting Telegram user IDs manually, the admin approves incoming requests interactively. Session isolation ensures that in a multi-user setup, one user cannot access another user's conversation history or memory — critical for shared bots serving multiple team members.

## Delegation and Scheduling (Examples 43-48)

### Example 43: Subagent Delegation

The `delegate_task` tool spawns isolated subagents to handle focused subtasks. The parent agent defines a goal, provides context, and specifies which toolsets the child can use. Up to 3 subagents run concurrently with a depth limit of 2 (no sub-sub-subagents). Children have restricted tool access.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    subgraph Parent["Parent Agent (full tools)"]
        style Parent fill:#0173B2,color:#fff
        PA["Orchestrates tasks"]
    end

    subgraph Children["Child Agents (restricted)"]
        style Children fill:#DE8F05,color:#fff
        C1["Child 1:\nResearch task"]
        C2["Child 2:\nCode review"]
        C3["Child 3:\nTest execution"]
    end

    subgraph Restricted["Restricted Tools"]
        style Restricted fill:#CC78BC,color:#fff
        NO["Cannot use:\n- delegate_task\n- clarify\n- memory tools\n- send_message\n- execute_code"]
    end

    PA -->|"delegate_task()"| C1
    PA -->|"delegate_task()"| C2
    PA -->|"delegate_task()"| C3
    C1 -->|"Result JSON"| PA
    C2 -->|"Result JSON"| PA
    C3 -->|"Result JSON"| PA
    Children --- Restricted
```

```bash
# Parent agent delegates a task:
# delegate_task(
#   goal="Review the Python files in src/ for security vulnerabilities",
#   context="Focus on SQL injection, XSS, and path traversal. Check all .py files.",
#   toolsets=["file", "terminal"]
# )
#                                       # => Spawns isolated child agent
#                                       # => Child has its own context window
#                                       # => Child can use file + terminal tools only
#                                       # => Child CANNOT delegate further (depth limit)
#                                       # => Child CANNOT ask user questions (no clarify)
#                                       # => Child CANNOT access parent's memory
#                                       # => Child CANNOT send messages to platforms

# Child agent executes autonomously:
# => Reads Python files using file tools
# => Searches for vulnerability patterns
# => Runs static analysis via terminal
# => Returns structured result to parent

# Parent receives JSON result:
# {
#   "status": "completed",              # => "completed", "failed", or "timeout"
#   "summary": "Found 3 potential issues...",
#   "token_usage": { "input": 15000, "output": 3000 },
#   "tool_trace": ["read_file x5", "terminal x2"]
# }
#                                       # => Parent integrates result into its response
#                                       # => Zero context pollution — child's full
#                                       # =>   conversation stays in child

# Concurrency: up to 3 simultaneous children
# Depth: parent → child → (no further delegation)
# Depth limit of 2 prevents infinite delegation chains
```

**Key Takeaway**: `delegate_task` spawns isolated child agents with restricted tools (no delegation, clarify, memory, send_message, or execute_code). Up to 3 concurrent children with depth limit 2 prevent runaway delegation.

**Why It Matters**: Delegation is the agent's parallel processing — instead of sequentially reviewing 10 files, the parent can delegate 3 review tasks that run simultaneously, cutting wall-clock time by 3x. The isolation is intentional: children cannot ask the user questions (which would block parallel execution), cannot delegate further (preventing exponential spawning), and cannot access memory (preventing cross-contamination). The structured JSON result gives the parent actionable data without inheriting the child's full conversation context — keeping the parent's context window clean for orchestration.

### Example 44: Batch Delegation

Batch mode sends multiple delegation tasks simultaneously, running up to 3 in parallel. Each task returns a structured JSON result with status, summary, token usage, and tool trace. Use batch delegation for parallel workstreams that are independent of each other.

```bash
# Parent delegates a batch of tasks:
# The agent internally manages parallel execution:

# Task 1: Analyze frontend code
# delegate_task(
#   goal="Analyze React components in src/components/ for accessibility issues",
#   context="Check ARIA attributes, alt text, keyboard navigation, color contrast",
#   toolsets=["file", "terminal"]
# )

# Task 2: Analyze backend code (runs in parallel with Task 1)
# delegate_task(
#   goal="Review API routes in src/api/ for input validation",
#   context="Check request body parsing, query param validation, header checks",
#   toolsets=["file", "terminal"]
# )

# Task 3: Check dependencies (runs in parallel with Tasks 1 and 2)
# delegate_task(
#   goal="Audit package.json dependencies for known vulnerabilities",
#   context="Run npm audit, check for outdated packages, review lock file",
#   toolsets=["terminal"]
# )

# All 3 tasks execute concurrently:
# => Child 1: reading React files, checking ARIA attrs
# => Child 2: reading API routes, checking validation
# => Child 3: running npm audit, checking versions

# Results returned as structured JSON:
# [
#   {
#     "task": "frontend accessibility",
#     "status": "completed",            # => Task finished successfully
#     "summary": "Found 5 missing ARIA labels, 2 low-contrast issues",
#     "token_usage": {
#       "input": 12000,                 # => Tokens consumed by this child
#       "output": 2500
#     },
#     "tool_trace": [
#       "read_file x8",                 # => Tools the child used
#       "search_files x3"
#     ]
#   },
#   {
#     "task": "API validation",
#     "status": "completed",
#     "summary": "3 routes missing input validation, 1 SQL injection risk",
#     "token_usage": { "input": 8000, "output": 1800 },
#     "tool_trace": ["read_file x6", "terminal x1"]
#   },
#   {
#     "task": "dependency audit",
#     "status": "completed",
#     "summary": "2 high-severity vulnerabilities, 8 outdated packages",
#     "token_usage": { "input": 5000, "output": 1200 },
#     "tool_trace": ["terminal x3"]
#   }
# ]
#                                       # => Parent synthesizes all results
#                                       # => Presents unified report to user
```

**Key Takeaway**: Batch delegation runs up to 3 independent tasks in parallel, each returning structured JSON with status, summary, token usage, and tool trace. The parent synthesizes results into a unified response.

**Why It Matters**: Sequential execution of independent tasks wastes wall-clock time. If reviewing frontend takes 30 seconds, backend takes 25 seconds, and dependency audit takes 15 seconds, sequential execution takes 70 seconds. Batch delegation completes all three in ~30 seconds (limited by the slowest task). The structured result format enables the parent to present a coherent summary without reading each child's full conversation. Token usage tracking per child helps you understand cost distribution across workstreams.

### Example 45: Delegation Model Override

The `delegation` section in `config.yaml` lets you override the model and provider used for child agents. This enables cost optimization: use an expensive model (Claude Opus) for the parent's orchestration and a cheaper model (Claude Haiku) for delegated subtasks.

```yaml
# ~/.hermes/config.yaml — delegation model override
model:
  provider: "anthropic" # => Parent agent uses Anthropic
  model:
    "claude-sonnet-4-6" # => Parent uses Sonnet for orchestration
    # => Good balance of quality and cost

delegation:
  provider:
    "anthropic" # => Override provider for child agents
    # => Can differ from parent's provider
  model:
    "claude-haiku-4" # => Children use Haiku (cheaper)
    # => ~10x cheaper than Sonnet
    # => Suitable for focused, narrow tasks

  max_concurrent:
    3 # => Maximum simultaneous child agents
    # => Default: 3
  max_depth:
    2 # => Maximum delegation depth
    # => Default: 2 (parent → child, no deeper)

  timeout:
    120 # => Seconds before child times out
    # => Default: 120 seconds
    # => Prevents runaway children

  max_tool_calls:
    50 # => Maximum tool calls per child
    # => Default: 50
    # => Safety limit on child activity
```

```bash
# Cost comparison example:
# Task: Review 10 Python files for code quality

# Without delegation (single Sonnet session):
# => Sonnet reads all 10 files sequentially
# => ~50k input tokens, ~10k output tokens
# => Cost: ~$0.30 (Sonnet pricing)

# With delegation (Sonnet parent + 3 Haiku children):
# => Sonnet orchestrates: ~5k tokens, cost ~$0.02
# => 3 Haiku children, ~15k tokens each, cost ~$0.01 each
# => Total: ~$0.05 (6x cheaper)
# => Wall-clock time: ~3x faster (parallel execution)

# Even cheaper: use OpenRouter for delegation
# delegation:
#   provider: "openrouter"
#   model: "meta-llama/llama-3.1-8b-instruct"
#                                       # => Open-source model via OpenRouter
#                                       # => ~100x cheaper than Sonnet
#                                       # => Quality sufficient for narrow tasks
```

**Key Takeaway**: Override the delegation model to use cheaper/smaller models for child agents while keeping a high-quality model for the parent orchestrator. This provides significant cost savings without sacrificing orchestration quality.

**Why It Matters**: Delegation tasks are typically narrow and well-defined (review one file, run one command, check one thing), which means they don't need the reasoning power of a frontier model. A parent using Claude Sonnet for orchestration can delegate to Claude Haiku at 10x lower cost, or to an open-source model via OpenRouter at 100x lower cost. This cost structure makes it economically viable to use delegation liberally — instead of reserving it for large tasks, you can delegate routine checks on every commit, every PR, every deployment.

### Example 46: Cron Job Creation

The `cronjob` tool lets the agent schedule tasks for future execution. Scheduling supports duration shortcuts (`30m`, `1h`, `2d`), standard cron syntax (`0 9 * * *`), and ISO timestamps. Cron jobs run persistently even after the session ends.

```bash
# Agent creates cron jobs via the cronjob tool:

# Duration shortcuts — relative to now
# cronjob(schedule="30m", task="Check if the build finished")
#                                       # => Runs once, 30 minutes from now
#                                       # => Shorthand: m=minutes, h=hours, d=days

# cronjob(schedule="1h", task="Send me a reminder to review PRs")
#                                       # => Runs once, 1 hour from now

# cronjob(schedule="2d", task="Follow up on the deployment")
#                                       # => Runs once, 2 days from now

# Cron syntax — recurring schedules
# cronjob(schedule="0 9 * * *", task="Send daily server health report")
#                                       # => Standard cron: minute hour day month weekday
#                                       # => This runs at 9:00 AM every day
#                                       # => "0 9 * * 1-5" for weekdays only

# cronjob(schedule="*/30 * * * *", task="Check disk space")
#                                       # => Every 30 minutes
#                                       # => Monitors resource usage continuously

# ISO timestamps — exact time
# cronjob(schedule="2026-04-15T14:00:00+07:00", task="Deploy release v2.1")
#                                       # => Runs at exact date/time
#                                       # => Timezone-aware (UTC+7 in this example)

# Managing cron jobs:
hermes cron list                        # => Lists all scheduled jobs
                                        # => Shows: ID, schedule, task, next run
                                        # => Output:
                                        # => ID   | Schedule      | Task
                                        # => c01  | 0 9 * * *     | Daily health report
                                        # => c02  | */30 * * * *  | Check disk space

hermes cron delete c01                  # => Removes job by ID
                                        # => Output: "Deleted cron job c01"

hermes cron logs c02                    # => Shows execution history for a job
                                        # => Output: last run, status, output summary
```

**Key Takeaway**: Schedule tasks with duration shortcuts (`30m`), cron syntax (`0 9 * * *`), or ISO timestamps. Jobs persist across sessions and can be listed, inspected, and deleted via `hermes cron`.

**Why It Matters**: Cron jobs transform the agent from a reactive tool (responds when you ask) into a proactive assistant (acts on a schedule without being prompted). Daily health reports, hourly monitoring, deployment reminders — these are workflows that would otherwise require separate scripts, separate cron configurations, and separate notification pipelines. With Hermes cron, you describe the task in natural language, and the agent handles scheduling, execution, and delivery. The persistent nature (jobs survive session end) means you set it once and it runs until deleted.

### Example 47: Cron with Multi-Platform Delivery

Cron jobs can deliver results to any configured messaging platform. Combine scheduling with `send_message` and skill attachment to create automated workflows that generate reports and distribute them across platforms.

```bash
# Natural language scheduling with platform delivery:
# User: "Every weekday at 9am, check our server status and send
#        the report to Telegram and the #ops channel on Slack"

# Agent creates:
# cronjob(
#   schedule="0 9 * * 1-5",
#   task="Check server status (CPU, memory, disk, uptime).
#         Send report to Telegram user 123456789
#         and Slack channel #ops-alerts."
# )
#                                       # => Runs Monday through Friday at 9:00 AM
#                                       # => Agent executes: checks system resources
#                                       # => Calls send_message to Telegram
#                                       # => Calls send_message to Slack
#                                       # => Each platform gets formatted report

# Skill attachment to cron jobs:
# cronjob(
#   schedule="0 8 * * *",
#   task="Run the deploy-status skill and send results to Discord",
#   skills=["deploy-status"]
# )
#                                       # => Cron job loads specified skill
#                                       # => Skill provides procedure for checking deployments
#                                       # => Agent follows skill procedure
#                                       # => Results delivered to Discord

# Example cron job output delivered to Telegram:
# => "Daily Server Report - 2026-04-14"
# => "CPU: 23% | Memory: 4.2/8 GB (52%) | Disk: 120/500 GB (24%)"
# => "Uptime: 47 days | Load: 0.82, 0.65, 0.71"
# => "Status: All systems healthy"

# Example delivered to Slack (mrkdwn format):
# => *Daily Server Report - 2026-04-14*
# => `CPU: 23%` | `Memory: 52%` | `Disk: 24%`
# => Uptime: 47 days | Status: :white_check_mark: Healthy
```

**Key Takeaway**: Attach skills and delivery targets to cron jobs for automated workflows. The agent generates content once and distributes to multiple platforms with platform-specific formatting.

**Why It Matters**: Combining cron scheduling with multi-platform delivery creates a personal automation platform. Instead of writing separate monitoring scripts with separate Slack webhooks and Telegram bot calls, you describe the workflow once in natural language. The agent composes the pipeline: data collection (via tools and skills), analysis (via LLM reasoning), and distribution (via send_message). Skill attachment ensures the cron job uses your refined procedures, not ad-hoc approaches. This scales from simple status checks to complex workflows like daily dependency audits, weekly security scans, or monthly performance reports.

### Example 48: Session Search

The `session_search` tool performs full-text search (FTS5) across all past conversations stored in Hermes Agent's SQLite database. Results are deduplicated, summarized by the LLM, and exclude the current session to avoid circular references.

```bash
# Agent uses session_search internally:
# session_search(query="kubernetes deployment error")
#                                       # => Searches all past sessions
#                                       # => Uses SQLite FTS5 (fast full-text search)
#                                       # => Returns matching conversation fragments
#                                       # => LLM summarizes relevant findings
#                                       # => Current session excluded from results

# session_search(query="how did I fix the SSL certificate issue")
#                                       # => Finds past sessions where SSL was discussed
#                                       # => Extracts the resolution steps
#                                       # => Presents summarized answer

# How FTS5 search works:
# 1. Query tokenized into search terms
#    "kubernetes deployment error"
#    => tokens: "kubernetes", "deployment", "error"
#                                       # => FTS5 matches any session containing
#                                       # =>   all three terms (AND logic)

# 2. Results ranked by relevance
#    => BM25 ranking algorithm
#    => More specific matches rank higher
#    => Recent sessions weighted slightly more

# 3. Lineage deduplication
#    => If Session A spawned Session B (via delegation),
#    =>   overlapping content deduplicated
#    => Prevents seeing same content twice

# 4. LLM summarization
#    => Raw matches passed to LLM
#    => LLM extracts relevant portions
#    => Returns concise summary, not raw fragments

# Example: searching for past deployment procedure
# User: "How did we deploy the auth service last time?"
# Agent: session_search(query="auth service deployment")
# => Finds session from 3 days ago where deployment was discussed
# => Extracts: "Used docker-compose with health checks,
# =>   env vars from vault, and blue-green swap via nginx"
# => Presents summarized procedure to user
```

**Key Takeaway**: `session_search` provides FTS5 full-text search across all past sessions with BM25 ranking, lineage deduplication, and LLM summarization. The current session is excluded to prevent circular references.

**Why It Matters**: Memory (MEMORY.md/USER.md) stores curated facts; session search gives access to the full history of conversations and problem-solving. When you encounter an error you solved three weeks ago, session search finds the exact resolution without you remembering which session it was in. The LLM summarization step is critical — raw FTS5 results would dump pages of conversation transcript; the LLM extracts just the relevant portions and presents them concisely. Lineage deduplication prevents noise when parent-child delegation sessions contain overlapping content.

## Browser Automation and Code Execution (Examples 49-54)

### Example 49: Browser Navigation

Hermes Agent's browser toolset provides programmatic control of a headless browser. `browser_navigate` opens URLs, and `browser_snapshot` captures the current DOM state as an accessibility tree. The browser persists across tool calls within a session.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    subgraph Agent["Hermes Agent"]
        style Agent fill:#0173B2,color:#fff
        NAV["browser_navigate"]
        SNAP["browser_snapshot"]
    end

    subgraph Browser["Headless Browser"]
        style Browser fill:#DE8F05,color:#fff
        PAGE["Web Page"]
        DOM["DOM / A11y Tree"]
    end

    subgraph Output["Agent Receives"]
        style Output fill:#029E73,color:#fff
        TREE["Accessibility Tree\n(structured text)"]
    end

    NAV -->|"URL"| PAGE
    SNAP -->|"Capture"| DOM
    DOM --> TREE
    TREE --> Agent
```

```bash
# Agent navigates to a URL:
# browser_navigate(url="https://example.com")
#                                       # => Opens URL in headless browser
#                                       # => Page fully loads (waits for network idle)
#                                       # => Returns page title and URL

# Agent captures DOM state:
# browser_snapshot()
#                                       # => Returns accessibility tree (not raw HTML)
#                                       # => Structured representation of page elements
#                                       # => Includes: buttons, links, inputs, text
#                                       # => Each element has a ref number for interaction

# Example snapshot output:
# [1] heading "Welcome to Example.com"
# [2] paragraph "This domain is for use in examples..."
# [3] link "More information..." href="https://iana.org/..."
# [4] button "Accept Cookies"
#                                       # => Ref numbers [1]-[4] used in click/type tools
#                                       # => Agent reads this to understand page structure
```

```yaml
# ~/.hermes/config.yaml — browser configuration
tools:
  browser:
    enabled: true # => Activates browser toolset
    headless:
      true # => Run without visible window
      # => false: shows browser window (debugging)

    inactivity_timeout:
      300 # => Seconds of no browser activity before
      # =>   browser is closed (default: 300)
      # => Saves resources on long sessions

    command_timeout:
      30 # => Seconds before a single browser command
      # =>   times out (default: 30)
      # => Prevents hanging on unresponsive pages

    record:
      false # => true: records browser session as video
      # => Useful for debugging automation
      # => Saved to ~/.hermes/recordings/
```

**Key Takeaway**: `browser_navigate` opens URLs and `browser_snapshot` returns an accessibility tree with numbered references for each element. The browser persists within a session and is configured via `config.yaml`.

**Why It Matters**: The accessibility tree representation is the key design choice — instead of dumping thousands of lines of raw HTML into the context window, the snapshot provides a compact, semantic view of the page. The agent sees "button 'Submit'" rather than `<button class="btn btn-primary mt-4 px-6" data-testid="submit-form" onclick="handleSubmit()">Submit</button>`. This compression makes browser automation token-efficient and allows the agent to reason about page structure at the semantic level. The ref numbering system enables precise interaction without CSS selectors.

### Example 50: Browser Interaction

Once a page is loaded, the agent interacts with elements using their ref numbers from `browser_snapshot`. Tools include `browser_click`, `browser_type`, `browser_scroll`, `browser_press` (keyboard keys), and `browser_back` (navigation history).

```bash
# Step 1: Navigate and snapshot
# browser_navigate(url="https://github.com/login")
# browser_snapshot()
# => [1] heading "Sign in to GitHub"
# => [2] label "Username or email address"
# => [3] textbox ref=3
# => [4] label "Password"
# => [5] textbox ref=5 type="password"
# => [6] button "Sign in"
# => [7] link "Forgot password?"

# Step 2: Type into username field
# browser_type(ref=3, text="user@example.com")
#                                       # => Types text into element with ref 3
#                                       # => Simulates real keyboard input
#                                       # => Triggers input events (onChange, etc.)

# Step 3: Type into password field
# browser_type(ref=5, text="secret-password")
#                                       # => Types into password field
#                                       # => Characters masked in the field

# Step 4: Click sign in button
# browser_click(ref=6)
#                                       # => Clicks element with ref 6
#                                       # => Waits for navigation/response
#                                       # => Page updates after click

# Step 5: Scroll down on a long page
# browser_scroll(direction="down", amount=3)
#                                       # => Scrolls down 3 "pages"
#                                       # => "up" scrolls toward top
#                                       # => amount: number of viewport heights

# Step 6: Press keyboard key
# browser_press(key="Enter")
#                                       # => Simulates keyboard press
#                                       # => Common keys: Enter, Tab, Escape, ArrowDown
#                                       # => Modifiers: Control+A, Shift+Tab

# Step 7: Navigate back
# browser_back()
#                                       # => Browser back button equivalent
#                                       # => Returns to previous page
#                                       # => Useful for multi-page workflows
```

**Key Takeaway**: Browser interaction uses ref numbers from `browser_snapshot` for precise element targeting. The five interaction tools (click, type, scroll, press, back) cover all common web automation patterns.

**Why It Matters**: Ref-based interaction eliminates the fragility of CSS selectors and XPath expressions — you don't need to know the page's implementation details to interact with it. The agent snapshots the page, identifies elements by their semantic roles (button, textbox, link), and interacts using stable ref numbers. This means the same automation works even if the site redesigns its CSS or restructures its DOM, as long as the semantic structure remains. Combined with the agent's reasoning, it can handle dynamic pages (SPAs, infinite scroll) by repeatedly snapshotting and adapting.

### Example 51: Browser Vision and Screenshots

The browser vision tools enable visual analysis of web pages. `browser_vision` sends a screenshot to the LLM for visual reasoning, `browser_get_images` extracts image URLs, and `browser_console` captures JavaScript console output. Session recording saves browsing as video.

```bash
# Visual page analysis:
# browser_vision(prompt="Describe the layout and identify any broken elements")
#                                       # => Captures screenshot of current page
#                                       # => Sends to LLM with vision capability
#                                       # => LLM analyzes visual layout, colors, spacing
#                                       # => Returns description + identified issues
#                                       # => Useful for: UI testing, design review,
#                                       # =>   accessibility audit, visual regression

# browser_vision(prompt="Is the login form properly aligned?")
#                                       # => Targeted visual question
#                                       # => Agent sees the page as a user would
#                                       # => Can identify visual bugs invisible to DOM

# Extract images from page:
# browser_get_images()
#                                       # => Returns list of image URLs on current page
#                                       # => Includes: <img> src, CSS background images
#                                       # => Useful for: content auditing, asset extraction
#                                       # => Output:
#                                       # => [
#                                       # =>   "https://example.com/logo.png",
#                                       # =>   "https://example.com/hero.jpg",
#                                       # =>   "https://cdn.example.com/banner.webp"
#                                       # => ]

# Read browser console output:
# browser_console()
#                                       # => Returns JavaScript console messages
#                                       # => Includes: log, warn, error, info
#                                       # => Captures: runtime errors, failed fetches,
#                                       # =>   deprecation warnings, custom logs
#                                       # => Useful for debugging JS-heavy applications
#                                       # => Output:
#                                       # => [ERROR] Uncaught TypeError: Cannot read
#                                       # =>   property 'map' of undefined (app.js:42)
#                                       # => [WARN] Deprecated API: use fetch() instead
```

```yaml
# ~/.hermes/config.yaml — recording configuration
tools:
  browser:
    record:
      true # => Records browser sessions as video
      # => Saved to ~/.hermes/recordings/
      # => Format: WebM video
      # => File: session-{id}-{timestamp}.webm
      # => Useful for: debugging automation failures,
      # =>   audit trails, demo generation
      # => Set to false in production (disk usage)
```

**Key Takeaway**: `browser_vision` sends screenshots to the LLM for visual analysis, `browser_get_images` extracts image URLs, and `browser_console` captures JavaScript logs. Session recording saves automation as video for debugging.

**Why It Matters**: DOM-based tools (snapshot, click, type) understand page structure but miss visual issues — a button might be in the DOM but hidden behind an overlay, or text might be rendered in unreadable colors. Vision tools bridge this gap by showing the agent what the user actually sees. Console capture is equally critical: JavaScript errors, failed API calls, and deprecation warnings often explain why a page behaves unexpectedly. Together, these tools give the agent the same debugging toolkit a human developer uses in browser DevTools, but automated and integrated into the agent's reasoning loop.

### Example 52: Code Execution Tool

The `execute_code` tool runs Python scripts in an isolated environment with access to 7 RPC tools (web_search, web_extract, read_file, write_file, search_files, patch, terminal). Code execution has zero context cost — the script runs outside the LLM context window.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    subgraph Agent["Agent Context Window"]
        style Agent fill:#0173B2,color:#fff
        PROMPT["execute_code(script)"]
    end

    subgraph Sandbox["Python Sandbox (zero context cost)"]
        style Sandbox fill:#DE8F05,color:#fff
        SCRIPT["Python Script"]
        RPC["RPC Tools:\n- web_search\n- web_extract\n- read_file\n- write_file\n- search_files\n- patch\n- terminal"]
    end

    subgraph Result["Returns to Agent"]
        style Result fill:#029E73,color:#fff
        OUT["stdout + stderr\n(compact result)"]
    end

    PROMPT -->|"Script"| SCRIPT
    SCRIPT -->|"Tool calls"| RPC
    RPC -->|"Results"| SCRIPT
    SCRIPT -->|"Output"| OUT
    OUT --> Agent
```

```bash
# Agent calls execute_code with a Python script:
# execute_code(script="""
# import json
#
# # RPC tools are available as functions
# # Read all Python files in src/
# files = search_files(pattern="*.py", path="src/")
#
# results = []
# for f in files:
#     content = read_file(f)              # RPC call: reads file
#     line_count = len(content.split('\n'))
#     if line_count > 200:
#         results.append({
#             'file': f,
#             'lines': line_count
#         })
#
# # Only stdout goes back to agent context
# print(json.dumps(results, indent=2))
# """)
#                                       # => Script runs in isolated Python process
#                                       # => RPC tools called via function syntax
#                                       # => read_file, search_files work like agent tools
#                                       # => Only print() output returns to agent
#                                       # => Intermediate tool results stay in sandbox
#                                       # => Zero context cost for processing logic

# Why zero context cost:
# => Without execute_code: agent reads 50 files,
# =>   all 50 file contents enter context window (~100k tokens)
# => With execute_code: Python script reads 50 files,
# =>   only the summary (200 tokens) enters context
# => Savings: 99.8% fewer tokens consumed
```

```yaml
# ~/.hermes/config.yaml — code execution configuration
tools:
  execute_code:
    enabled: true # => Activates code execution tool
    timeout:
      300 # => Max execution time in seconds
      # => Default: 300 (5 minutes)
      # => Prevents infinite loops
    max_tool_calls:
      100 # => Max RPC tool calls per script
      # => Default: 100
      # => Prevents runaway tool usage
```

**Key Takeaway**: `execute_code` runs Python scripts with RPC access to 7 tools at zero context cost — only stdout returns to the agent. Use it for data processing, batch operations, and any task where intermediate results don't need LLM reasoning.

**Why It Matters**: Context windows are the scarcest resource in LLM-based agents. Reading 50 files to count lines consumes 100k+ tokens; a Python script doing the same work consumes ~200 tokens (just the summary output). The RPC bridge means the script has the same capabilities as the agent (file I/O, web access, terminal commands) without polluting the context. This unlocks batch operations that would otherwise be impractical: scanning every file in a codebase, processing large datasets, aggregating API responses. The agent decides when to use execute_code (batch/filter tasks) vs direct tools (tasks requiring LLM reasoning at each step).

### Example 53: Clarify Tool

The `clarify` tool lets the agent ask the user for information when it cannot proceed without additional input. The tool has a configurable timeout (default 120 seconds) after which the agent proceeds with its best guess or reports that it cannot continue.

```bash
# Agent encounters ambiguity and asks for clarification:
# clarify(question="You asked to deploy the app. Which environment?
#                   Options: staging, production, or both?")
#                                       # => Pauses agent execution
#                                       # => Sends question to user
#                                       # => Waits for user response
#                                       # => Timeout: 120 seconds (configurable)
#                                       # => User responds: "staging"
#                                       # => Agent continues with answer

# Common clarify scenarios:
# clarify(question="I found 3 config files. Which one should I edit?
#                   1. config/dev.yaml
#                   2. config/staging.yaml
#                   3. config/prod.yaml")
#                                       # => Agent presents options
#                                       # => User selects by number or name

# clarify(question="The test is failing with a permission error.
#                   Should I: (a) fix the permissions, or
#                   (b) skip the test and continue?")
#                                       # => Agent requests decision
#                                       # => Avoids making risky choices autonomously

# Timeout behavior:
# If user doesn't respond within timeout:
# => Agent logs: "Clarification timed out after 120s"
# => Agent either:
#    - Proceeds with safest default option
#    - Reports: "I need your input to continue. Please re-ask."
#    - Depends on task criticality
```

```yaml
# ~/.hermes/config.yaml — clarify configuration
tools:
  clarify:
    timeout:
      120 # => Seconds to wait for user response
      # => Default: 120 (2 minutes)
      # => 0: wait indefinitely (not recommended)
      # => Short timeout for automated workflows
      # => Long timeout for interactive sessions
```

```bash
# Important restriction:
# clarify is NOT available to child agents (via delegation)
# => Children cannot ask the user questions
# => This is intentional — clarify would block parallel execution
# => Parent must provide complete context in delegate_task()
# => If child needs clarification, it fails and returns to parent
# => Parent can then clarify with user and re-delegate
```

**Key Takeaway**: The `clarify` tool pauses execution to ask the user a question, with a configurable timeout. It is restricted from child agents to prevent blocking parallel delegation.

**Why It Matters**: Autonomous agents face a tension between taking action and asking permission. Too autonomous and the agent makes risky decisions without consent; too cautious and it asks trivial questions that waste time. The clarify tool gives the agent a structured way to ask when it genuinely needs human judgment — which environment to deploy to, which of several valid approaches to take, whether to proceed with a potentially destructive operation. The delegation restriction is a critical design choice: if three child agents could all pause to ask questions, parallel execution would deadlock.

### Example 54: Mixture of Agents

The Mixture of Agents (MoA) toolset generates diverse responses from 4 reference models in parallel, then synthesizes them through a single aggregator into one high-quality answer. This improves response quality for complex, nuanced questions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    Q["User Question"] --> R1["Reference Model 1\n(e.g., Claude)"]
    Q --> R2["Reference Model 2\n(e.g., GPT-4)"]
    Q --> R3["Reference Model 3\n(e.g., Gemini)"]
    Q --> R4["Reference Model 4\n(e.g., Llama)"]
    style Q fill:#0173B2,color:#fff
    style R1 fill:#DE8F05,color:#fff
    style R2 fill:#DE8F05,color:#fff
    style R3 fill:#DE8F05,color:#fff
    style R4 fill:#DE8F05,color:#fff

    R1 --> AGG["Aggregator Model\n(synthesizes best\nfrom all 4)"]
    R2 --> AGG
    R3 --> AGG
    R4 --> AGG
    style AGG fill:#029E73,color:#fff

    AGG --> FINAL["Final Answer\n(higher quality than\nany single model)"]
    style FINAL fill:#CC78BC,color:#fff
```

```yaml
# ~/.hermes/config.yaml — Mixture of Agents configuration
tools:
  moa:
    enabled:
      true # => Activates MoA toolset
      # => Agent can invoke moa() tool

    reference_models: # => 4 models generate diverse responses
      - provider: "anthropic"
        model: "claude-sonnet-4-6" # => Reference model 1
      - provider: "openrouter"
        model: "openai/gpt-4o" # => Reference model 2
      - provider: "openrouter"
        model: "google/gemini-2.0-flash" # => Reference model 3
      - provider: "openrouter"
        model:
          "meta-llama/llama-3.1-70b" # => Reference model 4
          # => 4 models run in parallel
          # => Each generates independent response

    aggregator:
      provider: "anthropic"
      model:
        "claude-sonnet-4-6" # => Aggregator synthesizes final answer
        # => Sees all 4 reference responses
        # => Extracts best reasoning from each
        # => Produces single coherent answer
```

```bash
# How MoA works at runtime:

# User asks: "What's the best architecture for a real-time
#             collaborative document editor?"

# Step 1: Question sent to all 4 reference models in parallel
# => Claude: focuses on CRDT-based architecture
# => GPT-4o: emphasizes operational transformation (OT)
# => Gemini: suggests hybrid CRDT+OT with WebSocket
# => Llama: proposes event sourcing with conflict resolution

# Step 2: All 4 responses passed to aggregator
# => Aggregator sees: 4 diverse perspectives
# => Synthesizes: combines CRDT strengths from Claude,
#    practical OT considerations from GPT-4o,
#    WebSocket transport from Gemini,
#    event sourcing persistence from Llama

# Step 3: Final answer returned to user
# => Higher quality than any single model
# => Covers more perspectives and edge cases
# => Reduces individual model blind spots

# When to use MoA:
# => Complex architectural decisions
# => Code review requiring multiple perspectives
# => Research questions with nuanced answers
# => NOT for simple factual lookups (overkill + slow + expensive)

# Cost consideration:
# => 4 reference calls + 1 aggregator = 5x the token cost
# => Latency: limited by slowest reference model
# => Use selectively for high-value questions
```

**Key Takeaway**: MoA runs 4 reference models in parallel and synthesizes their responses through an aggregator. This produces higher-quality answers for complex questions at the cost of 5x token usage and higher latency.

**Why It Matters**: Individual LLMs have blind spots — each model was trained on different data and exhibits different reasoning biases. MoA exploits this diversity: Claude might excel at systems architecture, GPT-4 at practical implementation details, Gemini at recent technology trends, and Llama at academic research context. The aggregator's job is editorial, not creative — it selects the strongest reasoning from each model and weaves them into a coherent answer. This is most valuable for high-stakes decisions (architecture choices, security reviews, production incident analysis) where the cost of a wrong answer far exceeds the 5x token premium.
