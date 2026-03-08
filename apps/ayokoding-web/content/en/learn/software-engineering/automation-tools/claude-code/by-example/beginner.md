---
title: "Beginner"
date: 2026-02-02T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-30: Claude Code CLI fundamentals - interactive mode, print mode (`-p`), npm scripts, git hooks, and workflow management (0-40% coverage)"
tags: ["claude-code", "beginner", "by-example", "tutorial", "cli", "automation", "npm", "git-hooks"]
---

This tutorial provides 30 foundational examples covering the Claude Code CLI tool - the AI coding assistant controlled through the `claude` command. Learn interactive usage (Examples 1-6), non-interactive print mode (Examples 7-12), npm scripts integration (Examples 13-18), git hooks (Examples 19-20), and workflow management (Examples 21-30).

## What is Claude Code (Examples 1-6)

### Example 1: What is Claude Code

Claude Code is an AI-powered coding assistant you run from the command line using the `claude` command. It reads and writes files, runs commands, and helps you build software through natural language conversation. Think of it as a senior developer available 24/7 via your terminal.

**Key Features**:

- **Interactive mode**: Conversational development (`claude` → chat interface)
- **Print mode**: Non-interactive automation (`claude -p "query"` → exits after response)
- **File operations**: Read, write, edit files based on natural language requests
- **Command execution**: Run bash commands, git operations, build scripts
- **Context awareness**: Understands project structure, existing patterns, coding conventions

```bash
claude --version                    # => Shows installed Claude Code version (e.g., 1.x.x)
claude --help                       # => Lists available commands, flags, and usage
                                    # => Shows: -p/--print, --output-format, --agents options
```

**Key Takeaway**: Claude Code is a CLI tool (`claude` command) that brings AI assistance to software development through file operations and command execution.

**Why It Matters**: Traditional AI assistants require copying code between browser and editor. Claude Code works directly in your codebase - it reads files, makes changes, runs tests, and commits results. This eliminates context switching and enables true AI-assisted development workflows. Teams report measurable productivity gains on boilerplate generation, refactoring, and test writing. Unlike chat-based AI, Claude Code maintains full project context and executes changes atomically across multiple files.

### Example 2: Starting Interactive Session

The `claude` command without arguments starts interactive mode - a conversational interface where you describe what you want and Claude Code generates code, edits files, or runs commands.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CLI as claude command
    participant AI as Claude AI
    participant Files as Project Files

    Dev->>CLI: claude
    CLI->>Files: Loads .claude/ config
    CLI->>AI: Initializes session
    AI-->>Dev: Ready for prompts
    Dev->>AI: "Create user.ts"
    AI->>Files: Writes user.ts
    AI-->>Dev: File created
```

**Commands**:

```bash
claude                              # => Launches Claude Code CLI
                                    # => Loads project config (.claude/)
                                    # => Enters interactive conversation mode
                                    # => Displays welcome message
                                    # => Ready for natural language prompts
```

**Key Takeaway**: Run `claude` to start interactive mode. You'll get a conversational interface that maintains context across requests.

**Why It Matters**: Interactive mode enables iterative development through conversation. Ask Claude to create a file, review the result, request changes, add tests - all without leaving the terminal. Context persistence means Claude remembers earlier decisions and code it generated. This reduces cognitive load of tracking multi-file changes. Teams use interactive sessions for feature development, treating Claude as a pair programming partner who executes changes instantly.

### Example 3: Interactive Session with Initial Prompt

Launch Claude Code with an initial prompt to start working immediately without entering interactive mode first. Useful for quick questions or focused tasks.

**Commands**:

```bash
claude "explain the authentication flow"
                                    # => Launches Claude with prompt
                                    # => Analyzes auth-related files
                                    # => Provides explanation
                                    # => Remains in interactive mode for follow-ups
```

**Key Takeaway**: Pass initial prompt as argument to `claude "your prompt"`. Claude executes the prompt then stays in interactive mode.

**Why It Matters**: Initial prompts eliminate the startup step - you jump straight into work. This is faster for focused tasks like "explain this function" or "fix this bug". The session remains interactive for follow-up questions, maintaining context. Use this pattern for rapid code investigations where you know the first question but expect follow-ups.

### Example 4: Understanding Claude's Tool Usage

Claude Code uses tools (Read, Write, Edit, Bash, etc.) to interact with your codebase. Understanding tools helps you predict what Claude will do and provide better prompts.

**Commands**:

```bash
# In Claude interactive session
You: Add error handling to src/api/users.ts
                                    # => Claude announces: "I'll use Read to view the file"
                                    # => Tool: Read(src/api/users.ts)
                                    # => Claude announces: "I'll use Edit to add try-catch"
                                    # => Tool: Edit(src/api/users.ts, old_string, new_string)
                                    # => Changes made, file updated
