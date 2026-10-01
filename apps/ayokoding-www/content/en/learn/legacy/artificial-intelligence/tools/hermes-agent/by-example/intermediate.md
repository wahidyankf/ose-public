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
    accTitle: Example 28: Skills System Overview
    accDescr: Flowchart with 9 nodes and 5 connections. Nodes: skills_list(), name, description, version for ALL skills, skill_view(name), Complete SKILL.md + file listing, skill_view(name, path), Single reference file or template content, L0, L1, L2. Connections: skills_list() to name, description, version for ALL skills (Returns), skill_view(name) to Complete SKILL.md + file listing (Returns), skill_view(name, path) to Single reference file or template content (Returns), L0 to L1 (Agent needs details), L1 to L2 (Agent needs file).
    subgraph L0["Level 0: Skills List<br/>(~3k tokens)"]
        SL["skills_list()"]
        SL -->|"Returns"| META["name, description,<br/>version<br/>for ALL skills"]
    end

    subgraph L1["Level 1: Full Skill<br/>View"]
        SV1["skill_view(name)"]
        SV1 -->|"Returns"| FULL["Complete SKILL.md<br/>+ file listing"]
    end

    subgraph L2["Level 2: Specific<br/>File"]
        SV2["skill_view(name,<br/>path)"]
        SV2 -->|"Returns"| FILE["Single reference<br/>file<br/>or template content"]
    end

    L0 -->|"Agent needs<br/>details"| L1
    L1 -->|"Agent needs file"| L2
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class L0 pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class L1 pal-DE8F05
        classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
        class L2 pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```bash
# Level 0 — injected into every session automatically (~3k tokens)
hermes tools list skills                # => Lists all skills with name + description + version
                                        # => Agent uses this to find relevant skills by name
                                        # => Example output line: deploy-docker: "Deploy via Compose" (v1.2)

# Level 1 — agent loads full skill when needed
hermes chat -q "view skill deploy-docker"
                                        # => Agent calls: skill_view("deploy-docker")
                                        # => Returns: complete SKILL.md + file listing

# Level 2 — agent fetches specific reference file
hermes chat -q "show compose patterns from deploy-docker"
                                        # => Agent calls: skill_view("deploy-docker", "references/compose-patterns.md")
                                        # => Returns only that file — minimal token cost
                                        # => Avoids loading full skill when only one file needed
```

```yaml
# ~/.hermes/skills/ directory structure
# => Top-level categories organize skills by domain
# => Hermes scans this directory at session start
# => Add new skills by creating subdirectories here
skills/
  devops/                               # => Category directory
    deploy-docker/                      # => Individual skill directory
      SKILL.md                          # => Skill definition (required)
                                        # => skills_list() reads this for metadata
      references/                       # => Supporting reference docs
        compose-patterns.md             # => Loaded via skill_view(name, path)
                                        # => Level 2 fetch: minimal token cost
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
# Interactive skill browsing
hermes                                  # => Start a session
/skills                                 # => Lists all installed skills: name, description, version
                                        # => Output grouped by category (devops, coding, etc.)
hermes tools list skills                # => CLI equivalent of /skills (non-interactive)

# Programmatic: list all skills (agent calls at session start)
hermes chat -q "list available skills"
                                        # => Agent calls: skills_list()
                                        # => Returns JSON: [{name, description, version, platforms, category}, ...]
                                        # => Example entry: {name: "deploy-docker", version: "1.2", category: "devops"}

# Programmatic: view full skill content
hermes chat -q "show me the deploy-docker skill"
                                        # => Agent calls: skill_view("deploy-docker")
                                        # => Returns: complete SKILL.md + file listing

# Programmatic: fetch specific reference file
hermes chat -q "show compose patterns for docker deployments"
                                        # => Agent calls: skill_view("deploy-docker", "references/compose-patterns.md")
                                        # => Returns only that file — targeted, minimal token cost
```

**Key Takeaway**: Use `/skills` for interactive browsing and `skills_list()` / `skill_view()` for programmatic access. The agent automatically calls these tools when it needs skill knowledge.

**Why It Matters**: The read path is intentionally split into three granularity levels so the agent can make cost-effective decisions about what knowledge to load. In practice, the agent reads the skill list at session start, identifies relevant skills by name/description, and loads full content only for the 1-2 skills it actually needs. This self-regulating behavior means you can install dozens of skills without worrying about token bloat — the agent manages its own context window.

### Example 30: SKILL.md Format

Every skill is defined by a `SKILL.md` file containing YAML frontmatter (metadata, config, environment variables) and a markdown body (procedure, pitfalls, verification steps). This format is both human-readable and machine-parseable.

