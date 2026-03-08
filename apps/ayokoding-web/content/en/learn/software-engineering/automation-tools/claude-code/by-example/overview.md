---
title: "Overview"
date: 2026-02-02T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Claude Code CLI through 85 heavily annotated examples: interactive mode, print mode (`-p`), npm scripts, git hooks, CI/CD integration, and custom agents (95% coverage)"
tags: ["claude-code", "by-example", "tutorial", "cli", "automation", "ci-cd", "agents"]
---

**Learn the Claude Code CLI by doing.** This by-example tutorial teaches the `claude` command - the AI coding assistant you control from the terminal - through 85 heavily annotated, self-contained examples achieving 95% coverage. Master interactive usage, non-interactive automation (`-p` flag), npm scripts, git hooks, GitHub Actions, and custom agent patterns.

## What is By Example?

By Example is a **code-first learning approach** designed for experienced developers who want to master Claude Code efficiently. Instead of lengthy explanations followed by examples, you'll see complete, runnable command sequences with inline annotations explaining what each interaction does and why it matters.

**Target audience**: Developers with command-line experience who want to integrate AI assistance into their workflow and understand Claude Code's full capabilities.

## How This Tutorial Works

### Structure

- **[Beginner](/en/learn/software-engineering/automation-tools/claude-code/by-example/beginner)** (Examples 1-30): `claude` command fundamentals, interactive mode, print mode (`-p`), npm scripts, git hooks - 0-40% coverage
- **[Intermediate](/en/learn/software-engineering/automation-tools/claude-code/by-example/intermediate)** (Examples 31-60): GitHub Actions, CI/CD pipelines, multi-language subprocess integration (Python/Node/Java/Go) - 40-75% coverage
- **[Advanced](/en/learn/software-engineering/automation-tools/claude-code/by-example/advanced)** (Examples 61-85): Custom agents (`--agents`), MCP servers, production orchestration, configuration management - 75-95% coverage

### Example Format

Each example follows a five-part structure:

1. **Brief explanation** (2-3 sentences) - What is this pattern and why does it matter?
2. **Diagram** (when appropriate) - Visual representation of workflow or interaction
3. **Heavily annotated commands/code** - Complete, runnable examples with inline `# =>` annotations
4. **Key takeaway** (1-2 sentences) - The essential insight distilled
5. **Why it matters** (50-100 words) - Production relevance and real-world impact

### Example: Annotation Style

```bash
# Start interactive session
claude                              # => Launches Claude Code CLI
                                    # => Enters conversation mode
                                    # => Ready to accept natural language prompts

# Ask for code generation
You: Create a Python function to validate email addresses
                                    # => Claude Code analyzes request
                                    # => Generates function with regex validation
                                    # => Offers to explain or create tests

# Review generated code
                                    # => Claude Code shows complete function
                                    # => Includes imports, docstring, examples
                                    # => Asks for confirmation before writing

# Accept and write file
You: Yes, write it to utils/validation.py
                                    # => Creates utils/ directory if needed
                                    # => Writes function to file
                                    # => Updates project index
                                    # => Confirms completion
```

## What You'll Learn

### Coverage: 95% of Claude Code for Production Work

**Included**:

- Core commands (interactive mode, file operations, status checks)
- Conversation patterns (asking questions, refining requests, context management)
- Code generation (functions, classes, modules, tests)
- File operations (read, write, edit, search, refactor)
- Terminal integration (running commands, interpreting output)
- Workflow patterns (debugging, refactoring, documentation)
- Multi-file operations (codebase analysis, coordinated changes)
- Advanced prompting (context injection, style guides, constraints)
- Error handling (understanding failures, iteration strategies)
- Best practices (security, performance, maintainability)

**Excluded (the 5% edge cases)**:

- Rarely-used configuration options
- Platform-specific advanced features
- Internal API implementation details
- Experimental or deprecated features

## Self-Contained Examples

**Every example is copy-paste-runnable.** Each example includes:

- Complete command sequences
- All necessary context and setup
- Expected outputs and responses
- No references to previous examples (you can start anywhere)

**Example independence**: You can jump to Example 42, copy the commands, run them, and understand the pattern without reading Examples 1-41.

## Why Command-First?

Traditional tutorials explain concepts, then show commands. By Example inverts this:

1. **See the commands first** - Complete, working interaction
2. **Run it immediately** - Verify it works in your environment
3. **Read annotations** - Understand what each step does
4. **Absorb the pattern** - Internalize through direct interaction

**Benefits**:

