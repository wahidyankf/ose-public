# P0 local Ubuntu Podman installation

## Result

P0 action 10 passed for the recorded local tuple: Ubuntu `26.04.1 LTS`, `amd64`, Podman
`5.7.0+ds2-3build1`. The exact pin was already installed when this task began. The idempotent
transaction exited `0`, reported that the pinned version was already the newest version, and made
no package changes. `podman --version` reports `5.7.0`; `podman info --format json` reports
`.host.security.rootless == true`.

No container, network, or service was started. No Docker, account, group, socket, security, or
version-pin setting was changed.

## Signed APT source and pin recheck

APT metadata was refreshed once under transactional HIPPO admission on `2026-10-26`; the update
exited `0` and fetched `1215 kB`. The three configured Ubuntu release pockets verified with the
Ubuntu archive keyring and valid-signature fingerprint
`F6ECB3762474EDA9D21B7022871920D1991BC93C`:

| Pocket              | Signed origin and date                                               | Podman package selection                 |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| `resolute`          | `Origin: Ubuntu`, `Label: Ubuntu`; signed release date `2026-04-23`. | `5.7.0+ds2-3build1`, `universe`, `amd64` |
| `resolute-updates`  | `Origin: Ubuntu`, `Label: Ubuntu`; signed release date `2026-10-26`. | No Podman candidate selected             |
| `resolute-security` | `Origin: Ubuntu`, `Label: Ubuntu`; signed release date `2026-10-25`. | No Podman candidate selected             |

After the refresh, `apt-cache policy podman` and `apt-cache madison podman` still selected
`5.7.0+ds2-3build1` from Ubuntu `resolute/universe amd64`, matching the P0 install-inventory row.
The exact `apt-get --print-uris --yes install 'podman=5.7.0+ds2-3build1'` resolution exited `0`;
because the package was already installed, APT reported zero upgrades and zero new packages.

## Exact-pin transaction

The following command ran inside one transactional/standard HIPPO boundary with
`NEEDRESTART_MODE=l` passed to APT so needrestart used list-only behavior:

```bash
sudo env NEEDRESTART_MODE=l apt-get install --yes \
  'podman=5.7.0+ds2-3build1'
```

APT reported `podman is already the newest version (5.7.0+ds2-3build1)`, `0 upgraded`, `0 newly
installed`, and `0 to remove`. The package version, package policy, madison result, signed-release
fields, signature records, print-uris output, and transaction log remain in ignored
`local-tmp/plan/docker-to-podman/` captures.

The rootless check was read-only and returned `true`. No workload was created or changed.

The approved Python executable is `/usr/bin/python3`, version `3.14.4`. pipx was absent at the
initial action 10 inventory; action 11 installed signed Ubuntu pipx `1.8.0`. The system pip version,
isolated pipx-environment pip version, provider freeze, and wheel hashes are recorded separately in
[`provider-install.md`](./provider-install.md).
