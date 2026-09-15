---
description: Reasons a plan may declare a non-default Delivery Mode and the two named private-sibling categories where direct-main delivery is permitted.
when_to_use: Use when deciding whether a plan's change justifies overriding the worktree-to-pr default.
---

# When Plans Override the Default Mode

Specify a non-default `## Delivery Mode` field in a plan if:

- **Trivial, well-understood change**: size and simplicity are supporting safety conditions, not an
  eligibility category. Neither direct-push mode has an executable path in `ose-public`, and
  `worktree-to-origin-main` is unavailable in the private sibling too. Only explicitly declared
  `main-to-origin-main` survives there, for stateful IaC needing real secrets/local state or CI-IaC
  changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular.
  See
  [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).
- **External integration**: Working with a third party that requires a specific branch/PR shape.
- **Compliance**: A regulatory requirement adds a review process beyond the standard PR CI gate.

**Example plan overriding the default** -- a private-sibling stateful IaC plan, one of the two named
categories where `main-to-origin-main` is sanctioned today (a direct-push example targeting
`ose-public`, or a `worktree-to-origin-main` example in either repository, would fail this repo's
own `plan-checker` gate on sight):

```markdown
## Delivery Mode

`main-to-origin-main`

**Justification**: This `private-sibling` infrastructure-as-code plan updates a single Terraform
resource tag and needs the primary checkout's local secrets/state access. The change is trivial and
well-understood; the PR route is unavailable for the required local state operation. Not executable in `ose-public`
-- see
[Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).
```
