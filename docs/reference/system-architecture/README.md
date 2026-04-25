---
title: System Architecture
description: Comprehensive reference for the Open Sharia Enterprise platform architecture
category: reference
tags:
  - architecture
  - c4-model
  - system-design
created: 2025-11-29
---

# System Architecture

> **Note:** This document is a work in progress (WIP/Draft). Content and diagrams are subject to change as the platform evolves.

Comprehensive reference for the Open Sharia Enterprise platform architecture, including application inventory, interactions, deployment infrastructure, and CI/CD pipelines.

## System Overview

Open Sharia Enterprise is a monorepo-based platform built with Nx, containing multiple applications that serve different aspects of the Sharia-compliant enterprise ecosystem. The system follows a microservices-style architecture where applications are independent but share common libraries and build infrastructure.

**Key Characteristics:**

- **Monorepo Architecture**: Nx workspace with multiple independent applications
- **Trunk-Based Development**: All development on `main` branch
- **Automated Quality Gates**: Git hooks + GitHub Actions + Nx caching
- **Deployment**: Vercel for static sites and web applications
- **Build Optimization**: Nx affected builds ensure only changed code is rebuilt

## C4 Model Architecture

The system architecture is documented using the C4 model (Context, Container, Component, Code) to provide multiple levels of abstraction suitable for different audiences.

### C4 Level 1: System Context

Shows how the Open Sharia Enterprise platform fits into the world, including users and external systems.

```mermaid
graph TB
    subgraph "External Users"
        DEVS[Developers<br/>Building enterprise apps]
        AUTHORS[Content Authors<br/>Writing educational content]
        LEARNERS[Learners<br/>Studying programming/AI/security]
    end

    OSE_PLATFORM[Open Sharia Enterprise Platform<br/>Monorepo with 9 applications<br/>Nx workspace]

    subgraph "External Systems"
        GITHUB[GitHub<br/>Source control & CI/CD]
        VERCEL[Vercel<br/>Static site hosting]
        DNS[DNS/CDN<br/>Domain management]
    end

    DEVS -->|Clone, commit, push| GITHUB
    AUTHORS -->|Write markdown content| GITHUB
    LEARNERS -->|Read tutorials & guides| OSE_PLATFORM

    GITHUB -->|Webhook triggers| OSE_PLATFORM
    OSE_PLATFORM -->|Deploy static sites| VERCEL
    VERCEL -->|Serve websites| LEARNERS
    DNS -->|Route traffic| VERCEL

    style OSE_PLATFORM fill:#0077b6,stroke:#03045e,color:#ffffff,stroke-width:3px
    style DEVS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style AUTHORS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style LEARNERS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style GITHUB fill:#6a4c93,stroke:#22223b,color:#ffffff
    style VERCEL fill:#6a4c93,stroke:#22223b,color:#ffffff
    style DNS fill:#6a4c93,stroke:#22223b,color:#ffffff
```

**Key Relationships:**

- **Developers & Authors**: Interact with GitHub (source of truth) to build applications and create content
- **Learners**: Access educational content via Vercel-hosted sites (ayokoding-web, oseplatform-web)
- **GitHub**: Central hub for CI/CD automation and quality gates
- **Vercel**: Automated deployment platform for Hugo sites and web applications

## Contents

- [Applications & Containers](./applications.md) - Application inventory, C4 Level 2 container diagram, interactions
- [Components & Code](./components.md) - C4 Level 3 component diagrams, Level 4 code architecture
- [Deployment](./deployment.md) - Deployment architecture, environment branches, Vercel configuration
- [CI/CD Pipeline](./ci-cd.md) - Git hooks, GitHub Actions workflows, Nx build system, development workflow
- [Technology Stack](./technology-stack.md) - Stack summary, quality tools, future considerations
