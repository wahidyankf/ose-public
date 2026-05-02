# Claude Code Skills

This directory contains skill packages that provide progressive knowledge delivery to agents. Skills bundle domain-specific conventions, standards, and best practices.

## Skill Organization

### 📚 Documentation Skills

- **docs-applying-content-quality** - Universal content quality standards (active voice, heading hierarchy, accessibility)
- **docs-applying-diataxis-framework** - Four-category documentation organization (Tutorials, How-To, Reference, Explanation)
- **docs-creating-accessible-diagrams** - Accessible Mermaid diagrams with color-blind friendly palette
- **docs-creating-by-example-tutorials** - By-example tutorial creation methodology
- **docs-creating-in-the-field-tutorials** - In-the-field tutorial creation methodology
- **docs-validating-factual-accuracy** - Factual verification methodology with web research
- **docs-validating-links** - Link validity checking and fixing procedures
- **docs-validating-software-engineering-separation** - Programming language docs separation validation

### 📋 README Skills

- **readme-writing-readme-files** - README-specific quality standards and structure

### 📝 Planning Skills

- **plan-creating-project-plans** - Project planning methodology and structure
- **plan-writing-gherkin-criteria** - Gherkin-style acceptance criteria writing

### 🤖 Agent Development Skills

- **agent-developing-agents** - Agent creation, reference documentation structure, and model selection standards

### 🔧 CI/CD Skills

- **ci-standards** - CI/CD standards including mandatory Nx targets, coverage thresholds, Docker setup, Gherkin consumption, and workflow files

### 🏗️ Repository Pattern Skills

- **repo-applying-maker-checker-fixer** - Three-stage quality workflow pattern
- **repo-assessing-criticality-confidence** - Criticality and confidence assessment system
- **repo-defining-workflows** - Workflow orchestration and multi-step process patterns
- **repo-generating-validation-reports** - Progressive report writing with UUID chains
- **repo-practicing-trunk-based-development** - Trunk-based development workflow
- **repo-syncing-with-ose-primer** - Directional classification, transforms, and safety invariants for content flow between `ose-public` (upstream) and `ose-primer` (downstream template)
- **repo-understanding-repository-architecture** - Six-layer governance hierarchy

### 💻 Development Workflow Skills

- **swe-developing-applications-common** - Common development workflow patterns shared across all language developers
- **swe-developing-frontend-ui** - UI component development standards — CVA variants, Radix composition, design tokens, accessibility, responsive design, and anti-patterns
- **swe-developing-e2e-test-with-playwright** - End-to-end testing with Playwright methodology and standards

### 🔤 Programming Language Skills

- **swe-programming-clojure** - Clojure coding standards quick reference
- **swe-programming-csharp** - C# coding standards quick reference
- **swe-programming-dart** - Dart coding standards quick reference
- **swe-programming-elixir** - Elixir, Phoenix Framework, and Phoenix LiveView coding standards
- **swe-programming-fsharp** - F# coding standards quick reference
- **swe-programming-golang** - Go coding standards quick reference
- **swe-programming-java** - Java, Spring Framework, and Spring Boot coding standards
- **swe-programming-kotlin** - Kotlin coding standards quick reference
- **swe-programming-python** - Python coding standards quick reference
- **swe-programming-rust** - Rust coding standards quick reference
- **swe-programming-typescript** - TypeScript coding standards quick reference

### 🌐 Site Development Skills

- **apps-ayokoding-web-developing-content** - AyoKoding content development standards (Next.js)
- **apps-organiclever-web-developing-content** - OrganicLever frontend content development standards
- **apps-oseplatform-web-developing-content** - OSE Platform content development standards

## Skill Structure

Each skill package follows this directory structure:

```
skill-name/
├── SKILL.md           # Primary content (injected when invoked)
├── reference.md       # Extended reference (optional)
├── examples.md        # Usage examples (optional)
└── checklists.md      # Quick checklists (optional)
```

## Inline vs Fork Skills

Skills operate in two modes:

**Inline Skills** (default):

- Inject knowledge into current conversation
- Progressive disclosure (name/description → full content on-demand)
- Enable knowledge composition (multiple skills work together)

**Fork Skills** (`context: fork`):

- Delegate tasks to agents in isolated subagent contexts
- Act as lightweight orchestrators
- Return summarized results to main conversation

See `repo-applying-maker-checker-fixer` skill for complete workflow patterns.

## Dual-Mode Operation

**Source of Truth**: This directory (`.claude/skills/`) is the PRIMARY source for both Claude Code AND OpenCode.

**No mirror copy**: Per [opencode.ai/docs/skills](https://opencode.ai/docs/skills/),
OpenCode reads `.claude/skills/<name>/SKILL.md` natively. `rhino-cli agents sync`
does NOT copy skills to `.opencode/skill/` or `.opencode/skills/`. Editing a
skill here is immediately visible to both systems on the next session start.

**Making Changes**:

1. Edit skills in `.claude/skills/` directory.
2. Restart any active Claude Code or OpenCode session to pick up changes.
3. The `validate:sync` command's `No Synced Skill Mirror` check fails if a
   stale `.opencode/skill/` or `.opencode/skills/<claude-name>` mirror reappears.

**See**: [CLAUDE.md](../../CLAUDE.md) for complete guidance, [apps/rhino-cli/README.md](../../apps/rhino-cli/README.md) for rhino-cli details

## Skills vs Agents

**Skills** are reusable knowledge packages that **serve agents** but don't govern them:

- Deliver domain-specific knowledge on-demand
- Bundle conventions, patterns, and standards
- Support both inline (knowledge injection) and fork (task delegation) modes
- Service relationship, NOT governance layer

**Agents** are autonomous executors that **use skills** as knowledge resources:

- Execute specific tasks (make, check, fix, deploy)
- Consume skills for domain expertise
- Follow conventions and practices (L2/L3 governance)
- Action-oriented, task-focused

**See**: [governance/repository-governance-architecture.md](../../governance/repository-governance-architecture.md) for complete architecture

## Governance Standards

All skills follow governance principles:

- **Documentation First** - Comprehensive guidance in SKILL.md
- **Progressive Disclosure** - Name/description → full content on-demand
- **Simplicity Over Complexity** - Single-purpose skills, clear scope
- **Explicit Over Implicit** - Clear when/how to use each skill

**See**: [governance/principles/README.md](../../governance/principles/README.md)
