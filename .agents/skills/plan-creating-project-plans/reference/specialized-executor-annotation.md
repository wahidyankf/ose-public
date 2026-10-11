# Specialized-Executor Annotation

Domain-specialized agents hallucinate less than generic orchestration. When a delivery checkbox names a domain that maps cleanly to a specialized agent, annotate the checkbox with the suggested executor.

Selections follow [Focused Runs and Regression Gates](../../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md#focused-runs-and-regression-gates); resolve the example
command placeholder to a verified guarded runner invocation when authoring a plan.

**Annotation format** (sub-bullet under the checkbox prose, before any implementation notes):

```markdown
- [ ] Edit `apps/organiclever-be/src/Domain/User.fs`: add `email: string option` field
      with case-insensitive uniqueness. Verify by running
      `[verified runner command selecting User_RejectsDuplicateEmailIgnoringCase]` — the named
      case executes and passes with a positive count.
  - _Suggested executor: `swe-developer`_
```

**When to annotate**:

- Action touches a specific language file (`.fs`, `.go`, `.kt`, `.cs`, `.fsproj`, `.csproj`, etc.)
- Action touches a specific app context (`apps/ose-www/...` → `apps-ose-www-content-maker` for content)
- Action is content/documentation (`docs-maker`, `readme-maker`, `specs-maker`)
- Action is governance / repo rules (`rules-maker`)
- Action is content-platform skill domain (`apps-ayokoding-www-by-example-maker`, `apps-ayokoding-www-in-the-field-maker`, etc.)

**When to skip annotation** (default plan-execution Agent Selection suffices):

- Single-line edit to a governance doc
- Mechanical operation (`mv`, `git mv`, or an already classified guarded install)
- Shell command without code edits

The plan-execution workflow respects the annotation as Priority 0 — the suggested executor wins over heuristic matches by file extension or content keyword. Citing a non-existent agent is treated as Anti-Pattern AP-7 (HIGH finding by `plan-checker`; see [refuse-uncertainty-and-anti-patterns.md](refuse-uncertainty-and-anti-patterns.md)).