```yaml
# ~/.hermes/skills/devops/deploy-docker/SKILL.md
# => File path: category/skill-name/SKILL.md
---                                     # => YAML frontmatter delimiter
# YAML frontmatter — parsed by skills_list()
# => All fields below are machine-readable
name: deploy-docker                     # => Unique skill identifier
                                        # => Used in skill_view("deploy-docker")
description: >-                         # => Short description for Level 0 listing
  Deploy applications using Docker      # => Shown in skills_list() output
  Compose with health checks            # => Keep under 80 chars
version: "1.2"                          # => Semantic version for tracking changes
                                        # => Agent sees this in skill list
                                        # => Bump version when procedure changes

platforms:                              # => OS restrictions
  - linux                               # => Skill only loads on these platforms
  - macos                               # => Omit for cross-platform skills
                                        # => Empty list [] means all platforms

metadata:                               # => Hermes-specific extension block
  hermes:                               # => Namespace for activation rules
    fallback_for_toolsets: []           # => Conditional activation (see Example 33)
    requires_toolsets: []               # => Conditional activation (see Example 33)
                                        # => Both empty: always eligible

config:                                 # => Skill-specific key-value store
  compose_version: "3.8"               # => Accessible in skill body as variables
  default_timeout: 300                  # => Custom config for this skill
                                        # => Agent reads these at runtime

required_environment_variables:        # => Agent validates these before proceeding
  - DOCKER_HOST                         # => Agent warns if this is missing
  - REGISTRY_URL                        # => Skill cannot run without registry access
---                                     # => End of YAML frontmatter

## When to Use                          # => Agent reads this section to judge relevance

# => Section: conditions that trigger this skill
# => Agent reads this to decide relevance
Deploy this skill when the user asks to containerize an application,
# => Matches: "containerize", "docker compose", "container debug"
set up Docker Compose, or troubleshoot container deployments.
# => Not for: bare Docker commands, Kubernetes, or bare-metal deploys

## Procedure                            # => Ordered steps the agent executes in sequence

# => Section: step-by-step instructions
# => Agent follows these as a recipe
1. Check Docker daemon is running: `docker info`   # => Fails fast if daemon down
                                        # => Exit code 0 means daemon ready
2. Validate compose file: `docker compose config`  # => Catches YAML syntax errors
                                        # => Shows merged/resolved config on success
3. Build images: `docker compose build`            # => Builds all service images
                                        # => Uses layer cache; unchanged layers skip
4. Start services: `docker compose up -d`          # => Detached mode; returns prompt
                                        # => -d means background; logs stream separately
5. Verify health: `docker compose ps`              # => Shows status of each service
                                        # => All should show "running (healthy)" state

## Pitfalls                             # => Known failure modes; agent pre-checks these

# => Section: common failure modes
# => Agent checks these proactively
- Port conflicts: check `lsof -i :PORT` before starting  # => Prevents bind errors
                                        # => Common: port 80/443/5432 already in use
- Volume permissions: ensure host directories exist with correct ownership
                                        # => Run: ls -la /path before starting
- Network isolation: services in different compose files need explicit networks
                                        # => Fix: add named network in each compose file

## Verification                          # => Agent runs these checks after procedure completes

# => Section: how to confirm success
# => Agent runs these after completing procedure
- All containers show "healthy" in `docker compose ps`  # => State: healthy vs starting
                                        # => "starting" means health check not yet passed
- Application responds on expected port                  # => curl check confirms routing
- Logs show no error-level entries                       # => docker compose logs --tail=20
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
# => cat > file << 'HEREDOC' ... HEREDOC: writes multi-line content directly to file
# => Single-quoted 'SKILL' delimiter: prevents shell variable expansion inside body
# => Destination: ~/.hermes/skills/coding/format-code/SKILL.md (created or overwritten)
cat > ~/.hermes/skills/coding/format-code/SKILL.md << 'SKILL'
# => YAML frontmatter starts here (parsed by skills_list() for metadata)
# => Fields: name, description, version, platforms, required_environment_variables
---
# => name: unique identifier used in skill_view("format-code") and skills_list()
name: format-code
# => description: short text shown at Level 0; keep under 80 chars
description: "Format source code using project-specific formatters"
# => version: bump when procedure changes so agent knows skill was updated
version: "1.0"
platforms:
  - linux
  - macos
required_environment_variables: []
---
# => End of YAML frontmatter — markdown body begins below
# => "When to Use" section: agent reads this to decide skill relevance
## When to Use
# => Body text: free-form description of when this skill applies
Apply when the user asks to format code, fix style issues,
or prepare files for a commit with consistent formatting.

# => "Procedure" section: ordered steps the agent executes in sequence
## Procedure
# => Numbered list: agent follows these steps in order, one per tool call
1. Detect project type from config files (package.json, pyproject.toml, etc.)
2. Run the appropriate formatter (prettier, black, gofmt, rustfmt)
3. Report files changed

# => "Pitfalls" section: known failure modes; agent pre-checks these proactively
## Pitfalls

- Check for .editorconfig and respect its settings
- Some formatters modify files in-place — warn before bulk formatting

# => "Verification" section: how agent confirms the procedure succeeded
## Verification

- Run formatter in check mode to confirm no remaining changes
SKILL
                                        # => SKILL.md written to ~/.hermes/skills/coding/format-code/
                                        # => Skill is immediately available in the next session
                                        # => skills_list() returns it under category: coding

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
    accTitle: Example 32: Autonomous Skill Creation
    accDescr: Flowchart with 8 nodes and 6 connections. Nodes: 5+ tool calls, Error recovery, User correction, Agent detects reusable pattern, SKILL.md written to ~/.hermes/skills/, Skill refined in later sessions, Persist, Improve. Connections: 5+ tool calls to Agent detects reusable pattern, Error recovery to Agent detects reusable pattern, User correction to Agent detects reusable pattern, Agent detects reusable pattern to Persist, Persist to Improve, Improve to Persist (Next use).
    subgraph Session["Current Session"]
        T1["5+ tool calls"]
        T2["Error recovery"]
        T3["User correction"]
    end

    subgraph Trigger["Skill Creation<br/>Trigger"]
        D["Agent detects<br/>reusable pattern"]
    end

    subgraph Persist["Skill Persisted"]
        S["SKILL.md written<br/>to ~/.hermes/skills/"]
    end

    subgraph Improve["Self-Improvement"]
        I["Skill refined<br/>in later sessions"]
    end

    T1 --> D
    T2 --> D
    T3 --> D
    D --> Persist
    Persist --> Improve
    Improve -->|"Next use"| Persist
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class Session pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class Trigger pal-DE8F05
        classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
        class Persist pal-029E73
        classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
        class Improve pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Trigger autonomous skill creation** (runnable — first-time deployment generates 7+ tool calls):

```bash
# Step 1: Trigger autonomous skill creation with a complex task
hermes chat -q "Deploy this Next.js app to Vercel and verify it is live"
                                        # => Agent performs 7+ tool calls (> threshold of 5):
                                        # =>   checks vercel.json, validates build, deploys, verifies
                                        # => Threshold crossed: agent writes deploy-vercel SKILL.md

# Step 2: Verify the skill was created
ls ~/.hermes/skills/devops/deploy-vercel/
                                        # => Output: SKILL.md (agent-authored procedure)
cat ~/.hermes/skills/devops/deploy-vercel/SKILL.md
                                        # => Shows: procedure, pitfalls, verification steps
hermes tools list skills | grep deploy  # => deploy-vercel: "Deploy Next.js to Vercel" (v1.0)

# Step 3: Trigger self-improvement with a new edge case
hermes chat -q "Deploy the monorepo's frontend package to Vercel"
                                        # => Agent loads existing deploy-vercel skill
                                        # => Discovers: monorepo root detection needed
                                        # => Patches SKILL.md Pitfalls section automatically
cat ~/.hermes/skills/devops/deploy-vercel/SKILL.md | grep -A2 "Pitfalls"
                                        # => Updated pitfall: "Monorepo: set rootDirectory in vercel.json"
                                        # => Skill version bumped to v1.1 — each use improves it
```

**Key Takeaway**: The agent autonomously creates skills after complex tasks (5+ tool calls, error recovery, user corrections) and refines them during subsequent use, building an ever-improving procedural knowledge base.

**Why It Matters**: Autonomous skill creation is Hermes Agent's core differentiator — the agent learns from experience without explicit training. The first time you solve a complex problem, the agent watches and records. Every subsequent invocation benefits from that recorded knowledge. Over weeks of use, your agent accumulates operational expertise specific to your infrastructure, your codebase, and your preferences. This compounds: a skill created from deploying app A improves when deploying app B, which further refines for app C.

### Example 33: Skill Conditional Activation

Skills can be conditionally shown or hidden based on available toolsets and platform. `fallback_for_toolsets` hides a skill when the specified toolsets are present (the skill is a fallback). `requires_toolsets` hides a skill when the specified toolsets are absent (the skill needs them). Platform restrictions filter by OS.

```yaml
# ~/.hermes/skills/devops/manual-deploy/SKILL.md
--- # => YAML frontmatter start
name: manual-deploy # => Skill identifier
description: "Step-by-step manual deployment when CI/CD is unavailable"
# => Shown in skills_list() Level 0 output to help agent decide relevance
# => Keep description under 80 chars for readable list output
version: "1.0" # => Version tracked; bump when procedure changes

metadata: # => Hermes-specific activation config
  hermes: # => Namespace for conditional activation rules
    fallback_for_toolsets: # => List of toolsets that suppress this skill when present
      - terminal # => This skill is HIDDEN when terminal
        # =>   toolset is available
        # => Shown only when terminal is disabled
        # => Use case: fallback instructions when
        # =>   agent can't run commands directly

    requires_toolsets: [] # => List of toolsets this skill requires # => No toolset requirements
      # => (skill works without tools)
      # => Skill eligible regardless of toolsets
      # => Works in read-only and restricted modes

platforms: # => OS filter; empty = all platforms
  - linux # => Only shown on Linux
  - macos # => Only shown on macOS
    # => Hidden on Windows/other
--- # => YAML frontmatter end
```

```yaml
# ~/.hermes/skills/devops/docker-deploy/SKILL.md
--- # => YAML frontmatter start
name: docker-deploy # => Skill identifier
description: "Deploy via Docker Compose with health checks"
# => Shown in skills_list() output; keep under 80 chars for readability
# => Agent uses this description to decide skill relevance at Level 0
version: "1.0" # => Bump when procedure changes

