# Canonical skills

Skills are short, reusable guides that give an AI agent the right context at
the right moment: an agent loads the relevant skill instead of carrying every
repository convention into every task.

New here? Begin with [AGENTS.md](../../AGENTS.md).

## Read a skill before using it

Each skill has a `SKILL.md` file. Read it in full before acting on it; it may
point to a reference or a supplied script that is part of the workflow. A
typical package looks like this:

```text
skill-name/
├── SKILL.md       # required entry point
├── reference/     # optional focused detail
├── scripts/       # optional task helpers
└── assets/        # optional reusable material
```

## Source and platform behaviour

`.agents/skills/` is the hand-authored canonical source for these skill packages.
The declared Claude adapter routes to this tree; no platform receives a copied
skill body. Never create or hand-edit `.opencode/skills/` mirrors. After a
skill changes, regenerate and verify with `./rhino harness adapters generate`
and `./rhino harness adapters validate`.
See [Platform bindings](../../docs/reference/platform-bindings.md).

## Keep a new skill useful

Give it one clear job. Put the essential procedure in `SKILL.md`; link to
deeper material instead of repeating it. State boundaries, especially around
generated files, credentials, and destructive actions. See
[AI agents](../../repo-governance/development/agents/ai-agents.md) and the agent-development skill
below.

## Skill Catalog

### Docs, tutorials, and README

- [Docs Applying Content Quality](./docs-applying-content-quality/README.md) — universal markdown quality: voice, headings, accessibility
- [Docs Applying Diataxis Framework](./docs-applying-diataxis-framework/README.md) — tutorials, how-to, reference, explanation categories
- [Docs Authoring Standards](./docs-authoring-standards/README.md) — docs-maker's authoring checklist and frontmatter template
- [Docs Converting Pdf To Markdown](./docs-converting-pdf-to-markdown/README.md) — PDF-to-Markdown conversion fidelity via the crane CLI
- [Docs Creating Accessible Diagrams](./docs-creating-accessible-diagrams/README.md) — WCAG-compliant Mermaid diagrams with accessible palette
- [Docs Creating Annotated Concept Tutorials](./docs-creating-annotated-concept-tutorials/README.md) — Annotated-concept tutorial format standards
- [Docs Creating By Example Tutorials](./docs-creating-by-example-tutorials/README.md) — by-example tutorials with 75-85 annotated code examples
- [Docs Creating In The Field Tutorials](./docs-creating-in-the-field-tutorials/README.md) — production implementation guides, 20-40 per topic
- [Docs Creating Tutorial Structure](./docs-creating-tutorial-structure/README.md) — docs-tutorial-maker's seven-type, seven-section methodology
- [Docs Fixing Factual Accuracy](./docs-fixing-factual-accuracy/README.md) — re-validating and applying docs-checker factual findings
- [Docs Fixing Tutorial Quality](./docs-fixing-tutorial-quality/README.md) — applying validated docs-tutorial-checker findings
- [Docs Managing File Operations](./docs-managing-file-operations/README.md) — safely renaming, moving, deleting docs/ files
- [Docs Validating Factual Accuracy](./docs-validating-factual-accuracy/README.md) — verifying factual correctness via WebSearch/WebFetch
- [Docs Validating Links](./docs-validating-links/README.md) — markdown link validation methodology
- [Docs Validating Software Engineering Separation](./docs-validating-software-engineering-separation/README.md) — OSE-vs-AyoKoding documentation separation rules
- [Readme Fixing Quality](./readme-fixing-quality/README.md) — applying validated readme-checker findings
- [Readme Writing Readme Files](./readme-writing-readme-files/README.md) — README quality: hooks, plain language, scannability

### Plans

- [Grill Me](./grill-me/README.md) — interview the user via structured multiple-choice grilling
- [Plan Creating Project Plans](./plan-creating-project-plans/README.md) — project plan structure, naming, and grilling gates
- [Plan Grooming Idea Briefs](./plan-grooming-idea-briefs/README.md) — converging plans/ideas/ into deduplicated two-pagers
- [Plan Validating Quality](./plan-validating-quality/README.md) — plan-checker's 21-rule validation methodology
- [Plan Verifying Execution](./plan-verifying-execution/README.md) — post-execution verification, sibling to Plan Validating Quality
- [Plan Writing Gherkin Criteria](./plan-writing-gherkin-criteria/README.md) — Gherkin Given-When-Then acceptance criteria

### Software engineering

The [repository adapter](../../repo-governance/development/quality/stacks/repository-adapter.md) maps stack skills to projects.

