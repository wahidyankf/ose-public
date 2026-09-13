---
title: "Intermediate"
date: 2026-05-19T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 28-54: Pi Coding Agent intermediate skills - skills system, prompt templates, four operating modes (interactive/print/RPC/SDK), session branching and sharing, extension installation (40-75% coverage)"
tags: ["pi-coding-agent", "pi.dev", "intermediate", "by-example", "tutorial", "ai-agent", "coding-agent"]
---

This tutorial provides 27 intermediate examples covering Pi Coding Agent. Learn the skills system (Examples 28-32), prompt templates (Examples 33-36), print/JSON mode (Examples 37-40), RPC mode (Examples 41-44), SDK mode (Examples 45-48), session branching and sharing (Examples 49-51), and extension installation (Examples 52-54).

## Skills System (Examples 28-32)

### Example 28: Install a Skill from the Community Registry

Pi skills are reusable bundles of prompts, tool wirings, and context shaped for a specific task (e.g. "review a pull request", "draft a migration"). The community registry hosts skills you can install by name.

```bash
pi skill install code-review            # => Resolves the skill from the registry
                                        # => Downloads into ~/.config/pi/skills/code-review/
                                        # => Registers the skill so /skill code-review works
                                        # => Skill version pinned in skills.lock.json

pi skill list                           # => Lists installed skills, e.g.:
                                        # =>   code-review      v1.4.0  community
                                        # =>   migration-plan   v0.9.2  community
```

**Key Takeaway**: `pi skill install <name>` pulls a community skill into your local skills directory and registers it with the CLI.

**Why It Matters**: Skills package a working prompt + tool wiring + few-shot examples into one named artifact you can invoke later. Without skills, the team's "good code review prompt" lives in someone's Notion page and drifts; with skills it lives in version-controlled JSON the whole team can install with one command. The lockfile keeps everyone on the same skill version so the prompt does not silently change underneath users.

### Example 29: Install a Local Skill from a Directory

You can author and install skills directly from a local directory — useful for private team skills that should not go to the public registry.

```bash
# Layout of a local skill
ls ./team-skills/db-migration/          # => Lists skill files
                                        # =>   skill.json     (metadata + entry prompt)
                                        # =>   prompts/       (additional prompt templates)
                                        # =>   examples/      (few-shot examples)

pi skill install ./team-skills/db-migration
                                        # => Copies the directory into the local skills store
                                        # => Validates skill.json against the skill schema
                                        # => Registers under the name in skill.json
                                        # => No network call required
```

**Key Takeaway**: Pass a directory path to `pi skill install` instead of a registry name to install a local skill in-place.

**Why It Matters**: Private skills (security playbooks, internal API conventions, regulated-domain prompts) should never leave your network. Pi treating local directories and registry skills the same way means private skills do not become second-class citizens. You can develop a skill locally, prove it out, and only later choose whether to publish it to the registry.

### Example 30: List Installed Skills

The `pi skill list` command enumerates all installed skills with version and source so you know what is available before starting a session.

```bash
pi skill list                           # => Tabular output:
                                        # =>   NAME             VERSION   SOURCE
                                        # =>   code-review      v1.4.0    community
                                        # =>   db-migration     v0.1.0    local
                                        # =>   migration-plan   v0.9.2    community
                                        # =>   triage-bug       v2.0.1    community

pi skill list --json                    # => JSON output (scriptable)
pi skill list --source local            # => Filter to local-only skills
```

**Key Takeaway**: `pi skill list` is your inventory of available skills; `--source` filters by where each skill came from.

**Why It Matters**: A long session can pull from several skills, and forgetting which ones are installed costs time when an expected skill is silently missing. The JSON output makes the list scriptable — CI jobs can assert "skill X version Y is installed" before running, catching environment drift before it produces a confused agent run.

### Example 31: Invoke a Skill in a Session

Inside an interactive session the `/skill <name>` slash command activates a skill. The skill's entry prompt loads, tools wire up, and the session continues with the skill's behaviour applied.

```text
> /skill code-review
Activated skill: code-review v1.4.0
Skill loaded: 2 tools, 3 prompts, 5 few-shot examples.

> Please review the diff between main and feature/auth.
[Skill code-review runs its review checklist...]
[file_read src/auth.ts]
[shell_run git diff main...feature/auth -- src/]
Findings:
  1. auth.ts:42 - missing null check on `token`
  2. auth.test.ts - new path is untested
  3. config.ts:11 - secret leaked in error message
```