```

**Key Takeaway**: Claude announces tool usage before acting. Main tools: Read (view files), Write (create files), Edit (modify files), Bash (run commands).

**Why It Matters**: Tool announcements give you control - approve or reject operations before execution. Understanding tools helps you write better prompts ("Read auth.ts and add tests" vs "Add tests" where Claude might guess the wrong file). This transparency prevents unwanted changes. Configure permission policies to auto-approve safe tools (Read) while prompting for destructive ones (Edit, Bash).

### Example 5: File Operations in Interactive Mode

Claude Code can read, create, and edit files through natural language requests. You describe the operation, Claude executes it using appropriate tools.

**Commands**:

```bash
# In Claude interactive session
You: Create src/models/user.ts with User interface
                                    # => Claude uses Write tool
                                    # => Creates file with TypeScript interface
                                    # => Confirms: "Created src/models/user.ts"

You: Add a createdAt timestamp field
                                    # => Claude uses Read to view current file
                                    # => Uses Edit to add field
                                    # => Shows diff of changes
```

**Key Takeaway**: Claude handles file creation (Write), reading (Read), and editing (Edit) through conversational requests.

**Why It Matters**: Conversational file operations eliminate context switching between editor and terminal. Describe the change, Claude makes it. This is particularly powerful for multi-file changes - "Add User import to all files using it" touches multiple files in one request. Claude tracks which files it modified, enabling you to review changes systematically. This accelerates refactoring tasks that would take hours manually.

### Example 6: Exiting and Resuming Sessions

Exit Claude with `exit` command or Ctrl+D. Resume previous conversations with `claude -c` (continue) or `claude -r <session>` (resume specific session).

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Claude as claude command
    participant Disk as Session Storage

    Dev->>Claude: claude
    Claude->>Disk: Save session
    Dev->>Claude: exit
    Claude->>Disk: Persist conversation
    Dev->>Claude: claude -c
    Claude->>Disk: Load last session
    Claude-->>Dev: Resumed conversation
```

**Commands**:

```bash
# In Claude session
You: exit                           # => Exits Claude
                                    # => Session saved to disk

# Later...
claude -c                           # => Continues last conversation
                                    # => Loads previous context
                                    # => Ready for follow-ups

claude -r "auth-refactor"           # => Resumes named session
                                    # => Loads that specific conversation
```

**Key Takeaway**: Exit with `exit` or Ctrl+D. Resume with `claude -c` (last conversation) or `claude -r <session>` (specific session).

**Why It Matters**: Session persistence enables long-running projects across multiple work sessions. Start feature development Monday, resume same conversation Wednesday with full context intact - no re-explanation of requirements. Named sessions let you manage multiple parallel workstreams, such as a feature branch and a bugfix branch simultaneously. This mirrors how developers naturally organize work, reducing mental overhead of tracking AI conversation state.

## Non-Interactive Print Mode (Examples 7-12)

### Example 7: Basic Print Mode (`-p`)

Print mode (`claude -p`) runs non-interactively - executes query, prints response, exits. Essential for scripts and automation.

**Commands**:

```bash
claude -p "explain the authentication flow"
                                    # => Claude analyzes auth files
                                    # => Prints explanation to stdout
                                    # => Exits (does NOT enter interactive mode)
                                    # => Exit code 0 on success
```

**Key Takeaway**: Use `claude -p "query"` for non-interactive execution. Claude processes query, prints response, exits immediately.

**Why It Matters**: Print mode enables CLI automation - call Claude from scripts, CI/CD pipelines, and git hooks. Non-interactive execution is essential for automated workflows where human input is unavailable. Output goes to stdout for capture or piping. Exit codes indicate success or failure for script error handling. Print mode is the foundation for all Claude Code automation patterns, enabling AI intelligence in headless environments.

### Example 8: Piping Content to Claude

Pipe file contents or command output to Claude via stdin. Useful for analyzing logs, processing data, or batch operations.

**Commands**:

```bash
cat src/api/users.ts | claude -p "add error handling"
                                    # => Claude receives file via stdin
                                    # => Analyzes TypeScript code
                                    # => Adds try-catch blocks
                                    # => Prints modified code to stdout

git diff | claude -p "summarize these changes"
                                    # => Claude receives git diff
                                    # => Analyzes changes
                                    # => Prints summary
```

**Key Takeaway**: Pipe content to Claude with `cat file | claude -p "query"` or `command | claude -p "query"`.

**Why It Matters**: Piping enables batch processing - analyze multiple files, process command output, and transform data at scale. This integrates Claude into standard Unix pipelines without special adapters. Common pattern: `find . -name "*.ts" | xargs -I{} claude -p "add types to {}"` for batch operations across a codebase. Use piping for automated code analysis in CI/CD, treating Claude as an intelligent processing stage.

### Example 9: Output Formats (text vs json)

Control output format with `--output-format`. Options: `text` (default), `json` (structured), `stream-json` (streaming events).

**Commands**:

```bash
claude -p "list all API endpoints" --output-format json
                                    # => Claude analyzes routes
                                    # => Returns JSON: {"endpoints": [...]}
                                    # => Parseable by jq, scripts

claude -p "list all API endpoints"
                                    # => Default text format
                                    # => Human-readable output
                                    # => Not structured for parsing
```

**Key Takeaway**: Use `--output-format json` for machine-parseable output. Default is human-readable text.

**Why It Matters**: JSON output enables downstream processing - parse with `jq`, pass to other tools, store in databases. This is critical for automation pipelines where structured data flows between stages. Example: `claude -p "extract function names" --output-format json | jq '.functions[]'` for programmatic code analysis. Use JSON output for generating reports, validating codebases, and extracting metadata in machine-readable format that integrates with any tool.

### Example 10: Continuing Conversations Non-Interactively

Use `claude -c -p` to continue previous conversation in print mode. Useful for multi-step automation maintaining context.

**Commands**:

```bash
claude -p "analyze src/auth.ts and suggest improvements"
                                    # => Claude analyzes auth code
                                    # => Suggests: Add rate limiting, improve validation
                                    # => Saves session

claude -c -p "implement the rate limiting suggestion"
                                    # => Continues previous conversation
                                    # => Remembers auth.ts analysis
                                    # => Implements rate limiting
                                    # => Prints modified code
```

**Key Takeaway**: Use `claude -c -p` to continue last conversation in non-interactive mode. Context preserved across print mode calls.

**Why It Matters**: Context continuation enables multi-step automation scripts where each stage builds on previous results. Example script: analyze → suggest → implement → test - each step uses `claude -c -p` to maintain full conversation context. This prevents redundant re-analysis across pipeline stages. Use context continuation for automated refactoring pipelines, code review workflows, and any multi-stage transformation where accumulated understanding matters.

### Example 11: JSON Output Parsing in Scripts

Parse Claude's JSON output with `jq` or programming language JSON parsers for automated decision making.

**Commands**:

```bash
# Extract function names from code analysis
FUNCTIONS=$(claude -p "list all exported functions in src/utils.ts" --output-format json | jq -r '.functions[]')

# Count TypeScript errors
ERROR_COUNT=$(claude -p "check for type errors" --output-format json | jq '.errors | length')

# Extract specific field
COMPLEXITY=$(claude -p "calculate cyclomatic complexity" --output-format json | jq '.complexity')
```

**Key Takeaway**: Pipe Claude JSON output to `jq` for field extraction. Use in scripts for automated decision making.

**Why It Matters**: JSON parsing enables conditional logic in automation - "if complexity > 10, reject PR". Extract specific metrics for reporting dashboards and alerting. Common in CI/CD: `if [ $ERROR_COUNT -gt 0 ]; then exit 1; fi` to fail builds on Claude-detected issues. Build custom quality gates that combine Claude's semantic understanding with jq's data manipulation for sophisticated automated decision-making.

### Example 12: Session Management in Automation