metadata: # => Hermes-specific activation config
  hermes: # => Namespace for conditional activation rules
    fallback_for_toolsets: [] # => Empty: not a fallback skill # => Not a fallback — always eligible
      # => Shown whenever requires_toolsets satisfied

    requires_toolsets: # => All listed toolsets must be present
      - terminal # => HIDDEN when terminal toolset is absent
        # => Agent needs shell access for this skill
      - file # => Also requires file toolset
        # => Needs to read/write compose files
        # => Both toolsets required simultaneously

platforms: [] # => No platform restriction # => Empty = all platforms
  # => No OS restriction
  # => Available on Linux, macOS, Windows equally
--- # => YAML frontmatter end
```

```bash
# Scenario 1: Agent has terminal + file toolsets enabled (normal mode)
hermes chat -q "Deploy the app"         # => manual-deploy: HIDDEN (fallback_for_toolsets: terminal)
                                        # => docker-deploy: SHOWN (requires_toolsets satisfied)
                                        # => Agent uses docker-deploy skill for this request

# Scenario 2: Agent has no terminal toolset (read-only / restricted mode)
hermes chat --toolset file -q "Deploy the app"
                                        # => manual-deploy: SHOWN (fallback activated — terminal absent)
                                        # => docker-deploy: HIDDEN (requires terminal, which is absent)
                                        # => Agent uses manual-deploy for step-by-step instructions

# Scenario 3: Agent on Windows with terminal toolset
hermes chat -q "Deploy the app"         # => manual-deploy: HIDDEN (platform: linux/macos only)
                                        # => docker-deploy: SHOWN (platforms: [], no restriction)
                                        # => Platform check runs before toolset check

# Verify which skills are visible in current context
hermes tools list skills                # => Shows only skills eligible for current toolset + platform
                                        # => Hidden skills not shown (conditional filtering applied)
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
    accTitle: Example 35: Gateway Architecture
    accDescr: Flowchart with 12 nodes and 15 connections. Nodes: Telegram, Discord, Slack, WhatsApp, Signal, Email, Router, Auth / ACL, Session Manager, LLM Provider, Tool Execution, Memory. Connections: Telegram to Router, Discord to Router, Slack to Router, WhatsApp to Router, Signal to Router, Email to Router, Router to Auth / ACL, Auth / ACL to Session Manager, Session Manager to LLM Provider, LLM Provider to Tool Execution, Tool Execution to Memory, Session Manager to Router (Response), and 3 more.
    subgraph Platforms["Messaging Platforms"]
        TG["Telegram"]
        DC["Discord"]
        SL["Slack"]
        WA["WhatsApp"]
        SIG["Signal"]
        EM["Email"]
    end

    subgraph Gateway["hermes gateway"]
        RT["Router"]
        AUTH["Auth / ACL"]
        SM["Session Manager"]
    end

    subgraph Agent["Hermes Agent"]
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
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class Platforms pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class Gateway pal-DE8F05
        classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
        class Agent pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```bash
# Gateway lifecycle commands
hermes gateway start                    # => Starts gateway; connects all enabled channels
                                        # => Output: "Gateway started. Channels: telegram, slack"

hermes gateway start --daemon           # => Runs in background (detached)
                                        # => Logs to ~/.hermes/logs/gateway.log

hermes gateway stop                     # => Gracefully disconnects all channels

hermes gateway status                   # => Shows gateway health: PID, channels, uptime
                                        # => Shows message counts per channel

hermes gateway restart                  # => Stop + start (reloads config)
                                        # => Use after changing channel configuration
```

**Key Takeaway**: The gateway is a single process managing all platform connections. Use `start --daemon` for production, `status` to monitor health, and `restart` after configuration changes.

**Why It Matters**: The unified gateway architecture means you configure one process, not six separate bots. Adding a new platform is a config change and a restart — no new services to deploy or monitor. The gateway handles authentication, session routing, and platform-specific message formatting internally, so the agent sees a uniform interface regardless of whether the message came from Telegram or Slack. This dramatically simplifies operations: one log file, one PID, one health check.

### Example 36: Telegram Channel Setup

Telegram is the most popular channel for Hermes Agent. Setup requires a bot token from BotFather, user whitelisting via Telegram user IDs, and a DM pairing policy. The interactive `hermes gateway setup` wizard can guide you through configuration.

```yaml
# ~/.hermes/config.yaml — Telegram channel configuration
# Get bot token from @BotFather; get your user ID from @userinfobot
channels:
  telegram:
    enabled: true # => Activates Telegram channel; gateway connects on start


# .env — Telegram credentials (never commit this file)
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ

# TELEGRAM_ALLOWED_USERS=123456789,987654321
#                                       # => Comma-separated Telegram user IDs
#                                       # => Empty = no one can use the bot
```

```bash
hermes gateway setup                    # => Interactive wizard: prompts for token and user IDs
                                        # => Writes config and .env automatically

hermes gateway start                    # => Output: "Telegram channel connected"
                                        # => Unknown users: "pair" prompts admin, "ignore" drops silently
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
# Portal setup: discord.com/developers/applications
# New Application → Bot → Reset Token → enable MESSAGE_CONTENT intent
# OAuth2 URL Generator: scopes (bot, applications.commands) + Send/Read/Thread perms
# Invite bot to server via generated URL

hermes gateway start                    # => Output: "Discord channel connected"
                                        # => Bot appears online; responds to @mentions
                                        # =>   from users in DISCORD_ALLOWED_USERS
```

**Key Takeaway**: Discord requires a bot token with MESSAGE_CONTENT intent, user whitelist via `DISCORD_ALLOWED_USERS`, and supports `auto_thread` for organized conversations and `free_response_channels` for dedicated bot spaces.

**Why It Matters**: Discord is the default communication platform for many open-source communities and gaming-adjacent tech teams. Auto-threading prevents the bot from cluttering shared channels — each conversation gets its own thread, making it easy to follow and reference later. Free-response channels provide dedicated spaces where the bot is always listening, ideal for "ask the AI" channels that teams use for quick questions without the friction of typing @mentions.

### Example 38: Slack Channel Setup

Slack integration uses Socket Mode for secure, tunnel-free communication. Two tokens are required: a bot token (xoxb-) for sending messages and an app token (xapp-) for the WebSocket connection. Socket Mode eliminates the need for public URLs or ngrok.

