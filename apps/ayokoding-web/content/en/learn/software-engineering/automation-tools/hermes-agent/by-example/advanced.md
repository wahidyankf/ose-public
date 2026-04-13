---
title: "Advanced"
date: 2026-04-14T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 55-80: Hermes Agent terminal backends, security hardening, MCP integration, voice mode, production deployment, and scaling patterns (75-95% coverage)"
tags: ["hermes-agent", "advanced", "by-example", "tutorial", "security", "production", "mcp", "voice", "scaling"]
---

This tutorial provides 26 advanced examples covering terminal backends (Examples 55-60), security hardening (Examples 61-67), MCP integration and voice mode (Examples 68-73), and production deployment and scaling (Examples 74-80).

## Terminal Backends (Examples 55-60)

### Example 55: Docker Terminal Backend

Run agent commands inside isolated Docker containers instead of the host system. The Docker backend creates a sandboxed execution environment with configurable resource limits, persistent containers for session reuse, and environment variable forwarding.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Hermes Agent CLI"]
    B["Docker Backend"]
    C["Docker Container"]
    D["Host Filesystem<br/>(bind mounts)"]
    E["Container Filesystem<br/>(isolated)"]
    F["Resource Limits<br/>CPU / Memory / Disk"]

    A -->|"sends command"| B
    B -->|"creates/reuses"| C
    C --> E
    D -->|"docker_volumes"| C
    F -->|"enforced on"| C

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#0173B2,stroke:#000,color:#fff
```

```yaml
# ~/.hermes/config.yaml — Docker terminal backend configuration
terminal:
  backend:
    "docker" # => Use Docker as execution environment
    # => Requires Docker daemon running on host
  docker_image:
    "ubuntu:22.04" # => Base image for the container
    # => Any Docker Hub or private registry image
  docker_volumes: # => Host directories to mount into container
    - "/home/user/projects:/workspace" # => Mount projects directory at /workspace
      # => Format: host_path:container_path
    - "/home/user/.ssh:/root/.ssh:ro" # => Mount SSH keys read-only
      # => :ro suffix prevents container writes
  docker_mount_cwd_to_workspace:
    true # => Mount current working directory
    # => Appears at /workspace in container
  container_cpu:
    2 # => CPU core limit for container
    # => Prevents runaway processes hogging host
  container_memory:
    "4g" # => Memory limit (supports k, m, g suffixes)
    # => Container OOM-killed if exceeded
  container_disk:
    "10g" # => Disk space limit for container filesystem
    # => Does not affect mounted volumes
  container_persistent:
    true # => Reuse container across sessions
    # => false: fresh container each session
    # => true: state persists (installed packages, etc.)
  docker_forward_env: # => Environment variables forwarded to container
    - "GITHUB_TOKEN" # => Forward GitHub token from host
    - "AWS_ACCESS_KEY_ID" # => Forward AWS credentials
    - "AWS_SECRET_ACCESS_KEY" # => Agent can use host credentials
      # => without hardcoding in container
```

**Key Takeaway**: The Docker backend isolates all agent-executed commands in a container with configurable CPU, memory, and disk limits while still allowing access to host directories via bind mounts.

**Why It Matters**: Running an AI agent with shell access on your host machine carries inherent risk — a misunderstood instruction could delete files, install malware, or leak credentials. Docker isolation bounds the blast radius. If the agent runs `rm -rf /`, only the container filesystem is destroyed. Resource limits prevent cryptocurrency miners or fork bombs from impacting host performance. Persistent containers let the agent install tools once and reuse them, while environment forwarding means credentials never touch the container's filesystem. This is the recommended backend for any production or semi-trusted deployment.

### Example 56: SSH Terminal Backend

Execute agent commands on a remote server over SSH. The SSH backend connects to any machine you have SSH access to, running all commands in a persistent shell session on the remote host.

```yaml
# .env — SSH credentials (never commit this file)
TERMINAL_SSH_HOST=dev-server.example.com  # => Remote server hostname or IP
                                          # => Must be reachable from agent host
TERMINAL_SSH_USER=deploy                  # => SSH username on remote server
                                          # => Needs appropriate permissions
TERMINAL_SSH_PORT=22                      # => SSH port (default: 22)
                                          # => Change for non-standard setups
TERMINAL_SSH_KEY=/home/user/.ssh/id_ed25519
                                          # => Path to SSH private key
                                          # => Must have read permissions for agent
```

```yaml
# ~/.hermes/config.yaml — SSH terminal backend configuration
terminal:
  backend:
    "ssh" # => Use SSH as execution environment
    # => All commands execute on remote host
  persistent_shell:
    true # => Maintain SSH connection across commands
    # => Default for SSH backend (true)
    # => Preserves environment variables, cwd
    # => false: new SSH session per command
  cwd:
    "/home/deploy/workspace" # => Working directory on remote server
    # => Agent starts here each session
  timeout:
    300 # => Command timeout in seconds
    # => Prevents hung remote commands
```

```bash
# Agent executing commands via SSH backend
hermes                                    # => Start agent with SSH config
                                          # => Connects to dev-server.example.com

# Agent conversation:
You: List the running services
                                          # => Agent runs: ssh deploy@dev-server systemctl list-units
                                          # => Output streamed back to terminal
                                          # => All commands execute remotely
                                          # => Local filesystem untouched
```

**Key Takeaway**: The SSH backend forwards all agent commands to a remote server, using environment variables for credentials and maintaining a persistent shell session by default.

**Why It Matters**: SSH backends unlock remote server management through conversational AI. Instead of memorizing server-specific paths, service names, and log locations, you describe what you need and the agent executes it on the remote machine. This pattern is especially valuable for managing staging environments, debugging production issues (with read-only SSH access), or orchestrating deployments across multiple servers. The persistent shell means the agent maintains context — `cd` into a directory, set environment variables, and subsequent commands inherit that state, just like an interactive SSH session.

### Example 57: Modal Serverless Backend

Run agent commands on Modal's serverless infrastructure. The Modal backend spins up cloud compute on demand, hibernates when idle, and costs nearly nothing between sessions — ideal for burst workloads like CI runs, data processing, or GPU tasks.

```yaml
# .env — Modal credentials
MODAL_TOKEN_ID=ak-xxxxxxxxxxxx            # => Modal API token ID
                                          # => Get from: modal.com/settings
MODAL_TOKEN_SECRET=as-xxxxxxxxxxxx        # => Modal API token secret
                                          # => Pair with TOKEN_ID for auth
```

```yaml
# ~/.hermes/config.yaml — Modal terminal backend
terminal:
  backend:
    "modal" # => Use Modal serverless compute
    # => Auto-provisions cloud container
  modal_image:
    "debian_slim" # => Base image for Modal container
    # => Options: debian_slim, ubuntu, custom
    # => Custom: build from Dockerfile
  timeout:
    600 # => Max command runtime in seconds
    # => Modal auto-terminates after this
    # => Prevents runaway cloud costs
```

```bash
# Modal backend lifecycle
hermes                                    # => Agent starts, Modal container provisioned
                                          # => Cold start: ~2-5 seconds
                                          # => Subsequent: near-instant (warm)

You: Install numpy and run a matrix multiplication benchmark
                                          # => Modal spins up container
                                          # => Installs numpy (cached for next time)
                                          # => Runs benchmark on cloud hardware
                                          # => Returns results to local terminal

# After 5 minutes of inactivity:
                                          # => Modal hibernates container
                                          # => Cost drops to $0.00/hour
                                          # => Next command wakes it instantly
```

**Key Takeaway**: Modal provides on-demand serverless compute that hibernates when idle, giving the agent cloud resources without persistent infrastructure costs.

**Why It Matters**: Not every agent task fits on your laptop. Data processing, model fine-tuning, large builds, and GPU workloads need more compute than a developer machine provides. Modal's serverless model means you pay only for active compute seconds — a 30-minute data pipeline costs pennies, not the monthly fee of a persistent cloud VM. The agent treats Modal identically to a local terminal, so you don't change your workflow — just swap the backend in config.yaml. This makes Hermes Agent viable for teams where local machines vary wildly in capability but cloud budget exists for burst compute.

### Example 58: Daytona Managed Backend

Execute agent commands in Daytona's managed cloud containers. Daytona provides development-environment-as-a-service with automatic hibernation, pre-configured toolchains, and team-shared workspaces.

```yaml
# .env — Daytona credentials
DAYTONA_API_KEY=dtn_xxxxxxxxxxxx # => Daytona API key
# => Get from: app.daytona.io/settings
```

```yaml
# ~/.hermes/config.yaml — Daytona terminal backend
terminal:
  backend:
    "daytona" # => Use Daytona managed containers
    # => Cloud dev environment with hibernation
  daytona_image:
    "daytonaio/workspace:latest"
    # => Daytona workspace image
    # => Pre-configured with common dev tools
    # => Custom images from Daytona registry
  cwd:
    "/workspace" # => Working directory inside Daytona container
    # => Standard Daytona workspace root
  timeout: 600 # => Command timeout in seconds
```

```bash
# Daytona backend workflow
hermes                                    # => Agent starts
                                          # => Daytona provisions managed container
                                          # => Pre-installed: git, node, python, go, etc.

