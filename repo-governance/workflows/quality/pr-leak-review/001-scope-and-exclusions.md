---
description: "Defines the three leak classes, what is never a leak, and why every outbound commit is in scope rather than only the final tree."
when_to_use: "Use when deciding whether a candidate value in a commit, file name, message, or PR text is a real leak."
---

# Scope and Exclusions

A leak review judges three classes and no others. Each maps to the record's count of the same name.

| Class                            | A finding is                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `secret_or_private_value`        | a real credential or other value that grants access — in any environment, with staging and production credentials named explicitly because they reach real data and real users                                  |
| `protected_environment_property` | a value that belongs in environment or secret storage, such as a connection string or a non-public environment's endpoint or account identifier                                                                 |
| `machine_specific_absolute_path` | anything identifying the machine it came from: an absolute home path such as `/Users/<name>/`, `/home/<name>/`, or `C:\Users\<name>\`, a tool-installation prefix, a username, a hostname, or a private address |

Apply the canonical definitions:

- [No Secrets in Committed Files](../../../conventions/security/secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md)
  and [Guard Env-File Access Policy](../../../conventions/security/secrets-and-env-standards/guard-env-file-access-policy.md).
- [Hardcoded Environment Configuration](../../../development/workflow/anti-patterns/hardcoded-environment-configuration.md).
- [No Machine-Specific Commits](../../../development/quality/no-machine-specific-commits.md),
  especially [What Counts as Machine-Specific Information](../../../development/quality/no-machine-specific-commits/what-counts-as-machine-specific-information.md).

## Real Means Real

Any real credential is a finding, whichever environment it belongs to: a development key that works
is still a key, and deciding which environment a token reaches is guesswork the review does not
attempt. Only a value that is unmistakably synthetic passes.

## What Is Not a Leak

- A home-relative path such as `~/notes`. It names no account and resolves on every machine. A
  surface with a stricter local rule, such as a formal plan's worktree identity, keeps that rule.
- A repository-relative path, or a documented placeholder such as `<name>` or `<repository-path>`.
- Public identifiers, documented public values, and loopback addresses in test configuration that
  targets a local service.
- Synthetic fixtures that are unmistakably synthetic.

A name containing `key`, `token`, `secret`, `prod`, or `stag` is not evidence alone. A candidate is
a finding only when shape and context show the value is real or protected.

## History Is the Subject

Every commit bound for the remote is outbound on its own. A value added by one commit and deleted by
the next is published with both, and every clone keeps it. A review therefore reads each commit's
additions, its file names, and its message, never only the range's final files.

The review binds from adoption onward. Content a range does not add is not judged again, and history
published before adoption is out of scope for the review; a leak found there is handled under the
owning convention instead.

## The Review Is Itself Published

The review body is outbound, per [Public Outbound Safety](../../../conventions/security/public-outbound-safety.md).
A path pasted into it is the finding the review exists to catch, and a quoted secret is published
again in the record of its discovery. Anything found is treated as already disclosed.

It is not a security or semantic review. A screen matches shapes; this review reads context, and
three classes keep it small enough for every push and every head.
