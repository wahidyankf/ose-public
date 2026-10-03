---
description: "Lists the gates and the agents that check model-tier compliance, and what no validator can judge."
when_to_use: Use when looking for what validates an agent's model-tier declaration or its generated model fields.
---

# Tools and Automation

## The gates

`./rhino metadata validate` refuses a canonical agent whose `tier` is missing or outside the closed
set `ultra`, `plan`, `execution`, and `fast`. `./rhino harness adapters generate` and `validate`
refuse a tier a profile's `tiers` map does not declare, write each binding's model and effort from
the Tier Registry in `repo-config.yml`, and fail a binding that differs from what the registry
produces. Both read the registry, never their own source, so a model change is a registry edit.

No validator checks the **Model Selection Justification** block, or whether its argument is a good
one. A promotion that edits the tier and leaves prose behind produces a file arguing against its own
configuration, so reviewers read the block against the declared tier.

## The agents

The following agents enforce or assist with model selection:

- **agent-maker** -- applies these guidelines when creating new agents
- **rules-checker** -- judges whether a justification block exists and its argument actually fits the agent's charter
- **repo-workflow-fixer** -- corrects model selection issues identified by the checker
