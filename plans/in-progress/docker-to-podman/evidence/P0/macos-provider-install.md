# P0 Desktop macOS Podman Compose provider installation

## Result and scope

The Desktop Mac provider portion of P0 action 11 passed: isolated pipx now contains
`podman-compose==1.6.0`, installed with the approved native Python `3.14.7`. Its pipx venv
interpreter was independently verified as Python `3.14.7`. The resolver freeze and all four
wheel SHA-256 hashes were captured inside transactional/standard HIPPO admission.

This does not establish Podman engine or Compose runtime capability. At the initial installation,
a read-only package recheck found no Podman binary or receipt, so the provider's version command
exited `1` because it could not find `podman`. The maintainer later installed Podman manually.
On 2026-10-27 at `01:30 UTC`, a fresh target-native light admission with invocation-only
`PATH=/opt/podman/bin:$PATH` allowed `podman-compose --version` to exit `0`, reporting Podman
`6.1.4` and provider `1.6.0`. No shell profile was changed. The separate
[installation inventory](./install-inventory.md) records that terminal receipt and both native
package versions. No agent package install or Machine lifecycle action is claimed by this report.

## Provider environment

The target-native toolchain was Python `3.14.7`, pipx `1.10.1`, and system pip `26.2.1`. Before
installation, pipx reported no `podman-compose` venv. The following exact provider install command
ran inside a transactional/standard HIPPO packet and exited `0`:

```bash
pipx install --python /opt/homebrew/bin/python3 'podman-compose==1.6.0'
```

The install log reports `podman-compose 1.6.0` installed using Python `3.14.7`. The captured
`pipx list --json` schema records the `podman-compose` venv's `main_package.package_version` as
`1.6.0`, its venv metadata `python_version` as `Python 3.14.7`, and the source interpreter as
`/opt/homebrew/bin/python3`. The venv's own `bin/python --version` independently reports Python
`3.14.7`. The venv pip is `26.1.2`.

The provider freeze is:

```text
pip==26.1.2
podman-compose==1.6.0
python-dotenv==1.2.4
PyYAML==6.0.3
```

The resolver wheels downloaded with the approved Python are:

| Wheel                                            | SHA-256                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `pip-26.1.2-py3-none-any.whl`                    | `382ff9f685ee3bc25864f820aa50505825f10f5458ffff07e30a6d96e5715cab` |
| `podman_compose-1.6.0-py3-none-any.whl`          | `98e48af25d44c10ecef948163bfcca002e32aa8bbb7e66593fbd4faff7270c30` |
| `python_dotenv-1.2.4-py3-none-any.whl`           | `42269a8a5b3fd54ffa6f3d84b18abed50064717576b4ecf03dc4a55d8aa04fdc` |
| `pyyaml-6.0.3-cp314-cp314-macosx_11_0_arm64.whl` | `34d5fcd24b8445fadc33f9cf348c1047101756fd760b4dacb5c3e99755703310` |

This covers every line of the captured freeze, including pip. The initial provider resolver
download captured its three application dependency wheels; a later pinned `pip==26.1.2` download
filled the remaining freeze entry. The pip wheel metadata was read from the downloaded wheel and
verified as `Name: pip`, `Version: 26.1.2`. The complete four-wheel hash manifest is retained in
the ignored target scratch.

## Admission and terminal outcomes

Each remote compute started with a fresh Desktop target HIPPO status of `normal`; provider install
and subsequent venv/freeze/wheel capture each ran inside a target-native transactional/standard
HIPPO packet. The four complete SSH terminal receipts are retained under ignored
`local-tmp/plan/docker-to-podman/mac-install-recheck/`:

| Local terminal                            | Outcome                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `desktop-provider-terminal.txt`           | SSH exit `1`: pipx install exited `0`; the subsequent provider CLI check exited `1` because Podman was absent.                                                                 |
| `desktop-provider-evidence-terminal.txt`  | SSH exit `3`: confirmed provider `1.6.0`; an initial parser looked for Python version under `main_package`, where this pipx schema does not place it. No install was repeated. |
| `desktop-provider-final-terminal.txt`     | SSH exit `0`: verified the actual venv interpreter and package metadata, captured freeze, downloaded three wheels, and wrote hashes.                                           |
| `desktop-provider-pip-wheel-terminal.txt` | SSH exit `0`: downloaded only `pip==26.1.2`, verified wheel metadata, and captured the complete four-wheel manifest without reinstalling the provider.                         |

The corresponding target-native scratch, including JSON metadata, logs, wheels, freeze, and hash
manifest, remains ignored at `local-tmp/plan/docker-to-podman/macos-provider-install/`. Private
home-directory paths are confined to that raw evidence.
