---
title: "Overview"
date: 2026-07-30T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Backend Essentials](../backend-essentials/learning/overview.md) -- a small HTTP
  service you can run and hit with `curl` is the thing being hosted throughout every example here;
  [Just Enough Bash](../just-enough-bash/learning/overview.md) -- the shell, `ssh`, and reading a
  script are assumed fluent, since this course's artifacts ARE shell scripts, `systemd` unit files,
  and proxy configs rather than application code.
- **Tools & environment**: a macOS/Linux terminal; `ssh`; a single cheap Linux VM or a local VM (any
  provider); `systemd`; a reverse proxy (Caddy or Nginx) with automatic TLS; a firewall (`ufw`); and,
  for the PaaS contrast, a git-push platform (self-hosted or managed). No application framework is
  taught here -- the service being hosted is reused from `backend-essentials`.
- **Assumed knowledge**: running a service locally and reaching it with `curl`; basic Linux file and
  permission concepts; using `git`.

## Why this exists -- the big idea

**The problem before the solution**: an engineer who has only ever pushed to a fully managed platform
is helpless the moment they must run their own box. They cannot reason about a Linux service, a
reverse proxy, TLS, a firewall, or the question "why is it not reachable?" Self-hosting ONE service
demystifies the whole deployment substrate -- because every managed platform on earth is quietly
automating the exact same primitives this course exposes by hand.

**Keep-this-if-you-forget-everything**: a deployment is just _a process running on a machine,
reachable through a proxy, over TLS, restarted when it dies, reproducible from config_ -- everything
fancier is an automation of those same primitives.

**Cross-cutting big ideas, taught here and carried through every tier**:
`abstraction-and-its-cost` -- a PaaS hides the box; self-hosting shows you what it was hiding and
what you pay to peel that abstraction back; `taming-state` -- a service's lifecycle, configuration,
and data must be managed deliberately, never assumed, because on your own box nothing absorbs that
responsibility for you.

> **Scope guard -- what this course is, and is deliberately NOT.** This course is the **light
> on-ramp** to running your own software: provision one box or VM, run a service on it, put a reverse
> proxy with automatic TLS in front, harden it, and deploy once via a git-push PaaS for contrast. It
> is a _first altitude_ -- "get a real service of mine on the internet, reproducibly." It is
> **deliberately NOT** the full-depth operations course. Specifically, this course does **NOT cover
> clusters, Terraform/Packer/Ansible IaC, or Proxmox** bare-metal virtualization -- those are
> different altitudes: a `cluster` of many machines and the fleet management that runs one
> (`self-managed-kubernetes-and-gitops`) is a later, heavier altitude than the single box this course
> owns; `Terraform`, `Packer`, and `Ansible` (infrastructure-as-code and configuration-management
> tools that codify whole fleets) are reached for only once the hand-built, reproducible scripts here
> start to strain; and `Proxmox` (a bare-metal hypervisor for running many VMs on your own iron) is
> the deep end covered by `bare-metal-virtualization`. Reaching for any of those before you can
> reliably stand up one box by hand is premature -- this course is the prerequisite altitude beneath
> all of them.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 78 runnable, heavily annotated worked examples across
  Beginner (Examples 1-16: provision a box, SSH keys and a non-root user, a firewall, installing a
  runtime, running a service in the foreground, a `systemd` unit, enable-on-boot, status and logs,
  restart-on-crash, installing a reverse proxy, proxying to the app, a DNS A record, automatic TLS,
  env config, and keeping secrets out of the repo), Intermediate (Examples 17-32: a health endpoint,
  a cron/systemd-timer uptime check, a reproducible setup script, idempotent provisioning, secret
  rotation, proxy security headers, firewall least-privilege, log rotation, installing a PaaS, a
  git-push deploy, buildpack and Dockerfile builds, PaaS env config and TLS, rollback, and a
  zero-downtime restart), and Advanced (Examples 33-78: a data-backed service, tested backup and a
  restore drill, reboot resilience, multiple services on one box, resource limits, metrics, a deploy
  pipeline, a self-hosted-vs-managed writeup, a disaster rebuild, `fail2ban`, staging-vs-prod
  promotion, plus a deep run of `systemd` timer/socket/drop-in/graceful-shutdown patterns, a Caddy-vs
  -Nginx contrast and the rest of the proxy and TLS surface, DNS CNAME/TTL/subdomain routing,
  env-template and `systemd` environment files, secret rotation and pre-commit scanning, structured
  logging and log shipping, health-failure alerting, watchdog and backoff restarts, Procfile/release/
  scaling PaaS patterns, blue-green and connection-drain deploys, restic and pg_dump backups with
  retention and verification, and a cloud-init reprovision) -- plus a four-step capstone that stands
  up a fully self-hosted service on one box, reproducible from scripts.
- **Drilling** -- the spaced-repetition companion: recall Q&A across all 22 concepts, applied
  problems, self-contained config/shell katas, a self-check checklist, and elaborative-interrogation
  prompts.

**A note on how this course frames its claims**: this is an **ops/config** course. Every worked
example is a real shell script, `systemd` unit, Caddy/Nginx config, cron entry, or setup script --
minimal application code -- each followable on a single cheap VM or a local VM. Where an example
shows an "Expected" block, it is the verification step's observable outcome (a `systemctl status`
line, a `curl` response, a `journalctl` entry), framed as what you should see when you run the
accompanying verify command on your own box, not a transcript captured inside this build environment.

## Accuracy notes

> Pre-authoring `web-researcher` sweep pending (per this plan's Anti-Hallucination verification
> recipe). Dated per this topic's own accuracy-note discipline (DD-28): every volatile,
> version-pinned, or calendar-dependent fact below is flagged or dated here rather than stated
> unqualified in the stable spine above.

- 2026-07-30 -- **evergreen and stable**: `ssh` key-based authentication, `systemd` unit files and
  the `systemctl`/`journalctl` lifecycle, the reverse-proxy concept, ACME/Let's Encrypt automatic
  TLS, and `ufw` firewall basics are stable operational concepts and are taught as such throughout.
- 2026-07-30 -- **[Needs Verification] version-volatile, pin at authoring**: the exact CVE-clean
  versions and command surfaces of the chosen reverse proxy (Caddy/Nginx) and any PaaS (Dokku/Coolify
  or a managed buildpack platform) change release to release. The hedge value current as of drafting:
  Caddy latest stable **v2.11.4**
  (source: caddyserver/caddy releases -- https://github.com/caddyserver/caddy/releases ; accessed
  2026-07-22). Nginx and the PaaS choice are kept portable across a couple of options rather than
  pinned to one vendor's exact release; re-verify any version before running it on a real box.
- 2026-07-30 -- **[Needs Verification]**: provider-specific VM-provisioning UI/CLI details are kept
  provider-agnostic wherever possible; the examples name the _shape_ of the step ("create a Linux VM,
  record its IP") rather than one vendor's console.

---

Next: [Learning Overview](./learning/overview.md) →
