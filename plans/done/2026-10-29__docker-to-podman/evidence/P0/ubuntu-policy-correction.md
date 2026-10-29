# P0 Ubuntu pasta policy correction

## Result and remaining verification

On 2026-10-26 UTC, the authorized SIGTERM receive rule was installed on the local Ubuntu host.
Independent review passed the exact candidate and rollback packet before application. Fresh host
preconditions matched the reviewed originals, the files were backed up, the candidate parsed
without loading or reading cache, and the enforced `pasta` profile was then replaced successfully.
Post-apply checks confirmed the exact candidate hashes and `pasta (enforce)` state.

This records the policy correction only. The required real rootless-container capability and
cleanup verification is still pending, so this evidence does not pass the Ubuntu P0 capability
prerequisite or close the overall P0 gate. No workload, helper termination, or network teardown
was run as part of this policy apply.

## Applied scope

The vendor profile now includes its local override file. That file contains only:

```text
signal (receive) set=(term) peer=podman,
```

The change grants pasta-profile processes permission to receive SIGTERM from a process labeled
`podman`, subject to normal Unix signal permissions. AppArmor labels are host-wide: the matching
permission applies to all such processes on this host, including pasta processes outside this
repository. The pasta profile remains enforced.

Only these two files changed:

| File                                  | Original SHA-256                                                   | Installed SHA-256                                                  |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `/etc/apparmor.d/usr.bin.pasta`       | `d5e1f27f6af84f6816e06dba396dffd5697f653efe4029175a972042853dfc21` | `8505084fd57f255af44887f6a7aa8a7646d3ee22ee6a2a33dfebde76b4509823` |
| `/etc/apparmor.d/local/usr.bin.pasta` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `aaaacd46f6b5f50041c883174bc028fc628ae6d07e60f4e2e0507136977f09d0` |

Both installed files are `root:root` mode `0644`. A root-only backup was verified and retained.
Its exact host path and the terminal apply receipt are recorded in the ignored local policy packet;
they are omitted here. No other AppArmor profile, helper selection, system setting, package, or
container resource was changed by this apply.

## Apply verification

- HIPPO transaction: class `transactional`, tier `standard`; terminal exit `0`.
- Native syntax parse: `apparmor_parser --skip-kernel-load --skip-read-cache`; exit `0`.
- Profile replacement: `apparmor_parser --replace`; exit `0`.
- Final loaded state: exactly `pasta (enforce)`.
- Final file hashes and ownership/modes matched the reviewed candidates; backup hashes matched the
  originals.

The accepted cleanup and capability criteria remain those in
[`ubuntu-capabilities.md`](./ubuntu-capabilities.md) and
[`prerequisite-blockers.md`](./prerequisite-blockers.md). A separate bounded real-host run must
record native teardown statuses, confirm no owned resources or helpers remain, preserve the
required isolation/resource assertions, and inspect an attributable audit interval before this
prerequisite can be marked complete.
