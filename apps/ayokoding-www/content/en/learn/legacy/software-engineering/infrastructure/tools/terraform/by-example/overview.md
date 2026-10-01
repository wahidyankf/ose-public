---
title: "Overview"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000000
description: "Learn Terraform through 84 annotated code examples covering infrastructure as code, HCL syntax, providers, state management, and cloud provisioning patterns"
tags: ["terraform", "iac", "infrastructure", "tutorial", "by-example", "devops", "cloud", "hcl"]
---

**Want to master Terraform through working examples?** This by-example guide teaches Terraform fundamentals through 84 annotated code examples organized by complexity level (in active development toward 95% coverage).

## What Is By-Example Learning?

By-example learning is an **example-first approach** where you learn through annotated, runnable code rather than narrative explanations. Each example is self-contained, immediately executable as Terraform configuration, and heavily commented to show:

- **What each line does** - Inline comments explain HCL syntax, resource attributes, and Terraform behavior
- **Expected outputs** - Using `# =>` notation for plan outputs, apply results, and state changes
- **Terraform mechanics** - How providers, state management, dependencies, and execution flow work
- **Key takeaways** - 1-2 sentence summaries of patterns and best practices

This approach is **ideal for experienced infrastructure engineers** who already understand cloud concepts and networking fundamentals, and want to quickly master Terraform's declarative language, resource management, and Infrastructure as Code patterns through working configurations.

Unlike narrative tutorials that build understanding through explanation and storytelling, by-example learning lets you **see the code first, run it second, and understand it through direct interaction**. You learn Terraform patterns by executing actual infrastructure provisioning.

## What Is Terraform?

**Terraform** is a declarative Infrastructure as Code (IaC) tool that provisions and manages cloud resources across multiple providers. Unlike imperative scripts that define step-by-step instructions, **Terraform provides**:

- **Declarative configuration** - Describe desired infrastructure state in HCL (HashiCorp Configuration Language)
- **Multi-cloud support** - Single tool for AWS, Azure, GCP, Kubernetes, and 1000+ providers
- **State management** - Tracks actual infrastructure state and plans changes
- **Execution plans** - Preview changes before applying (terraform plan)
- **Resource graph** - Automatic dependency resolution and parallel execution
- **Immutable infrastructure** - Replace rather than modify resources for consistency

**Terraform vs. CloudFormation/ARM**: CloudFormation (AWS) and ARM (Azure) are cloud-specific. Terraform is cloud-agnostic with consistent syntax across providers. Terraform vs. Ansible: Ansible excels at configuration management, Terraform at infrastructure provisioning. Use both together—Terraform provisions VMs, Ansible configures them.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: Learning Path
    accDescr: Graph with 3 nodes and 2 connections. Nodes: Beginner Examples 1-28 HCL & Resources, Intermediate Examples 29+ Modules & State (in development), Advanced Examples 57+ Testing & CI/CD (in development). Connections: Beginner Examples 1-28 HCL & Resources to Intermediate Examples 29+ Modules & State (in development), Intermediate Examples 29+ Modules & State (in development) to Advanced Examples 57+ Testing & CI/CD (in development).
    A["Beginner<br/>Examples 1-28<br/>HCL & Resources"] --> B["Intermediate<br/>Examples 29+<br/>Modules & State<br/>#40;in<br/>development#41;"]
    B --> C["Advanced<br/>Examples 57+<br/>Testing & CI/CD<br/>#40;in<br/>development#41;"]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class C pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Progress from Terraform fundamentals (HCL syntax, providers, resources, variables) through production patterns (modules, remote state, workspaces) to advanced infrastructure (custom providers, testing, multi-environment deployments). Each level builds on the previous, introducing more sophisticated Terraform features and real-world patterns.

## Coverage Philosophy

This by-example guide provides **comprehensive coverage of Terraform fundamentals** through practical, annotated examples, with intermediate and advanced topics in active development. Coverage represents depth and breadth of concepts, not time estimates—focus is on **outcomes and understanding**, not duration.

### What's Covered

