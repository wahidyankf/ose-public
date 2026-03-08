---
title: "Overview"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000000
description: "Learn Docker containerization through 84 annotated code examples covering 95% of Docker - ideal for experienced developers"
tags: ["docker", "tutorial", "by-example", "examples", "code-first", "containers", "devops"]
---

## What is Docker By Example?

This tutorial teaches Docker containerization through **84 heavily annotated, runnable examples** that achieve 95% coverage of Docker's features needed for production work. Each example is self-contained, copy-paste-runnable, and extensively commented to show exactly what happens at each step.

## Who is This For?

**Target audience**: Experienced developers and DevOps engineers who prefer learning through working code rather than theoretical explanations.

**Prerequisites**:

- Familiarity with command-line interfaces
- Basic understanding of software development and deployment
- Experience with at least one programming language

**What you'll learn**:

- Dockerfile syntax and image building (multi-stage builds, layer optimization)
- Container lifecycle management (creation, execution, networking, volumes)
- Docker Compose orchestration (multi-container applications, service dependencies)
- Production patterns (health checks, resource limits, security best practices)
- Container registries and distribution (Docker Hub, private registries)
- CI/CD integration (automated builds, testing, deployment)

## How to Use This Tutorial

### Code-First Learning Philosophy

**Show the code first, run it second, understand through interaction.**

Each example follows this pattern:

1. **Brief explanation** (2-3 sentences) - What and why
2. **Diagram** (when helpful) - Visualize the concept
3. **Annotated code** - Heavily commented with `# =>` notation showing outputs and states
4. **Key takeaway** - The core insight distilled

### Example Annotation Pattern

All examples use `# =>` notation to show outputs, states, and intermediate values:

```dockerfile
# Base image selection
FROM node:18-alpine     # => Pulls official Node.js 18 image based on Alpine Linux (small footprint)

# Working directory setup
WORKDIR /app            # => Sets /app as the working directory inside container

# Dependency installation
COPY package*.json ./   # => Copies package files to /app/ (leverages layer caching)
RUN npm ci              # => Installs exact dependencies from package-lock.json
                        # => Creates a new layer with node_modules/

# Application code
COPY . .                # => Copies all source files to /app/

# Container configuration
EXPOSE 3000             # => Documents that container listens on port 3000 (informational only)
CMD ["node", "server.js"] # => Default command when container starts
```

### Self-Contained Examples

**Every example is copy-paste-runnable** within its chapter scope:

- **Beginner examples**: Completely standalone (no external dependencies)
- **Intermediate examples**: Assume basic Docker knowledge but include all necessary files
- **Advanced examples**: Assume fundamentals but remain fully runnable

You can copy any example and run it immediately without referring to previous examples.

## 95% Coverage: What It Means

### Included in 95%

**Core Docker features for production work**:

- Image building (Dockerfile syntax, multi-stage builds, layer optimization)
- Container lifecycle (run, exec, logs, inspect, stop, remove)
- Networking (bridge, host, overlay networks, service discovery)
- Data persistence (volumes, bind mounts, tmpfs)
- Docker Compose (service definitions, dependencies, environment variables)
- Security (user permissions, secrets, scanning, best practices)
- Resource management (CPU/memory limits, health checks, restart policies)
- Registry operations (push, pull, authentication, private registries)
- Production patterns (logging, monitoring, orchestration basics)

### Excluded from 95% (the remaining 5%)

**Specialized or rare scenarios**:

- Docker engine internals and architecture
- Kubernetes-specific features (covered in separate Kubernetes tutorials)
- Deprecated Docker features (Swarm mode details)
- Platform-specific advanced features (Windows containers specifics)
- Docker plugin development
- Low-level container runtime details (containerd, runc internals)

## Tutorial Structure

### Beginner (Examples 1-27) - 0-40% Coverage

**Focus**: Docker fundamentals and core workflow

**Topics**:

- Installation and hello world
- Dockerfile basics (FROM, RUN, COPY, CMD)
- Image management (build, list, tag, remove)
- Container basics (run, stop, remove, logs)
- Volumes and data persistence
- Basic networking
- Docker Compose introduction

**Example count**: 27 examples

### Intermediate (Examples 28-54) - 40-75% Coverage

**Focus**: Production patterns and service orchestration

**Topics**:

- Multi-stage builds for optimization
- Docker Compose services and dependencies
- Health checks and restart policies
- Resource limits (CPU, memory)
- Logging strategies and monitoring
- Environment variable management
- Networking modes and custom networks

**Example count**: 27 examples

### Advanced (Examples 55-84) - 75-95% Coverage

**Focus**: Production deployment and optimization

**Topics**:

- Docker Swarm basics (orchestration introduction)
- Security best practices (scanning, secrets, user permissions)
- Registry operations (Docker Hub, private registries, authentication)
- CI/CD integration (automated builds, testing pipelines)
- Production deployment patterns
- Performance optimization

**Example count**: 30 examples

## Color-Blind Friendly Diagrams

All diagrams use a **WCAG AA compliant color palette**:

- **Blue** (#0173B2) - Primary elements, starting states
- **Orange** (#DE8F05) - Processing states, intermediate steps
- **Teal** (#029E73) - Success states, outputs
- **Purple** (#CC78BC) - Alternative paths, options
- **Brown** (#CA9161) - Neutral elements, helpers

**Never**: Red, green, or yellow (not color-blind accessible)

## Navigation

**Structure**:

- [Beginner](/en/learn/software-engineering/infrastructure/tools/docker/by-example/beginner) - Examples 1-27 (fundamentals)
- [Intermediate](/en/learn/software-engineering/infrastructure/tools/docker/by-example/intermediate) - Examples 28-54 (production patterns)
- [Advanced](/en/learn/software-engineering/infrastructure/tools/docker/by-example/advanced) - Examples 55-84 (expert mastery)

## Getting Started

**System Requirements**:

- Docker Engine 20.10+ (Linux, macOS, Windows)
- Docker Compose 2.0+ (included with Docker Desktop)
- Terminal/command-line access
- 4GB RAM minimum, 8GB recommended

**Installation**:

- Linux: [Docker Engine installation](https://docs.docker.com/engine/install/)
- macOS/Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Verify installation**:

```bash
docker --version    # => Docker version 24.0.0 or higher
docker compose version  # => Docker Compose version v2.20.0 or higher
```

## How This Differs from Other Tutorials

**Traditional tutorials**: Explain concepts, then show small code snippets.

**This tutorial**: Shows complete, runnable examples first, with heavy annotations explaining what happens at each step. Every example can be copied and executed immediately.

**Coverage approach**: Achieves 95% feature coverage through systematic progression across 84 examples, ensuring you learn everything needed for production Docker work.

## Ready to Start?

Begin with [Beginner](/en/learn/software-engineering/infrastructure/tools/docker/by-example/beginner) for Docker fundamentals, or jump to [Intermediate](/en/learn/software-engineering/infrastructure/tools/docker/by-example/intermediate) if you already know basic Dockerfile syntax and container management.

**Learning tip**: Run every example. Docker is best learned by doing, not reading. Each example is designed to be executed, examined, and modified.
