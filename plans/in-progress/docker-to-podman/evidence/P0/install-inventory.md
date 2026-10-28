# P0 installation and runtime inventory

## Scope and safety boundary

This record first captured the pre-install inventory and install tuple verification for P0 action 9. The execution worktree was at `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7` on `2026-10-26`.
At that initial capture, no Podman package was installed. The user later installed Podman on both
Macs; the verified CLI and package receipt state is recorded below. This agent did not initialize,
start, or stop a Podman Machine, or start, stop, or remove a container. No Docker context, socket,
account, group, or security setting was changed.
The protected Docker inventory used only filtered metadata fields and never read container
environment variables.

Local and remote compute ran through their respective repository-root HIPPO consumer. The local
command PATH included `$HOME/.dotnet/tools:$HOME/.local/share/flutter-sdk/3.41.5/flutter/bin`.
Remote Mac package verification used the Mac repository's own `./hippo` boundary with the
transactional/standard tier for the package download and signature checks.

## Existing Docker ownership and planned port collisions

The normal local account is not in the Docker socket's owning group: its supplementary group list
does not include `docker`, while `/var/run/docker.sock` is owned by `root:docker` with mode `660`.
The plan owner explicitly authorized an existing non-interactive sudo route for read-only Docker
metadata only. The capture therefore used `sudo -n docker` for the following read-only commands:
`context show`, `version`, `ps --all`, filtered `inspect`, `volume ls`, `network ls`, and `compose ls`.
No privilege was used for workload changes.

The capture found zero containers, zero Compose projects, seven named volumes, and three default
engine networks. All seven volumes were labeled as isolated test artifacts owned by another
repository; none was owned by this plan. They are unrelated and must be preserved. The three
networks were the engine's built-in bridge, host, and null networks. No plan-owned durable service
or persistent data set exists on this Docker engine, so there is no owned-service backup/restore
packet to make. The plan's later synthetic PostgreSQL backup/restore rehearsal remains required.

The existing listening-TCP sample contained 12 listeners. None used the active plan Compose host
ports: `3100`, `3101`, `3200`, `4225`, `4226`, `5435`, or `5436`. Thus the current listener sample
shows no host-port collision, and the Docker API inventory shows no containers or Compose projects
that could claim those ports. The pre-container baseline is clear with respect to current Docker
ownership and these planned ports; preserve the seven unrelated volumes.

Ignored raw captures, including volume labels and IDs, remain under
`local-tmp/plan/docker-to-podman/`. They are intentionally not copied into this record.

## Ubuntu package tuple

| Tuple                        | Observed version and origin                                                                                                                                                                                                                                                               | Resolution evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Ubuntu host            | Ubuntu `26.04.1 LTS`, `amd64`; Podman and `podman-compose` are absent; Python `3.14.4`; `pipx` is absent.                                                                                                                                                                                 | `lsb_release -ds`, `dpkg --print-architecture`, `command -v`, `python3 --version`, and `pipx --version` (the latter absent) ran under local HIPPO `ephemeral/light`.                                                                                                                                                                                                                                                                                                                                                                                        |
| Podman package               | Candidate `5.7.0+ds2-3build1`; `apt-cache policy` and `apt-cache madison` select Ubuntu `resolute/universe amd64`; package is not installed.                                                                                                                                              | The cached Ubuntu `resolute` InRelease reports `Origin: Ubuntu`, `Label: Ubuntu`, `Suite: resolute`, `Codename: resolute`, and `Components: main restricted universe multiverse`. `gpgv` accepted the signed InRelease using the Ubuntu archive keyring; `VALIDSIG` fingerprint `F6ECB3762474EDA9D21B7022871920D1991BC93C`. The signed InRelease date is `2026-04-23`; this is the current local APT cache candidate, not a claim that the index is fresh at install time. The locally configured mirror hostname is retained only in ignored raw evidence. |
| Exact APT resolution         | `apt-get --print-uris --yes install 'podman=5.7.0+ds2-3build1'` resolves 22 new packages, 74.1 MB of archives, and 248 MB additional installed space. The Podman archive filename is `podman_5.7.0+ds2-3build1_amd64.deb`, size `25818110`, index MD5 `2d3134dcd8cf82b606c78d1ea0076267`. | `--print-uris` only; no package download or installation occurred. The full resolver output, including the host-specific mirror URI, remains in ignored `local-tmp/plan/docker-to-podman/apt-get-print-uris-podman-5.7.0.txt`.                                                                                                                                                                                                                                                                                                                              |
| GitHub Actions CI Podman pin | **PROVISIONAL / UNPROVEN**; no CI-selected package version or signed origin has been recorded.                                                                                                                                                                                            | The bounded workflow scan finds no Podman package install; the inspected `Repository policy` job log from run `40318340404` has no `apt-cache policy/madison`, `apt-get --print-uris`, or `podman=` receipt. Its runner image evidence does not establish a package candidate. The local Ubuntu candidate is not substituted for CI.                                                                                                                                                                                                                        |

