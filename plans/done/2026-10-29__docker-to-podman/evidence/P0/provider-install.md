# P0 local Podman Compose provider installation

## Result and scope

The local Ubuntu and selected Desktop macOS portions of P0 action 11 passed. On Ubuntu,
`podman-compose==1.6.0` is installed in its isolated pipx environment and reports version `1.6.0`.
The separate [Desktop provider installation record](./macos-provider-install.md) captures its
successful pipx install and native interpreter. A fresh native CLI receipt confirms Podman `6.1.4`
and `podman-compose` `1.6.0` on that Desktop.

The selected Desktop also passed the separate full
[macOS capability probe](./macos-capabilities.md) (run `13990`). A supplemental
[Go temporary-directory probe](./macos-runner-temp.md) passed its scoped default-temp bind and
cleanup checks; it does not prove the production runner's complete path. The Laptop's additional
Machine guest boot remains unresolved and has no runtime pass. These host results distinguish
provider/package installation from engine capability and runner proof.

No profile or startup file was edited, `pipx ensurepath` was not run, and `HOME` was not changed.
The plan-approved OS Python was used only as pipx's isolated-venv interpreter; no package was
installed into system Python. The command temporarily added pipx's user application directory to
that admitted invocation's `PATH` only. No container was started.

## Native prerequisites and signed origins

The machine had Python `3.14.4`, but no pipx, `python3-pip`, or Python venv package. The official
[pipx install guide](https://pipx.pypa.io/latest/how-to/install-pipx.html) directs Ubuntu 23.04+
to install pipx through APT and warns against using `pip install --user` on externally managed
system Python. The official [Debian and Ubuntu guidance](https://pipx.pypa.io/stable/how-to/troubleshoot.html#debian-and-ubuntu-issues)
also calls for `python3-venv` and `python3-pip`. Those native prerequisites were installed from the
verified Ubuntu package indexes with `--no-install-recommends`:

| Package           |      Installed version | Signed Ubuntu pocket                    |
| ----------------- | ---------------------: | --------------------------------------- |
| `pipx`            |              `1.8.0-1` | `resolute`                              |
| `python3-pip`     | `25.1.1+dfsg-1ubuntu2` | `resolute`                              |
| `python3-venv`    |      `3.14.3-0ubuntu2` | `resolute`                              |
| `python3.14-venv` |    `3.14.4-1ubuntu0.2` | `resolute-updates`, `resolute-security` |

Each pocket's `InRelease` signature was accepted by the Ubuntu archive keyring with fingerprint
`F6ECB3762474EDA9D21B7022871920D1991BC93C`. The APT transaction installed 10 packages, upgraded
none, removed none, and added `17.5 MB`. It ran under a transactional/standard HIPPO boundary with
`NEEDRESTART_MODE=l`.

## Provider environment

`pipx install --python /usr/bin/python3 podman-compose==1.6.0` ran inside the same admitted
transactional packet as the native prerequisites. The selected interpreter was the approved OS
Python executable `/usr/bin/python3`, version `3.14.4`; its system pip was `25.1.1`. pipx is
`1.8.0`; the isolated environment's pip is `26.2.2` and reports Python `3.14`. `pipx list --json`
records the installed application as `podman-compose` version `1.6.0` using Python `3.14.4`.
`podman-compose --version` reports `podman-compose version 1.6.0`.

The installed provider environment froze to:

```text
podman-compose==1.6.0
python-dotenv==1.2.4
PyYAML==6.0.3
```

All three resolver entries were downloaded as wheels in the admitted packet. Their SHA-256 hashes
are:

| Wheel                                                                                           | SHA-256                                                            |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `podman_compose-1.6.0-py3-none-any.whl`                                                         | `98e48af25d44c10ecef948163bfcca002e32aa8bbb7e66593fbd4faff7270c30` |
| `python_dotenv-1.2.4-py3-none-any.whl`                                                          | `42269a8a5b3fd54ffa6f3d84b18abed50064717576b4ecf03dc4a55d8aa04fdc` |
| `pyyaml-6.0.3-cp314-cp314-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` | `c458b6d084f9b935061bc36216e8a69a7e293a2f1e68bf956dcd9e6cbcd143f5` |

The raw pipx environment and JSON metadata, frozen requirements, wheel files and hashes, and
installer logs are retained in ignored `local-tmp/plan/docker-to-podman/provider-install/`.
Private home-directory paths remain only in those ignored files.

## Admission receipt

The native prerequisites, pipx install, resolver freeze, wheel downloads and hashes, and provider
version check all ran inside one local transactional/standard HIPPO command using the configured
machine profile. The command exited `0`. A subsequent optional read-only summary was queued behind
the approved heavy quick regression and cancelled before start; its receipt is in ignored
`report-read-queue-cancellation.txt`. It did not interrupt or alter the regression or installation.