You: Clone my repo and run the test suite
                                          # => Agent executes in Daytona container
                                          # => Full dev environment available
                                          # => Network access for package installs

# Session ends:
                                          # => Daytona hibernates container
                                          # => State preserved (files, packages)
                                          # => Resumes on next session
                                          # => No cost while hibernating
```

**Key Takeaway**: Daytona provides managed cloud containers with pre-configured dev toolchains, automatic hibernation, and state persistence across sessions.

**Why It Matters**: Daytona bridges the gap between "I need a full dev environment" and "I don't want to manage infrastructure." Unlike raw Docker or SSH, Daytona containers come pre-loaded with development tools, handle authentication to common services, and hibernate automatically when idle. For teams, this means every agent session gets an identical environment regardless of who runs it — no "works on my machine" variance. The managed nature means you don't configure Docker networks, handle volume permissions, or debug container startup failures. You point Hermes Agent at Daytona and get a fully functional, isolated dev environment that costs nothing when unused.

### Example 59: Singularity HPC Backend

Run agent commands inside Singularity containers on HPC (High-Performance Computing) clusters. Singularity provides namespace isolation without requiring root access, making it the standard container runtime for research and academic computing environments.

```yaml
# ~/.hermes/config.yaml — Singularity terminal backend
terminal:
  backend:
    "singularity" # => Use Singularity (Apptainer) containers
    # => Standard on HPC clusters
    # => No root/daemon required
  singularity_image:
    "docker://ubuntu:22.04"
    # => Image source in docker:// format
    # => Pulls from Docker Hub
    # => Converts to Singularity SIF format
    # => Also supports: library://, shub://
  cwd:
    "/scratch/user/workspace" # => Working directory on HPC filesystem
    # => Typically scratch or project storage
  timeout:
    3600 # => Longer timeout for HPC workloads
    # => Research tasks can take hours
```

```bash
# Singularity backend on HPC cluster
hermes                                    # => Agent starts with Singularity backend
                                          # => No root access needed
                                          # => No Docker daemon required

You: Run the protein folding simulation on the dataset in /scratch
                                          # => Agent executes inside Singularity container
                                          # => Has access to cluster filesystem
                                          # => Namespace isolation: process IDs, network
                                          # => Host UID mapped into container (no root)

# Key difference from Docker:
                                          # => Singularity: rootless, daemon-less
                                          # => Docker: requires root or docker group
                                          # => HPC clusters almost never allow Docker
                                          # => Singularity is the HPC standard
```

**Key Takeaway**: Singularity runs containers without a daemon or root access, making it the only viable container backend for HPC clusters where Docker is prohibited.

**Why It Matters**: Research computing and HPC environments have strict security policies — no root access, no persistent daemons, no privileged containers. Docker is typically banned outright. Singularity (now Apptainer) was designed specifically for this constraint: it runs containers as the invoking user, requires no daemon, and integrates with cluster schedulers like SLURM and PBS. By supporting Singularity, Hermes Agent becomes usable in academic and research settings where other agent frameworks fail at the first `docker run`. Scientists and researchers can leverage AI assistance for data analysis, simulation management, and experiment orchestration without violating cluster security policies.

### Example 60: Terminal Environment Passthrough

Control which environment variables, credential files, and settings are forwarded from the host into any terminal backend. Environment passthrough applies uniformly across Docker, SSH, Modal, Daytona, and Singularity backends.

```yaml
# ~/.hermes/config.yaml — Environment passthrough configuration
terminal:
  backend:
    "docker" # => Applies to any backend
    # => Configuration is backend-agnostic

  env_passthrough: # => Environment variables forwarded to sandbox
    - "GITHUB_TOKEN" # => Git operations in container
    - "NPM_TOKEN" # => Private npm registry access
    - "AWS_ACCESS_KEY_ID" # => AWS SDK authentication
    - "AWS_SECRET_ACCESS_KEY" # => AWS SDK authentication (pair)
    - "DATABASE_URL" # => Database connection string
      # => Variables read from host environment
      # => Available inside sandbox as-is

  credential_files: # => Files mounted into container
    - "/home/user/.ssh/id_ed25519" # => SSH private key
    - "/home/user/.aws/credentials" # => AWS credentials file
    - "/home/user/.kube/config" # => Kubernetes config
      # => Mounted read-only by default
      # => Container cannot modify originals

  cwd:
    "/workspace" # => Working directory inside sandbox
    # => Agent starts here each session
    # => Applies to all backends

  timeout:
    120 # => Per-command timeout in seconds
    # => Default: 120 (2 minutes)
    # => Increase for long-running builds
    # => 0: no timeout (not recommended)
```

```bash
# Verifying environment passthrough
hermes                                    # => Start agent with passthrough config

You: Check if GitHub token is available
                                          # => Agent runs: echo $GITHUB_TOKEN | head -c 8
                                          # => Output: ghp_xxxx (first 8 chars)
                                          # => Token forwarded from host

You: List my AWS S3 buckets
                                          # => Agent runs: aws s3 ls
                                          # => Uses forwarded AWS credentials
                                          # => No credentials stored in container
```

**Key Takeaway**: `env_passthrough` forwards host environment variables and `credential_files` mounts host files into any sandbox backend, providing a unified authentication mechanism.

**Why It Matters**: Credentials are the hardest part of sandboxed execution. Without passthrough, you'd need to copy API keys into containers, manage secrets rotation in multiple places, and risk credentials leaking into container images or logs. The passthrough model keeps credentials on the host — the sandbox gets runtime access without persistent storage. When you rotate a GitHub token, you update it once on the host; every future agent session automatically uses the new value. Credential files mount read-only, preventing the agent from accidentally corrupting your SSH keys or AWS config. This design makes secure sandbox usage practical rather than a credentials-management nightmare.

## Security Hardening (Examples 61-67)

### Example 61: Approval Modes

Control whether the agent can execute commands autonomously or requires human approval. Three modes — manual, smart, and off — balance safety against workflow speed.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Agent Generates Command"]
    B{"Approval Mode?"}
    C["Manual Mode"]
    D["Smart Mode"]
    E["Off Mode"]
    F["Human Reviews<br/>Every Command"]
    G["Auxiliary LLM<br/>Assesses Danger"]
    H["Command Executes<br/>Immediately"]
    I{"Dangerous?"}
    J["Human Reviews"]
    K["Auto-Approved"]

    A --> B
    B -->|"manual"| C
    B -->|"smart"| D
    B -->|"off"| E
    C --> F
    D --> G
    E --> H
    G --> I
    I -->|"yes"| J
    I -->|"no"| K

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#fff
    style G fill:#029E73,stroke:#000,color:#fff
    style H fill:#CA9161,stroke:#000,color:#fff
    style I fill:#DE8F05,stroke:#000,color:#fff
    style J fill:#CC78BC,stroke:#000,color:#fff
    style K fill:#029E73,stroke:#000,color:#fff
```

```yaml
# ~/.hermes/config.yaml — Approval mode configuration

# Mode 1: Manual (most restrictive)
approvals:
  mode: "manual"                          # => Every command requires human approval
                                          # => Agent proposes, you confirm or reject
                                          # => Safest mode: nothing executes unseen
                                          # => Best for: untrusted tasks, new setups

# Mode 2: Smart (balanced)
approvals:
  mode: "smart"                           # => Auxiliary LLM assesses command danger
                                          # => Safe commands auto-approved (ls, cat, echo)
                                          # => Dangerous commands prompt for approval
                                          # => Detects: rm, sudo, curl|bash, network ops
                                          # => Uses lightweight model for assessment
                                          # => Best for: daily development work

# Mode 3: Off (fully autonomous)
approvals:
  mode: "off"                             # => No approval required for any command
                                          # => Agent executes immediately
                                          # => Maximum speed, minimum safety
                                          # => Only use with Docker/sandbox backend
                                          # => Never use on host with sensitive data
```

```bash
# Smart mode in action
You: Clean up old Docker images
                                          # => Agent proposes: docker image prune -a
                                          # => Smart mode: assesses as DANGEROUS
                                          # => Prompt: "This will remove all unused images. Allow? [y/n]"
                                          # => You: y
                                          # => Command executes

You: How much disk space is free?
                                          # => Agent proposes: df -h
                                          # => Smart mode: assesses as SAFE
                                          # => Auto-approved, executes immediately
                                          # => No prompt shown
```

**Key Takeaway**: Approval modes control the human-in-the-loop for command execution — `manual` approves everything, `smart` uses an auxiliary LLM to auto-approve safe commands, and `off` runs everything without asking.

**Why It Matters**: The right approval mode depends on your threat model, not your convenience. Running `off` mode on a host machine with production credentials is asking for an incident report. Running `manual` mode for routine development wastes your time approving `ls` and `cat` commands. Smart mode is the practical middle ground for most work — it catches destructive operations (`rm -rf`, `DROP TABLE`, `git push --force`) while letting read-only commands flow. Pair smart mode with Docker backend and you get defense in depth: the approval layer catches intent mistakes, the container catches execution mistakes.

### Example 62: Secret Redaction

