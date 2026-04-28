---
title: "Overview"
weight: 10000000
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Learn K3s through 85 annotated examples covering installation, workloads, networking, storage, GitOps, and production operations - ideal for experienced engineers"
tags: ["k3s", "kubernetes", "infrastructure", "by-example", "containers", "devops"]
---

This series teaches K3s — the lightweight Kubernetes distribution by Rancher — through heavily annotated, self-contained examples. Each example focuses on a single K3s or Kubernetes concept and includes inline annotations explaining what each command or manifest directive does, why it matters, and what cluster state results from it.

K3s packages a full Kubernetes control plane into a single ~70 MB binary. It uses containerd instead of Docker, embeds Traefik as an ingress controller, ships local-path-provisioner for storage, and bundles CoreDNS, Flannel CNI, and Klipper load balancer — all with zero external dependencies for a single-node install. This series covers K3s v1.35.4+k3s1 running Kubernetes v1.35.4.

## Series Structure

The examples are organized into three levels based on complexity:

- [Beginner](/en/learn/software-engineering/infrastructure/tools/k3s/by-example/beginner) —
  Installation, core workload types, networking basics, storage, health checks, and K3s-specific
  features like the auto-manifest directory and config file (Examples 1-28)
- [Intermediate](/en/learn/software-engineering/infrastructure/tools/k3s/by-example/intermediate) —
  High availability setup, CNI replacement, HelmChart CRD, cert-manager TLS, MetalLB, RBAC,
  NetworkPolicy, autoscaling, Longhorn storage, and workload placement (Examples 29-57)
- [Advanced](/en/learn/software-engineering/infrastructure/tools/k3s/by-example/advanced) —
  GitOps with Flux CD, multi-cluster with Rancher, policy enforcement with OPA Gatekeeper,
  observability stacks, cluster backup/restore, custom operators, and production hardening
  (Examples 58-85)

## Structure of Each Example

Every example follows a consistent five-part format:

1. **Brief Explanation** — what the K3s concept addresses and why it matters (2-3 sentences)
2. **Mermaid Diagram** — visual representation of cluster topology, traffic flow, or component relationships (when appropriate)
3. **Heavily Annotated Code** — shell commands or YAML manifests with `# =>` comments documenting each step and its cluster-state effect
4. **Key Takeaway** — the core insight to retain from the example (1-2 sentences)
5. **Why It Matters** — production relevance and real-world impact (50-100 words)

## Prerequisites

These examples assume you have:

- A Linux host (Ubuntu 22.04 or Debian 12 recommended) with at least 1 CPU and 512 MB RAM
- `sudo` access for installation commands
- Familiarity with basic shell commands and YAML syntax
- Understanding of core Kubernetes concepts (Pod, Deployment, Service) at a conceptual level

## How to Use This Series

Each page presents annotated shell sessions and YAML manifests. Read the `# =>` annotations alongside
the commands to understand both the mechanics and the intent. The examples within each level build
progressively, so reading sequentially within a level gives the fullest understanding.