```yaml
# ~/.hermes/config.yaml — Slack channel configuration
channels:
  slack:
    enabled: true # => Activates Slack channel
    socket_mode: true # => Uses Socket Mode (WebSocket; requires xapp- token)
    require_mention: true # => Bot only responds when @mentioned
    auto_thread: true # => Creates a thread for each conversation
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
# Portal setup: api.slack.com/apps → Create New App → From Scratch
hermes gateway setup                    # => Interactive wizard guides Slack configuration
                                        # => Prompts for bot token and app token

# Manually set credentials in .env
echo "SLACK_BOT_TOKEN=xoxb-..." >> ~/.hermes/.env
echo "SLACK_APP_TOKEN=xapp-..." >> ~/.hermes/.env
echo "SLACK_ALLOWED_USERS=U1234567890" >> ~/.hermes/.env
                                        # => Bot token: from OAuth & Permissions page
                                        # => App token: from Basic Information > App-Level Tokens
                                        # => Allowed users: Slack member IDs (format: UXXXXXXXXXX)

hermes gateway start                    # => "Slack channel connected (Socket Mode)"
                                        # => Outbound WebSocket: no public URL needed
hermes gateway status                   # => Shows: slack: connected, uptime, message count
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
# Prerequisites: ensure Node.js is installed (Baileys is a Node.js library)
node --version                          # => Output: v20.x.x (Node.js required for Baileys)
echo "WHATSAPP_ALLOWED_USERS=1234567890" >> ~/.hermes/.env
                                        # => Phone numbers without "+" prefix
                                        # => Country code included (e.g., 1234567890 for US)

# WhatsApp setup process:
hermes gateway start                    # => Starts gateway with WhatsApp enabled
                                        # => Displays QR code in terminal
                                        # => Scan with WhatsApp: Settings > Linked Devices > Link a Device
                                        # => After scan: "WhatsApp channel connected"

# Verify session persisted
ls ~/.hermes/whatsapp-session/          # => Session files cached here
                                        # => Subsequent starts skip QR code (session cached)
                                        # => Re-scan required if session expires (~14 days)

hermes gateway status                   # => Shows: whatsapp: connected, uptime, message count
                                        # => One WhatsApp account per gateway instance
```

**Key Takeaway**: WhatsApp uses QR code pairing via Baileys (requires Node.js), with sessions cached locally but requiring periodic re-authentication — this is an unofficial integration suitable for personal convenience, not production.

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
# Signal: register and start signal-cli daemon before starting Hermes
signal-cli -a +1234567890 register      # => Sends SMS verification code to phone number
signal-cli -a +1234567890 verify CODE   # => Verifies registration with received code
signal-cli -a +1234567890 daemon --http localhost:8080 &
                                        # => Starts signal-cli REST API on port 8080
                                        # => Hermes connects to this HTTP endpoint

echo "SIGNAL_ACCOUNT=+1234567890" >> ~/.hermes/.env
echo "SIGNAL_HTTP_URL=http://localhost:8080" >> ~/.hermes/.env
hermes gateway start                    # => "Signal channel connected" (via signal-cli HTTP)
                                        # => End-to-end encrypted messaging enabled

# Email: configure SMTP/IMAP credentials then start gateway
echo "EMAIL_SMTP_HOST=smtp.gmail.com" >> ~/.hermes/.env
echo "EMAIL_SMTP_PORT=587" >> ~/.hermes/.env
echo "EMAIL_ALLOWED_SENDERS=user@example.com" >> ~/.hermes/.env
hermes gateway start                    # => "Email channel connected"
                                        # => Polls IMAP inbox every 60 seconds
                                        # => Replies via SMTP to allowed senders only

hermes gateway status                   # => Shows: signal: connected, email: connected
```

**Key Takeaway**: Signal requires `signal-cli` running as a daemon with HTTP API, while Email uses standard SMTP/IMAP with sender whitelisting — both configured via environment variables in `.env`.

**Why It Matters**: Signal provides the highest-security option for agent communication — end-to-end encrypted messages that not even Nous Research can read. This matters for teams handling sensitive data (healthcare, finance, legal) where Telegram or Slack may not meet compliance requirements. Email, while less interactive, enables asynchronous workflows: schedule a cron job to email a daily report, or forward alerts to the agent's inbox for automated triage. The sender whitelist prevents the agent from processing spam or phishing emails as legitimate requests.

### Example 41: Multi-Platform Message Delivery

The `send_message` tool lets the agent proactively deliver messages to any configured platform. Combined with cron jobs, this enables scheduled reports, alerts, and notifications delivered to whichever platform the user prefers.

**Start the gateway and trigger multi-platform delivery**:

```bash
# Ensure the gateway is running with at least Telegram + Slack configured
hermes gateway start                    # => Connects all enabled channels
                                        # => Output: "Gateway started. Channels: telegram, slack"

# Verify connected channels
hermes gateway status                   # => Shows: connected channels, uptime, message counts
                                        # => Output: "telegram: connected, slack: connected"
```

**Trigger cross-platform message delivery from a session**:

```bash
# Ask the agent to send the same report to multiple platforms
hermes chat -q "Check server disk usage and send a summary to both Telegram and Slack"
                                        # => Agent runs: df -h /
                                        # => Agent calls send_message for Telegram + Slack
                                        # => Same content delivered to both channels

# Send a targeted message to a specific platform directly
hermes chat -q "Send today's deployment status to Slack #ops-alerts"
                                        # => Agent calls send_message: platform=slack, channel=#ops-alerts
hermes chat -q "Message me on Telegram with the current CPU load"
                                        # => Agent runs: uptime; sends result to Telegram
```

````yaml
# Platform formatting reference — gateway handles conversion automatically
# => Gateway auto-converts agent output to each platform's native format
# => Agent uses uniform send_message(); gateway handles platform differences
gateway:
  platforms:
    telegram:
      max_length: 4096 # => Long messages auto-split into multiple sends
      format:
        markdown # => Supports bold, italic, inline code
        # => Use *bold*, _italic_, `code`, ```block```
    slack:
      max_length: 3000 # => Block Kit available for structured layouts
      format:
        mrkdwn # => *bold* _italic_ `code` (different from Markdown)
        # => NOT standard Markdown — Slack uses its own format
    discord:
      max_length: 2000 # => Standard Markdown; Embeds for structured data
      format: markdown # => Bold, italic, code, spoilers supported
    email:
      format: html # => HTML or plain text body; subject auto-generated
      attachments:
        true # => File paths supported for attachments
        # => Agent passes file path; gateway reads and attaches
````

**Key Takeaway**: The `send_message` tool provides a uniform interface for delivering messages to any configured platform. Platform-specific formatting differences are handled automatically by the gateway.

**Why It Matters**: Multi-platform delivery decouples the agent's actions from where you receive notifications. A single cron job can send morning status reports to Telegram (for your phone), Slack (for the team), and email (for stakeholders who don't use chat). This is the foundation for building notification pipelines — the agent generates content once and distributes it across channels. Without this, you would need separate notification scripts for each platform, each with its own authentication and formatting logic.

### Example 42: DM Policies and Access Control

Hermes Agent enforces layered access control for messaging channels. Each platform has a user whitelist, an unauthorized DM behavior policy, and optional per-user session isolation. These controls prevent unauthorized access to your agent and API tokens.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    accTitle: Example 42: DM Policies and Access Control
    accDescr: Flowchart with 11 nodes and 10 connections. Nodes: Incoming Message, Platform Configured?, Drop, User in Allowlist?, Route to Session, DM Policy?, Send Pairing Request to Admin, Silently Drop, Per-User Sessions?, Own Session (isolated context), Shared Session (group context). Connections: Incoming Message to Platform Configured?, Platform Configured? to Drop (No), Platform Configured? to User in Allowlist? (Yes), User in Allowlist? to Route to Session (Yes), User in Allowlist? to DM Policy? (No), DM Policy? to Send Pairing Request to Admin (pair), DM Policy? to Silently Drop (ignore), Route to Session to Per-User Sessions?, Per-User Sessions? to Own Session (isolated context) (Yes), Per-User Sessions? to Shared Session (group context) (No).
    MSG["Incoming Message"] --> PLATFORM{"Platform<br/>Configured?"}

    PLATFORM -->|"No"| DROP1["Drop"]
    PLATFORM -->|"Yes"| ALLOW{"User in<br/>Allowlist?"}

    ALLOW -->|"Yes"| SESSION["Route to<br/>Session"]
    ALLOW -->|"No"| POLICY{"DM Policy?"}

    POLICY -->|"pair"| PAIR["Send Pairing<br/>Request to Admin"]
    POLICY -->|"ignore"| DROP2["Silently Drop"]

    SESSION --> ISOLATE{"Per-User<br/>Sessions?"}
    ISOLATE -->|"Yes"| OWN["Own Session<br/>(isolated context)"]
    ISOLATE -->|"No"| SHARED["Shared Session<br/>(group context)"]
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class MSG pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class ALLOW pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class SESSION pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class POLICY pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PAIR pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
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
# Configure access control before starting gateway
hermes gateway setup                    # => Interactive wizard sets unauthorized_dm_behavior
                                        # => Choose "pair" (admin approval) or "ignore" (silent drop)
hermes config set gateway.unauthorized_dm_behavior pair
                                        # => Directly set to "pair" mode
hermes config set gateway.group_sessions_per_user true
                                        # => Isolate each user's session context

# Start gateway and test pair flow
hermes gateway start                    # => Gateway running with pair mode enabled
                                        # => Unknown user 555666777 messages Telegram bot
                                        # => Bot replies: "Sending pairing request to admin..."
                                        # => Admin receives: "User 555666777 wants to pair. /approve or /deny"

# Admin approval command (typed in Telegram to the bot)
hermes gateway pair-approve 555666777   # => CLI equivalent of /approve in Telegram
                                        # => User 555666777 added to TELEGRAM_ALLOWED_USERS
                                        # => User can now interact with the agent

# Check and update current allowlists
cat ~/.hermes/.env | grep ALLOWED       # => TELEGRAM_ALLOWED_USERS=123456789,555666777
echo "TELEGRAM_ALLOWED_USERS=123456789,555666777" >> ~/.hermes/.env
                                        # => Manually add user if not using pair flow

# Switch to ignore mode for stricter security
hermes config set gateway.unauthorized_dm_behavior ignore
hermes gateway restart                  # => Reload config; unknown users now silently dropped
                                        # => No response, no admin notification

# Verify session isolation is working
hermes gateway status                   # => Shows: group_sessions_per_user: true
                                        # => Each user gets own isolated context
                                        # => User A's memory invisible to User B
```