Automatically detect and redact API keys, tokens, passwords, and other secrets from command output. Secret redaction prevents accidental exposure of credentials in logs, session history, and agent memory.

```yaml
# ~/.hermes/config.yaml — Secret redaction configuration
security:
  redact_secrets:
    true # => Enable automatic secret detection
    # => Scans all command output
    # => Replaces secrets with [REDACTED]
    # => Patterns: API keys, tokens, passwords
    # => Regex-based detection + entropy analysis
```

```bash
# Without redaction (dangerous):
You: Show me the environment variables
                                          # => Agent runs: env
                                          # => Output includes:
                                          # =>   GITHUB_TOKEN=ghp_a1b2c3d4e5f6g7h8i9j0
                                          # =>   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG
                                          # =>   DATABASE_URL=postgres://admin:s3cret@db:5432/prod
                                          # => Secrets visible in session history!

# With redaction enabled (safe):
You: Show me the environment variables
                                          # => Agent runs: env
                                          # => Output shows:
                                          # =>   GITHUB_TOKEN=[REDACTED]
                                          # =>   AWS_SECRET_ACCESS_KEY=[REDACTED]
                                          # =>   DATABASE_URL=postgres://admin:[REDACTED]@db:5432/prod
                                          # => Secrets masked before reaching agent context
                                          # => Cannot leak into memory or skills
```

```yaml
# Redaction covers multiple secret patterns:
# => GitHub tokens: ghp_*, gho_*, ghs_*, github_pat_*
# => AWS keys: AKIA*, aws_secret_access_key patterns
# => Generic API keys: sk-*, pk_*, rk_* prefixes
# => Bearer tokens: Authorization: Bearer *
# => Connection strings: password segments in URLs
# => High-entropy strings: base64 blocks > 20 chars
# => Private keys: -----BEGIN * PRIVATE KEY-----
```

**Key Takeaway**: Enabling `redact_secrets: true` scans all command output for credential patterns and replaces them with `[REDACTED]` before the content reaches the agent's context or session history.

**Why It Matters**: AI agents have a unique secret-exposure risk that traditional tools don't. When an agent runs `env` or `cat .env`, the output enters the LLM's context window — which may be logged, stored in session history, written to MEMORY.md, or even sent to a cloud API for inference. A single `env` command can leak every credential on the machine into a context window that persists across sessions. Secret redaction intercepts this at the source: credentials are replaced before they enter the agent's awareness. The agent can still use tools that need credentials (they're in the real environment), but it never sees the actual values, so it cannot accidentally memorize, log, or share them.

### Example 63: Tirith Security Scanning

Pre-scan agent commands with Tirith, a policy-as-code engine that evaluates commands against security rules before execution. Tirith catches risky command patterns that the approval system might miss.

```yaml
# ~/.hermes/config.yaml — Tirith security scanning
security:
  tirith_enabled:
    true # => Enable Tirith pre-execution scanning
    # => Every command checked before running
  tirith_path:
    "/usr/local/bin/tirith" # => Path to Tirith binary
    # => Install: pip install tirith
  tirith_timeout:
    10 # => Timeout for Tirith evaluation (seconds)
    # => Prevents slow policy checks blocking agent
  tirith_fail_open:
    false # => Behavior when Tirith times out or errors
    # => false: block command on Tirith failure
    # => true: allow command if Tirith unavailable
    # => false is more secure (fail-closed)
```

```bash
# Tirith scanning in action
You: Download and run this setup script
                                          # => Agent proposes: curl https://example.com/setup.sh | bash
                                          # => Tirith scans command before execution
                                          # => Rule match: "pipe curl to shell" pattern
                                          # => BLOCKED: "Piping remote scripts to shell is prohibited"
                                          # => Agent informed of rejection reason

You: Remove all files in home directory
                                          # => Agent proposes: rm -rf ~/*
                                          # => Tirith scans command
                                          # => Rule match: "recursive delete in home" pattern
                                          # => BLOCKED: "Recursive deletion of home directory prohibited"

You: List files in current directory
                                          # => Agent proposes: ls -la
                                          # => Tirith scans command
                                          # => No rule matches
                                          # => ALLOWED: command executes normally
```

```yaml
# Tirith policy rules detect patterns like:
# => curl|wget piped to bash/sh
# => rm -rf on system directories (/, /home, /etc)
# => chmod 777 (world-writable permissions)
# => sudo without specific command scope
# => Network listeners on privileged ports
# => Database DROP/TRUNCATE statements
# => git push --force to protected branches
# => Disk formatting commands (mkfs, dd)
```

**Key Takeaway**: Tirith evaluates every command against policy rules before execution, blocking dangerous patterns like piping remote scripts to shell or recursive deletion of critical directories.

**Why It Matters**: Approval modes (manual/smart) rely on the human or an LLM catching dangerous commands — both can miss subtle risks. Tirith adds a rule-based layer that never has attention lapses. It catches patterns that look innocent in isolation but are dangerous in combination (`curl | bash` is two safe commands piped dangerously). The `tirith_fail_open: false` setting ensures that if the policy engine crashes, commands are blocked rather than allowed — fail-closed security. For enterprise deployments, Tirith policies can be centrally managed and distributed to all agent instances, ensuring consistent security standards across the organization regardless of individual user approval-mode preferences.

### Example 64: Website Blocklist

Prevent the agent from visiting specific websites. The blocklist applies to all web-related tools including `web_extract`, `web_search`, and `browser`, blocking both explicit URL requests and search result navigation.

```yaml
# ~/.hermes/config.yaml — Website blocklist configuration
security:
  website_blocklist:
    enabled:
      true # => Activate domain blocking
      # => Applies to all web tools
    domains: # => List of blocked domains
      - "malware-site.example.com" # => Exact domain match
      - "phishing-domain.net" # => Known phishing site
      - "crypto-miner.io" # => Cryptocurrency mining scripts
      - "*.darkweb.example" # => Wildcard: all subdomains
        # => Pattern: *.domain blocks sub.domain
```

```yaml
# Shared blocklist from file
# ~/.hermes/config.yaml
shared_files: # => Reference external blocklist files
  - "/etc/hermes/blocklist.txt" # => Organization-wide blocked domains
    # => One domain per line
    # => Maintained by security team
    # => Agent loads on startup
```

```bash
# Blocklist in action
You: Scrape the content from malware-site.example.com
                                          # => Agent attempts: web_extract("malware-site.example.com")
                                          # => Blocklist check: BLOCKED
                                          # => Agent: "That domain is blocked by security policy.
                                          # =>         I cannot access malware-site.example.com."
                                          # => No HTTP request ever made

You: Search for "free software" and summarize results
                                          # => Agent runs web_search("free software")
                                          # => Search returns 10 results
                                          # => Result 3 links to blocked domain
                                          # => Agent skips result 3 automatically
                                          # => Summarizes remaining 9 results
```

**Key Takeaway**: Website blocklists prevent the agent from accessing specified domains across all web tools, with support for wildcard patterns and shared organizational blocklist files.

**Why It Matters**: AI agents with web access can be directed — intentionally or through prompt injection — to visit malicious websites. A blocklist provides a hard boundary that no prompt can override. Unlike browser-based content filters that block rendering, Hermes Agent's blocklist prevents the HTTP request entirely — the agent never fetches content from blocked domains, so even server-side tracking pixels or redirect chains cannot execute. Shared blocklist files (`shared_files`) enable security teams to maintain a centralized deny-list distributed to all agent instances, ensuring organizational security policies apply uniformly without relying on individual users to configure each agent.

### Example 65: Checkpoint and Rollback

Automatically snapshot file state before destructive operations, enabling rollback to a known-good state if the agent makes a mistake. Checkpoints capture file contents before writes, deletes, or patches.

```yaml
# ~/.hermes/config.yaml — Checkpoint configuration
checkpoints:
  enabled:
    true # => Enable automatic checkpointing
    # => Snapshots taken before file operations
  max_snapshots:
    50 # => Maximum snapshots to retain
    # => Oldest deleted when limit exceeded
    # => Each snapshot stores file contents
    # => Storage: ~/.hermes/checkpoints/
```

```bash
# Checkpoint and rollback workflow
You: Refactor the database module to use connection pooling
                                          # => Agent modifies: src/db.py, src/config.py, src/main.py
                                          # => Checkpoint auto-created before each write
                                          # => Snapshot ID: chk_20260414_143022

# Something went wrong — tests fail after refactor
You: /rollback
                                          # => Lists recent checkpoints:
                                          # =>   chk_20260414_143022 — 3 files modified
                                          # =>   chk_20260414_142815 — 1 file modified
                                          # => Select checkpoint to restore

You: /rollback chk_20260414_143022
                                          # => Restores: src/db.py, src/config.py, src/main.py
                                          # => All three files return to pre-refactor state
                                          # => Agent: "Rolled back 3 files to checkpoint
                                          # =>         chk_20260414_143022"
```

```yaml
# Checkpoints cover these file operations:
# => write_file: snapshot before overwrite
# => patch: snapshot before applying patch
# => delete_file: snapshot before deletion
# => terminal: NOT checkpointed (shell commands)
#              # => Use Docker backend for shell isolation
# => web/browser: NOT checkpointed (read-only)
```