## CI tuple

The runtime workflow inventory covers these callers and reusable definitions:

- Web Compose: `ayokoding-www-test-local-deploy-prod.yml`,
  `ose-www-test-local-deploy-prod.yml`, and `organiclever-www-test-local-deploy-prod.yml` call
  `_reusable-www-test-local-deploy.yml`.
- App Compose: `ose-app-test-local-deploy-stag.yml` and
  `organiclever-app-test-local-deploy-stag.yml` call
  `_reusable-app-test-local-deploy-stag.yml`.
- AyoKoding examples Buildx: `ayokoding-www-examples-check.yml` and `pr-quality-gate.yml` call
  `_reusable-ayokoding-www-examples-check.yml`.
- Backend image build/deploy: `ose-be-build-deploy-stag.yml` and
  `organiclever-be-build-deploy-stag.yml` call `_reusable-be-build-deploy.yml`.
- Image publication: `publish-images.yml` contains its own three runtime jobs.

All four reusable definitions and all three `publish-images.yml` jobs use the single declared
`runs-on` label `ubuntu-latest`. The label is shared across Compose, examples Buildx, backend image
build/deploy, and image publication; no second CI runner label was found in this bounded runtime
inventory.

The existing promotion PR quality run `40318340404` completed successfully and was read without
dispatching a new workflow. Its inspected `Repository policy` job setup log records runner `2.338.0`, image `ubuntu-26.04`, image
version `20261012.163.1`, and the Rust host triple `x86_64-unknown-linux-gnu`; tool-cache paths and
the Flutter action also report `x64`/`X64`. This is the observed evaluation of `ubuntu-latest` for
that run on `2026-10-26`, not a claim that GitHub's moving label is pinned. The release image and
architecture evidence came from that run's actual setup logs, not from the workflow label alone.

The CI pin row remains provisional. Existing evidence establishes its one runner label and current
evaluated Ubuntu image, so the eventual package row can be checked against that exact runner tuple.
Before a Podman-consuming job starts a container, its setup step must record the runner release and
architecture, `apt-cache policy/madison`, the signed Ubuntu origin, and exact `--print-uris`
resolution for its selected package pin. No new CI job was dispatched for this P0 inventory.