**Key Takeaway**: Layer access control with platform allowlists, DM policies (pair/ignore), and per-user session isolation. The pairing flow enables controlled onboarding without sharing user IDs out-of-band.

**Why It Matters**: Every messaging channel is a potential attack surface — an unprotected Telegram bot can be abused by anyone, consuming your API tokens or executing commands on your system. The three-layer defense (platform allowlist + DM policy + session isolation) provides defense-in-depth. The pairing flow lets admins approve new users interactively instead of collecting IDs manually. Session isolation ensures one user cannot access another's conversation history or memory — critical for shared bots serving multiple team members.

## Delegation and Scheduling (Examples 43-48)

### Example 43: Subagent Delegation

The `delegate_task` tool spawns isolated subagents to handle focused subtasks. The parent agent defines a goal, provides context, and specifies which toolsets the child can use. Up to 3 subagents run concurrently with a depth limit of 2 (no sub-sub-subagents). Children have restricted tool access.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    accTitle: Example 43: Subagent Delegation
    accDescr: Flowchart with 7 nodes and 7 connections. Nodes: Orchestrates tasks, Child 1: Research task, Child 2: Code review, Child 3: Test execution, Cannot use: - delegate_task - clarify - memory tools - send_message - execute_code, Children, Restricted. Connections: Orchestrates tasks to Child 1: Research task (delegate_task()), Orchestrates tasks to Child 2: Code review (delegate_task()), Orchestrates tasks to Child 3: Test execution (delegate_task()), Child 1: Research task to Orchestrates tasks (Result JSON), Child 2: Code review to Orchestrates tasks (Result JSON), Child 3: Test execution to Orchestrates tasks (Result JSON), Children to Restricted.
    subgraph Parent["Parent Agent (full<br/>tools)"]
        PA["Orchestrates tasks"]
    end

    subgraph Children["Child Agents<br/>(restricted)"]
        C1["Child 1:<br/>Research task"]
        C2["Child 2:<br/>Code review"]
        C3["Child 3:<br/>Test execution"]
    end

    subgraph Restricted["Restricted Tools"]
        NO["Cannot use:<br/>- delegate_task<br/>- clarify<br/>- memory tools<br/>- send_message<br/>- execute_code"]
    end

    PA -->|"delegate_task()"| C1
    PA -->|"delegate_task()"| C2
    PA -->|"delegate_task()"| C3
    C1 -->|"Result JSON"| PA
    C2 -->|"Result JSON"| PA
    C3 -->|"Result JSON"| PA
    Children --- Restricted
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class Parent pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class Children pal-DE8F05
        classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
        class Restricted pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```bash
# Trigger delegation by asking the agent to perform a complex focused task
hermes chat -q "Review all Python files in src/ for security vulnerabilities"
                                        # => Agent uses delegate_task internally
                                        # => Spawns isolated child: toolsets=["file", "terminal"]
                                        # => Child CANNOT delegate further (depth limit = 2)

# Child executes autonomously; parent receives result summary:
hermes session stats                    # => Shows child token usage: input=15000, output=3000
                                        # => tool_trace: read_file x5, terminal x2
                                        # => Result: "Found 3 issues: SQL injection db.py:42, XSS views.py:87"

# Verify delegation configuration
hermes config get delegation            # => Shows: max_concurrent=3, max_depth=2, timeout=120s
hermes config set delegation.max_concurrent 2
                                        # => Reduce concurrent children (lower resource usage)
hermes config set delegation.timeout 60 # => Shorter timeout (60s) for quick tasks
                                        # => Child killed and returns "timeout" status if exceeded

# View delegation activity in current session
hermes session show --delegation        # => Shows parent-child relationship tree
                                        # => Each child listed with status and token usage
```

**Key Takeaway**: `delegate_task` spawns isolated child agents with restricted tools (no delegation, clarify, memory, send_message, or execute_code). Up to 3 concurrent children with depth limit 2 prevent runaway delegation.

**Why It Matters**: Delegation is the agent's parallel processing — instead of sequentially reviewing 10 files, the parent can delegate 3 review tasks that run simultaneously, cutting wall-clock time by 3x. The isolation is intentional: children cannot ask the user questions (which would block parallel execution), cannot delegate further (preventing exponential spawning), and cannot access memory (preventing cross-contamination). The structured JSON result gives the parent actionable data without inheriting the child's full conversation context — keeping the parent's context window clean for orchestration.

### Example 44: Batch Delegation

Batch mode sends multiple delegation tasks simultaneously, running up to 3 in parallel. Each task returns a structured JSON result with status, summary, token usage, and tool trace. Use batch delegation for parallel workstreams that are independent of each other.

