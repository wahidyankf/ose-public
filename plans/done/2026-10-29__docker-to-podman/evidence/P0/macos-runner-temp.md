# P0 macOS Go temporary-directory proof

## Supplemental Desktop result

The selected Desktop passed one supplemental native Go temporary-directory probe. It ran under
the current approved HIPPO consumer and profile, using the existing Go 1.27.1 Darwin ARM SDK;
the probe installed no SDK or Podman package. HIPPO history `development-transactional-1793103165565-79949`
records a passed payload, peak owner count 1 and maximum sampled pressure level 1. The target
consumer and outer SSH both exited 0. This adds one focused Desktop result to the separate full
[macOS Podman capability proof](./macos-capabilities.md).

Before execution, the native consumer lock and unchanged current profile were verified. All seven
source artifact digests, including the transitive observer, matched their staged bytes.

The native Go helper created its fixture with `os.MkdirTemp("", "ayokoding-run-")`, using Go's
default temporary-directory selection. The observed logical path
was under `/var/folders/.../T`; its physical parent used macOS's `/private` path alias. The
temporary directory was owned by the current user with mode 0700, and the observed parent GID was 20. These facts describe this invocation only; they do not prove which temporary directory the
production runner will select.

The unchanged bare keep-id invocation produced container and host-visible output ownership
501:20. The probe verified input reads, writable working-copy output, a read-only input mount,
and a denied write with the expected read-only filesystem result. It also confirmed 512 MiB
memory, 0.5 CPU, 128 PIDs, dropped effective capabilities and no-new-privileges.

Both created containers stopped and were removed by exact ID. Dual-route absence checks,
task-owned output cleanup and Go fixture cleanup passed. Podman projections matched before and
after: zero containers, Pods and volumes; the same one network and retained fixture image; and
unchanged gvproxy and krunkit process IDs. Docker container ID/state projections were empty
before and after this invocation. They do not establish the earlier Docker inventory or provide
a full Docker configuration comparison. Task-owned staging, helper build output and Go cache
remain for the plan's final owned cleanup.

## Limits

This is an observed default-Go temporary-directory supplemental capability result on the selected
Desktop. It does not exercise the complete production runner or its actual temporary-directory
environment, establish a P1 runner/doctor pass, close the P0 gate, prove the Laptop, or replace the
separate Desktop DNS/database/full capability evidence. The successful bare keep-id mapping is an
observation for this container and host; it is not a general UID/GID mapping rule.

The sampler's final `finishedAt` value is a sample timestamp, not the exact payload completion
time. The native snapshot ended shortly after that sample, and the terminal exit followed. No
completion time is inferred from the sampler timestamp.
