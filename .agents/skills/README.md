# Canonical skills

Skills are short, reusable guides that give an AI agent the right context at
the right moment: an agent loads the relevant skill instead of carrying every
repository convention into every task.

New here? Begin with [AGENTS.md](../../AGENTS.md).

## Read a skill before using it

Read a skill's `SKILL.md` in full before acting on it; it may
point to a reference or script that is part of the workflow. A
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
skill changes, run `./rhino harness adapters generate`
then `./rhino harness adapters validate`.
See [Platform bindings](../../docs/reference/platform-bindings.md).

## Keep a new skill useful

Give it one clear job. Put the essential procedure in `SKILL.md`; link to
deeper material instead of repeating it. State boundaries, especially around
generated files, credentials, and destructive actions. See
[AI agents](../../repo-governance/development/agents/ai-agents.md) and the agent-development skill
below.

## Skill Catalog

### Docs, tutorials, and README

- [Docs Applying Content Quality](./docs-applying-content-quality/) — universal markdown quality: voice, headings, accessibility
- [Docs Applying Diataxis Framework](./docs-applying-diataxis-framework/) — tutorials, how-to, reference, explanation categories
- [Docs Authoring Standards](./docs-authoring-standards/) — docs-maker's authoring checklist and frontmatter template
- [Docs Converting Pdf To Markdown](./docs-converting-pdf-to-markdown/) — PDF-to-Markdown conversion fidelity via the crane CLI
- [Docs Creating Accessible Diagrams](./docs-creating-accessible-diagrams/) — WCAG-compliant Mermaid diagrams with accessible palette
- [Docs Creating Annotated Concept Tutorials](./docs-creating-annotated-concept-tutorials/) — Annotated-concept tutorial format standards
- [Docs Creating By Example Tutorials](./docs-creating-by-example-tutorials/) — by-example tutorials with 75-85 annotated code examples
- [Docs Creating In The Field Tutorials](./docs-creating-in-the-field-tutorials/) — production implementation guides, 20-40 per topic
- [Docs Creating Tutorial Structure](./docs-creating-tutorial-structure/) — docs-tutorial-maker's seven-type, seven-section methodology
- [Docs Fixing Factual Accuracy](./docs-fixing-factual-accuracy/) — re-validating and applying docs-checker factual findings
- [Docs Fixing Tutorial Quality](./docs-fixing-tutorial-quality/) — applying validated docs-tutorial-checker findings
- [Docs Managing File Operations](./docs-managing-file-operations/) — safely renaming, moving, deleting docs/ files
- [Docs Validating Factual Accuracy](./docs-validating-factual-accuracy/) — verifying factual correctness via WebSearch/WebFetch
- [Docs Validating Links](./docs-validating-links/) — markdown link validation methodology
- [Docs Validating Software Engineering Separation](./docs-validating-software-engineering-separation/) — OSE-vs-AyoKoding documentation separation rules
- [Readme Fixing Quality](./readme-fixing-quality/) — applying validated readme-checker findings
- [Readme Writing Readme Files](./readme-writing-readme-files/) — README quality: hooks, plain language, scannability

### Plans

- [Grill Me](./grill-me/) — interview the user via structured multiple-choice grilling
- [Plan Creating Project Plans](./plan-creating-project-plans/) — project plan structure, naming, and grilling gates
- [Plan Grooming Idea Briefs](./plan-grooming-idea-briefs/) — converging plans/ideas/ into deduplicated two-pagers
- [Plan Validating Quality](./plan-validating-quality/) — plan-checker's 21-rule validation methodology
- [Plan Verifying Execution](./plan-verifying-execution/) — post-execution verification, sibling to Plan Validating Quality
- [Plan Writing Gherkin Criteria](./plan-writing-gherkin-criteria/) — Gherkin Given-When-Then acceptance criteria

### Software engineering

The [repository adapter](../../repo-governance/development/quality/stacks/repository-adapter.md) maps stack skills to projects.

