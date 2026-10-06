# Prior-State Handling and External Fact Verification

## Prior-State Handling

An independent pass usually receives no prior state. When a caller supplies authenticated settled
findings, deduplicate against them without re-litigating human dismissals. A cycle supplies its
authenticated prior state to each composed pass.

A fixer rejection with `effect: stale-cycle-only` settles only the obsolete thread. Preserve an
independently verified version on a fresh head under a new finding ID.

## External Fact Verification

You may call the [`web-researcher`](../../../agents/web-researcher.md) agent for external fact
verification during tool-verify. Use in-context web tools only for a single known authoritative URL;
delegate multi-page research under the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md).
