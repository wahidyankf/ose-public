# Specialized-Executor Annotation

Domain-specialized agents hallucinate less than generic orchestration. When a delivery checkbox names a domain that maps cleanly to a specialized agent, annotate the checkbox with the suggested executor.

**Annotation format** (sub-bullet under the checkbox prose, before any implementation notes):

```markdown
- [ ] Edit `apps/organiclever-be/src/Domain/User.fs` [Repo-grounded]: add `email: string option` field
      with case-insensitive uniqueness. Verify by running
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:test:unit` — new test
      `User_RejectsDuplicateEmailIgnoringCase` passes.
  - _Suggested executor: `swe-code-maker`_
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