- [Building Command Line Interfaces](./building-command-line-interfaces/) — applying the command-line interface contract
- [Developing Applications](./developing-applications/) — language-agnostic application judgement
- [Developing Frontend UI](./developing-frontend-ui/) — UI tokens, composition, accessibility
- [Evolving Database Schemas](./evolving-database-schemas/) — expand, migrate, verify, contract
- [Framework ASP.NET Core](./framework-aspnet-core/) — ASP.NET Core stack skill
- [Framework Gin](./framework-gin/) — Gin stack skill
- [Framework Giraffe](./framework-giraffe/) — Giraffe stack skill
- [Framework Next.js](./framework-nextjs/) — Next.js stack skill
- [Framework React](./framework-react/) — React stack skill
- [Framework Spring Boot](./framework-spring-boot/) — Spring Boot stack skill
- [Modeling Threats](./modeling-threats/) — a short threat model beside a decision
- [Programming C#](./programming-csharp/) — C# stack skill
- [Programming F#](./programming-fsharp/) — F# stack skill
- [Programming Go](./programming-golang/) — Go stack skill
- [Programming Java](./programming-java/) — Java stack skill
- [Programming JavaScript](./programming-javascript/) — JavaScript stack skill
- [Programming Python](./programming-python/) — Python stack skill
- [Programming Shell](./programming-shell/) — shell stack skill
- [Programming TypeScript](./programming-typescript/) — TypeScript stack skill
- [Tooling Nx](./tooling-nx/) — Nx workspace stack skill
- [Writing Browser E2E Tests](./writing-browser-e2e-tests/) — Playwright browser end-to-end tests

### App content and deploy

- [Apps Ayokoding Www Authoring Annotated Concept](./apps-ayokoding-www-authoring-annotated-concept/) — Annotated-concept authoring for ayokoding-web
- [Apps Ayokoding Www Developing Content](./apps-ayokoding-www-developing-content/) — ayokoding-web bilingual content development guide
- [Apps Deploying Vercel Branches](./apps-deploying-vercel-branches/) — swe-releaser's environment-branch deploy procedure
- [Apps Organiclever Www Developing Content](./apps-organiclever-www-developing-content/) — organiclever-www feature-context/PGlite/Effect TS development
- [Apps Ose Www Developing Content](./apps-ose-www-developing-content/) — ose-web content creation conventions

### PR review pipeline

- [Pr Review Fixer Resolution](./pr-review-fixer-resolution/) — pr-review-fixer's thread-resolution triage
- [Pr Review Scout Classification](./pr-review-scout-classification/) — pr-review-scout's risk-tier classification
- [Pr Review Specialist Protocol](./pr-review-specialist-protocol/) — shared protocol for the nine discipline specialists
- [Pr Review Synthesis Coordination](./pr-review-synthesis-coordination/) — pr-review-checker's dedup and posting
- [Producing Review Findings](./producing-review-findings/) — what a reviewer raises and how

### Web and API testing

- [Api Testing Exploratory Methodology](./api-testing-exploratory-methodology/) — swe-api-tester's exploratory charter
- [Exploratory Testing](./exploratory-testing/) — session-based exploratory testing
- [Web Testing Design Fidelity](./web-testing-design-fidelity/) — swe-web-tester's design charter
- [Web Testing Exploratory Methodology](./web-testing-exploratory-methodology/) — swe-web-tester's exploratory charter
- [Web Testing Usability Heuristics](./web-testing-usability-heuristics/) — swe-usability-tester's Nielsen heuristics

### Repository, CI, and governance

- [Agent Developing Agents](./agent-developing-agents/) — AI agent frontmatter, naming, tool-access standards
- [Ci Standards](./ci-standards/) — CI/CD compliance knowledge
- [Harness Compatibility Protocol](./harness-compatibility-protocol/) — cross-vendor harness parity invariants
- [Repo Applying Maker Checker Fixer](./repo-applying-maker-checker-fixer/) — Maker/Checker/Fixer three-stage workflow pattern
- [Repo Assessing Criticality Confidence](./repo-assessing-criticality-confidence/) — criticality x confidence classification system
- [Repo Defining Workflows](./repo-defining-workflows/) — workflow-pattern frontmatter and execution phases
- [Repo Generating Validation Reports](./repo-generating-validation-reports/) — validation report format: UUIDs, timestamps
- [Repo Maintaining Task Lists](./repo-maintaining-task-lists/) — open the harness's native task list before any task and keep it in sync
- [Repo Practicing Trunk Based Development](./repo-practicing-trunk-based-development/) — Trunk Based Development and the worktree-to-pr default
- [Repo Propagating Rules](./repo-propagating-rules/) — run the rules-propagation workflow whenever a rule changes
- [Repo Understanding Repository Architecture](./repo-understanding-repository-architecture/) — six-layer governance hierarchy
- [Repo Understanding Shared Vocabulary](./repo-understanding-shared-vocabulary/) — what repo rules, content trees, and delivery units cover
- [Rules Validating Governance](./rules-validating-governance/) — rules-checker's repo-wide consistency methodology
- [Social Linkedin Posting](./social-linkedin-posting/) — social-linkedin-post-maker's character-limit and workflow rules
- [Specs Scaffolding](./specs-scaffolding/) — specs-maker's four surface-profile trees
- [Specs Validating Structure](./specs-validating-structure/) — specs-checker's nine validation categories