- **HCL fundamentals** - Syntax, blocks, attributes, expressions, functions
- **Provider configuration** - AWS, Azure, GCP, Kubernetes, version constraints
- **Resource management** - Creation, updates, dependencies, lifecycle rules
- **Variables and outputs** - Input variables, output values, locals, sensitive data
- **Data sources** - Querying existing infrastructure, referencing external data
- **State management** - Local state, remote backends, state locking, migration
- **Modules** - Module structure, composition, versioning, Terraform Registry
- **Workspaces** - Multi-environment management, workspace-specific configuration
- **Provisioners** - Local-exec, remote-exec, file provisioner, connection blocks
- **Dynamic blocks** - Dynamic resource generation, for_each, count
- **Terraform import** - Importing existing infrastructure into state
- **Custom providers** - Provider development, schema definition, CRUD operations
- **Testing** - Terratest integration, TFLint static analysis, validation
- **State migration** - Backend migration, state refactoring, resource moves
- **Multi-environment patterns** - Directory structure, variable composition, DRY principles
- **Security** - Secrets management, encryption, least privilege IAM
- **CI/CD integration** - GitOps workflows, automated planning, approval gates

### What's NOT Covered

This guide focuses on **Terraform essentials and production infrastructure patterns**, not specialized use cases or exhaustive provider coverage. For additional topics:

- **Terraform Cloud/Enterprise** - Workspaces, VCS integration, policy as code (Sentinel)
- **All 1000+ providers** - Focus on most common providers (AWS, Azure, GCP, Kubernetes)
- **Provider-specific deep-dives** - Exhaustive resource documentation for every provider
- **Legacy Terraform 0.11** - Focus on modern Terraform 1.x+ syntax
- **Terragrunt patterns** - DRY wrapper around Terraform (separate tool)

The 95% coverage goal maintains humility—no tutorial can cover everything. This guide teaches the **core patterns that unlock the remaining 5%** through your own exploration and Terraform documentation.

## Prerequisites

Before starting this tutorial, you should be comfortable with:

- **Cloud fundamentals** - VPCs, subnets, security groups, IAM, basic networking
- **Command line** - File operations, environment variables, shell basics
- **Git basics** - Version control, repositories, branches
- **YAML/JSON** - Basic structured data formats (HCL is similar)
- **Infrastructure concepts** - Servers, networking, DNS, load balancing

No prior Terraform experience required—this guide starts from first principles and builds to production infrastructure patterns.

## How to Use This Guide

1. **Read beginner examples** (1-28) - Establish HCL fundamentals and resource management
2. **Run each example** - Execute terraform init, plan, apply against test environments
3. **Read intermediate examples** (29+) - Learn modules, remote state, and orchestration (in development)
4. **Read advanced examples** (57+) - Master testing, security, and CI/CD integration (in development)
5. **Experiment** - Modify examples, combine patterns, build your own infrastructure

Focus on running and understanding examples rather than memorizing syntax. Terraform is learned through doing—each example should be executed and experimented with.

## Example Structure

Each example follows a five-part format:

1. **Explanation** (2-4 sentences) - What the example demonstrates and why it matters
2. **Diagram** (when helpful) - Mermaid diagram visualizing infrastructure or execution flow
3. **Annotated code** - Terraform configuration with inline `# =>` comments showing outputs
4. **Key takeaway** - 1-2 sentence summary of the pattern learned

This format emphasizes **code first, explanation second**—you see working infrastructure code before diving into conceptual details.

## Getting Started

Install Terraform and set up credentials:

```bash
# Install on macOS
# $ brew install terraform

# Install on Linux
# $ wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip
# $ unzip terraform_1.9.0_linux_amd64.zip
# $ sudo mv terraform /usr/local/bin/

# Verify installation
# $ terraform version
# => Terraform v1.9.0 or later

# Configure AWS credentials (example)
# $ export AWS_ACCESS_KEY_ID="your-access-key"
# $ export AWS_SECRET_ACCESS_KEY="your-secret-key"
# $ export AWS_DEFAULT_REGION="us-east-1"
```