**Key Takeaway**: `/skill <name>` activates a skill mid-session; the skill's prompts and tools augment the current session without losing prior history.

**Why It Matters**: Skills are composable with ongoing work. You can have a project-context session running, drop in the `code-review` skill to review a diff, then continue the original task — Pi keeps the conversation linear. Compare to "open a new tool, copy context across, get the review, paste back" which is the alternative without skills.

### Example 32: Override a Skill with a Local Patch

Sometimes a registry skill is 90% right and 10% wrong for your team. Pi lets you override individual files of a community skill with local copies without forking the whole thing.

```bash
mkdir -p ~/.config/pi/skills/code-review.overrides/prompts/
                                        # => Override directory mirrors the skill layout

cp ~/.config/pi/skills/code-review/prompts/checklist.md \
   ~/.config/pi/skills/code-review.overrides/prompts/checklist.md
                                        # => Start from the upstream checklist

# Edit ~/.config/pi/skills/code-review.overrides/prompts/checklist.md
# to add your team's extra checks (e.g. accessibility, i18n).

pi skill list --overrides               # => Lists active overrides
                                        # =>   code-review/prompts/checklist.md  (local)
```

**Key Takeaway**: Pi merges a `<skill>.overrides/` directory on top of an installed skill; you patch individual files instead of forking.

**Why It Matters**: Forking a skill is heavy — you lose upgrade flow and own the whole bundle forever. Overrides keep the skill upgradable: when the upstream `code-review` ships v1.5, your one overridden file stays put and everything else updates. This is the same pattern as Nix overlays or Helm chart `values.yaml` — small, named patches against a moving upstream.

## Prompt Templates (Examples 33-36)

### Example 33: Install a Prompt Template

Prompt templates are simpler than skills — they are reusable prompt strings with parameter substitution. The registry has templates for common tasks like commit messages, PR descriptions, and bug triage.

```bash
pi template install commit-message      # => Downloads template into
                                        # =>   ~/.config/pi/templates/commit-message.tmpl
                                        # => Registers /tpl commit-message slash command
                                        # => Template variables are introspectable via --help

pi template list                        # => Lists installed templates with version
pi template show commit-message         # => Prints the template text + declared variables
```

**Key Takeaway**: `pi template install <name>` registers a community prompt template you can invoke via `/tpl <name>` in any session.

**Why It Matters**: Most "ad hoc prompts" are actually templates with one or two variable slots — "summarise this PR", "explain this stacktrace", "write a commit message for these files". Naming them and pinning their text means the team sends the same prompt every time, which makes prompt quality measurable and improvable instead of slipping with the wind of personal mood.

### Example 34: Write an Inline Template

You can author templates inside your `~/.config/pi/templates/` directory and Pi picks them up automatically. The format is a markdown file with variable placeholders.

```text
# ~/.config/pi/templates/explain-stacktrace.tmpl
# ---
# name: explain-stacktrace
# variables:
#   - stacktrace
#   - language: go
# ---
You are a senior {{ language }} engineer. Read the following stacktrace
and explain in plain English what went wrong and where to look first.

Stacktrace:
{{ stacktrace }}

Output:
1. One-sentence summary
2. Most likely root cause
3. Two-line debugging plan
```

```bash
pi template list                        # => New template appears automatically:
                                        # =>   explain-stacktrace  v0.0.0  local
```

**Key Takeaway**: Drop a `.tmpl` file in `~/.config/pi/templates/` with frontmatter declaring variables; Pi indexes it on next run.

**Why It Matters**: Lowering the cost of authoring templates is what makes them a daily tool rather than a one-time experiment. A 12-line markdown file plus two variables is something you write in two minutes and reuse forever. The Mustache-style `{{ var }}` syntax is the lowest-common-denominator templating familiar across many tools, which keeps the cognitive load near zero.

### Example 35: Parameterized Template Invocation

Once a template is installed, invoke it with `/tpl <name>` and pass parameters by name. Missing required parameters prompt interactively.