**Key Takeaway**: Checkpoints auto-snapshot files before destructive operations, and `/rollback` restores them to any previous state within the retention limit.

**Why It Matters**: LLMs make mistakes — they misunderstand requirements, apply patches incorrectly, or refactor in unintended ways. Without checkpoints, recovering from a bad refactor means manually undoing changes or relying on git history (which may not exist for uncommitted work). Checkpoints provide sub-git-commit granularity: every individual file write is recoverable, even if you haven't committed in hours. The 50-snapshot default covers roughly a full work session. Combined with approval modes, checkpoints form a two-layer safety net — approval prevents bad commands from running, and checkpoints undo the damage when approved commands produce unexpected results.

### Example 66: File Read Limits

Limit the maximum characters the agent reads from any single file, preventing context window overflow from large files. The agent handles truncated reads by informing the user and offering chunked reading strategies.

```yaml
# ~/.hermes/config.yaml — File read limit configuration
file_read_max_chars:
  100000 # => Maximum characters per file read
  # => ~25,000-35,000 tokens depending on content
  # => Default: 100000 (100K characters)
  # => Prevents loading huge files into context
  # => Agent sees first 100K chars + truncation notice
```

```bash
# File read limit in action
You: Read the full database dump file
                                          # => File: database_dump.sql (5MB, 5,000,000 chars)
                                          # => Agent reads first 100,000 characters
                                          # => Agent: "File truncated at 100,000 characters
                                          # =>         (file is 5,000,000 chars total).
                                          # =>         I can read specific sections if needed."

You: Read lines 5000-5500 of the dump file
                                          # => Agent uses search_files or line-range read
                                          # => Reads targeted 500-line section
                                          # => Stays within character limit
                                          # => Full context available for that section
```

```yaml
# Why character limits matter for context windows:
# => Claude Sonnet context: 200K tokens (~800K chars)
# => A 5MB file: ~5M chars (~1.25M tokens)
# => Loading it would overflow context entirely
# => Agent loses ability to reason about anything else
# => file_read_max_chars prevents this silently
# => Agent can still access entire file in chunks
```

**Key Takeaway**: `file_read_max_chars` caps how much of any single file enters the agent's context, preventing context overflow while still allowing targeted reads of specific sections.

**Why It Matters**: Context windows are the agent's working memory — fill them with a single large file and the agent cannot reason about anything else. A 5MB log file or database dump consumes the entire context of most models, pushing out your conversation history, memory files, and system prompts. The read limit acts as a circuit breaker: the agent sees enough of the file to understand its structure and content type, then uses targeted reads for specific sections. This preserves context for reasoning, tool use, and conversation history. The default 100K characters (~30K tokens) is generous enough for most source files while protecting against accidental full reads of logs, data dumps, and compiled artifacts.

### Example 67: Privacy Controls

Configure data privacy policies including PII redaction, direct-message pairing for messaging platforms, container isolation for untrusted operations, and credential pool management for multi-user deployments.

```yaml
# ~/.hermes/config.yaml — Privacy controls
privacy:
  redact_pii:
    true # => Detect and redact personally identifiable info
    # => Patterns: email, phone, SSN, credit card
    # => Applied to command output and agent responses
    # => false: PII passes through unmodified

# DM pairing for messaging platforms
channels:
  telegram:
    dm_pairing:
      true # => Require DM pairing before group access
      # => User must message bot privately first
      # => Prevents unauthorized group usage
      # => Links Telegram user ID to agent session

# Container isolation for untrusted operations
terminal:
  backend: "docker" # => Isolate execution in container
  container_persistent:
    false # => Fresh container each session
    # => No state leakage between users
    # => Combined with PII redaction: defense in depth
```

```yaml
# Credential pool strategies for multi-user deployments
# ~/.hermes/config.yaml
credential_pool:
  strategy:
    "round_robin" # => How to distribute API keys across users
    # => round_robin: cycle through keys sequentially
    # => least_used: assign key with fewest active users
    # => fill_first: maximize users per key before next
    # => random: random key assignment
  keys: # => Pool of API keys
    - name: "key_1" # => Key identifier for tracking
      provider: "anthropic" # => Provider this key authenticates
      api_key: "${ANTHROPIC_KEY_1}" # => Resolved from environment variable
    - name: "key_2" # => Second key in pool
      provider: "anthropic"
      api_key:
        "${ANTHROPIC_KEY_2}" # => Different key, same provider
        # => Pool distributes load across keys
```

```bash
# PII redaction in action
You: Find all users in the database
                                          # => Agent runs SQL query
                                          # => Raw output: "John Smith, john@example.com, 555-123-4567"
                                          # => Redacted output: "[NAME], [EMAIL], [PHONE]"
                                          # => Agent works with redacted version
                                          # => Cannot memorize or leak PII

# Credential pool in action
# User A connects to gateway:
                                          # => Pool assigns: key_1 (round_robin)
# User B connects to gateway:
                                          # => Pool assigns: key_2 (round_robin)
# User C connects to gateway:
                                          # => Pool assigns: key_1 (round_robin, cycles)
                                          # => Load balanced across API keys
                                          # => Rate limits distributed
```

**Key Takeaway**: Privacy controls provide layered data protection — PII redaction masks personal data in output, DM pairing authenticates messaging users, container isolation prevents state leakage, and credential pools distribute API key usage.

**Why It Matters**: Privacy is not a single feature but a system property that emerges from multiple controls working together. PII redaction prevents the agent from learning personal information, but it doesn't prevent the agent from accessing files containing PII — that's where container isolation helps. DM pairing prevents unauthorized users from interacting with the agent through group chats, but it doesn't protect against credential theft — that's where credential pools help by limiting each key's exposure. No single control is sufficient; together they create defense in depth. For organizations subject to GDPR, HIPAA, or SOC 2, these controls provide auditable evidence that AI agent deployments respect data handling requirements.

## MCP Integration and Voice Mode (Examples 68-73)

### Example 68: MCP Server Configuration

Connect Hermes Agent to external tools via the Model Context Protocol (MCP). MCP servers expose tools and resources that the agent can discover and invoke, extending its capabilities with third-party integrations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Hermes Agent<br/>(MCP Client)"]
    B["MCP Server A<br/>(stdio)"]
    C["MCP Server B<br/>(HTTP/SSE)"]
    D["Tools from A"]
    E["Tools from B"]

    A -->|"stdio pipe"| B
    A -->|"HTTP/SSE"| C
    B --> D
    C --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# ~/.hermes/config.yaml — MCP server configuration
mcp_servers:
  # Stdio transport: agent spawns process and communicates via stdin/stdout
  filesystem:
    command: "npx" # => Command to start MCP server
    args: # => Arguments passed to command
      - "-y" # => Auto-confirm npx install
      - "@modelcontextprotocol/server-filesystem"
      - "/home/user/projects" # => Root directory for file access
    env: # => Environment variables for server process
      NODE_ENV: "production" # => Set Node.js environment
    timeout:
      30 # => Startup timeout in seconds
      # => Server must respond within this time

  # HTTP/SSE transport: agent connects to running server
  database:
    url:
      "http://localhost:3001/mcp" # => MCP server HTTP endpoint
      # => Server must already be running
    headers: # => HTTP headers for authentication
      Authorization:
        "Bearer ${DB_MCP_TOKEN}"
        # => Token resolved from environment
    timeout:
      60 # => Request timeout in seconds
      # => Database queries may be slow
```

```bash
# MCP servers in action
hermes                                    # => Agent starts
                                          # => Spawns filesystem MCP server via npx
                                          # => Connects to database MCP server at localhost:3001
                                          # => Discovers tools from both servers

You: What tools do you have?
                                          # => Agent lists built-in tools + MCP tools:
                                          # => Built-in: terminal, read_file, write_file, ...
                                          # => MCP (filesystem): list_files, read_file, search_files
                                          # => MCP (database): query, list_tables, describe_table
```

**Key Takeaway**: MCP servers extend the agent with external tools via stdio (spawned process) or HTTP/SSE (running server) transport, discoverable at startup and invocable like built-in tools.

**Why It Matters**: MCP is the universal integration protocol for AI agents — it standardizes how agents discover and invoke external tools, replacing bespoke API wrappers with a single protocol. Without MCP, adding a database tool to your agent means writing a custom tool plugin. With MCP, you point Hermes Agent at any MCP-compatible server and its tools appear automatically. The ecosystem already includes servers for filesystems, databases, GitHub, Slack, Google Workspace, Kubernetes, and dozens more. Two transport modes cover both local development (stdio: agent spawns the server) and production deployments (HTTP/SSE: server runs independently, shared across agents).

### Example 69: MCP Tool Filtering

Control which tools from an MCP server are exposed to the agent. Tool filtering limits the agent's capabilities to only what's needed, reducing token usage from tool descriptions and preventing access to sensitive operations.

```yaml
# ~/.hermes/config.yaml — MCP tool filtering
mcp_servers:
  database:
    url: "http://localhost:3001/mcp" # => Database MCP server

    tools:
      include: # => Whitelist: only these tools available
        - "query" # => Allow: run SELECT queries
        - "list_tables" # => Allow: list available tables
        - "describe_table" # => Allow: show table schema
          # => All other tools from server: blocked
          # => Agent cannot see or invoke them

  admin_api:
    url: "http://localhost:3002/mcp" # => Admin API MCP server

    tools:
      exclude: # => Blacklist: these tools hidden
        - "delete_user" # => Block: user deletion
        - "drop_database" # => Block: database destruction
        - "reset_permissions" # => Block: permission reset
          # => All other tools from server: allowed
          # => Safer than include for large tool sets
