---
description: The security-domain adaptation of the SWE By-Example five-part structure - coverage, scenario, annotated artifact, key takeaway, and why it matters.
when_to_use: Use when structuring a new security by-example entry or checking an existing one against the five required parts.
---

# Five-Part Format (Security-Adapted)

Every example follows the same five-part structure as SWE by-example, with security-specific
adaptations:

## Part 1: What This Covers (2-3 sentences)

Same as SWE by-example. Must answer:

- What security technique, control, or detection does this example demonstrate?
- Why does it matter in a real environment?
- When would a practitioner use it?

## Part 2: Scenario (1-2 sentences)

Replace "Brief Explanation" with explicit scenario context:

- State the environment (OS, network segment, tool version)
- State authorization framing for offensive examples ("authorized pentest on lab target 192.0.2.5")
- State analyst role for defensive examples ("Tier 1 SOC analyst reviewing alerts")

```markdown
**Scenario:** Authorized internal pentest against a lab Ubuntu 22.04 server at 192.0.2.5.
You have completed host discovery and are performing service enumeration.
```

## Part 3: Annotated Tool Output or Config

Replace "runnable source code" with the security artifact, fully annotated with `# =>`:

- Show the exact command(s) to run
- Show realistic (but fictional/lab) output
- Annotate every output field that matters with `# =>`
- Use fictional IP ranges (10.x.x.x, 192.168.x.x, RFC 5737 documentation ranges)
- Use fictional but plausible hostnames, usernames, hashes

Density target: same 1.0–2.25 annotation lines per non-blank, non-comment content line per example.

## Part 4: Key Takeaway (1-2 sentences)

Same as SWE by-example. For Red Team examples, include the defensive implication:

```markdown
**Key Takeaway:** OpenSSH 7.9 with password authentication enabled is a high-value target;
defenders should enforce key-only auth and monitor for repeated authentication failures (Event
ID 4625 on Windows, auth.log failures on Linux).
```

## Part 5: Why It Matters (50-100 words)

Same as SWE by-example. Production-focused, active voice, specific to the technique.