```text
> /tpl explain-stacktrace language=python stacktrace="""
Traceback (most recent call last):
  File "/app/main.py", line 42, in <module>
    handle(request)
  File "/app/api.py", line 12, in handle
    return db.query(req.user_id)
TypeError: 'NoneType' object is not callable
"""

[Template rendered; sent to model]

Summary: db.query was called on a None object.
Root cause: db variable is unset — likely a missing init/connect step.
Plan: 1. grep for `db =` to find init site;
      2. confirm init runs before handle(); add fast-fail check on startup.
```

**Key Takeaway**: `/tpl <name> var=value` renders the template with substitution and sends the result as your prompt — parameters can be heredoc-style multiline values.

**Why It Matters**: Calling a template with concrete parameters is what makes a prompt a function rather than a copy-paste exercise. The interactive prompt-for-missing-params behaviour means you never silently send a half-filled template to the model. This is the same affordance as a CLI tool prompting for an unset flag — predictable, helpful, and impossible to misuse silently.

### Example 36: Pull Template Variables from Environment

Templates can declare environment-variable defaults so common variables (current branch, repo name, user) auto-populate without manual entry.

```text
# ~/.config/pi/templates/release-notes.tmpl
# ---
# name: release-notes
# variables:
#   - repo:        { env: REPO_NAME }
#   - branch:      { env: GIT_BRANCH, default: main }
#   - prev_tag
#   - new_tag
# ---
Draft release notes for {{ repo }} between {{ prev_tag }} and {{ new_tag }}
on branch {{ branch }}. Group changes by area (features, fixes, docs).
```

```bash
export REPO_NAME=my-product
export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
                                        # => Variables auto-fill from env
                                        # => Only prev_tag and new_tag prompt
```

```text
> /tpl release-notes prev_tag=v1.2.0 new_tag=v1.3.0
                                        # => repo + branch picked from env vars
```

**Key Takeaway**: Template variables can declare an `env:` source with optional default — context-sensitive variables fill themselves from your shell environment.

**Why It Matters**: A template that always asks "what's the current branch?" is a template you stop using. Wiring env-sourced defaults removes the cost of common variables so the only prompts you see are the ones that actually need a decision. This is how good CLIs work (commands that infer cwd, current user, current branch) and Pi applies the same ergonomic principle to prompts.

## Print / JSON Mode (Examples 37-40)

### Example 37: Print Mode One-Shot

Print mode runs Pi non-interactively: you pass a prompt, Pi runs the turn end-to-end and prints the result. Useful for scripting and CI integration.

```bash
pi -p "Summarise the changes in README.md vs HEAD~1"
                                        # => -p / --print enables print mode
                                        # => No TUI; prints final model response only
                                        # => Tool calls still happen; output is text
                                        # => Exits 0 on success, non-zero on error

# Variant: pipe input via stdin
echo "Explain the bug in src/parser.ts" | pi -p
                                        # => Reads prompt from stdin when -p is set
                                        # => Equivalent to passing as argument
```

**Key Takeaway**: `-p` runs Pi as a one-shot CLI — no TUI, plain stdout, exit codes — so it composes with shell pipelines.

**Why It Matters**: Print mode bridges the agent into Unix scripting. A make target can call Pi for a summary; a git hook can call Pi to draft a commit message; a CI step can call Pi to triage a build failure. None of this works in TUI mode because TUI demands a terminal. Print mode is what makes Pi a building block instead of an only-interactive tool.

### Example 38: JSON Output for Structured Consumption

Add `--json` to print mode and Pi emits a structured object instead of human-readable text. The object includes the response, tool calls, token counts, and session ID.

```bash
pi -p --json "List exports of src/auth.ts" > out.json
                                        # => Writes JSON to file
                                        # => Schema:
                                        # =>   { "session_id": "...",
                                        # =>     "response": "...",
                                        # =>     "tool_calls": [ {...}, ... ],
                                        # =>     "tokens": { "input": N, "output": N },
                                        # =>     "cost_usd": 0.001 }

cat out.json | jq '.response'           # => Extracts just the response text
cat out.json | jq '.tool_calls[].name'  # => Lists tool calls used
```

**Key Takeaway**: `pi -p --json` emits a single JSON object per call — pipe it through `jq` like any other JSON CLI.

**Why It Matters**: Free-form text is fine for humans but hostile to automation. JSON output makes Pi callable from any language with a JSON parser, which is every language. Capturing tool calls in the output also gives downstream scripts an audit trail — "did the agent read this file?" is answerable post-hoc by inspecting the JSON, not by re-reading a TUI transcript.

### Example 39: Scripting Pi from a Makefile