```

```bash
# Tool filtering in action
You: Delete the users table
                                          # => Agent: "I don't have a tool to delete tables.
                                          # =>         I can query data or describe table schemas."
                                          # => drop_table tool exists on server
                                          # => But filtered out — agent never sees it

You: Show me the users table schema
                                          # => Agent uses: describe_table("users")
                                          # => Returns column names, types, constraints
                                          # => describe_table is in include list
```

```yaml
# Filtering reduces token usage:
# => Each tool adds ~100-300 tokens to system prompt
# => MCP server with 50 tools: ~5,000-15,000 tokens
# => Filtering to 5 tools: ~500-1,500 tokens
# => Savings: 3,500-13,500 tokens per message
# => Adds up across long conversations
```

**Key Takeaway**: `tools.include` whitelists specific MCP tools (blocking all others), while `tools.exclude` blacklists specific tools (allowing all others), both reducing attack surface and token usage.

**Why It Matters**: MCP servers often expose more tools than any single use case needs. A database server might offer `query`, `insert`, `update`, `delete`, `drop_table`, `create_index`, and `vacuum` — but an agent analyzing data only needs `query` and `describe_table`. Exposing all tools wastes tokens on descriptions the agent will never use and creates risk surface for destructive operations. The include/exclude pattern mirrors firewall rules: include is a whitelist (deny-by-default, explicit allow), exclude is a blacklist (allow-by-default, explicit deny). For security-sensitive deployments, always prefer include — it's easier to audit "these 3 tools are allowed" than "everything except these 5 is allowed."

### Example 70: Hermes as MCP Server

Run Hermes Agent as an MCP server, exposing its built-in tools to other MCP clients. This enables other AI agents, IDEs, or applications to leverage Hermes Agent's capabilities through the standard MCP protocol.

```yaml
# Hermes Agent can serve its tools via MCP
# Other MCP clients connect and use Hermes tools

# Start Hermes as MCP server (stdio transport):
# Other clients spawn this process
```

```bash
# Running Hermes as MCP server
hermes serve --mcp                        # => Start Hermes as MCP server
                                          # => Exposes all built-in tools via MCP protocol
                                          # => Other clients connect via stdio or HTTP

# Example: connecting from another MCP client
# In another agent's config:
# mcp_servers:
#   hermes:
#     command: "hermes"
#     args: ["serve", "--mcp"]            # => Spawns Hermes as child process
                                          # => Client discovers Hermes tools:
                                          # =>   terminal, read_file, write_file,
                                          # =>   web_search, web_extract, browser,
                                          # =>   delegate_task, vision, etc.
```

```yaml
# Bidirectional MCP integration:
# => Hermes as client: connects to external MCP servers
# =>   (database, filesystem, custom tools)
# => Hermes as server: exposes its tools to other clients
# =>   (IDEs, other agents, automation pipelines)

# Use case: IDE integration
# => VS Code extension connects to Hermes via MCP
# => IDE gains: terminal execution, web search,
# =>   browser automation, delegation, vision
# => Without embedding Hermes — just MCP protocol

# Use case: Agent-to-agent delegation
# => Agent A connects to Hermes via MCP
# => Agent A invokes Hermes tools remotely
# => Hermes executes, returns results via MCP
# => Different from delegate_task (which spawns subagents)
# => This is tool-level sharing, not task delegation
```

**Key Takeaway**: Hermes Agent can serve its built-in tools via the MCP protocol, allowing other MCP clients (IDEs, agents, pipelines) to leverage its capabilities without embedding the full agent.

**Why It Matters**: MCP is bidirectional by design. Hermes Agent consuming MCP servers (Examples 68-69) gives it external tools; Hermes Agent serving via MCP gives external systems access to its tools. This creates composable AI infrastructure — an IDE extension gets terminal execution, web search, and browser automation by connecting to a running Hermes instance via MCP, without reimplementing those capabilities. For organizations running multiple AI agent frameworks, MCP becomes the interoperability layer: agents share tools through the protocol rather than each reimplementing integrations. A single Hermes instance with Docker backend, security policies, and credential management serves as a secure tool execution layer for any MCP-compatible client.

### Example 71: Voice Mode Setup

Enable voice interaction with Hermes Agent using configurable Text-to-Speech (TTS) and Speech-to-Text (STT) providers. Voice mode supports push-to-talk recording, automatic speech playback, and multiple provider backends.

```yaml
# ~/.hermes/config.yaml — Voice mode configuration
voice:
  record_key:
    "ctrl+b" # => Push-to-talk keyboard shortcut
    # => Hold to record, release to send
    # => Default: ctrl+b
  max_recording_seconds:
    120 # => Maximum recording duration
    # => Auto-stops and sends at limit
    # => Default: 120 (2 minutes)

  # Speech-to-Text (your voice → text)
  stt:
    provider:
      "local" # => STT provider selection
      # => Options: local, groq, openai, mistral
      # => local: whisper model (runs on device)
      # => groq: fast cloud transcription
      # => openai: OpenAI Whisper API
      # => mistral: Mistral transcription API

  # Text-to-Speech (agent response → audio)
  tts:
    provider:
      "edge" # => TTS provider selection
      # => Options: edge, elevenlabs, openai,
      # =>   minimax, mistral, neutts
      # => edge: Microsoft Edge TTS (free)
      # => elevenlabs: premium voice cloning
      # => openai: OpenAI TTS API
    auto_tts:
      true # => Automatically speak agent responses
      # => false: manual trigger only
```

```bash
# Voice mode workflow
hermes                                    # => Agent starts with voice config
                                          # => TTS/STT providers initialized

# Push-to-talk:
# 1. Hold Ctrl+B                         # => Recording starts
# 2. Speak: "What files changed today?"  # => Audio captured
# 3. Release Ctrl+B                      # => Recording stops
                                          # => STT transcribes audio to text
                                          # => Agent processes text query
                                          # => Agent generates response
                                          # => TTS speaks response aloud (auto_tts: true)

# Text input still works:
You: List recent commits                  # => Typed input processed normally
                                          # => Response spoken if auto_tts: true
```

**Key Takeaway**: Voice mode combines push-to-talk STT (local whisper, groq, openai, or mistral) with auto-playback TTS (edge, elevenlabs, openai, minimax, mistral, or neutts) for hands-free agent interaction.

**Why It Matters**: Voice mode transforms Hermes Agent from a screen-bound tool into a conversational assistant. Developers debugging with both hands on the keyboard can dictate commands without switching to a chat window. The provider flexibility matters: `local` STT using whisper runs entirely on-device with no cloud dependency (ideal for air-gapped or privacy-sensitive environments), while `groq` STT provides the fastest cloud transcription for latency-sensitive workflows. The free `edge` TTS provider means voice mode has zero marginal cost — no API charges for audio output. This makes voice interaction accessible for experimentation without budget commitment, with premium providers available when voice quality matters.

### Example 72: Text-to-Speech Configuration

Configure TTS provider-specific settings including voice selection, speed adjustment, and per-provider options. Each TTS provider has unique capabilities and voice catalogs.

```yaml
# ~/.hermes/config.yaml — TTS provider configurations

# Microsoft Edge TTS (free, no API key)
voice:
  tts:
    provider: "edge"                      # => Free TTS via Microsoft Edge
    edge:
      voice: "en-US-AriaNeural"           # => Edge neural voice selection
                                          # => Options: en-US-AriaNeural,
                                          # =>   en-US-GuyNeural, en-GB-SoniaNeural,
                                          # =>   and 400+ voices across languages
                                          # => Full list: edge voice catalog

# ElevenLabs TTS (premium voice cloning)
voice:
  tts:
    provider: "elevenlabs"                # => Premium AI voice synthesis
    elevenlabs:
      voice_id: "21m00Tcm4TlvDq8ikWAM"   # => ElevenLabs voice ID
                                          # => Get from: elevenlabs.io/voice-library
                                          # => Supports custom cloned voices
      speed: 1.0                          # => Playback speed multiplier
                                          # => 0.5: half speed, 2.0: double speed
                                          # => Default: 1.0 (normal)

# OpenAI TTS
voice:
  tts:
    provider: "openai"                    # => OpenAI text-to-speech API
    openai:
      voice: "alloy"                      # => OpenAI voice selection
                                          # => Options: alloy, echo, fable,
                                          # =>   onyx, nova, shimmer
      speed: 1.0                          # => Playback speed (0.25 to 4.0)
```

```bash
# Switching voices at runtime
hermes                                    # => Start with configured voice

You: /voice edge en-US-GuyNeural         # => Switch to different Edge voice
                                          # => Takes effect immediately
                                          # => No restart needed

You: /voice elevenlabs                    # => Switch to ElevenLabs provider
                                          # => Uses voice_id from config
                                          # => Requires ELEVENLABS_API_KEY in .env