```bash
# Trigger batch delegation with a broad code review request
hermes chat -q "Do a full code review: check frontend accessibility, API validation, and npm dependencies"
                                        # => Agent spawns 3 children in parallel (max_concurrent=3)
                                        # => Completes in ~30s vs 70s sequential

# After all children finish, view token usage breakdown
hermes session stats                    # => Per-child: frontend=12000, API=8000, deps=5000 tokens
hermes session show --last              # => Parent's unified report from all 3 children
hermes session show --delegation        # => Full parent-child delegation tree with statuses

# Configure and verify batch settings
hermes config get delegation.max_concurrent
                                        # => Shows: 3 (current concurrent child limit)
hermes config set delegation.max_concurrent 3
                                        # => Ensures maximum parallelism for batch tasks
hermes config get delegation.timeout    # => Shows: 120 (seconds per child before timeout)

# Run focused batch for a specific directory
hermes chat -q "Review the src/api/ directory: check validation, error handling, and test coverage"
                                        # => Agent splits into 3 focused subtasks automatically
                                        # => Each child handles one concern; parent synthesizes
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
# Duration shortcuts — schedule one-time tasks relative to now
hermes chat -q "Check if the CI build finished in 30 minutes"
                                        # => Agent creates: cronjob(schedule="30m", task="Check CI build")
                                        # => Shorthand: m=minutes, h=hours, d=days

hermes chat -q "Remind me to review PRs in 1 hour"
                                        # => Agent creates: cronjob(schedule="1h", task="Review PRs reminder")

hermes chat -q "Follow up on the deployment in 2 days"
                                        # => Agent creates: cronjob(schedule="2d", task="Deployment follow-up")

# Cron syntax — schedule recurring tasks
hermes chat -q "Send me a daily server health report at 9am every day"
                                        # => Agent creates: cronjob(schedule="0 9 * * *", ...)
                                        # => Standard cron: minute hour day month weekday
                                        # => "0 9 * * 1-5" for weekdays only

hermes chat -q "Check disk space every 30 minutes"
                                        # => Agent creates: cronjob(schedule="*/30 * * * *", ...)
                                        # => Monitors resource usage continuously

# ISO timestamp — schedule exact one-time execution
hermes chat -q "Deploy release v2.1 at 2026-04-15T14:00:00+07:00"
                                        # => Agent creates: cronjob(schedule="2026-04-15T14:00:00+07:00", ...)
                                        # => Timezone-aware; runs at exact date/time

# Managing cron jobs
hermes cron list                        # => Lists all scheduled jobs
                                        # => Shows: ID, schedule, task, next run time
                                        # => Output: c01 | 0 9 * * * | Daily health report

hermes cron delete c01                  # => Removes job c01 by ID
                                        # => Output: "Deleted cron job c01"

hermes cron logs c02                    # => Shows execution history for job c02
                                        # => Output: last run time, status, output summary
```

**Key Takeaway**: Schedule tasks with duration shortcuts (`30m`), cron syntax (`0 9 * * *`), or ISO timestamps. Jobs persist across sessions and can be listed, inspected, and deleted via `hermes cron`.

**Why It Matters**: Cron jobs transform the agent from a reactive tool (responds when you ask) into a proactive assistant (acts on a schedule without being prompted). Daily health reports, hourly monitoring, deployment reminders — these are workflows that would otherwise require separate scripts, separate cron configurations, and separate notification pipelines. With Hermes cron, you describe the task in natural language, and the agent handles scheduling, execution, and delivery. The persistent nature (jobs survive session end) means you set it once and it runs until deleted.

### Example 47: Cron with Multi-Platform Delivery

Cron jobs can deliver results to any configured messaging platform. Combine scheduling with `send_message` and skill attachment to create automated workflows that generate reports and distribute them across platforms.

```bash
# Schedule a recurring cron job with multi-platform delivery
hermes chat -q "Every weekday at 9am, check server status and report to Telegram and Slack #ops-alerts"
                                        # => Agent creates: cronjob(schedule="0 9 * * 1-5", ...)
                                        # => Each run: checks CPU, memory, disk, uptime
                                        # => Calls send_message to Telegram + Slack

# Verify the cron job was created and inspect it
hermes cron list                        # => Output: c01 | 0 9 * * 1-5 | Server status report
hermes cron show c01                    # => Shows full task definition, skills, target platforms
                                        # => Confirms schedule and delivery targets are correct

# Schedule a cron job with skill attachment
hermes chat -q "Every morning at 8am, run the deploy-status skill and send results to Discord"
                                        # => Agent creates: cronjob(schedule="0 8 * * *", skills=["deploy-status"])
                                        # => Cron job loads deploy-status skill each run
                                        # => Results formatted and delivered to Discord
hermes cron list                        # => Output: c02 | 0 8 * * * | Deploy status (skill: deploy-status)

# View output from a past run
hermes cron logs c01                    # => Execution history for the weekday report
                                        # => 2026-04-14 09:00 | completed | Telegram: sent, Slack: sent
                                        # => "CPU: 23% | Memory: 52% | Disk: 24% | Status: Healthy"

# Update or remove a cron job
hermes cron delete c02                  # => Removes the deploy-status cron job
                                        # => Output: "Deleted cron job c02"
```

**Key Takeaway**: Attach skills and delivery targets to cron jobs for automated workflows. The agent generates content once and distributes to multiple platforms with platform-specific formatting.

**Why It Matters**: Combining cron scheduling with multi-platform delivery creates a personal automation platform. Instead of writing separate monitoring scripts with separate Slack webhooks and Telegram bot calls, you describe the workflow once in natural language. The agent composes the pipeline: data collection (via tools and skills), analysis (via LLM reasoning), and distribution (via send_message). Skill attachment ensures the cron job uses your refined procedures, not ad-hoc approaches. This scales from simple status checks to complex workflows like daily dependency audits, weekly security scans, or monthly performance reports.

### Example 48: Session Search

The `session_search` tool performs full-text search (FTS5) across all past conversations stored in Hermes Agent's SQLite database. Results are deduplicated, summarized by the LLM, and exclude the current session to avoid circular references.

```bash
# Search past sessions by asking the agent directly
hermes chat -q "What error did I get with the kubernetes deployment last week?"
                                        # => Agent calls session_search(query="kubernetes deployment error")
                                        # => SQLite FTS5 full-text search; BM25 ranking applied
                                        # => LLM summarizes relevant fragments — not raw transcript

hermes chat -q "How did I fix the SSL certificate issue?"
                                        # => Agent finds past session; extracts resolution steps

# Search directly from CLI (non-interactive)
hermes session search "auth service deployment"
                                        # => Summarized matches from past sessions
                                        # => Current session excluded; lineage deduplication applied
                                        # => Output: "3 days ago: docker-compose + blue-green swap + vault"

# List and inspect sessions
hermes session list                     # => Lists sessions: ID, date, summary, token count
hermes session list --limit 10          # => Show only 10 most recent sessions
hermes session show SESSION_ID          # => Full transcript of a specific session
hermes session show --last              # => Most recent completed session transcript

# Search with filters
hermes session search --days 7 "nginx config"
                                        # => Search only sessions from last 7 days
hermes session search --tag deployment "rollback"
                                        # => Search sessions tagged as deployment-related
```

**Key Takeaway**: `session_search` provides FTS5 full-text search across all past sessions with BM25 ranking, lineage deduplication, and LLM summarization. The current session is excluded to prevent circular references.

**Why It Matters**: Memory (MEMORY.md/USER.md) stores curated facts; session search gives access to the full history of conversations and problem-solving. When you encounter an error you solved three weeks ago, session search finds the exact resolution without you remembering which session it was in. The LLM summarization step is critical — raw FTS5 results would dump pages of conversation transcript; the LLM extracts just the relevant portions and presents them concisely. Lineage deduplication prevents noise when parent-child delegation sessions contain overlapping content.

## Browser Automation and Code Execution (Examples 49-54)

### Example 49: Browser Navigation