- **Faster learning** - No walls of text before seeing actual commands
- **Immediate verification** - Run commands to confirm understanding
- **Reference-friendly** - Come back later to find specific patterns
- **Production-focused** - Examples use real-world workflows, not toy scenarios

## How to Use This Tutorial

### If You're New to AI Coding Tools

Start with [Quick Start](/en/learn/software-engineering/automation-tools/claude-code/quick-start) first, then return to By Example for comprehensive coverage.

### If You Know Command-Line Tools

Jump straight into **Beginner** examples. You'll recognize command patterns but see AI-specific workflows and best practices.

### If You've Used AI Assistants Before

Start with **Intermediate** or **Advanced** based on your comfort level. Each example is self-contained, so you won't get lost.

### As a Reference

Use the example index to find specific topics (e.g., "How do I debug with Claude Code?" → Example 47).

## Comparison to Narrative Tutorials

| Aspect               | By Example (This Tutorial)         | Narrative Tutorial                  |
| -------------------- | ---------------------------------- | ----------------------------------- |
| **Approach**         | Command-first (show, then explain) | Explanation-first (tell, then show) |
| **Target Audience**  | Experienced developers             | Beginners and intermediate          |
| **Coverage**         | 95% (comprehensive)                | 60-85% (focused depth)              |
| **Example Count**    | 85 examples                        | 15-30 examples                      |
| **Learning Style**   | Run commands, understand output    | Read explanation, see examples      |
| **Use as Reference** | Excellent (self-contained)         | Moderate (sequential narrative)     |

**Both are valid approaches.** Choose based on your learning style and experience level.

## Diagrams and Visualizations

Approximately 40% of examples include Mermaid diagrams visualizing:

- Conversation flow (user request → AI response → file operation)
- Multi-file refactoring workflows
- Context management and indexing
- Error handling and iteration patterns
- Workflow optimization strategies

All diagrams use a color-blind friendly palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161) meeting WCAG AA accessibility standards.

## Prerequisites

- **Claude Code installed and configured** - See [Initial Setup](/en/learn/software-engineering/automation-tools/claude-code/initial-setup)
- **Command-line experience** - Comfortable using terminal, running commands
- **Programming knowledge** - Familiarity with at least one programming language
- **Git basics** - Understanding version control for experimentation

**No prior AI coding experience required** - Examples start from fundamentals.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Initial Setup<br/>0-5%"]
    B["Quick Start<br/>5-30%"]
    C["By Example: Beginner<br/>0-40%<br/>Examples 1-30"]
    D["By Example: Intermediate<br/>40-75%<br/>Examples 31-60"]
    E["By Example: Advanced<br/>75-95%<br/>Examples 61-85"]

    A --> B
    B --> C
    C --> D
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

## What's Next?

Ready to start learning? Choose your entry point:

- **New to Claude Code?** → [Beginner Examples (1-30)](/en/learn/software-engineering/automation-tools/claude-code/by-example/beginner)
- **Know the basics?** → [Intermediate Examples (31-60)](/en/learn/software-engineering/automation-tools/claude-code/by-example/intermediate)
- **Experienced with AI tools?** → [Advanced Examples (61-85)](/en/learn/software-engineering/automation-tools/claude-code/by-example/advanced)

## Learning Progression

We measure progress by **coverage depth**, not time:

- **Beginner**: 0-40% coverage through 30 examples (essential commands, basic workflows)
- **Intermediate**: 40-75% coverage through 30 examples (production patterns, advanced features)
- **Advanced**: 75-95% coverage through 25 examples (expert techniques, optimization)

Work at your own pace. Move through examples as you build confidence with each pattern.

## Key Principles

1. **Every example is runnable** - Copy, paste, run, verify
2. **Annotations explain WHY** - Understand the reasoning, not just commands
3. **Self-contained is non-negotiable** - No hunting for context in other examples
4. **Production patterns, not toys** - Real-world workflows you'll actually use
5. **Modern Claude Code** - Latest CLI version, contemporary best practices

## AI-Assisted Development Benefits

Throughout examples, you'll see how Claude Code provides:

- **Speed** - Generate boilerplate and common patterns instantly
- **Understanding** - Explain unfamiliar code in plain language
- **Quality** - Follow best practices automatically
- **Learning** - Discover new patterns and techniques
- **Confidence** - Validate approaches before implementation
- **Efficiency** - Reduce context switching and manual work

## Feedback and Improvements

Found an error? See a better way to use Claude Code? Examples are continuously improved based on user feedback and new Claude Code features.

**Let's start coding with AI!** Choose your level and dive into the examples.