Control session behavior with `--session-id` (explicit ID), `--no-session-persistence` (don't save), `--fork-session` (branch from existing).

**Commands**:

```bash
# Explicit session ID for reproducibility
claude -p "analyze code" --session-id "550e8400-e29b-41d4-a716-446655440000"
                                    # => Uses specific UUID
                                    # => Resumable with same ID

# Don't save session (one-off operation)
claude -p "quick check" --no-session-persistence
                                    # => Runs query
                                    # => Does NOT save to disk
                                    # => No session recovery

# Fork from existing session
claude -r "main-session" --fork-session -p "experiment with new approach"
                                    # => Loads main-session context
                                    # => Creates new session ID
                                    # => Original session unchanged
```

**Key Takeaway**: Control session lifecycle with `--session-id`, `--no-session-persistence`, `--fork-session`.

**Why It Matters**: Session management enables advanced automation patterns suited for production workflows. Explicit session IDs make CI/CD builds reproducible and debuggable. No-persistence mode prevents one-off analysis checks from polluting session history. Session forking enables A/B experimentation - try JWT vs session authentication from identical starting context. Use session management to control AI state with the same rigor applied to application state.

## npm Scripts Integration (Examples 13-18)

### Example 13: npm Script Calling Claude for Code Generation

Wrap Claude commands in package.json scripts for team-wide automation. Everyone runs same Claude operations consistently.

**Commands**:

```json
// package.json
{
  "scripts": {
    "generate:model": "claude -p 'create User model with TypeScript types'"
  }
}
```

```bash
npm run generate:model             # => Executes Claude command
                                    # => Generates User model
                                    # => Output to stdout
                                    # => Team uses same command
```

**Key Takeaway**: Add Claude commands to package.json scripts. Standardizes automation across team.

**Why It Matters**: npm scripts document Claude usage patterns. New team members discover available automations via `npm run`. Consistency - everyone uses same prompts, gets same results. Version control tracks changes to automation commands. This lowers the barrier to AI adoption - team members don't need to remember Claude flags, just run `npm run <task>`.

### Example 14: npm Script for Documentation Generation

Automate documentation generation with npm scripts calling Claude to analyze code and generate docs.

**Commands**:

```json
// package.json
{
  "scripts": {
    "docs:generate": "claude -p 'generate API documentation from src/api/*.ts' --output-format json > docs/api.json"
  }
}
```

```bash
npm run docs:generate              # => Claude analyzes API files
                                    # => Generates JSON documentation
                                    # => Saves to docs/api.json
                                    # => Automated doc generation
```

**Key Takeaway**: npm scripts + Claude enable automated documentation generation. Output to files with `>` redirection.

**Why It Matters**: Manual documentation consistently falls out of sync with code as the codebase evolves. Automated generation through npm scripts keeps documentation current with minimal effort. Run `npm run docs:generate` before releases to produce fresh documentation. CI/CD pipelines can validate that generated docs match actual code structure, making documentation drift detectable as a build failure rather than a production surprise.

### Example 15: npm Script with Environment Variables

Pass configuration to Claude via environment variables. Useful for model selection, custom prompts, or feature flags.

**Commands**:

```json
// package.json
{
  "scripts": {
    "analyze:fast": "CLAUDE_MODEL=haiku npm run analyze",
    "analyze:thorough": "CLAUDE_MODEL=sonnet npm run analyze",
    "analyze": "claude -p 'analyze codebase for issues' --model $CLAUDE_MODEL"
  }
}
```

```bash
npm run analyze:fast               # => Uses Haiku model (faster, cheaper)
npm run analyze:thorough           # => Uses Sonnet model (thorough, slower)
```

**Key Takeaway**: Use environment variables to configure Claude commands. Different scripts can customize behavior.

**Why It Matters**: Environment variables enable flexible automation that adapts to different contexts without code changes. Use the same base command with different model configurations - Haiku for fast development feedback, Sonnet for thorough CI/CD analysis. This pattern matches how teams configure application environments: dev, staging, and production each have appropriate performance and cost tradeoffs. Selecting the right model per context reduces AI costs while maintaining quality.

### Example 16: npm Script Error Handling

Handle Claude errors in npm scripts with exit codes and conditional logic. Fail builds on Claude-detected issues.

**Commands**:

```json
// package.json
{
  "scripts": {
    "validate": "claude -p 'check for type errors' --output-format json > errors.json && [ $(jq '.errors | length' errors.json) -eq 0 ]",
    "test:ai": "claude -p 'validate test coverage' || (echo 'AI validation failed' && exit 1)"
  }
}
```

```bash
npm run validate                   # => Runs Claude validation
                                    # => Exits 0 if no errors
                                    # => Exits 1 if errors found
                                    # => npm reports success/failure
```

**Key Takeaway**: Use exit codes for error handling. Chain commands with `&&` (success) or `||` (failure).

**Why It Matters**: Error handling in npm scripts enables automated quality gates that prevent problematic code from merging. Fail CI/CD builds on Claude-detected issues including type errors, missing tests, and security vulnerabilities. Automated quality enforcement means code cannot merge if validation fails, shifting the enforcement burden from human reviewers to automated systems. Exit code propagation ensures Claude failures surface correctly in CI/CD dashboards.

### Example 17: npm Script Chaining Multiple Claude Commands

Chain multiple Claude commands in sequence. Each step uses output from previous step.

**Commands**:

```json
// package.json
{
  "scripts": {
    "full-analysis": "claude -p 'analyze architecture' > arch.txt && claude -c -p 'suggest improvements based on analysis' > improvements.txt && claude -c -p 'prioritize improvements by impact' > priorities.txt"
  }
}
```

```bash
npm run full-analysis              # => Step 1: Analyze architecture → arch.txt
                                    # => Step 2: Suggest improvements → improvements.txt
                                    # => Step 3: Prioritize → priorities.txt
                                    # => Each step continues previous conversation
```

**Key Takeaway**: Chain commands with `&&`. Use `claude -c -p` for context continuation across commands.

**Why It Matters**: Multi-step pipelines enable complex automation where each stage specializes in one aspect of the workflow. Analysis informs planning, planning drives implementation, implementation triggers testing. Context preservation across chained commands means Claude accumulates understanding as the pipeline progresses. Build comprehensive quality pipelines combining analysis, prioritization, implementation, and verification into a single reproducible workflow executed consistently across the team.

### Example 18: npm Script Output Capture and Processing

Capture Claude output to files, then process with standard Unix tools or other scripts.

**Commands**:

```json
// package.json
{
  "scripts": {
    "extract-deps": "claude -p 'list all npm dependencies with versions' --output-format json > deps.json && jq '.dependencies[]' deps.json > deps-list.txt"
  }
}
```

```bash
npm run extract-deps               # => Claude analyzes package.json
                                    # => Outputs JSON to deps.json
                                    # => jq extracts dependency list
                                    # => Saves to deps-list.txt
```

**Key Takeaway**: Capture Claude output with `>`, process with downstream tools (`jq`, `grep`, custom scripts).

**Why It Matters**: Output capture enables seamless integration with existing toolchains - Claude becomes one intelligence stage in a larger pipeline. Example: Claude analysis → jq filtering → dashboard upload → Slack notification. This leverages Unix philosophy of composing simple tools for complex workflows. Integrate Claude Code into existing CI/CD infrastructure without rewriting pipelines, incrementally adding AI capability to proven automation.

## Git Hooks with Claude Code (Examples 19-20)

### Example 19: Pre-commit Hook Using Claude for Validation

Run Claude validation before commits. Prevents committing code with detected issues.

**Commands**:

```bash
# .husky/pre-commit
#!/bin/bash
claude -p "validate staged files for issues" --output-format json > /tmp/validation.json

ISSUES=$(jq '.issues | length' /tmp/validation.json)

if [ "$ISSUES" -gt 0 ]; then
  echo "❌ Claude detected issues:"
  jq '.issues[]' /tmp/validation.json
  exit 1
fi

echo "✅ Claude validation passed"
```

```bash
git add src/api/users.ts
git commit -m "add user endpoint"
                                    # => Pre-commit hook runs
                                    # => Claude validates users.ts
                                    # => If issues: blocks commit, shows errors
                                    # => If clean: allows commit
```

**Key Takeaway**: Use Claude in pre-commit hooks to validate code before committing. Exit 1 blocks commit, exit 0 allows it.

**Why It Matters**: Pre-commit validation prevents problematic code from entering version control where it costs more to fix. Catching issues at commit time provides immediate feedback compared to discovering problems during CI/CD runs minutes later. Claude validates for type errors, missing tests, and security vulnerabilities before the code leaves the developer's machine. This shift-left approach reduces rework and keeps the main branch consistently clean.

### Example 20: Pre-push Hook Using Claude for Code Review

Run Claude code review before pushing. Ensures code quality before sharing with team.

**Commands**:

```bash
# .husky/pre-push
#!/bin/bash
FILES=$(git diff --name-only origin/main...HEAD)

for FILE in $FILES; do
  REVIEW=$(claude -p "review $FILE for code quality issues" --output-format json)
  SEVERITY=$(echo "$REVIEW" | jq -r '.max_severity')

  if [ "$SEVERITY" = "high" ] || [ "$SEVERITY" = "critical" ]; then
    echo "❌ Critical issues in $FILE"
    echo "$REVIEW" | jq '.issues[]'
    exit 1
  fi
done

echo "✅ Claude review passed"
```

```bash
git push                           # => Pre-push hook runs
                                    # => Claude reviews changed files
                                    # => If critical issues: blocks push
                                    # => If acceptable: allows push
```

**Key Takeaway**: Use Claude in pre-push hooks to review code before sharing. Block push on critical issues.

**Why It Matters**: Pre-push review provides a final automated code review gate before code reaches teammates. Claude catches quality issues, security problems, and anti-patterns that survive unit tests. This reduces human review burden significantly - reviewers focus on architecture, business logic, and design decisions rather than style violations or common mistakes. Teams report higher code review quality when routine issues are filtered out automatically.

## Workflow Management (Examples 21-30)

### Example 21: Managing Conversation History

View previous messages to recall earlier decisions or code snippets. Conversation history helps maintain continuity across sessions.

**Commands**:

```bash
# In Claude session - scroll up to view history
                                    # => Terminal shows previous messages
                                    # => Your prompts and Claude responses
                                    # => Code blocks generated earlier
                                    # => Tool usage logs (Read, Write, Edit, Bash)
                                    # => Useful for recalling earlier implementations
```

**Key Takeaway**: Scroll terminal to review conversation history. Helpful for recalling earlier code or decisions before making related changes.

**Why It Matters**: Conversation history serves as live session documentation showing every decision and change made during a work session. When debugging, scroll through history to identify exactly what Claude modified and why. This makes AI-assisted development auditable - every code change has traceable rationale in the conversation log. Teams use conversation history during postmortems to reconstruct the reasoning behind production changes.

### Example 22: Asking Follow-Up Questions

Chain questions for deeper understanding. Follow-ups clarify details, explore alternatives, or request elaboration on initial responses.

**Commands**:

```bash
You: Explain the difference between map and forEach in JavaScript
                                    # => Claude explains: map returns array, forEach returns undefined
You: When should I use map over forEach?
                                    # => Claude explains: Use map for transformations, forEach for side effects
You: Show me an example of each
                                    # => Claude provides code examples:
                                    # =>   map: const doubled = nums.map(n => n * 2);
                                    # =>   forEach: nums.forEach(n => console.log(n));
You: What about performance differences?
                                    # => Claude discusses: Minimal difference, choice is semantic
```

**Key Takeaway**: Ask follow-up questions to explore topics deeply. Each question builds on previous context without re-explaining.

**Why It Matters**: Follow-up questioning enables Socratic learning where understanding deepens through dialogue rather than passive reading. Each question builds on previous context, allowing increasingly specific investigation. This mirrors the learning pattern of pair programming where a senior developer explains decisions in response to junior questions. The interactive format improves retention compared to documentation reading because questions are driven by genuine curiosity about real code.

### Example 23: Canceling Operations

Stop Claude mid-execution if you realize the request is incorrect or unnecessary. Ctrl+C cancels current operation.

**Commands**:

```bash
You: Delete all files in src/components/
                                    # => Claude starts analyzing files to delete
                                    # => You realize this was wrong request
^C                                  # => Press Ctrl+C to cancel
                                    # => Claude stops execution
                                    # => No files deleted (operation interrupted)
You: Sorry, I meant to say: delete only the unused components
                                    # => Claude asks: "Which components are unused?"
```

**Key Takeaway**: Press Ctrl+C to cancel operations in progress. Useful when you realize request was wrong or too broad.

**Why It Matters**: Cancel capability prevents destructive operations from completing when you spot errors mid-execution. This safety net fundamentally changes how developers work with AI - you can send broad requests and cancel if the approach diverges from intent. The ability to interrupt encourages experimentation with ambitious refactoring requests, knowing you retain control. This reduces hesitation to use AI for complex, high-risk operations.

### Example 24: Checking Project Status

Request git status or file listings to understand current project state before making changes.

**Commands**:

```bash
You: Show me git status
                                    # => Claude runs: git status
                                    # => Output:
                                    # => On branch feature/user-auth
                                    # => Changes not staged for commit:
                                    # =>   modified:   src/api/auth.ts
                                    # =>   modified:   src/models/User.ts
                                    # => Untracked files:
                                    # =>   src/middleware/authenticate.ts
You: List files in src/components/
                                    # => Claude runs: ls src/components/
                                    # => Output: Button.tsx  Input.tsx  Modal.tsx
```

**Key Takeaway**: Request status checks before making changes. Claude uses Bash tool to run git status, ls, or other inspection commands.

**Why It Matters**: Status checks prevent common mistakes like working on the wrong branch or overwriting uncommitted changes. AI-driven status checks integrate context gathering naturally into conversation flow rather than requiring separate terminal commands. This is especially valuable when returning to a project after a break - a single question retrieves full project state including branch, modified files, and pending changes, eliminating manual reconnaissance.

### Example 25: Clearing Context for Fresh Start

Exit and restart Claude to clear conversation context. Useful when switching to unrelated task or after very long conversation.

**Commands**:

```bash
You: exit                           # => Exits Claude session
                                    # => All conversation context cleared
                                    # => Returns to regular terminal
claude                              # => Start fresh session
                                    # => New conversation with empty context
                                    # => Loads .claude/ config again
You: Create a Python script for data analysis
                                    # => No context from previous TypeScript work
                                    # => Fresh start for Python project
```

**Key Takeaway**: Exit and restart Claude to clear conversation context. Useful for switching projects or tasks.

**Why It Matters**: Fresh context prevents AI from applying patterns from one conversation to an unrelated new task, which causes confusing recommendations. When working across multiple projects, separate sessions maintain clean task isolation. However, exiting loses conversation history permanently - weigh context cleanup against history preservation based on project continuity needs. For distinct projects, always start fresh; for continuing work on the same feature, use session resumption.

### Example 26: Basic Refactoring - Extract Variable

Request variable extraction to improve code readability. Claude names extracted variable semantically based on value or usage.

**Commands**:

```bash
You: Extract the magic number 86400 into a named constant in src/utils/time.ts
                                    # => Claude reads file
                                    # => Sees: const expiresIn = currentTime + 86400;
                                    # => Extracts constant:
                                    # =>   const SECONDS_PER_DAY = 86400;
                                    # => Updates usage:
                                    # =>   const expiresIn = currentTime + SECONDS_PER_DAY;
                                    # => Adds constant at top of file
```

**Key Takeaway**: Claude extracts magic numbers/strings into named constants. Chooses semantic names based on value meaning and usage context.

**Why It Matters**: Named constants dramatically improve code maintainability - change a value in one place rather than hunting for scattered magic numbers. AI extraction identifies all occurrences of literal values across the entire codebase, including cases humans miss. Semantic naming (SECONDS_PER_DAY vs 86400) communicates intent to future readers. This readability improvement compounds over time as more constants are extracted and reused.

### Example 27: Adding Error Handling

Request error handling additions to existing code. Claude wraps operations in try-catch blocks and adds appropriate error logging or user feedback.

```mermaid
graph TD
    A[Existing Code] -->|Read| B[Analyze Operation]
    B -->|Identify| C[Database Query]
    C -->|Wrap| D[Add Try-Catch]
    D -->|Success Path| E[Return JSON Response]
    D -->|Error Path| F[Log Error]
    F -->|Return| G[500 Error Response]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#CA9161,stroke:#000,color:#fff
    style G fill:#CA9161,stroke:#000,color:#fff
```

**Commands**:

```bash
You: Add error handling to the database query in src/api/users.ts
                                    # => Claude reads file
                                    # => Finds: const users = await db.query('SELECT * FROM users');
                                    # => Wraps in try-catch:
                                    # =>   try {
                                    # =>     const users = await db.query('SELECT * FROM users');
                                    # =>     return res.json(users);
                                    # =>   } catch (error) {
                                    # =>     console.error('Database query failed:', error);
                                    # =>     return res.status(500).json({ error: 'Internal server error' });
                                    # =>   }
```

**Key Takeaway**: Claude adds try-catch blocks with appropriate error responses. Considers operation type (API vs utility) for error handling strategy.

**Why It Matters**: Comprehensive error handling is tedious to add manually but critical for production robustness and user experience. AI adds try-catch blocks consistently across the codebase, following existing project patterns for error responses and logging. Manual error handling is often inconsistent or incomplete - developers add it to new code but forget existing functions. AI-assisted addition ensures uniform coverage without extensive time investment from the team.

### Example 28: Generating README Files

Request README generation for projects or modules. Claude analyzes code structure to create documentation with setup instructions, usage examples, and API references.

**Commands**:

```bash
You: Create a README.md for this project
                                    # => Claude reads package.json, scans src/ structure
                                    # => Identifies main entry points and scripts
                                    # => Generates README.md with full project documentation
```

Claude generates `README.md` with structure based on actual project analysis:

```markdown
# Project Name # => From package.json "name" field

Description from package.json # => From package.json "description" field

## Installation

npm install # => Detected from package.json scripts

## Usage

npm start # => Detected from package.json "start" script

## Project Structure

src/ # => Overview of detected source structure
api/ # => Detected API layer
models/ # => Detected data models

## Scripts

- `npm test` - Run test suite # => From package.json "test" script
- `npm build` - Build for production # => From package.json "build" script
```

**Key Takeaway**: Claude generates README by analyzing project structure, package.json, and code organization. Includes setup, usage, and structure sections.

**Why It Matters**: README generation from actual project structure ensures documentation accuracy instead of relying on memory or outdated notes. Manual README writing is time-consuming and frequently becomes stale as the project evolves. AI generates a current snapshot reflecting the real project state. Generated READMEs serve as an accurate starting point that teams customize with project-specific context, business rationale, and decision documentation.

### Example 29: Creating .gitignore Files

Request .gitignore generation matching project technology stack. Claude includes common ignore patterns for detected languages and frameworks.

**Commands**:

```bash
You: Create a .gitignore file for this Node.js project
                                    # => Claude detects: Node.js + TypeScript
                                    # => Generates comprehensive .gitignore for detected stack
```

Claude generates `.gitignore` matching the detected technology stack:

```gitignore
# Node                              # => Package installation artifacts
node_modules/
npm-debug.log*

# TypeScript                        # => Compiled output and build cache
dist/
*.tsbuildinfo

# Environment                       # => Secret credentials - never commit these
.env
.env.local

# IDE                               # => Editor-specific settings (optional per team)
.vscode/
.idea/
```

**Key Takeaway**: Claude generates .gitignore with patterns for detected tech stack. Includes node_modules, build outputs, environment files, and IDE folders.

**Why It Matters**: Comprehensive .gitignore files prevent committing sensitive data and bloating repositories with build artifacts. AI-generated ignores include patterns developers frequently overlook, such as OS-specific files, editor configurations, and framework-specific temporary files. Missing .gitignore entries cause security incidents when credentials get committed and expensive repo repairs when node_modules gets tracked. Prevention is far simpler than remediation after sensitive data enters version control history.

### Example 30: Exiting Claude Sessions

Exit interactive mode to return to regular terminal. Session context is lost, but can restart Claude anytime.

**Commands**:

```bash
You: exit                           # => Exits Claude Code session
                                    # => Returns to regular terminal prompt
                                    # => All conversation context cleared
                                    # => Files created/modified remain
                                    # => Can restart with: claude
$ pwd                               # => Back in normal terminal
/home/user/projects/my-app          # => Regular shell commands work
$ claude                            # => Restart Claude for new session
                                    # => Fresh context, no memory of previous session
```

**Key Takeaway**: Use `exit` command or Ctrl+D to leave Claude session. Returns to regular terminal, conversation context cleared.

**Why It Matters**: Explicit exit enables controlled session boundaries, creating clear transitions between AI-assisted and manual workflows. Work with Claude for complex tasks, then return to the terminal for git operations, deployment, or work that benefits from manual control. Clean separation prevents over-reliance on AI for simple tasks where direct commands are faster. Maintaining core terminal proficiency ensures you remain effective when AI assistance is unavailable.

## Next Steps

This beginner tutorial covered Examples 1-30 (0-40% of Claude Code capabilities). You learned interactive session management, basic code generation, file operations, and essential workflows for AI-assisted development.

**Continue learning**:

- [Intermediate](/en/learn/software-engineering/automation-tools/claude-code/by-example/intermediate) - Examples 31-60 covering agent configuration, advanced refactoring, and testing workflows
- [Advanced](/en/learn/software-engineering/automation-tools/claude-code/by-example/advanced) - Examples 61-85 covering custom agents, production orchestration, and enterprise integration patterns