The maintainer explicitly authorized closing CI package/rootless proof in the runtime PR's first
CI run, with success required before merge. P0's local Ubuntu/macOS prerequisites remain mandatory
before implementation; this is the only deferred P0 host row. See
[authorized CI evidence timing](../../delivery.md#authorized-ci-evidence-timing). The row remains
honestly provisional here and is not CI capability evidence until the real job records its proof.

## macOS package tuple and authenticity

Before the user-installed Podman binaries were available, the Desktop Mac inventory reported
macOS `15.5`, kernel `24.5.0`, architecture `arm64`, Python `3.14.7`, and `pipx 1.10.1`.
`sudo -n` was unavailable during that inventory; no agent privileged installer action was
attempted. The user later reported installing Podman manually on both Macs. Native checks now
confirm the CLI and its package receipt on each machine:

| Mac     | CLI path and version              | Native package receipt                                                                      | Verification                                                                                                                                   |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop | `/opt/podman/bin/podman`, `6.1.4` | `com.redhat.podman`, version `6.1.4`, volume `/`, location `opt`, install-time `1793062822` | CLI and `pkgutil --pkg-info com.redhat.podman` each exited `0` inside separate target-native HIPPO light admissions at `2026-10-27 01:21 UTC`. |
| Laptop  | `/opt/podman/bin/podman`, `6.1.4` | `com.redhat.podman`, version `6.1.4`, volume `/`, location `opt`, install-time `1793062944` | CLI version exited `0` at `01:06 UTC`; the receipt query exited `0` in a fresh light admission at `01:13 UTC`.                                 |

The ignored terminal receipts are `local-tmp/plan/docker-to-podman/mac-installed-verification/20261027T0120Z/desktop-light-hippo-terminal.txt`, `.../20261027T0105Z/laptop-terminal.txt`, and `.../20261027T0113Z/laptop-receipts-terminal.txt`.

The Desktop's pipx provider client also reports `podman-compose version 1.6.0` when invoked with
an invocation-only `PATH=/opt/podman/bin:$PATH`; its output first confirms Podman's local client
version `6.1.4`. No profile or startup file was edited. The result is in ignored
`local-tmp/plan/docker-to-podman/mac-installed-verification/20261027T0130Z/desktop-provider-path-terminal.txt`.

The earlier `pkgutil --pkg-info podman` probe exited `1` because `podman` is not the receipt
identifier. `pkgutil --pkgs` found `com.redhat.podman`; querying that exact identifier returned
version `6.1.4` on the Laptop. The Desktop's exact-ID receipt query also returned `6.1.4`. These
matching native receipts and CLI versions identify the installed package as Podman `6.1.4`. The
user performed the installation; this agent did not observe the installation transaction or link
the installed bytes to the separately verified download below.

Fresh GitHub release API metadata for official tag `v6.1.4` identifies
`podman-installer-macos-arm64.pkg` at
`https://github.com/podman-container-tools/podman/releases/download/v6.1.4/podman-installer-macos-arm64.pkg`,
size `76099040`, SHA-256
`48f675622f66233ca2116e67fdab41ed9dbcc25b48b78a8e6ef0be6549031d22`. The official `shasums` asset
API digest is `sha256:2e2137f14806c5efb43fcd63ff8ed53747a499e83793fe07993d972eb6db9b79`; the downloaded
checksum manifest matches that digest, and its package checksum matches the API package digest. The
downloaded package bytes match both sources and the exact asset size. This verifies the available
official installer artifact, separately from the user's later installation action.

Native verification accepted the package:

- `pkgutil --check-signature`: signed by the Red Hat Developer ID Installer certificate; Apple
  notarization is trusted.
- `spctl --assess --type install --verbose=4`: accepted, source `Notarized Developer ID`.

The release API JSON, `shasums`, package bytes, and native verification output remain in the Mac
repository's ignored `local-tmp/plan/docker-to-podman/install-verification/` directory. The agent
did not run the installer or initialize, start, or stop a Podman Machine. A Desktop
`podman machine list --format json` query at `01:29 UTC` returned one machine. Its filtered inspect
projection exposed the state string `running` and a Podman Unix socket path; the socket check
found a live socket with mode `srw-------`, owner `<local-user>`, group `staff`. The filtered projection did
not preserve whether `Running` or `Rootful` fields existed, so those values are not reported. A
later focused field inspection was deferred by HIPPO before packet start
(`hippo.limit.capacity-deferred`); see ignored
`local-tmp/plan/docker-to-podman/mac-installed-verification/20261027T0131Z/desktop-machine-inspect-details-terminal.txt`.
The socket path and full output remain in ignored
`local-tmp/plan/docker-to-podman/mac-installed-verification/20261027T0129Z/desktop-actual-light-admission-terminal.txt`.
At that historical inventory point, no `podman info` or workload command had run, so rootless
engine status was unverified. Subsequent selected Desktop capability and native cleanup checks
now pass; see [Mac capability evidence](./macos-capabilities.md). A
Laptop `podman machine list --format json` query at `01:06 UTC` returned zero machines. No
container command was run.

## Human administrator installer command

For the planned human-administrator installation step, run this from the Mac repository root. It
rechecks the task-owned artifact's size, release SHA-256, Apple package signature, and
Gatekeeper assessment inside the admitted HIPPO command before invoking the installer with sudo:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- \
  bash -euo pipefail -c '
    pkg=local-tmp/plan/docker-to-podman/install-verification/podman-installer-macos-arm64.pkg
    expected=48f675622f66233ca2116e67fdab41ed9dbcc25b48b78a8e6ef0be6549031d22
    test "$(wc -c < "$pkg" | tr -d " ")" = 76099040
    digest_line="$(shasum -a 256 "$pkg")"
    test "${digest_line%% *}" = "$expected"
    pkgutil --check-signature "$pkg"
    spctl --assess --type install --verbose=4 "$pkg"
    sudo installer -pkg "$pkg" -target /
  '
```

This command has not been run; the user installed Podman manually instead. Machine initialization
and startup remain separate actions after the CLI and package installation.