- [Developing Applications](./developing-applications/README.md) — language-agnostic application judgement
- [Developing Frontend UI](./developing-frontend-ui/README.md) — UI tokens, composition, accessibility
- [Framework ASP.NET Core](./framework-aspnet-core/README.md) — ASP.NET Core stack skill
- [Framework Gin](./framework-gin/README.md) — Gin stack skill
- [Framework Giraffe](./framework-giraffe/README.md) — Giraffe stack skill
- [Framework Next.js](./framework-nextjs/README.md) — Next.js stack skill
- [Framework React](./framework-react/README.md) — React stack skill
- [Framework Spring Boot](./framework-spring-boot/README.md) — Spring Boot stack skill
- [Programming C#](./programming-csharp/README.md) — C# stack skill
- [Programming F#](./programming-fsharp/README.md) — F# stack skill
- [Programming Go](./programming-golang/README.md) — Go stack skill
- [Programming Java](./programming-java/README.md) — Java stack skill
- [Programming JavaScript](./programming-javascript/README.md) — JavaScript stack skill
- [Programming Python](./programming-python/README.md) — Python stack skill
- [Programming Shell](./programming-shell/README.md) — shell stack skill
- [Programming TypeScript](./programming-typescript/README.md) — TypeScript stack skill
- [Tooling Nx](./tooling-nx/README.md) — Nx workspace stack skill
- [Writing Browser E2E Tests](./writing-browser-e2e-tests/README.md) — Playwright browser end-to-end tests

### App content and deploy

- [Apps Ayokoding Www Authoring Annotated Concept](./apps-ayokoding-www-authoring-annotated-concept/README.md) — Annotated-concept authoring for ayokoding-web
- [Apps Ayokoding Www Developing Content](./apps-ayokoding-www-developing-content/README.md) — ayokoding-web bilingual content development guide
- [Apps Deploying Vercel Branches](./apps-deploying-vercel-branches/README.md) — shared deployer-agent branch force-push procedure
- [Apps Organiclever Www Developing Content](./apps-organiclever-www-developing-content/README.md) — organiclever-www feature-context/PGlite/Effect TS development
- [Apps Ose Www Developing Content](./apps-ose-www-developing-content/README.md) — ose-web content creation conventions

### PR review pipeline

- [Pr Review Fixer Resolution](./pr-review-fixer-resolution/README.md) — pr-review-fixer's thread-resolution triage
- [Pr Review Scout Classification](./pr-review-scout-classification/README.md) — pr-review-scout-maker's risk-tier classification
- [Pr Review Specialist Protocol](./pr-review-specialist-protocol/README.md) — shared protocol for the nine discipline specialists
- [Pr Review Synthesis Coordination](./pr-review-synthesis-coordination/README.md) — pr-review-synthesis-maker's dedup and posting

### Web and API testing

- [Api Testing Exploratory Methodology](./api-testing-exploratory-methodology/README.md) — api-exploratory-tester's contract-aware testing methodology
- [Web Testing Design Fidelity](./web-testing-design-fidelity/README.md) — web-design-tester's design-fidelity methodology
- [Web Testing Exploratory Methodology](./web-testing-exploratory-methodology/README.md) — web-exploratory-tester's spec-aware testing methodology
- [Web Testing Usability Heuristics](./web-testing-usability-heuristics/README.md) — web-usability-tester's Nielsen heuristics evaluation

### Repository, CI, and governance

- [Agent Developing Agents](./agent-developing-agents/README.md) — AI agent frontmatter, naming, tool-access standards
- [Ci Standards](./ci-standards/README.md) — CI/CD compliance knowledge
- [Harness Compatibility Protocol](./harness-compatibility-protocol/README.md) — cross-vendor harness parity invariants
- [Repo Applying Maker Checker Fixer](./repo-applying-maker-checker-fixer/README.md) — Maker/Checker/Fixer three-stage workflow pattern
- [Repo Assessing Criticality Confidence](./repo-assessing-criticality-confidence/README.md) — criticality x confidence classification system
- [Repo Defining Workflows](./repo-defining-workflows/README.md) — workflow-pattern frontmatter and execution phases
- [Repo Generating Validation Reports](./repo-generating-validation-reports/README.md) — validation report format: UUIDs, timestamps
- [Repo Maintaining Task Lists](./repo-maintaining-task-lists/README.md) — open the harness's native task list before any task and keep it in sync
- [Repo Practicing Trunk Based Development](./repo-practicing-trunk-based-development/README.md) — Trunk Based Development and the worktree-to-pr default
- [Repo Propagating Rules](./repo-propagating-rules/README.md) — run the rules-propagation workflow whenever a rule is created, updated, or deleted
- [Repo Understanding Repository Architecture](./repo-understanding-repository-architecture/README.md) — six-layer governance hierarchy
- [Repo Understanding Shared Vocabulary](./repo-understanding-shared-vocabulary/README.md) — what repo rules, content trees, and delivery units cover
- [Rules Validating Governance](./rules-validating-governance/README.md) — rules-checker's repo-wide consistency methodology
- [Social Linkedin Posting](./social-linkedin-posting/README.md) — social-linkedin-post-maker's character-limit and workflow rules
- [Specs Scaffolding](./specs-scaffolding/README.md) — specs-maker's four surface-profile trees
- [Specs Validating Structure](./specs-validating-structure/README.md) — specs-checker's nine validation categories
