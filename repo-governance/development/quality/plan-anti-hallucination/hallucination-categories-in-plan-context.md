---
description: "Categories of hallucination in plan content."
when_to_use: "Use to classify a suspected hallucination."
---

# Hallucination Categories in Plan Context

Plans drift from reality in predictable ways. Each category maps to a verification ritual.

| Category              | Example                                                   | Verification Ritual                                                                                            |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **File path**         | `apps/ose-www/src/server/trpc.ts`                         | `Glob` or `Bash test -f`; if NEW, mark `_New file_`                                                            |
| **Directory path**    | `repo-governance/conventions/writing/`                    | `Bash test -d` or `Glob` for sibling                                                                           |
| **Symbol / function** | `unstable_cache`, `getServerSession`, `RouteConfig`       | `Grep` against the codebase or cite the import path                                                            |
| **Nx target**         | `nx run ose-www:test:quick`                               | Read `apps/ose-www/project.json` or `nx show project`                                                          |
| **Package version**   | `next@16.0.0`, `tRPC v11`                                 | Grep `package.json` (or `go.mod`, `Cargo.toml`, `*.csproj`, etc.)                                              |
| **API signature**     | `unstable_cache(fn, keyParts, { revalidate })`            | `web-researcher` against authoritative docs                                                                    |
| **Command flag**      | `npx nx affected -t typecheck --parallel=cores-1`         | `<cmd> --help` or repo's documented usage in `package.json` scripts                                            |
| **Test name**         | `RateLimit_RejectsExceedingRequests`                      | If pre-existing, `Grep` test files; if NEW, mark `_New test_`                                                  |
| **Agent name**        | `swe-code-maker`, `web-researcher`                        | `test -f .agents/agents/<name>.md` and confirm (flat canonical directory)                                      |
| **Skill name**        | `plan-creating-project-plans`                             | List `.agents/skills/` and confirm                                                                             |
| **External standard** | "AGENTS.md spec at agents.md", "Conventional Commits 1.0" | `web-researcher` with cited excerpt + URL + access date                                                        |
| **Behaviour claim**   | "Next.js serves `app/robots.ts` over `public/robots.txt`" | `web-researcher` with cited official-doc excerpt                                                               |
| **Numeric KPI**       | "reduces review time by 35%"                              | If no measured baseline exists: FORBIDDEN as fact, allowed only as `_Judgment call:_` or qualitative reasoning |
| **Cross-link target** | `[Worktree Path Convention](./worktree-path.md)`          | `Bash test -f` on the resolved path                                                                            |

If a claim does not match any row above and is not directly observable from the plan's own narrative, it is a candidate for `[Unverified]` labeling or refusal.