Print + JSON mode makes Pi a regular build dependency. Common pattern: `make notes` or `make triage` calls Pi to generate or analyse content.

<!-- markdownlint-disable MD010 -->

```makefile
# Makefile
.PHONY: notes
notes:
	@pi -p --json -m anthropic:claude-3.5-sonnet \
	    "Draft release notes for the last 20 commits on $$(git rev-parse --abbrev-ref HEAD)" \
	    | jq -r '.response' > NOTES.md
                                        # => Pi generates notes
                                        # => jq strips the JSON envelope
                                        # => Result lands as NOTES.md in repo
                                        # => `make notes` is the team-facing command

.PHONY: triage
triage:
	@gh run view --log $(RUN_ID) \
	  | pi -p "Why did this CI run fail? One-paragraph diagnosis."
                                        # => Pipe CI logs into Pi via stdin
                                        # => Pi returns plain-text diagnosis
```

<!-- markdownlint-enable MD010 -->

**Key Takeaway**: Makefile targets that call `pi -p` turn agent capabilities into named, discoverable team commands.

**Why It Matters**: A `make notes` command is something everyone on the team can find and run; a 4-line Pi prompt buried in someone's shell history is not. Wiring Pi into the Makefile (or `package.json` scripts, or `justfile`) makes agent capability part of the project's surface area — discoverable via `make help`, reproducible across machines, versioned in git.

### Example 40: Piping Pi Output into jq

JSON output combined with `jq` makes Pi a transformer in arbitrary pipelines — extract specific fields, filter tool calls, branch on cost.

```bash
# Extract only the model response
pi -p --json "Generate test cases for src/auth.ts" \
  | jq -r '.response' > tests-draft.md
                                        # => -r strips JSON quoting

# Branch on token cost
COST=$(pi -p --json "Refactor src/parser.ts" | jq '.cost_usd')
if (( $(echo "$COST > 0.10" | bc -l) )); then
    echo "Warning: this turn cost \$$COST"
fi

# Extract tool calls and count file reads
pi -p --json "Audit secrets in this repo" \
  | jq '[.tool_calls[] | select(.name=="file_read")] | length'
                                        # => Prints number of file_read calls used
```

**Key Takeaway**: JSON output makes Pi a first-class participant in Unix pipelines — `jq` extracts, filters, and conditionally branches on Pi's metadata.

**Why It Matters**: When Pi participates in a pipeline rather than terminating it, you compose Pi with the rest of the Unix toolbox — `grep`, `awk`, `xargs`, `jq`, `tee`. This compositional surface is exactly what made shell scripting durable across decades. Pi inheriting that pattern means it stays useful when the model behind it gets swapped out — the pipeline shape outlives any specific model.

## RPC Mode (Examples 41-44)

### Example 41: Start Pi as an RPC Server

RPC mode runs Pi as a long-lived server process listening on a Unix socket (or TCP port). Other processes send turns to it without paying repeated startup cost.

```bash
pi serve                                # => Starts RPC server
                                        # => Default socket: ~/.config/pi/pi.sock
                                        # => Persists sessions across calls
                                        # => Single-user; no auth on local socket
                                        # => Streams responses to clients

# Or use a TCP port
pi serve --port 7331                    # => Binds on 127.0.0.1:7331
                                        # => --host 0.0.0.0 to listen on all interfaces
                                        # =>   (only with --auth-token; never bare)
```

**Key Takeaway**: `pi serve` runs Pi as a background server; clients send turns over a socket or TCP port.

**Why It Matters**: Editor plugins, dev-tool integrations, and long-running agents need to talk to Pi continuously, not start a new process per turn. RPC mode trades a small operational cost (one persistent process) for a large latency win (no Node-startup overhead per call) and shared session state across many clients. This is the same engineering tradeoff as language servers — one server, many editor windows.

### Example 42: Send a Turn from Another Process

Once `pi serve` is running, any process can send a turn. The simplest client is a small Node script using the documented RPC schema (JSON-RPC over the socket).

```bash
# Quick test using a one-liner Node REPL command
node -e '
  const net = require("net");
  const c = net.connect("/Users/<you>/.config/pi/pi.sock");
  c.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "turn",
    params: { prompt: "Hello from another process" }
  }) + "\n");
  c.on("data", d => console.log(d.toString()));
'
                                        # => Connects to Pi RPC server
                                        # => Sends a JSON-RPC turn request
                                        # => Pi streams response chunks back
```