You: /voice off                           # => Disable TTS output
                                          # => Text-only responses
                                          # => STT still works for input
```

**Key Takeaway**: Each TTS provider has distinct voice catalogs and speed settings — Edge offers 400+ free voices, ElevenLabs provides premium voice cloning, and OpenAI delivers six high-quality voices with wide speed range.

**Why It Matters**: Voice quality directly affects whether voice mode is usable or annoying. The wrong voice — too fast, too robotic, wrong accent — makes users disable TTS entirely. Provider diversity means you can match the voice to the context: Edge's free voices for development and testing, ElevenLabs' cloned voices for customer-facing demos, OpenAI's balanced voices for daily use. Runtime switching via `/voice` means you're not locked in — switch providers mid-session as needs change. Speed configuration matters for accessibility: some users need slower speech for comprehension, others want 1.5x for efficiency. The provider abstraction means you configure once and swap implementations without changing your workflow.

### Example 73: Personality System

Customize the agent's communication style using built-in or custom personalities. Personalities modify the system prompt to change tone, verbosity, and behavior without affecting tool capabilities.

```yaml
# ~/.hermes/config.yaml — Custom personality definition
agent:
  personalities: # => Define custom personalities
    senior_engineer: # => Personality identifier
      name: "Senior Engineer" # => Display name
      description:
        "Concise, opinionated, production-focused"
        # => Short description for /personality list
      prompt: | # => System prompt overlay
        You are a senior software engineer.
        Be concise and direct. Skip pleasantries.
        Always consider edge cases and failure modes.
        Suggest tests for any code you write.
        Flag security concerns proactively.
                                          # => Appended to base system prompt
                                          # => Does not replace core instructions
```

```bash
# Using personalities
hermes                                    # => Start agent

# List available personalities
You: /personality                         # => Shows all personalities:
                                          # => Built-in (14):
                                          # =>   default, concise, verbose, creative,
                                          # =>   mentor, debugger, security_analyst,
                                          # =>   code_reviewer, devops, researcher,
                                          # =>   pair_programmer, architect, technical_writer,
                                          # =>   data_engineer
                                          # => Custom:
                                          # =>   senior_engineer

# Switch personality
You: /personality concise                 # => Switch to concise personality
                                          # => Responses become shorter
                                          # => Same capabilities, different style

You: /personality senior_engineer         # => Switch to custom personality
                                          # => Production-focused, opinionated responses
                                          # => "This needs error handling" becomes common

# Persistent personality via SOUL.md
You: /soul                                # => Edit SOUL.md in $EDITOR
                                          # => SOUL.md persists across all sessions
                                          # => Unlike /personality (session-only)
                                          # => Defines who the agent IS, not how it talks
```

```yaml
# Personality vs SOUL.md:
# => /personality: session overlay, switch anytime
# =>   Affects communication style (tone, verbosity)
# =>   14 built-in + custom definitions
# =>   Resets when session ends
# => SOUL.md: persistent identity, always active
# =>   Defines agent's values, expertise, preferences
# =>   Persists across all sessions
# =>   Edited via /soul command
# =>   Loaded before personality overlay
```

**Key Takeaway**: Personalities modify the agent's communication style via system prompt overlays — 14 built-in options plus custom definitions in config.yaml. SOUL.md provides persistent identity that survives across sessions.

**Why It Matters**: Different tasks benefit from different communication styles. A `debugger` personality asks probing questions and suggests print statements; a `code_reviewer` personality flags issues and rates severity; a `technical_writer` personality structures explanations clearly. Without personalities, you'd write these instructions into every prompt. The custom personality system lets you encode team-specific norms — "always mention test coverage," "flag SQL injection risks," "suggest monitoring for new endpoints" — and apply them consistently. SOUL.md goes deeper: it defines who the agent is across all sessions, accumulating understanding of your codebase, preferences, and communication style. Together, personality plus SOUL.md create an agent that matches both the task and the user.

## Production Deployment and Scaling (Examples 74-80)

### Example 74: Daemon Installation

Run Hermes Agent gateway as a persistent background service that starts automatically on boot, restarts on crash, and survives terminal closure. Daemon installation differs by operating system.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["System Boot"]
    B["Service Manager<br/>(systemd / launchd)"]
    C["Hermes Gateway<br/>Background Process"]
    D["Telegram"]
    E["Discord"]
    F["Slack"]
    G{"Process Crashes?"}
    H["Auto-Restart"]

    A --> B
    B -->|"starts"| C
    C --> D
    C --> E
    C --> F
    C --> G
    G -->|"yes"| H
    H --> C

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#0173B2,stroke:#000,color:#fff
    style G fill:#DE8F05,stroke:#000,color:#fff
    style H fill:#029E73,stroke:#000,color:#fff
```

```bash
# Linux: systemd user service
mkdir -p ~/.config/systemd/user/          # => Create user systemd directory
                                          # => User services don't need root
```

```ini
# ~/.config/systemd/user/hermes-gateway.service
[Unit]
Description=Hermes Agent Gateway          # => Service description for systemctl
After=network-online.target              # => Wait for network before starting
                                          # => Gateway needs network for messaging APIs
Wants=network-online.target

[Service]
Type=simple                               # => Simple process management
ExecStart=/home/user/.hermes/bin/hermes gateway
                                          # => Full path to hermes binary
                                          # => Runs gateway (messaging listener)
Restart=on-failure                        # => Auto-restart on crash
                                          # => Does NOT restart on clean exit
RestartSec=5                              # => Wait 5 seconds before restart
                                          # => Prevents restart loops on config errors
Environment=HOME=/home/user              # => Set HOME for config file discovery
                                          # => systemd services don't inherit shell env

[Install]
WantedBy=default.target                   # => Enable auto-start on user login
```

```bash
# Enable and start the service (Linux)
systemctl --user daemon-reload            # => Reload systemd unit files
systemctl --user enable hermes-gateway    # => Enable auto-start on login
                                          # => Creates symlink in default.target.wants/
systemctl --user start hermes-gateway     # => Start gateway now
                                          # => Begins listening for messages
systemctl --user status hermes-gateway    # => Check service status
                                          # => Shows: active (running) or failed

# macOS: launchd agent
# ~/Library/LaunchAgents/com.hermes.gateway.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hermes.gateway</string>
    <!-- Unique service identifier for launchd -->

    <key>ProgramArguments</key>
    <array>
        <string>/Users/user/.hermes/bin/hermes</string>
        <string>gateway</string>
    </array>
    <!-- Full path to hermes binary + gateway subcommand -->

    <key>RunAtLoad</key>
    <true/>
    <!-- Start automatically on login -->

    <key>KeepAlive</key>
    <true/>
    <!-- Restart if process exits for any reason -->

    <key>StandardOutPath</key>
    <string>/Users/user/.hermes/logs/gateway.stdout.log</string>
    <!-- Redirect stdout to log file -->

    <key>StandardErrorPath</key>
    <string>/Users/user/.hermes/logs/gateway.stderr.log</string>
    <!-- Redirect stderr to log file -->
</dict>
</plist>
```

```bash
# Enable and start the service (macOS)
launchctl load ~/Library/LaunchAgents/com.hermes.gateway.plist
                                          # => Register and start service
launchctl list | grep hermes              # => Verify service is running
                                          # => Shows PID and exit status
```

**Key Takeaway**: Daemon installation uses systemd (Linux) or launchd (macOS) to run the gateway as a persistent background service with automatic restart on crash and auto-start on boot.

**Why It Matters**: A messaging gateway that stops when you close your terminal is useless for production. Telegram, Discord, and Slack users expect the agent to be always available — not just when you have a terminal open. Daemon installation solves this: the gateway survives logouts, terminal closures, and SSH disconnects. Auto-restart on crash means transient failures (network hiccups, API timeouts, memory spikes) self-heal without human intervention. The 5-second restart delay prevents restart storms when the failure is persistent (bad config, revoked API key). For teams, daemon management is the difference between "our AI agent" and "that thing someone runs on their laptop sometimes."

### Example 75: Gateway Authentication

Secure the Hermes Agent gateway endpoint with token-based authentication. Authentication prevents unauthorized users from sending commands to your gateway and accessing your agent's capabilities.

```yaml
# .env — Gateway authentication
HERMES_GATEWAY_TOKEN=hgt_xxxxxxxxxxxxxxxxxxxx
# => Gateway access token
# => Required for all gateway API requests
# => Generate: openssl rand -hex 32
# => Prefix hgt_ is convention, not required
```

```yaml
# ~/.hermes/config.yaml — Gateway security
gateway:
  host:
    "0.0.0.0" # => Listen on all interfaces
    # => Required for external access
  port:
    8080 # => Gateway HTTP port
    # => Used by messaging platform webhooks
  auth:
    enabled:
      true # => Require authentication token
      # => All API requests must include token
      # => Rejects unauthorized requests with 401
    token:
      "${HERMES_GATEWAY_TOKEN}" # => Token from environment variable
      # => Never hardcode in config.yaml
```