Hermes Agent's browser toolset provides programmatic control of a headless browser. `browser_navigate` opens URLs, and `browser_snapshot` captures the current DOM state as an accessibility tree. The browser persists across tool calls within a session.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    accTitle: Example 49: Browser Navigation
    accDescr: Flowchart with 6 nodes and 4 connections. Nodes: browser_navigate, browser_snapshot, Web Page, DOM / A11y Tree, Accessibility Tree (structured text), Agent. Connections: browser_navigate to Web Page (URL), browser_snapshot to DOM / A11y Tree (Capture), DOM / A11y Tree to Accessibility Tree (structured text), Accessibility Tree (structured text) to Agent.
    subgraph Agent["Hermes Agent"]
        NAV["browser_navigate"]
        SNAP["browser_snapshot"]
    end

    subgraph Browser["Headless Browser"]
        PAGE["Web Page"]
        DOM["DOM / A11y Tree"]
    end

    subgraph Output["Agent Receives"]
        TREE["Accessibility Tree<br/>(structured text)"]
    end

    NAV -->|"URL"| PAGE
    SNAP -->|"Capture"| DOM
    DOM --> TREE
    TREE --> Agent
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class Agent pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class Browser pal-DE8F05
        classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
        class Output pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```bash
# Enable browser toolset and navigate to a URL
hermes chat -q "Open https://example.com and tell me what's on the page"
                                        # => Agent calls: browser_navigate(url="https://example.com")
                                        # => Page fully loads (waits for network idle)
                                        # => Then calls: browser_snapshot()
                                        # => Returns accessibility tree (not raw HTML)

# Example snapshot output the agent receives:
# [1] heading "Welcome to Example.com"
# [2] paragraph "This domain is for use in examples..."
# [3] link "More information..." href="https://iana.org/..."
# [4] button "Accept Cookies"
#                                       # => Ref numbers [1]-[4] used in click/type tools
                                        # => Agent reads this to understand page structure
                                        # => Compact semantic view vs. thousands of raw HTML lines
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
# Step 1: Ask agent to perform multi-step browser login workflow
hermes chat -q "Log into GitHub at https://github.com/login using my credentials"
                                        # => Agent calls browser_navigate(url="https://github.com/login")
                                        # => Agent calls browser_snapshot() to see page elements

# Step 2: Agent reads snapshot and types into username field
hermes chat -q "Type 'user@example.com' into the username field"
                                        # => Agent calls browser_type(ref=3, text="user@example.com")
                                        # => ref=3 is the username textbox from snapshot
                                        # => Simulates real keyboard input; triggers onChange events

# Step 3: Type into password field
hermes chat -q "Type the password into the password field"
                                        # => Agent calls browser_type(ref=5, text="***")
                                        # => ref=5 is the password field (type="password")

# Step 4: Click the submit button
hermes chat -q "Click the Sign In button"
                                        # => Agent calls browser_click(ref=6)
                                        # => Waits for navigation/page update after click

# Step 5: Take snapshot to see page after login
hermes chat -q "What's on the page now after logging in?"
                                        # => Agent calls browser_snapshot() after navigation
                                        # => Returns new accessibility tree of dashboard page

# Step 6: Scroll to find more content
hermes chat -q "Scroll down to find the repository list"
                                        # => Agent calls browser_scroll(direction="down", amount=3)
                                        # => amount=3: 3 viewport heights; "up" scrolls toward top

# Step 7: Use keyboard shortcut or navigate back
hermes chat -q "Press Enter to submit the search form"
                                        # => Agent calls browser_press(key="Enter")
hermes chat -q "Go back to the previous page"
                                        # => Agent calls browser_back()
                                        # => Returns to previous page in browser history

# Step 8: Verify the workflow completed successfully
hermes chat -q "Take a snapshot and confirm I'm now logged into GitHub"
                                        # => Agent calls browser_snapshot(); reads page state
hermes chat -q "Search for 'hermes-agent' in the GitHub search box"
                                        # => Agent: browser_click search field + browser_type + browser_press(Enter)
hermes chat -q "Click on the first search result"
                                        # => Agent calls browser_click(ref=N) where N is first result ref
hermes chat -q "Scroll to the bottom of the README and take a screenshot"
                                        # => Agent: browser_scroll(direction=down) + browser_vision
hermes chat -q "Open a new tab and navigate to https://docs.github.com"
                                        # => Agent navigates to docs page; browser persists across calls
```

**Key Takeaway**: Browser interaction uses ref numbers from `browser_snapshot` for precise element targeting. The five interaction tools (click, type, scroll, press, back) cover all common web automation patterns.

**Why It Matters**: Ref-based interaction eliminates the fragility of CSS selectors and XPath expressions — you don't need to know the page's implementation details to interact with it. The agent snapshots the page, identifies elements by their semantic roles (button, textbox, link), and interacts using stable ref numbers. This means the same automation works even if the site redesigns its CSS or restructures its DOM, as long as the semantic structure remains. Combined with the agent's reasoning, it can handle dynamic pages (SPAs, infinite scroll) by repeatedly snapshotting and adapting.

### Example 51: Browser Vision and Screenshots

The browser vision tools enable visual analysis of web pages. `browser_vision` sends a screenshot to the LLM for visual reasoning, `browser_get_images` extracts image URLs, and `browser_console` captures JavaScript console output. Session recording saves browsing as video.

```bash
# Visual analysis: describe and check a page visually
hermes chat -q "Open https://myapp.com and check for visual layout problems"
                                        # => Agent: browser_navigate + browser_vision
                                        # => Screenshot sent to LLM; LLM analyzes layout, colors, spacing

hermes chat -q "Is the login form on this page properly aligned?"
                                        # => Agent: browser_vision with targeted question
                                        # => Sees page as user would; catches bugs invisible to DOM

# Extract all images from the current page
hermes chat -q "List all images on this page"
                                        # => Agent calls: browser_get_images()
                                        # => Returns: all <img> src + CSS background image URLs
hermes chat -q "Download all hero images from this marketing page"
                                        # => Agent: browser_get_images() + write_file for each URL

# Capture JavaScript console output for debugging
hermes chat -q "Check for JavaScript errors on this page"
                                        # => Agent calls: browser_console()
                                        # => Returns: [ERROR] TypeError, [WARN] deprecated API, etc.
hermes chat -q "Why is the dashboard loading slowly? Check the browser console"
                                        # => Agent: browser_navigate + browser_console
                                        # => Finds: failed network requests, slow resource loads

# View session recording after automation run
ls ~/.hermes/recordings/                # => Lists WebM video files of browser sessions
                                        # => Format: session-{id}-{timestamp}.webm
```

```yaml
# ~/.hermes/config.yaml — recording configuration
tools:
  browser:
    enabled: true # => Activates browser toolset
    headless: true # => Run without visible window (false for debugging)
    record:
      true # => Records browser sessions as video
      # => Saved to ~/.hermes/recordings/ as WebM
      # => Set to false in production (disk usage)
    command_timeout: 30 # => Seconds before a browser command times out
```

**Key Takeaway**: `browser_vision` sends screenshots to the LLM for visual analysis, `browser_get_images` extracts image URLs, and `browser_console` captures JavaScript logs. Session recording saves automation as video for debugging.

**Why It Matters**: DOM-based tools (snapshot, click, type) understand page structure but miss visual issues — a button might be in the DOM but hidden behind an overlay, or text might be rendered in unreadable colors. Vision tools bridge this gap by showing the agent what the user actually sees. Console capture is equally critical: JavaScript errors, failed API calls, and deprecation warnings often explain why a page behaves unexpectedly. Together, these tools give the agent the same debugging toolkit a human developer uses in browser DevTools, but automated and integrated into the agent's reasoning loop.