**Key Takeaway**: RPC clients connect to the Unix socket and exchange newline-delimited JSON-RPC messages — any language with a socket library can drive Pi.

**Why It Matters**: A documented JSON-RPC over Unix socket protocol is language-agnostic — Python, Go, Ruby, and Rust clients are equally easy to write. No HTTP overhead, no auth setup (the socket's filesystem permissions are the auth), and no SDK to install. This keeps the integration surface minimal so embedding Pi in a new tool is a one-afternoon task instead of a one-week project.

### Example 43: Stream Tokens via RPC

Pi streams model output to RPC clients as it arrives. Streaming matters for editor UIs that want to render tokens live rather than blocking until the full response is ready.

```javascript
// stream-client.js
const net = require("net");
const client = net.connect(process.env.HOME + "/.config/pi/pi.sock");
// => Connects to RPC socket

client.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 42,
    method: "turn.stream", // => .stream variant returns chunks
    params: { prompt: "Explain async/await in 4 lines" },
  }) + "\n",
);

let buffer = "";
client.on("data", (data) => {
  buffer += data.toString();
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    // => Frame on newline boundary
    const msg = JSON.parse(buffer.slice(0, nl));
    buffer = buffer.slice(nl + 1);
    if (msg.method === "turn.chunk") {
      process.stdout.write(msg.params.delta);
      // => Print incremental token delta
    } else if (msg.id === 42) {
      process.stdout.write("\n[done]\n");
      client.end();
    }
  }
});
```

**Key Takeaway**: `turn.stream` is the streaming variant of `turn`; clients receive `turn.chunk` notifications with incremental deltas until the final response.

**Why It Matters**: Streaming is the difference between a UI that feels alive and one that feels frozen. For tasks where the model takes 10-30 seconds, blocking is unusable; streaming gives the user visible progress and the option to stop early. Editor plugins that render Pi output inline rely on this — they look as responsive as any LSP integration because the wire protocol matches.

### Example 44: RPC Client in Python

Pi's RPC protocol is JSON-RPC, so the Python client is a few lines around `socket` and `json`. This is the pattern for non-Node integrations.

```python
# pi_client.py
import json
import socket
import os

SOCKET_PATH = os.path.expanduser("~/.config/pi/pi.sock")
                                        # => Default Pi RPC socket path

def ask(prompt: str) -> str:
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                                        # => AF_UNIX for local socket
    s.connect(SOCKET_PATH)
    req = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "turn",
        "params": {"prompt": prompt},
    }) + "\n"
    s.sendall(req.encode())
                                        # => Send JSON-RPC turn request
    buf = b""
    while True:
        chunk = s.recv(4096)
        if not chunk:
            break
        buf += chunk
        if buf.endswith(b"\n"):
            break
    s.close()
    resp = json.loads(buf.decode())
                                        # => Parse single JSON-RPC response
    return resp["result"]["response"]

if __name__ == "__main__":
    print(ask("Summarise the README in 2 sentences."))
```

**Key Takeaway**: Pi's RPC contract is JSON-RPC over a Unix socket — a 30-line Python module gives any Python process a `ask()` function backed by Pi.

**Why It Matters**: Embedding agent capability in non-Node services is common — data tools, notebooks, ML pipelines. By exposing a standard JSON-RPC contract instead of a Node-only API, Pi makes itself reachable from those ecosystems with no adapter library. This widens Pi's addressable use cases without growing the Pi project itself.

## SDK Mode (Examples 45-48)

### Example 45: Import pi-agent-core in a Node Script

Pi's core agent loop is shipped as `@earendil-works/pi-agent-core` for embedding inside Node applications. Unlike RPC mode, the SDK runs the agent in-process.

```bash
npm install @earendil-works/pi-agent-core @earendil-works/pi-ai
                                        # => Two packages:
                                        # =>   pi-agent-core: the agent loop
                                        # =>   pi-ai: provider/model adapters
```

```typescript
// agent.ts
import { Agent } from "@earendil-works/pi-agent-core";
// => Core agent class
import { anthropic } from "@earendil-works/pi-ai/providers";
// => Provider factory

async function main() {
  const agent = new Agent({
    model: anthropic("claude-3.5-sonnet"),
    // => Model instance
    cwd: process.cwd(), // => Working directory the agent sees
  });

  const result = await agent.run("List the exports of src/auth.ts");
  // => Single-turn run; returns
  // =>   { response, tool_calls, tokens, cost_usd }
  console.log(result.response);
}

main();
```

**Key Takeaway**: `Agent` from `@earendil-works/pi-agent-core` is the in-process entry point — construct it with a model and run turns directly without spawning a server.

**Why It Matters**: For Node applications already running in the agent's host environment, embedding skips the RPC roundtrip entirely. This matters for latency-sensitive integrations (interactive editors, real-time pipelines) where even sub-millisecond IPC costs accumulate. The SDK shape (`new Agent(...)` + `agent.run(...)`) is small enough to memorise, which lowers the cost of adopting it.

### Example 46: Embed Pi in a Node CLI Tool

A common SDK use case is building a domain-specific CLI on top of Pi — your CLI handles user input and tool invocation, Pi handles the LLM reasoning.

```typescript
// my-review-cli.ts
import { Agent } from "@earendil-works/pi-agent-core";
import { anthropic } from "@earendil-works/pi-ai/providers";

async function reviewDiff(branch: string) {
  const agent = new Agent({
    model: anthropic("claude-3.5-sonnet"),
    cwd: process.cwd(),
    systemPrompt: "You are a senior reviewer. Output findings as numbered list.",
    // => Custom system prompt overrides Pi's default
  });

  const result = await agent.run(
    `Review the diff between main and ${branch}. ` + `Use file_read and shell_run as needed.`,
  );

  console.log("=== Review for branch:", branch, "===");
  console.log(result.response);
  console.log("\n[cost: $" + result.cost_usd.toFixed(4) + "]");
  // => Per-call cost surfaced to the user
}

reviewDiff(process.argv[2] ?? "HEAD");
// => Usage: ts-node my-review-cli.ts feature/auth
```

**Key Takeaway**: A custom CLI that wraps `Agent` with a domain-specific system prompt and command-line interface is a few-dozen-line script.

**Why It Matters**: Many teams have a "review the PR" or "draft a migration" workflow they would like as a named command. Building it on the SDK gives you full control over inputs, outputs, exit codes, and presentation — things print mode does not let you customise as deeply. Cost surfacing is a small thing that turns the tool from "magic box" to "accountable assistant".

### Example 47: Register a Custom Tool via the SDK

The SDK lets you register additional tools beyond Pi's built-ins. Tools are just async functions with a JSON schema describing their inputs.

```typescript
// custom-tool.ts
import { Agent } from "@earendil-works/pi-agent-core";
import { anthropic } from "@earendil-works/pi-ai/providers";

const agent = new Agent({
  model: anthropic("claude-3.5-sonnet"),
  cwd: process.cwd(),
});

agent.registerTool({
  name: "db_query", // => Tool name the model calls
  description: "Run a read-only SQL query against the staging DB.",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string", description: "SQL SELECT statement" },
    },
    required: ["sql"],
  },
  handler: async ({ sql }) => {
    // => Handler receives validated inputs
    if (!/^\s*SELECT\b/i.test(sql)) {
      throw new Error("Only SELECT statements are allowed.");
      // => Defense: reject writes
    }
    const rows = await runQuery(sql); // => Your DB layer
    return { rows }; // => Pi serialises and sends back to the model
  },
});

const result = await agent.run("How many active users signed up last week? Use db_query.");
console.log(result.response);
```

**Key Takeaway**: `agent.registerTool({ name, inputSchema, handler })` extends Pi with bespoke capabilities — the agent can call your domain APIs as if they were built-in tools.

**Why It Matters**: The agent's value scales with the tools it can reach. Most useful in-house workflows (deploy, run-migration, query-warehouse, look-up-customer) are not generic file edits — they require domain glue. The SDK's tool registration is small and well-typed enough that exposing a new tool is a five-minute task, so the agent's capability grows with your codebase rather than being capped by what ships in the box.

### Example 48: Embed Pi in a Web Server

Pi's SDK works inside any Node server (Express, Fastify, Hono). Per-request agent instances let an HTTP endpoint expose Pi capability to upstream services.

```typescript
// server.ts
import express from "express";
import { Agent } from "@earendil-works/pi-agent-core";
import { anthropic } from "@earendil-works/pi-ai/providers";

const app = express();
app.use(express.json());

app.post("/ask", async (req, res) => {
  // => POST /ask  { "prompt": "..." }
  const agent = new Agent({
    model: anthropic("claude-3.5-sonnet"),
    cwd: process.env.PROJECT_ROOT ?? process.cwd(),
    // => Each request sees the configured project
  });

  try {
    const result = await agent.run(req.body.prompt);
    res.json({
      response: result.response,
      tokens: result.tokens,
      cost_usd: result.cost_usd,
    });
    // => Mirrors Pi's print-mode JSON shape
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8080, () => console.log("Pi-backed API on :8080"));
// => curl -d '{"prompt":"..."}' :8080/ask
```

**Key Takeaway**: Pi inside a web server is "agent-per-request" — each handler instantiates an `Agent`, runs one turn, and responds with the structured result.

**Why It Matters**: Wrapping Pi behind an HTTP endpoint lets you expose agent capability to non-Node services (Python, Go) or to remote clients without giving them Pi credentials. This is the common pattern for internal "AI APIs" — one team runs the Pi-backed service with the org's API keys, other teams call it over the network. The print-mode-compatible response shape means downstream code does not need to switch shapes if you ever move from a server to a CLI invocation.

## Session Branching and Sharing (Examples 49-51)

### Example 49: Branch a Session and List Branches

Pi sessions are trees, not linear chats. Branching forks a session at a turn so you can explore alternative directions without losing the original.

```text
> /history
Turn 14: user    "Refactor the auth service to use a single repository."
Turn 13: model   "I'll start by creating a Repository interface..."
Turn 12: user    "Use Postgres-only first; we'll add Redis later."
Turn 11: model   "Here's the schema design with Redis caching..."
Turn 10: user    "Design the data layer for user sessions."

> /branch 11
Branched at turn 11. Created branch 'alt-no-redis' from current 'main'.

> /branches
* alt-no-redis  (current; from turn 11, 0 new turns)
  main          (3 turns past turn 11)

> # On the new branch, take a different direction
Use SQLite locally and Postgres in production; skip Redis entirely.
```

**Key Takeaway**: `/branch <turn>` forks at a turn; `/branches` lists all branches of the current session with their divergence point.

**Why It Matters**: AI sessions routinely hit forks — "should we use Redis or not?" — where both branches deserve exploration. Without branching, picking one means losing the other. Pi's tree structure preserves both so you can compare results, return to the rejected approach later, or even merge insights from both branches into a third one.

### Example 50: Share a Session via GitHub Gist

`pi session share` uploads a session as a GitHub gist (default secret, optional public). The gist contains a markdown render of the conversation plus the raw JSONL.

```bash
pi session share 2026-05-19T10-31Z-my-repo
                                        # => First run: prompts for GitHub auth
                                        # => Uploads two files in one gist:
                                        # =>   session.md     (rendered transcript)
                                        # =>   session.jsonl  (raw machine-readable)
                                        # => Prints: https://gist.github.com/<user>/<id>

pi session share <id> --public          # => Public gist instead of secret
pi session share <id> --branch alt-no-redis
                                        # => Share a specific branch (default: current branch)
```

**Key Takeaway**: `pi session share` produces a shareable URL with both human-readable and machine-readable views of the session.

**Why It Matters**: Showing your work to a teammate or vendor support is much higher-bandwidth with a session URL than with screenshots — the reviewer sees every tool call, every model response, with timestamps and costs. The dual-format gist matters because the recipient may be a human (markdown view) or another agent (JSONL view) and Pi serves both without needing two share commands.

### Example 51: Redact Paths Before Sharing

Sharing a session can leak filesystem layout, customer names in paths, or internal hostnames. The `--redact-paths` flag scrubs them before upload.

```bash
pi session share <id> --redact-paths    # => Replaces absolute paths with placeholders, e.g.
                                        # =>   /Users/<you>/customer-acme/...
                                        # =>     becomes /home/<user>/project/...
                                        # => Replaces hostnames in URLs:
                                        # =>   https://acme-internal.corp/...
                                        # =>     becomes https://internal.example/...

pi session share <id> --redact-paths --redact-rules ./my-redactions.json
                                        # => Add project-specific redactions
                                        # => JSON schema:
                                        # =>   [ { "match": "regex", "replace": "string" }, ... ]
```

**Key Takeaway**: `--redact-paths` scrubs absolute paths and hostnames before share; `--redact-rules` adds project-specific patterns (customer names, internal URLs).

**Why It Matters**: A useful session often contains paths like `/Users/<you>/clients/big-bank-corp/audit-2026/` — the path itself is sensitive even if the content is fine. Built-in redaction means the team default for sharing is safe, and project-specific extra patterns let you cover names and tokens that change between projects. Without this, the safe behaviour is "never share" and Pi's collaboration value drops.

## Extension Installation (Examples 52-54)

### Example 52: Install a Community Extension

Extensions are full TypeScript packages that register tools, slash commands, keyboard shortcuts, event handlers, and TUI panels. The community registry hosts them under named slugs.

```bash
pi extension install pi-git-helpers     # => Resolves extension from the registry
                                        # => Installs to ~/.config/pi/extensions/pi-git-helpers/
                                        # => Loads on next session start
                                        # => Adds tools: git_blame, git_log_search, ...
                                        # => Adds slash commands: /blame, /log

pi extension install ./pi-extensions/team-tools
                                        # => Local install from a directory
                                        # => Same shape as community install
                                        # => Useful for private team extensions
```

**Key Takeaway**: `pi extension install <name-or-path>` adds a TypeScript extension to your local Pi runtime; tools and slash commands the extension registers become available on next session.

**Why It Matters**: Skills cover most prompt-shaped customisation, but extensions are what you reach for when you need new tools, persistent panels, or custom keyboard shortcuts. The local-or-registry symmetry mirrors the skills convention — your team can author private extensions exactly the same way the community authors public ones. This consistency means there is one extension-authoring mental model regardless of distribution.

### Example 53: List Installed Extensions

`pi extension list` shows all installed extensions with version and load status. Disabled extensions still show in the list but do not load.

```bash
pi extension list                       # => Tabular output:
                                        # =>   NAME              VERSION  STATUS    SOURCE
                                        # =>   pi-git-helpers    v0.4.1   enabled   community
                                        # =>   pi-snapshot       v0.2.0   disabled  community
                                        # =>   team-tools        v0.1.0   enabled   local

pi extension list --json                # => Scriptable JSON form
pi extension show pi-git-helpers        # => Print extension manifest:
                                        # =>   tools, commands, hooks declared
                                        # =>   permission scopes requested
```

**Key Takeaway**: `pi extension list` is the canonical inventory; `pi extension show <name>` exposes the manifest including declared permissions.

**Why It Matters**: Extensions can request broad capabilities (file write, shell execution, network access). Reviewing the manifest before enabling a community extension is the security-conscious practice; Pi exposing the manifest via a CLI subcommand makes that review one command rather than spelunking through extension source code. The JSON output supports policies like "fail CI if any extension declares unknown permission scopes."

### Example 54: Disable an Extension

When an extension misbehaves or you simply do not need it in a session, disable it. Disabled extensions stay installed but skip loading, so re-enabling is a one-flag flip.

```bash
pi extension disable pi-snapshot        # => Marks extension disabled
                                        # => Survives across sessions
                                        # => Does NOT delete files — only the load flag flips

pi extension enable pi-snapshot         # => Re-enables; loads on next session
pi extension uninstall pi-snapshot      # => Full removal (deletes directory + lockfile entry)

# Per-session override without changing global state
pi --disable-extension pi-snapshot      # => Disable just for this session
pi --no-extensions                      # => Disable ALL extensions for this session
                                        # => Useful for "is this bug an extension's fault?"
```

**Key Takeaway**: `pi extension disable <name>` is reversible; `pi extension uninstall <name>` removes the extension. Per-session flags (`--disable-extension`, `--no-extensions`) override globals.

**Why It Matters**: Disable is the right primitive when triaging a misbehaving extension — uninstall throws away configuration you might want back. The `--no-extensions` escape hatch is the canonical first step when Pi behaves strangely: if the problem disappears with extensions off, the problem is an extension; if it persists, the problem is core. This single flag turns extension debugging from "stare at code" into "split-half search."

## Next Steps

You now understand Pi's skills system, prompt templates, the four operating modes (interactive, print, RPC, SDK), session branching and sharing, and extension installation. Continue with [Advanced Examples 55-80](/en/learn/artificial-intelligence/tools/pi-coding-agent/by-example/advanced) to learn extension authoring, custom TUI panels, security hardening, CI integration, and production embedding patterns.
