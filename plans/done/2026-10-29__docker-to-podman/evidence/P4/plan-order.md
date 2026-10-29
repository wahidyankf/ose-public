# P4 AC-10 plan-order recheck

Recheck required by `plans/done/2026-10-29__docker-to-podman/delivery.md` (P4 AC-10 item) and
`plans/done/2026-10-29__docker-to-podman/prd.md` AC-10.

## Scope: what is live

`plans/README.md` and `repo-governance/conventions/structure/plans/plan-order-graph-and-legend.md`
define the graph as every plan in `plans/backlog/` and `plans/in-progress/`, and nothing else.
`plans/done/` is excluded. `plans/ideas/` is not a graph stage.

Live plan READMEs found (12, excluding the two folder index READMEs):

- `plans/in-progress/`: 3 plans.
- `plans/backlog/`: 9 plans.

No plan under `plans/done/` appears as a node in the `plans/README.md` graph.

## Node table

IDs are the plan folder names. `plans/README.md` uses short labels, mapped here.

| Graph label | ID and folder                                                              | Depends-on from README (file line)                                                   | Matches `plans/README.md`? |
| ----------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| POD         | `docker-to-podman` (`plans/in-progress/`)                                  | `[]` (README line 5)                                                                 | yes                        |
| PHX         | `ayokoding-app-web` (`plans/in-progress/`)                                 | `[docker-to-podman]` (README line 6)                                                 | yes                        |
| P06         | `ayokoding-learn-revamp-06-accounting-courses` (`plans/backlog/`)          | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P07         | `ayokoding-learn-revamp-07-erp-courses` (`plans/backlog/`)                 | `[ayokoding-app-web, ayokoding-learn-revamp-06-accounting-courses]` (line 3)         | yes                        |
| P08         | `ayokoding-learn-revamp-08-capstone-courses` (`plans/backlog/`)            | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P09         | `ayokoding-learn-revamp-09-filler-rewrites` (`plans/backlog/`)             | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P10         | `ayokoding-learn-revamp-10-legacy-unique-migration` (`plans/in-progress/`) | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P11         | `ayokoding-learn-revamp-11-audit-languages-and-tooling` (`plans/backlog/`) | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P12         | `ayokoding-learn-revamp-12-audit-cs-systems-and-data` (`plans/backlog/`)   | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P13         | `ayokoding-learn-revamp-13-audit-product-security-ai` (`plans/backlog/`)   | `[ayokoding-app-web]` (line 3)                                                       | yes                        |
| P14         | `ayokoding-learn-revamp-14-legacy-removal` (`plans/backlog/`)              | `[ayokoding-app-web, 06, 07, 08, 09, 10, 11, 12, 13]` using full folder IDs (line 3) | yes                        |
| FER         | `ferret-init-02-local-backend` (`plans/backlog/`)                          | no `Depends-on` line; reads as no dependencies                                       | yes                        |

Each README path is `plans/<stage>/<folder>/README.md`. The graph has exactly 12 nodes, one per
live plan, each once. The graph `accDescr` says "Twelve live plans", which matches.

Notes:

- FER has no declaration. Its status banner is blocked on FERRET Init 01, which is archived under
  `plans/done/`. Init 01 is not live, so it is correctly absent from the graph, and FER has no live
  edge. The convention says a missing declaration reads as no dependencies.
- The graph in `plans/README.md` states that FER "has no live dependencies and runs in parallel
  with everything".

## docker-to-podman in the graph

`docker-to-podman` is a live node (in progress). Its only edge in `plans/README.md` is
`POD --> PHX`. It has no incoming edge, which matches `Depends-on: []`.

## Edge comparison

README declarations give 19 edges. The `plans/README.md` graph draws 19 edges. The sets are
identical.

| Edge                                                         | README source              | In graph?  |
| ------------------------------------------------------------ | -------------------------- | ---------- |
| POD -> PHX                                                   | PHX README line 6          | yes        |
| PHX -> P06, P07, P08, P09, P10, P11, P12, P13, P14 (9 edges) | line 3 of each plan README | yes, all 9 |
| P06 -> P07                                                   | P07 README line 3          | yes        |
| P06, P07, P08, P09, P10, P11, P12, P13 -> P14 (8 edges)      | P14 README line 3          | yes, all 8 |

## Retained edge checks

- Phoenix's Podman prerequisite: `ayokoding-app-web` README line 6 is `Depends-on: [docker-to-podman]`;
  graph has `POD --> PHX`. Pass.
- Direct Phoenix dependency for plans 06 through 14: all nine READMEs list `ayokoding-app-web`
  (06, 07, 08, 09, 10, 11, 12, 13 at line 3; 14 at line 3); graph has `PHX --> P06` through
  `PHX --> P14`. Pass.
- 06 -> 07: 07 README lists `ayokoding-learn-revamp-06-accounting-courses`; graph has
  `P06 --> P07`. Pass.
- Every content plan 06 through 13 joins into plan 14: the 14 README lists all eight IDs; graph has
  `P06 --> P14` through `P13 --> P14`. Pass.
- No stale or historical IDs appear in any `Depends-on` list. Pass.

## Acyclicity proof

Method: Kahn topological sort over the 12 nodes and 19 edges.

In-degrees at start: POD 0, FER 0, PHX 1, P06 1, P07 2, P08 1, P09 1, P10 1, P11 1, P12 1, P13 1,
P14 9.

1. Remove the in-degree-0 nodes POD and FER. PHX drops to 0.
2. Remove PHX. P06, P08, P09, P10, P11, P12, P13 drop to 0. P07 drops to 1. P14 drops to 8.
3. Remove P06. P07 drops to 0. P14 drops to 7.
4. Remove P07. P14 drops to 6.
5. Remove P08, P09, P10, P11, P12, P13. P14 drops to 0.
6. Remove P14.

All 12 nodes were removed, so no cycle exists. One valid order:

`FER, POD, PHX, P06, P07, P08, P09, P10, P11, P12, P13, P14`

Longest chain: POD -> PHX -> P06 -> P07 -> P14.

## Findings

None. No README `Depends-on` differs from `plans/README.md`, and no completed plan is a node.

## Verdict

PASS. 12 nodes, 19 edges, each live plan exactly once, acyclic, all retained edges present.