### Example 52: Code Execution Tool

The `execute_code` tool runs Python scripts in an isolated environment with access to 7 RPC tools (web_search, web_extract, read_file, write_file, search_files, patch, terminal). Code execution has zero context cost — the script runs outside the LLM context window.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    accTitle: Example 52: Code Execution Tool
    accDescr: Flowchart with 5 nodes and 5 connections. Nodes: execute_code(script), Python Script, RPC Tools: - web_search - web_extract - read_file - write_file - search_files - patch - terminal, stdout + stderr (compact result), Agent. Connections: execute_code(script) to Python Script (Script), Python Script to RPC Tools: - web_search - web_extract - read_file - write_file - search_files - patch - terminal (Tool calls), RPC Tools: - web_search - web_extract - read_file - write_file - search_files - patch - terminal to Python Script (Results), Python Script to stdout + stderr (compact result) (Output), stdout + stderr (compact result) to Agent.
    subgraph Agent["Agent Context Window"]
        PROMPT["execute_code(script)"]
    end

    subgraph Sandbox["Python Sandbox (zero<br/>context cost)"]
        SCRIPT["Python Script"]
        RPC["RPC Tools:<br/>- web_search<br/>- web_extract<br/>- read_file<br/>- write_file<br/>- search_files<br/>- patch<br/>- terminal"]
    end

    subgraph Result["Returns to Agent"]
        OUT["stdout + stderr<br/>(compact result)"]
    end

    PROMPT -->|"Script"| SCRIPT
    SCRIPT -->|"Tool calls"| RPC
    RPC -->|"Results"| SCRIPT
    SCRIPT -->|"Output"| OUT
    OUT --> Agent
        classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
        class Agent pal-0173B2
        classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
        class Sandbox pal-DE8F05
        classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
        class Result pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```bash
# Trigger execute_code by asking the agent to process a batch of files
hermes chat -q "Find all Python files in src/ that are longer than 200 lines"
                                        # => Agent writes and executes a Python script internally:
                                        # =>   files = search_files(pattern="*.py", path="src/")
                                        # =>   for f in files: count lines, filter > 200
                                        # =>   print(json.dumps(results))  # only stdout returns
                                        # => Script runs in isolated process — zero context cost
                                        # => Only the JSON summary enters the agent context

hermes chat -q "Count lines in each file in src/ and output a sorted report"
                                        # => Agent executes Python: search_files + read_file x N
                                        # => N file reads stay in sandbox — not in context window
                                        # => Only final print() output (~200 tokens) returned

# Configure code execution settings
hermes config get tools.execute_code    # => Shows: enabled=true, timeout=300, max_tool_calls=100
                                        # => timeout: max seconds before script is killed
                                        # => max_tool_calls: safety cap on RPC calls per script

# Cost comparison demonstration
hermes chat -q "How many tokens does execute_code save vs. reading 50 files directly?"
                                        # => Agent calculates:
                                        # =>   Direct: 50 files × ~2000 tokens = ~100k tokens
                                        # =>   execute_code: ~200 tokens (just the summary)
                                        # =>   Savings: 99.8% fewer context tokens consumed
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
# Trigger the clarify tool by giving the agent an ambiguous request
hermes chat -q "Deploy the app"         # => Agent has no environment specified
                                        # => Calls: clarify("Which environment? Options: staging, production, or both?")
                                        # => Pauses agent execution; sends question to user

# You respond in the terminal/chat:
staging                                 # => User responds with "staging"
                                        # => Agent resumes with: deploy to staging environment
                                        # => Timeout: 120 seconds before proceeding with safest default

# Trigger with file selection ambiguity
hermes chat -q "Edit the config file for this project"
                                        # => Agent finds 3 config files; calls clarify with options:
                                        # =>   "1. config/dev.yaml  2. config/staging.yaml  3. config/prod.yaml"

# Trigger with destructive action decision
hermes chat -q "Fix the failing test"   # => Agent finds permission error
                                        # => Calls: clarify("Fix permissions (a) or skip test (b)?")
                                        # => Avoids risky autonomous decisions
```

```yaml
# ~/.hermes/config.yaml — clarify timeout configuration
tools:
  clarify:
    timeout:
      120 # => Seconds to wait for user response
      # => Default: 120 (2 minutes)
      # => 0: wait indefinitely (not recommended for automation)
    on_timeout:
      "default" # => "default": proceed with safest option
      # => "abort": report cannot continue; user must re-ask
```

```bash
# Important: clarify is NOT available to child agents (via delegate_task)
hermes config get delegation            # => Shows: child_tools excludes "clarify"
                                        # => Children cannot pause to ask user questions
                                        # => Reason: clarify would block parallel execution
                                        # => Parent must provide complete context upfront
                                        # => If child truly needs input, it fails; parent clarifies and re-delegates
```

**Key Takeaway**: The `clarify` tool pauses execution to ask the user a question, with a configurable timeout. It is restricted from child agents to prevent blocking parallel delegation.

**Why It Matters**: Autonomous agents face a tension between taking action and asking permission. Too autonomous and the agent makes risky decisions without consent; too cautious and it asks trivial questions that waste time. The clarify tool gives the agent a structured way to ask when it genuinely needs human judgment — which environment to deploy to, which of several valid approaches to take, whether to proceed with a potentially destructive operation. The delegation restriction is a critical design choice: if three child agents could all pause to ask questions, parallel execution would deadlock.

### Example 54: Mixture of Agents

The Mixture of Agents (MoA) toolset generates diverse responses from 4 reference models in parallel, then synthesizes them through a single aggregator into one high-quality answer. This improves response quality for complex, nuanced questions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TB
    accTitle: Example 54: Mixture of Agents
    accDescr: Flowchart with 7 nodes and 9 connections. Nodes: User Question, Reference Model 1 (e.g., Claude), Reference Model 2 (e.g., GPT-4), Reference Model 3 (e.g., Gemini), Reference Model 4 (e.g., Llama), Aggregator Model (synthesizes best from all 4), Final Answer (higher quality than any single model). Connections: User Question to Reference Model 1 (e.g., Claude), User Question to Reference Model 2 (e.g., GPT-4), User Question to Reference Model 3 (e.g., Gemini), User Question to Reference Model 4 (e.g., Llama), Reference Model 1 (e.g., Claude) to Aggregator Model (synthesizes best from all 4), Reference Model 2 (e.g., GPT-4) to Aggregator Model (synthesizes best from all 4), Reference Model 3 (e.g., Gemini) to Aggregator Model (synthesizes best from all 4), Reference Model 4 (e.g., Llama) to Aggregator Model (synthesizes best from all 4), Aggregator Model (synthesizes best from all 4) to Final Answer (higher quality than any single model).
    Q["User Question"] --> R1["Reference Model 1<br/>(e.g., Claude)"]
    Q --> R2["Reference Model 2<br/>(e.g., GPT-4)"]
    Q --> R3["Reference Model 3<br/>(e.g., Gemini)"]
    Q --> R4["Reference Model 4<br/>(e.g., Llama)"]

    R1 --> AGG["Aggregator Model<br/>(synthesizes best<br/>from all 4)"]
    R2 --> AGG
    R3 --> AGG
    R4 --> AGG

    AGG --> FINAL["Final Answer<br/>(higher quality than<br/>any single model)"]
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Q pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class R1 pal-DE8F05
    class R2 pal-DE8F05
    class R3 pal-DE8F05
    class R4 pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class AGG pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class FINAL pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
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
