---
title: "Overview"
date: 2025-12-29T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Ansible through 80 annotated code examples covering playbooks, inventory, roles, modules, templates, vault, and production automation patterns"
tags: ["ansible", "automation", "infrastructure", "tutorial", "by-example", "devops", "configuration-management"]
---

**Want to master Ansible through working examples?** This by-example guide teaches 95% of Ansible through 80 annotated code examples organized by complexity level.

## What Is By-Example Learning?

By-example learning is an **example-first approach** where you learn through annotated, runnable code rather than narrative explanations. Each example is self-contained, immediately executable as an Ansible playbook or task, and heavily commented to show:

- **What each line does** - Inline comments explain modules, variables, and Ansible behavior
- **Expected outputs** - Using `# =>` notation for task results, module outputs, and state changes
- **Ansible mechanics** - How idempotency, facts, handlers, and execution flow work
- **Key takeaways** - 1-2 sentence summaries of patterns and best practices

This approach is **ideal for experienced infrastructure engineers** who already understand Linux systems and command-line tools, and want to quickly master Ansible's DSL, modules, and automation patterns through working playbooks.

Unlike narrative tutorials that build understanding through explanation and storytelling, by-example learning lets you **see the code first, run it second, and understand it through direct interaction**. You learn Ansible patterns by running actual automation playbooks.

## What Is Ansible?

**Ansible** is an agentless automation platform that uses SSH to configure systems, deploy applications, and orchestrate complex workflows. Unlike agent-based tools (Puppet, Chef), **Ansible provides**:

- **Agentless architecture** - No agents to install; uses SSH and Python on target hosts
- **Declarative YAML syntax** - Human-readable playbooks describing desired state
- **Idempotent modules** - Safe to run multiple times; only applies necessary changes
- **Built-in modules** - 3000+ modules for system, cloud, network, and application management
- **Simple inventory** - Static INI/YAML files or dynamic cloud-based sources
- **No database** - Stateless execution model; playbooks are the source of truth

**Ansible vs. Shell Scripts**: Shell scripts are procedural (step-by-step commands). Ansible playbooks are declarative (desired state) and idempotent (safe to rerun). Ansible handles error checking, state validation, and cross-platform differences automatically.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Beginner<br/>Examples 1-27<br/>Playbooks & Core Modules"] --> B["Intermediate<br/>Examples 28-54<br/>Roles & Templates"]
    B --> C["Advanced<br/>Examples 55-80<br/>Collections & Testing"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
```

Progress from Ansible fundamentals (playbooks, inventory, core modules) through production patterns (roles, templates, vault) to advanced automation (custom modules, collections, testing). Each level builds on the previous, introducing more sophisticated Ansible features and real-world patterns.

## Coverage Philosophy

This by-example guide provides **95% coverage of Ansible** through practical, annotated examples. The 95% figure represents the depth and breadth of concepts covered, not a time estimate—focus is on **outcomes and understanding**, not duration.

### What's Covered

- **Playbook fundamentals** - YAML syntax, tasks, plays, execution flow, verbosity
- **Inventory management** - Static INI/YAML files, dynamic inventory, groups, host variables
- **Core modules** - `command`, `shell`, `copy`, `file`, `template`, `apt`, `yum`, `service`
- **Variables and facts** - Variables, facts, host_vars, group_vars, Jinja2 templating
- **Conditionals and loops** - `when`, `loop`, `with_items`, `until`, complex conditions
- **Roles and Galaxy** - Role structure, dependencies, Ansible Galaxy, role composition
- **Handlers and notifications** - Handler triggers, notifications, flush_handlers, idempotency
- **Templates** - Jinja2 syntax, filters, loops, conditionals, whitespace control
- **Ansible Vault** - Encrypting variables, vault-id, editing encrypted files, best practices
- **Error handling** - `ignore_errors`, `failed_when`, `changed_when`, `block`/`rescue`
- **Tags and task control** - Task tagging, --tags/--skip-tags, task delegation
- **Custom modules** - Python module development, argument spec, return values, testing
- **Ansible Collections** - Installing collections, using collection modules, creating collections
- **Testing** - Ansible-lint, Molecule, test scenarios, verification, CI/CD integration
- **Production patterns** - Idempotency, orchestration, rolling updates, health checks

### What's NOT Covered

This guide focuses on **Ansible essentials and production automation patterns**, not specialized use cases or exhaustive module coverage. For additional topics:

- **Ansible Tower/AWX** - Web UI, job scheduling, RBAC, workflows
- **Network automation** - Cisco, Juniper, Arista module deep-dives
- **Windows automation** - WinRM configuration, Windows-specific modules
- **Container orchestration** - Kubernetes operator patterns, Docker Swarm
- **All 3000+ modules** - Focus on most common 50-60 modules

The 95% coverage goal maintains humility—no tutorial can cover everything. This guide teaches the **core patterns that unlock the remaining 5%** through your own exploration and Ansible documentation.

## Prerequisites

Before starting this tutorial, you should be comfortable with:

- **Linux command line** - File operations, permissions, process management, SSH
- **YAML syntax** - Basic YAML structure, lists, dictionaries, multi-line strings
- **SSH fundamentals** - Key-based authentication, ssh-agent, authorized_keys
- **Python basics** - Understanding that Ansible uses Python under the hood
- **Text editors** - Vim, nano, or your preferred editor for playbook editing

No prior Ansible experience required—this guide starts from first principles and builds to production automation patterns.

## How to Use This Guide

1. **Read beginner examples** (1-27) - Establish playbook fundamentals and module usage
2. **Run each example** - Execute playbooks against test VMs or containers
3. **Read intermediate examples** (28-54) - Learn roles, templates, and production patterns
4. **Read advanced examples** (55-80) - Master testing, custom modules, and CI/CD integration
5. **Experiment** - Modify examples, combine patterns, build your own automation

Focus on running and understanding examples rather than memorizing syntax. Ansible is learned through doing—each example should be executed and experimented with.

## Example Structure

Each example follows a five-part format:

1. **Explanation** (2-4 sentences) - What the example demonstrates and why it matters
2. **Diagram** (when helpful) - Mermaid diagram visualizing execution flow or architecture
3. **Annotated code** - Playbook with inline `# =>` comments showing outputs and mechanics
4. **Key takeaway** - 1-2 sentence summary of the pattern learned

This format emphasizes **code first, explanation second**—you see working automation before diving into conceptual details.

## Getting Started

Install Ansible and set up a test environment:

```yaml
# Install on Ubuntu/Debian
# $ sudo apt update && sudo apt install ansible

# Install on macOS
# $ brew install ansible

# Verify installation
# $ ansible --version
# => ansible [core 2.15.0] or later
```

Set up SSH access to test hosts, then proceed to [Beginner](/en/learn/software-engineering/infrastructure/tools/ansible/by-example/beginner) examples.
