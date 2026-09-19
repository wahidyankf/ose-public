---
description: Why Docker Dev Containers are incompatible with git worktree isolation, how ./rhino toolchain validate mirrors the IaC check-diff-apply pattern, and guidance for future toolchain decisions.
when_to_use: Use when justifying the doctor-based check-diff-apply pattern, or when deciding whether a new tool fits native-first management.
---

# Rationale — Worktrees and the Doctor Pattern

## 5. Git Worktrees Are Incompatible with Dev Containers

The repository uses git worktrees for AI agent isolation (`.claude/worktrees/`). Worktrees are host-level filesystem constructs that do not map cleanly to Docker volumes. Each worktree would require its own container, multiplying the resource cost and eliminating the lightweight isolation that worktrees provide.

## 6. `./rhino toolchain validate` Already Provides the Check-Diff-Apply Pattern

The `doctor` command maps directly to familiar IaC concepts:

| `Rhino` Command          | IaC Equivalent                   | Purpose                         |
| ------------------------ | -------------------------------- | ------------------------------- |
| `doctor`                 | `terraform plan`                 | Detect drift from desired state |
| `doctor --fix`           | `terraform apply`                | Converge to desired state       |
| `doctor --fix --dry-run` | `terraform plan` (without apply) | Preview changes before applying |

Config files serve as the desired state declarations:

- `package.json` (volta field) declares Node.js and npm versions
- `Cargo.toml` declares Rust edition and crate dependencies
- `global.json` declares .NET SDK version

## Guidance for Future Decisions

### DO

- Use `./rhino toolchain validate` for toolchain verification and auto-install
- Use version managers (Volta, rustup, dotnet-install) for language version pinning
- Use `Brewfile` for declarative Homebrew dependencies
- Use Docker for networked E2E stacks and CI pipelines; keep Integration on local resources it
  owns, with no external network reach

### DO NOT

- Introduce Terraform, Ansible, Nix, or similar IaC tools for dev environment setup
- Create Docker Dev Containers (`.devcontainer/`) as the primary development mode
- Add external state files for tracking installed tools