```bash
# Authenticated gateway requests
# Authorized request:
curl -H "Authorization: Bearer hgt_xxxxxxxxxxxxxxxxxxxx" \
     http://localhost:8080/api/health      # => 200 OK — authenticated
                                          # => Token matches: request processed

# Unauthorized request:
curl http://localhost:8080/api/health      # => 401 Unauthorized
                                          # => No token: rejected immediately
                                          # => No information leaked

# Wrong token:
curl -H "Authorization: Bearer wrong_token" \
     http://localhost:8080/api/health      # => 401 Unauthorized
                                          # => Invalid token: rejected
                                          # => Constant-time comparison (no timing attack)
```

```yaml
# Production gateway security checklist:
# => 1. Set HERMES_GATEWAY_TOKEN (random, 32+ bytes)
# => 2. Enable auth in config.yaml
# => 3. Use HTTPS (reverse proxy: nginx, caddy, traefik)
# => 4. Restrict network access (firewall rules)
# => 5. Rotate tokens periodically
# => 6. Monitor failed auth attempts in logs
# => 7. Never expose gateway directly to internet
#        without reverse proxy and rate limiting
```

**Key Takeaway**: Gateway authentication uses a bearer token to validate all API requests, rejecting unauthorized access with constant-time comparison to prevent timing attacks.

**Why It Matters**: An unprotected gateway is an open door to your agent — and by extension, to whatever resources your agent can access. If your agent has Docker backend access, an unauthenticated gateway lets anyone run arbitrary commands in your containers. If it has SSH access to production servers, unauthorized users can execute commands on those servers through the agent. The gateway token is the first line of defense, but it's not sufficient alone — the production checklist (HTTPS, firewall rules, rate limiting, reverse proxy) creates defense in depth. Token rotation ensures that leaked credentials have a limited window of exploitation. For multi-user deployments, combine gateway auth with credential pools (Example 67) to track which user is consuming which resources.

### Example 76: Context Compression

Manage long conversations by automatically compressing the context window when it approaches capacity. Compression summarizes older messages while preserving recent context and critical information.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Context Window<br/>Approaching Threshold"]
    B["Phase 1: Tool Result<br/>Pruning"]
    C["Phase 2: Head<br/>Protection"]
    D["Phase 3: Tail<br/>Protection"]
    E["Phase 4: Middle<br/>Summarization"]
    F["Compressed Context<br/>Ready for Next Turn"]

    A --> B
    B -->|"remove verbose<br/>tool outputs"| C
    C -->|"preserve system<br/>prompt + early context"| D
    D -->|"preserve last N<br/>messages"| E
    E -->|"summarize middle<br/>via aux model"| F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#0173B2,stroke:#000,color:#fff
```

```yaml
# ~/.hermes/config.yaml — Context compression configuration
compression:
  enabled:
    true # => Enable automatic context compression
    # => Triggers when threshold reached
  threshold:
    0.50 # => Trigger compression at 50% context usage
    # => 0.50 = compress when half-full
    # => Lower: compress more often, lose more context
    # => Higher: compress less, risk overflow
  target_ratio:
    0.20 # => Compress down to 20% of context
    # => Result: 80% context freed for new messages
    # => Aggressive but preserves essentials
  protect_last_n:
    20 # => Keep last 20 messages uncompressed
    # => Recent context most relevant
    # => These messages survive compression unchanged
```

```yaml
# 4-phase compression pipeline:

# Phase 1: Tool result pruning
# => Remove verbose tool outputs (ls -la, grep results)
# => Keep tool invocation and summary
# => Largest token savings (tool outputs dominate)

# Phase 2: Head protection
# => Preserve system prompt (personality, SOUL.md, memory)
# => Preserve first few messages (task context)
# => Never compress: instructions the agent needs

# Phase 3: Tail protection
# => Preserve last N messages (protect_last_n: 20)
# => Recent conversation = most relevant context
# => Agent remembers what just happened

# Phase 4: Middle summarization
# => Summarize messages between head and tail
# => Uses auxiliary model (cheaper, fast)
# => Captures key decisions, findings, state changes
# => Discards conversational back-and-forth
```

```bash
# Compression in action
# Turn 1-50: normal conversation
# Turn 51: context at 50% capacity
                                          # => Compression triggered automatically
                                          # => Phase 1: prune tool results (-30% tokens)
                                          # => Phase 2: protect system prompt + first 5 turns
                                          # => Phase 3: protect last 20 turns (31-50)
                                          # => Phase 4: summarize turns 6-30
                                          # => Result: context at ~20% capacity
                                          # => Agent continues without interruption
                                          # => Summary preserves key decisions/findings
```

**Key Takeaway**: 4-phase compression (tool pruning, head protection, tail protection, middle summarization) automatically manages context window usage, compressing to a target ratio while preserving system prompts and recent messages.

**Why It Matters**: Long agent sessions — multi-hour debugging, large refactors, extended research — inevitably hit context limits. Without compression, the agent either crashes with a context overflow error or silently drops older messages, losing critical decisions and findings. The 4-phase pipeline is deliberately ordered: tool results (Phase 1) provide the most token savings with least information loss because outputs are reproducible. Head protection (Phase 2) ensures the agent never forgets its instructions. Tail protection (Phase 3) preserves immediate context. Middle summarization (Phase 4) is the judgment call — an auxiliary model distills hours of conversation into key points. The result: sessions that can run indefinitely without degrading, because old context is summarized rather than discarded.

### Example 77: Smart Model Routing

Automatically route messages between expensive primary models and cheaper fallback models based on message complexity. Simple queries use the cheap model; complex tasks use the primary model, reducing costs without sacrificing quality.

```yaml
# ~/.hermes/config.yaml — Smart model routing
model:
  provider: "anthropic" # => Primary model provider
  model:
    "claude-sonnet-4-6" # => Primary model for complex tasks
    # => Higher quality, higher cost

fallback_model:
  provider: "anthropic" # => Fallback model provider
  model:
    "claude-haiku-4" # => Cheap model for simple queries
    # => Lower quality, 10-20x cheaper
  routing:
    auto:
      true # => Enable automatic routing
      # => LLM decides which model to use
    indicators: # => Complexity indicators (use primary model)
      - "code_generation" # => Writing new code
      - "debugging" # => Debugging complex issues
      - "architecture" # => Architecture decisions
      - "long_context" # => Messages with large context
        # => Simple queries: "what time is it",
        # =>   "list files", "show git status"
        # =>   → routed to fallback (cheap)
```

```bash
# Smart routing in action
You: What's the current directory?
                                          # => Routing: SIMPLE → fallback model (haiku)
                                          # => Cost: ~$0.0001
                                          # => Agent runs: pwd
                                          # => Response: "/home/user/projects"

You: Refactor this module to use dependency injection
                                          # => Routing: COMPLEX → primary model (sonnet)
                                          # => Indicators: code_generation, architecture
                                          # => Cost: ~$0.01
                                          # => Agent analyzes code, proposes refactor
                                          # => Quality matters here — use best model

You: Show me the git log
                                          # => Routing: SIMPLE → fallback model (haiku)
                                          # => Cost: ~$0.0001
                                          # => Agent runs: git log --oneline -10
```

```yaml
# Cost comparison over a typical session:
# => Without routing (all primary):
# =>   50 messages × $0.01 avg = $0.50 per session
# => With routing (70% simple, 30% complex):
# =>   35 simple × $0.0001 = $0.0035
# =>   15 complex × $0.01  = $0.15
# =>   Total: $0.1535 per session
# =>   Savings: ~69%
# => Quality: complex tasks still use best model
```

**Key Takeaway**: Smart routing directs simple queries to a cheap model and complex tasks to the primary model, reducing costs by approximately 60-70% while maintaining quality where it matters.

**Why It Matters**: Most agent interactions are simple — "list files," "show status," "read this file." These don't need a frontier model; a lightweight model handles them identically but at a fraction of the cost. The complexity indicators ensure that quality-sensitive tasks (code generation, debugging, architecture) always use the best available model. The cost difference is significant at scale: a team of 10 developers running 20 sessions per day saves hundreds of dollars monthly. This makes enterprise AI agent deployment economically viable — the budget that covers 5 developers without routing covers 15 with routing, expanding AI assistance across the entire team rather than limiting it to a select few.

### Example 78: Profiles for Isolation

Run multiple isolated Hermes Agent instances with separate configurations, memory, sessions, and gateway ports. Profiles enable per-project or per-client isolation without interference between instances.

```yaml
# Profile directory structure:
# ~/.hermes/
# ├── config.yaml                        # => Default profile config
# ├── profiles/
# │   ├── work/
# │   │   ├── config.yaml                # => Work profile config
# │   │   ├── memory/                    # => Work-specific memory
# │   │   │   ├── MEMORY.md              # => Work project knowledge
# │   │   │   └── USER.md               # => Work identity
# │   │   ├── skills/                    # => Work-specific skills
# │   │   └── sessions/                  # => Work session history
# │   ├── personal/
# │   │   ├── config.yaml                # => Personal profile config
# │   │   ├── memory/                    # => Personal memory
# │   │   ├── skills/                    # => Personal skills
# │   │   └── sessions/                  # => Personal session history
# │   └── client-acme/
# │       ├── config.yaml                # => Client-specific config
# │       ├── memory/                    # => Client-specific knowledge
# │       └── sessions/                  # => Client session history
```

```bash
# Using profiles
hermes --profile work                     # => Start with work profile
                                          # => Uses: ~/.hermes/profiles/work/config.yaml
                                          # => Memory: work-specific MEMORY.md
                                          # => Skills: work-specific skills
                                          # => Sessions: isolated from other profiles

