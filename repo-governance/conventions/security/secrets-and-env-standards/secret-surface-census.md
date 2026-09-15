---
description: The full inventory of every secret-bearing surface in the repo — app env files, .secrets/, secrets.json, IaC vars, and each platform's environment — with backing tool, backup, and validation status.
when_to_use: Use when auditing which secret surfaces exist in this repo and whether each is backed up and validated.
---

# Secret-Surface Census

| Surface                   | Path                                        | Backing tool       | Backed up                | Validated                                        |
| ------------------------- | ------------------------------------------- | ------------------ | ------------------------ | ------------------------------------------------ |
| App env file              | `apps/<app>/.env.local`                     | dotenvy / Next.js  | Yes (floor)              | Yes (`env validate`)                             |
| Blessed secrets dir       | `.secrets/`                                 | manual             | Yes (floor)              | No                                               |
| Root secrets blob         | `secrets.json`                              | manual             | Yes (floor)              | No                                               |
| Terraform vars            | `infra/terraform/**/*.tfvars`               | Terraform          | Commented scaffold       | Commented scaffold                               |
| Ansible inventory         | `infra/ansible/**/inventory`                | Ansible            | Commented scaffold       | Commented scaffold                               |
| GitHub Environment secret | `{group}-app-staging` / `{group}-app-local` | GitHub Actions Env | No (platform)            | Manifest (`env-injection:` in `repo-config.yml`) |
| Vercel project env        | Vercel project settings (per target)        | Vercel dashboard   | No (platform)            | Manifest (`env-injection:` in `repo-config.yml`) |
| k3s / coralpolyp secret   | The private sibling's secret store          | k3s + coralpolyp   | No (the private sibling) | The private sibling cross-repo                   |

Template files (`*.env.example`) are tracked in git — they are not secrets. Real gitignored files are
the backup target. Injection-target rows (GitHub / Vercel / k3s) hold real values outside this repo;
the `env-injection:` section in `repo-config.yml` is the in-repo record of which key lives where.
