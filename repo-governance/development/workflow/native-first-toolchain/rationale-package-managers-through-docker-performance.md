---
description: Why native package managers are already idempotent, why installed binaries are the source of truth, why this is a single-machine problem, and why container-based Dev Containers cost too much on macOS, with the Docker figures kept as recorded history.
when_to_use: Use when justifying why native toolchain management beats IaC or containerized dev environments for this monorepo, or when checking which performance figures apply to Podman.
---

# Rationale — Package Managers Through Container Performance

## 1. Package Managers Are Already Idempotent

Every major package manager handles re-installation gracefully:

| Command                        | Re-run Behaviour                | Idempotent? | Notes                  |
| ------------------------------ | ------------------------------- | ----------- | ---------------------- |
| `brew install go`              | Fetches manifest, skips install | Yes         | Network call but no-op |
| `volta install node@X`         | Silent no-op                    | Yes         |                        |
| `cargo install cargo-llvm-cov` | Downloads index, skips          | Yes         | Slow but safe          |
| `asdf plugin add X`            | "already added"                 | Yes         |                        |
| `pyenv install X`              | "already exists"                | Yes         |                        |
| `curl get.volta.sh \| bash`    | Re-installs                     | Yes         | Noisy but safe         |
| `rustup-init -y`               | Non-interactive install         | Yes         | Must use `-y` flag     |
| `brew install --cask flutter`  | Skips if installed              | Yes         | Must use `--cask`      |
| `sudo apt-get install -y X`    | "already newest version"        | Yes         | Ubuntu/Linux           |
| `sudo snap install X`          | "already installed"             | Yes         | Ubuntu/Linux           |

No external state file or convergence engine is needed when the underlying tools already guarantee idempotency.

## 2. State Is the Installed Binaries

`which go` + `go version` IS the state query. Terraform's state file would be a stale cache of something `./rhino toolchain validate` can detect in seconds. The filesystem and PATH are the single source of truth for "what is installed," and querying them directly is simpler and more accurate than maintaining a parallel state file.

## 3. Single Developer Machine, Not a Fleet

Terraform and Ansible solve fleet management across hundreds of servers. This repository targets one macOS laptop per developer. The overhead of a DSL, provider plugins, or inventory files provides zero value for a single-machine target.

## 4. Docker Dev Containers Have Unacceptable Performance Cost on macOS (Podman Unmeasured)

The figures in this section are the values this rationale originally recorded for Docker-based Dev
Containers. They are historical Docker figures, not Podman measurements. Podman on macOS runs
containers inside a Podman machine VM, so bind-mount I/O and image size may differ from them.

The recorded figures are: nineteen toolchains produce a 15-30 GB Docker image; macOS Docker bind-mount
I/O runs 2-5x slower than native filesystem access; and pre-commit hooks that complete in 5 seconds
natively take 30-60 seconds inside a container. Developers disable hooks out of frustration, which
degrades code quality -- a worse outcome than not using a container at all.

The performance argument carries over to Podman only where a measurement on Podman supports it. This
repository records no Podman measurement for these figures yet.