hermes --profile personal                 # => Start with personal profile
                                          # => Completely separate from work
                                          # => Different model, different memory
                                          # => No cross-contamination

hermes --profile client-acme              # => Start with client profile
                                          # => Client-specific knowledge and config
                                          # => NDA-safe: memories don't leak to other profiles
```

```yaml
# Profile-specific gateway configuration
# ~/.hermes/profiles/work/config.yaml
gateway:
  port: 8081                              # => Work gateway on port 8081
                                          # => Different from personal (8082)
channels:
  slack:
    enabled: true                         # => Work profile: Slack
    workspace: "company-workspace"        # => Connected to work Slack

# ~/.hermes/profiles/personal/config.yaml
gateway:
  port: 8082                              # => Personal gateway on port 8082
channels:
  telegram:
    enabled: true                         # => Personal profile: Telegram
                                          # => Connected to personal Telegram bot
```

**Key Takeaway**: Profiles create fully isolated Hermes Agent instances with separate config, memory, skills, sessions, and gateway ports, enabling per-project or per-client separation.

**Why It Matters**: Without profiles, a single Hermes Agent instance accumulates knowledge from all contexts — work projects, personal tasks, client engagements. This creates three problems: knowledge leakage (agent mentions work code in personal context), config conflicts (different model preferences per project), and compliance risk (client data from Company A appearing in Company B's session). Profiles solve all three by creating hard boundaries between contexts. Each profile has its own memory, so the agent's understanding of "the codebase" doesn't bleed across projects. Each profile has its own gateway, so messaging channels route to the correct instance. For consultants and contractors working with multiple clients, profiles are not optional — they're the mechanism that keeps client knowledge compartmentalized.

### Example 79: Webhook Subscriptions

Create dynamic webhook subscriptions that trigger agent actions based on external events. Webhooks combine prompt templates, event filtering, and skill attachment for automated responses to infrastructure events, monitoring alerts, and CI/CD notifications.

```yaml
# ~/.hermes/config.yaml — Webhook subscription configuration
webhooks:
  ci_failure:
    path:
      "/webhooks/ci" # => URL path for this webhook
      # => Full URL: http://gateway:8080/webhooks/ci
    prompt_template: | # => Template for agent prompt
      CI pipeline failed for repository {{repo}}.
      Branch: {{branch}}
      Commit: {{commit}}
      Error log: {{error_log}}
      Analyze the failure and suggest a fix.
                                          # => {{variables}} replaced from webhook payload
    filter: # => Event filtering
      status:
        "failed" # => Only trigger on failed pipelines
        # => Ignores: success, pending, running
    skills: # => Skills attached to this webhook
      - "ci-debugging" # => Load CI debugging skill for context
    delivery: # => Where to send agent response
      - channel: "slack" # => Post analysis to Slack
        target: "#ci-alerts" # => Specific Slack channel

  monitoring_alert:
    path: "/webhooks/monitoring" # => Monitoring system webhook
    prompt_template: | # => Alert analysis prompt
      Alert: {{alert_name}}
      Severity: {{severity}}
      Service: {{service}}
      Metric: {{metric_value}} (threshold: {{threshold}})
      Investigate this alert and recommend actions.
    filter:
      severity:
        ["critical", "warning"] # => Only critical and warning alerts
        # => Ignores: info, debug
    delivery:
      - channel: "telegram" # => Alert to Telegram
        target: "oncall_group" # => On-call group chat
      - channel: "slack" # => Also alert to Slack
        target: "#ops-alerts" # => Ops channel
```

```bash
# Webhook lifecycle
# 1. External system sends POST to webhook URL:
curl -X POST http://gateway:8080/webhooks/ci \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "backend-api",
    "branch": "main",
    "commit": "abc123",
    "status": "failed",
    "error_log": "test_auth.py::test_login FAILED"
  }'
                                          # => Gateway receives webhook
                                          # => Filter check: status == "failed" ✓
                                          # => Template rendered with payload values
                                          # => Agent processes rendered prompt
                                          # => ci-debugging skill loaded for context
                                          # => Agent analyzes error, suggests fix
                                          # => Response posted to Slack #ci-alerts

# 2. Monitoring system sends alert:
                                          # => POST to /webhooks/monitoring
                                          # => Filter: severity in [critical, warning]
                                          # => Agent investigates alert
                                          # => Response delivered to Telegram + Slack
```

**Key Takeaway**: Webhook subscriptions combine URL endpoints, prompt templates with variable substitution, event filters, skill attachment, and multi-channel delivery for automated agent responses to external events.

**Why It Matters**: Webhooks transform Hermes Agent from a reactive tool (you ask, it answers) into a proactive system (events happen, it investigates). CI failures get analyzed before anyone looks at them — the agent reads error logs, identifies the failing test, traces the root cause to a recent commit, and posts a suggested fix to Slack. Monitoring alerts get triaged — the agent checks metrics context, identifies whether the spike is anomalous or seasonal, and recommends scaling actions. The prompt template mechanism means you define the investigation strategy once; every future event follows the same analytical framework. Multi-channel delivery ensures the right people get notified on the right platform. This closes the loop between event detection and response, reducing mean time to resolution by having the agent start investigation before humans even see the alert.

### Example 80: Monitoring and Cost Tracking

Track token usage, costs, and session analytics using built-in monitoring commands and configurable logging. Monitoring provides visibility into agent efficiency, model costs, and usage patterns.

```yaml
# ~/.hermes/config.yaml — Logging configuration
logging:
  level:
    "info" # => Log level: debug, info, warning, error
    # => info: normal operation logging
    # => debug: verbose, includes API requests
  file:
    "~/.hermes/logs/hermes.log" # => Log file location
    # => Rotated daily by default
  max_size:
    "100M" # => Maximum log file size
    # => Rotated when exceeded
  retention:
    30 # => Keep logs for 30 days
    # => Older logs auto-deleted
```

```bash
# Token usage for current session
You: /usage                               # => Display current session stats:
                                          # => Tokens in:    45,230
                                          # => Tokens out:   12,450
                                          # => Total tokens:  57,680
                                          # => Estimated cost: $0.0847
                                          # => Model: claude-sonnet-4-6
                                          # => Session duration: 1h 23m
                                          # => Tool calls: 34

# Session analytics over time
You: /insights --days 7                   # => Display 7-day analytics:
                                          # => Sessions: 23
                                          # => Total tokens: 1,245,000
                                          # => Total cost: $1.83
                                          # => Avg session cost: $0.08
                                          # => Most used tools: terminal (45%),
                                          # =>   read_file (22%), web_search (11%)
                                          # => Avg session length: 47 minutes
                                          # => Compression events: 8
```

```yaml
# TUI status bar (visible during sessions):
# ┌──────────────────────────────────────────────────────┐
# │ Model: claude-sonnet-4-6 │ Tokens: 45.2K │ $0.08 │
# │ Tools: 34 calls │ Context: 32% │ Session: 1h 23m    │
# └──────────────────────────────────────────────────────┘
# => Real-time display in terminal UI
# => Updates after every turn
# => Tokens: running total for session
# => Context: current context window usage (%)
# => Cost: estimated based on provider pricing
# => Tools: cumulative tool call count
```

```bash
# Cost optimization workflow
You: /insights --days 30                  # => Monthly cost analysis
                                          # => Identify expensive sessions
                                          # => Check compression efficiency
                                          # => Review model routing savings

# Compare costs with and without smart routing:
                                          # => Without routing: $47.20/month
                                          # => With routing:    $15.80/month
                                          # => Savings: 66.5%
                                          # => Quality impact: none for simple queries

# Identify token-heavy tools:
                                          # => terminal output: 45% of tokens
                                          # =>   Action: increase file_read_max_chars threshold
                                          # => web_extract: 22% of tokens
                                          # =>   Action: enable content summarization
                                          # => search_files: 8% of tokens
                                          # =>   Action: refine search patterns
```

**Key Takeaway**: Built-in `/usage` and `/insights` commands provide real-time and historical monitoring of token consumption, costs, tool usage, and session analytics, while the TUI status bar displays live metrics.

**Why It Matters**: AI agent costs are opaque without monitoring. A single agent session costs cents; a team of developers running agents daily costs hundreds per month. Without visibility, costs grow silently until the invoice arrives. The `/usage` command provides immediate feedback — you see cost accumulating in real-time and can decide whether to continue an expensive investigation or try a different approach. `/insights` over time reveals patterns: which tools consume the most tokens (usually terminal output and web extraction), which sessions are outliers, and whether smart routing is delivering expected savings. The TUI status bar makes cost awareness effortless — it's always visible, like a fuel gauge. For budget-conscious teams, monitoring transforms AI agent spending from an unpredictable expense into a manageable, optimizable cost center with clear levers (compression, routing, tool filtering) for reduction.