Set up test cloud account credentials, then proceed to [Beginner](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner) examples.

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: Hello World - Minimal Configuration](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-1-hello-world---minimal-configuration)
- [Example 2: Terraform CLI Basics](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-2-terraform-cli-basics)
- [Example 3: HCL Block Types](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-3-hcl-block-types)
- [Example 4: HCL Data Types and Expressions](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-4-hcl-data-types-and-expressions)
- [Example 5: Comments and Documentation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-5-comments-and-documentation)
- [Example 6: HCL Functions](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-6-hcl-functions)
- [Example 7: Provider Configuration](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-7-provider-configuration)
- [Example 8: Resource Basics](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-8-resource-basics)
- [Example 9: Resource Dependencies](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-9-resource-dependencies)
- [Example 10: Resource Lifecycle](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-10-resource-lifecycle)
- [Example 11: Input Variables](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-11-input-variables)
- [Example 12: Output Values](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-12-output-values)
- [Example 13: Local Values](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-13-local-values)
- [Example 14: Data Source Basics](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-14-data-source-basics)
- [Example 15: External Data Source](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-15-external-data-source)
- [Example 16: Understanding State](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-16-understanding-state)
- [Example 17: State Commands](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-17-state-commands)
- [Example 18: State Locking](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-18-state-locking)
- [Example 19: Variable Validation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-19-variable-validation)
- [Example 20: Variable Precedence](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-20-variable-precedence)
- [Example 21: Sensitive Variables](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-21-sensitive-variables)
- [Example 22: Variable Files Organization](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-22-variable-files-organization)
- [Example 23: Data Source Dependencies](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-23-data-source-dependencies)
- [Example 24: Terraform Data Source](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-24-terraform-data-source)
- [Example 25: State Backup and Recovery](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-25-state-backup-and-recovery)
- [Example 26: State Refresh](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-26-state-refresh)
- [Example 27: Targeting Specific Resources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-27-targeting-specific-resources)
- [Example 28: Import Existing Resources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/beginner#example-28-import-existing-resources)

### Intermediate (Examples 29–56)

- [Example 29: Basic Module Structure](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-29-basic-module-structure)
- [Example 30: Module Versioning with Git Sources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-30-module-versioning-with-git-sources)
- [Example 31: Module Input Validation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-31-module-input-validation)
- [Example 32: Module Composition with Dependencies](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-32-module-composition-with-dependencies)
- [Example 33: Module Count and For Each](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-33-module-count-and-for-each)
- [Example 34: Terraform Registry Modules](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-34-terraform-registry-modules)
- [Example 35: Module Data-Only Pattern](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-35-module-data-only-pattern)
- [Example 36: Local Backend with State File](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-36-local-backend-with-state-file)
- [Example 37: S3 Backend with State Locking](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-37-s3-backend-with-state-locking)
- [Example 38: Backend Configuration with Partial Config](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-38-backend-configuration-with-partial-config)
- [Example 39: Remote State Data Sources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-39-remote-state-data-sources)
- [Example 40: State Migration Between Backends](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-40-state-migration-between-backends)
- [Example 41: Workspace Basics for Environment Management](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-41-workspace-basics-for-environment-management)
- [Example 42: Workspace Strategies and Limitations](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-42-workspace-strategies-and-limitations)
- [Example 43: Workspace Key Prefix for Remote State](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-43-workspace-key-prefix-for-remote-state)
- [Example 44: Local-Exec Provisioner for External Commands](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-44-local-exec-provisioner-for-external-commands)
- [Example 45: Remote-Exec Provisioner for Instance Configuration](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-45-remote-exec-provisioner-for-instance-configuration)
- [Example 46: File Provisioner for Uploading Content](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-46-file-provisioner-for-uploading-content)
- [Example 47: Null Resource for Provisioner-Only Resources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-47-null-resource-for-provisioner-only-resources)
- [Example 48: Dynamic Blocks for Repeated Nested Configuration](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-48-dynamic-blocks-for-repeated-nested-configuration)
- [Example 49: For Each with Maps and Advanced Patterns](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-49-for-each-with-maps-and-advanced-patterns)
- [Example 50: Count and For Each Conditional Resource Creation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-50-count-and-for-each-conditional-resource-creation)
- [Example 51: Terraform Import for Existing Resources](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-51-terraform-import-for-existing-resources)
- [Example 52: Moved Blocks for Resource Refactoring](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-52-moved-blocks-for-resource-refactoring)
- [Example 53: State List and Show Commands](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-53-state-list-and-show-commands)
- [Example 54: State mv for Resource Renaming](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-54-state-mv-for-resource-renaming)
- [Example 55: State rm for Removing Resources from State](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-55-state-rm-for-removing-resources-from-state)
- [Example 56: Replace for Forced Resource Recreation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate#example-56-replace-for-forced-resource-recreation)

### Advanced (Examples 57–84)

- [Example 57: Provider Development Basics](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-57-provider-development-basics)
- [Example 58: Provider Data Sources and Computed Values](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-58-provider-data-sources-and-computed-values)
- [Example 59: Provider Testing with Terraform Plugin SDK](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-59-provider-testing-with-terraform-plugin-sdk)
- [Example 60: Validation with terraform validate and fmt](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-60-validation-with-terraform-validate-and-fmt)
- [Example 61: Static Analysis with TFLint](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-61-static-analysis-with-tflint)
- [Example 62: Automated Testing with Terratest](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-62-automated-testing-with-terratest)
- [Example 63: Policy as Code with Sentinel and OPA](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-63-policy-as-code-with-sentinel-and-opa)
- [Example 64: Contract Testing for Modules](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-64-contract-testing-for-modules)
- [Example 65: Terraform Workspaces vs Directory Structure (Production Decision)](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-65-terraform-workspaces-vs-directory-structure-production-decision)
- [Example 66: Multi-Region Infrastructure Patterns](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-66-multi-region-infrastructure-patterns)
- [Example 67: Blue-Green Deployment Pattern](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-67-blue-green-deployment-pattern)
- [Example 68: Feature Flags for Incremental Rollouts](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-68-feature-flags-for-incremental-rollouts)
- [Example 69: Secrets Management with External Secret Stores](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-69-secrets-management-with-external-secret-stores)
- [Example 70: Least Privilege IAM Roles for Terraform](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-70-least-privilege-iam-roles-for-terraform)
- [Example 71: Drift Detection and Remediation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-71-drift-detection-and-remediation)
- [Example 72: GitHub Actions CI/CD Pipeline](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-72-github-actions-cicd-pipeline)
- [Example 73: GitLab CI/CD with Terraform Cloud Integration](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-73-gitlab-cicd-with-terraform-cloud-integration)
- [Example 74: Atlantis for Pull Request Automation](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-74-atlantis-for-pull-request-automation)
- [Example 75: Terraform Performance Optimization with Parallelism](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-75-terraform-performance-optimization-with-parallelism)
- [Example 76: State File Performance and Optimization](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-76-state-file-performance-and-optimization)
- [Example 77: State Backup and Recovery Strategies](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-77-state-backup-and-recovery-strategies)
- [Example 78: Disaster Recovery with Infrastructure Replication](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-78-disaster-recovery-with-infrastructure-replication)
- [Example 79: Multi-Account AWS Strategy with Terraform](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-79-multi-account-aws-strategy-with-terraform)
- [Example 80: Terraform Cloud Sentinel Policy as Code](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-80-terraform-cloud-sentinel-policy-as-code)
- [Example 81: Terraform Module Registry for Enterprise](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-81-terraform-module-registry-for-enterprise)
- [Example 82: Kitchen-Terraform for Integration Testing](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-82-kitchen-terraform-for-integration-testing)
- [Example 83: Terraform Workspace Strategy for Monorepo](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-83-terraform-workspace-strategy-for-monorepo)
- [Example 84: Terraform Cost Optimization Patterns](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/advanced#example-84-terraform-cost-optimization-patterns)
