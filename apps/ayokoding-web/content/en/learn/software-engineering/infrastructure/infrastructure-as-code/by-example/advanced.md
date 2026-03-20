---
title: "Advanced"
weight: 10000003
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Examples 58-85: Advanced IaC patterns covering multi-cloud, policy as code, GitOps, testing, secrets management, and enterprise-scale infrastructure automation (75-95% coverage)"
tags:
  [
    "infrastructure-as-code",
    "iac",
    "terraform",
    "ansible",
    "pulumi",
    "tutorial",
    "by-example",
    "advanced",
    "multi-cloud",
    "policy-as-code",
    "gitops",
  ]
---

Master advanced Infrastructure as Code patterns through 28 annotated examples covering multi-cloud deployments, Terraform Cloud features, policy as code with Sentinel and OPA, drift detection, blue-green deployments, immutable infrastructure, GitOps workflows, infrastructure testing with Terratest, secrets management with Vault, and large-scale module composition.

## Group 16: Multi-Cloud and Terraform Cloud

### Example 58: Multi-Cloud Provider Configuration

Terraform supports multiple cloud providers simultaneously in one configuration, enabling hybrid or multi-cloud strategies. You declare provider aliases to distinguish resources deployed to different cloud accounts or regions.

```hcl
# multi-cloud/main.tf
# => Multi-cloud configuration using provider aliases

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"   # => AWS provider from Terraform registry
      version = "~> 5.0"          # => Accept 5.x releases, reject 6.x
    }
    azurerm = {
      source  = "hashicorp/azurerm" # => Azure provider from Terraform registry
      version = "~> 3.0"            # => Accept 3.x releases
    }
    google = {
      source  = "hashicorp/google"  # => GCP provider from Terraform registry
      version = "~> 5.0"            # => Accept 5.x releases
    }
  }
}

provider "aws" {
  region = "us-east-1"              # => Primary AWS region
  # => Credentials from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars
}

provider "aws" {
  alias  = "eu"                     # => Alias distinguishes this from default
  region = "eu-west-1"              # => Secondary region for AWS EU workloads
  # => Usage: provider = aws.eu in resource blocks
}

provider "azurerm" {
  features {}                       # => Required empty block for Azure provider
  subscription_id = var.azure_subscription_id
  # => Azure subscription to deploy into
}

provider "google" {
  project = var.gcp_project_id      # => GCP project identifier
  region  = "us-central1"           # => Default region for GCP resources
}

# AWS S3 bucket in primary region
resource "aws_s3_bucket" "primary" {
  bucket = "my-app-primary-data"    # => Bucket name (globally unique)
  # => Uses default aws provider (us-east-1)
}

# AWS S3 bucket in EU region (using alias)
resource "aws_s3_bucket" "eu_backup" {
  provider = aws.eu                 # => Override provider for this resource
  bucket   = "my-app-eu-backup"     # => Bucket in eu-west-1
  # => provider = aws.eu routes to the aliased provider block
}

# Azure blob storage for compliance
resource "azurerm_storage_account" "compliance" {
  name                     = "myappcompliancedata"
  resource_group_name      = var.azure_rg_name
  location                 = "West Europe"          # => Azure region
  account_tier             = "Standard"             # => Storage tier (Standard/Premium)
  account_replication_type = "GRS"                  # => Geo-redundant replication
  # => GRS replicates data to paired Azure region automatically
}

# GCP Cloud Storage for analytics
resource "google_storage_bucket" "analytics" {
  name     = "my-app-analytics-${var.gcp_project_id}"
  location = "US"                   # => Multi-region bucket for redundancy
  # => Appending project ID ensures globally unique name
}
```

**Key Takeaway**: Use provider aliases to manage resources across multiple clouds or regions in a single Terraform configuration, with each resource explicitly choosing its provider via the `provider` argument.

**Why It Matters**: Multi-cloud strategies protect enterprises from vendor lock-in and enable regulatory compliance—some regulations require data stored in specific jurisdictions. Terraform's provider alias system means a single `terraform apply` can provision resources across AWS, Azure, and GCP atomically, letting teams reason about their entire infrastructure footprint as one coherent codebase rather than three separate tool chains.

---

### Example 59: Terraform Cloud Workspace Configuration

Terraform Cloud provides remote state storage, plan history, and team collaboration features. Remote backends replace local state files with centrally managed state accessible to all team members.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Local Terraform CLI"] -->|terraform init| B["Terraform Cloud API"]
  B --> C["Remote State Storage"]
  B --> D["Remote Plan Execution"]
  B --> E["Policy Enforcement"]
  D --> F["Apply on Approval"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#CC78BC,stroke:#000,color:#fff
  style E fill:#CA9161,stroke:#000,color:#fff
  style F fill:#0173B2,stroke:#000,color:#fff
```

```hcl
# backend/main.tf
# => Terraform Cloud backend configuration

terraform {
  cloud {
    organization = "my-org"         # => Terraform Cloud organization name
    # => Must match your organization in app.terraform.io

    workspaces {
      name = "production-infra"     # => Specific workspace name
      # => Workspace holds state, variables, and run history
      # => Alternative: tags = ["production"] selects by tag
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables stored in Terraform Cloud (not in code)
# => In Terraform Cloud UI: workspace → Variables tab
# => Sensitive variables (AWS credentials) marked sensitive, never shown in logs
# => Non-sensitive variables visible to all workspace members

variable "environment" {
  type        = string              # => String variable type
  description = "Deployment environment (staging/production)"
  # => Set in Terraform Cloud workspace variables
}

variable "instance_count" {
  type        = number              # => Number type for validation
  description = "Number of application instances"
  default     = 2                   # => Override in workspace variables
}

resource "aws_instance" "app" {
  count         = var.instance_count  # => Creates multiple instances
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"

  tags = {
    Environment = var.environment     # => Tag from workspace variable
    ManagedBy   = "terraform-cloud"   # => Audit trail tag
    WorkspaceId = terraform.workspace # => Built-in workspace name reference
  }
  # => terraform.workspace returns current workspace name
}
```

**Key Takeaway**: The `cloud` block in the `terraform` configuration connects your local CLI to Terraform Cloud, offloading state management and enabling collaborative workflows with approval gates.

**Why It Matters**: Terraform Cloud eliminates the two most common team collaboration problems with IaC: concurrent state corruption (one person's apply overwriting another's) and secret sprawl (each developer storing cloud credentials locally). Organizations running Terraform at scale—HashiCorp reports teams managing 1,000+ resources—find that remote execution plans and policy enforcement gates reduce production incidents significantly compared to local-only workflows.

---

### Example 60: Terraform Cloud Variable Sets

Variable sets in Terraform Cloud let you define variables once and share them across multiple workspaces, eliminating copy-paste duplication of common configuration.

```hcl
# variable-sets/main.tf
# => Demonstrates referencing shared variable sets via provider configuration
# => Variable sets are configured in Terraform Cloud UI, not in HCL

terraform {
  cloud {
    organization = "my-org"
    workspaces {
      tags = ["app-tier"]           # => All workspaces tagged "app-tier" use this config
      # => Tag-based workspace selection enables dynamic workspace discovery
    }
  }
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# => Variables below are defined in a Terraform Cloud variable set
# => Variable set "AWS Global Config" applied to all "app-tier" workspaces
# => Variables: aws_region, common_tags, vpc_id, subnet_ids

variable "aws_region" {
  type        = string
  description = "AWS region - provided by variable set"
  # => Value injected from variable set at plan time
  # => No default needed; Terraform Cloud enforces the variable set
}

variable "common_tags" {
  type = map(string)
  description = "Common resource tags - provided by variable set"
  # => Example value from variable set:
  # => { "CostCenter" = "engineering", "Owner" = "platform-team" }
}

provider "aws" {
  region = var.aws_region           # => Region from shared variable set
  # => All workspaces with this variable set deploy to the same region
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = merge(var.common_tags, {
    Name = "main-vpc"               # => Workspace-specific tag added to common tags
    # => merge() combines two maps; workspace-specific tags override shared ones
  })
  # => Result: { "CostCenter"="engineering", "Owner"="platform-team", "Name"="main-vpc" }
}
```

**Key Takeaway**: Terraform Cloud variable sets eliminate the need to duplicate provider configuration and common variables across every workspace, making it possible to update shared config in one place.

**Why It Matters**: In large organizations managing dozens of Terraform workspaces, variable set centralization prevents drift where different teams configure the same AWS region or tagging standards differently. When security requirements change—for example, adding a mandatory compliance tag—updating one variable set propagates the change to all workspaces on the next plan, rather than requiring manual updates across every workspace configuration.

---

## Group 17: Policy as Code

### Example 61: Sentinel Policy Enforcement

Sentinel is HashiCorp's policy-as-code framework embedded in Terraform Cloud/Enterprise. Policies run between plan and apply, blocking non-compliant infrastructure from being created.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["terraform plan"] --> B["Sentinel Engine"]
  B --> C{Policy Check}
  C -->|"Pass"| D["terraform apply"]
  C -->|"Fail (Advisory)"| E["Warning + Apply"]
  C -->|"Fail (Soft-Mandatory)"| F["Override Required"]
  C -->|"Fail (Hard-Mandatory)"| G["Apply Blocked"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#CA9161,stroke:#000,color:#fff
  style D fill:#029E73,stroke:#000,color:#fff
  style E fill:#CC78BC,stroke:#000,color:#fff
  style F fill:#DE8F05,stroke:#000,color:#fff
  style G fill:#CA9161,stroke:#000,color:#fff
```

```python
# policies/require-tags.sentinel
# => Sentinel policy enforcing mandatory resource tags
# => Sentinel uses its own policy language (similar to Python)

import "tfplan/v2" as tfplan
# => tfplan module provides access to the Terraform plan data
# => v2 is the second generation of the Sentinel Terraform integration

# Define required tags all resources must have
required_tags = ["Environment", "Owner", "CostCenter"]
# => All three tags required on every resource that supports tags

# Get all resources from the plan
all_resources = filter tfplan.resource_changes as _, rc {
  # => filter iterates all resource changes in the plan
  rc.mode is "managed" and   # => Exclude data sources (mode = "data")
  rc.change.actions contains "create" or
  rc.change.actions contains "update"
  # => Check only resources being created or updated
}

# Check each resource for required tags
violations = filter all_resources as address, rc {
  # => Build list of resources missing required tags
  tags = rc.change.after.tags else {}
  # => Read tags from the planned resource state
  # => "else {}" handles resources with no tags attribute (returns empty map)

  any required_tags as tag {
    # => Check if ANY required tag is missing
    not tags[tag] is defined or tags[tag] is ""
    # => Tag missing OR tag present but empty string
  }
}

# Policy result
main = rule {
  length(violations) is 0           # => Pass if no violations found
  # => length(violations) > 0 means at least one resource lacks required tags
}
```

**Key Takeaway**: Sentinel policies run automatically on every plan and block non-compliant infrastructure before it reaches `apply`, enforcing organizational standards without relying on human review.

**Why It Matters**: Policy as code transforms compliance from a post-deployment audit activity into a pre-deployment gate. Financial services and healthcare organizations using Terraform Enterprise report that Sentinel catches 90%+ of compliance violations before resources are ever created, eliminating the expensive remediation cycle of identifying violations in production and applying fixes that may require downtime. Hard-mandatory policies make certain violations impossible to deploy, not merely discouraged.

---

### Example 62: OPA (Open Policy Agent) for Terraform

OPA with Conftest provides vendor-neutral policy enforcement that works with any Terraform workflow, including open-source Terraform without Terraform Cloud/Enterprise.

```hcl
# opa-policies/deny-public-s3.rego
# => OPA Rego policy preventing public S3 buckets
# => Rego is OPA's query language for policy decisions
```

**OPA Rego policy** (`policies/deny-public-s3.rego`):

```python
package terraform.aws.s3
# => Package declaration namespaces this policy
# => Convention: terraform.<provider>.<service>

import rego.v1
# => Import Rego v1 syntax (recommended for new policies)

# Deny rule: triggers if any S3 bucket ACL is public
deny contains msg if {
  # => deny is a set; each element is an error message
  # => This rule fires once per matching bucket

  resource := input.resource_changes[_]
  # => input.resource_changes is array of all planned changes
  # => [_] iterates over all elements (anonymous variable)

  resource.type == "aws_s3_bucket_acl"
  # => Only check aws_s3_bucket_acl resource type

  resource.change.actions[_] in {"create", "update"}
  # => Only check resources being created or updated

  acl := resource.change.after.acl
  # => Read the planned ACL value

  acl in {"public-read", "public-read-write", "authenticated-read"}
  # => These ACL values expose bucket contents publicly
  # => "private" and "bucket-owner-full-control" are safe

  msg := sprintf(
    "S3 bucket ACL '%s' on resource '%s' makes bucket public. Use 'private' ACL.",
    [acl, resource.address]
  )
  # => Build descriptive error message including resource address
  # => resource.address example: "aws_s3_bucket_acl.app_bucket"
}
```

**Running Conftest** (CI pipeline command):

```bash
# Install conftest and run policy check against Terraform plan
terraform show -json tfplan.binary > tfplan.json
# => Convert binary plan to JSON for OPA consumption
# => tfplan.binary created by: terraform plan -out=tfplan.binary

conftest test tfplan.json --policy policies/
# => conftest tests the plan JSON against all .rego files in policies/
# => Exit code 1 if any deny rules fire, exit code 0 if all pass
# => Output: PASS or FAIL with denial messages

# Example output on failure:
# FAIL - tfplan.json - terraform.aws.s3 - S3 bucket ACL 'public-read' on
#        resource 'aws_s3_bucket_acl.app_bucket' makes bucket public. Use 'private' ACL.
```

**Key Takeaway**: OPA/Conftest provides policy-as-code for the open-source Terraform workflow using the same Rego language used for Kubernetes admission control, enabling consistent policy enforcement across your entire infrastructure toolchain.

**Why It Matters**: Unlike Sentinel (which requires Terraform Enterprise), OPA works with any CI system—GitHub Actions, GitLab CI, Jenkins—making policy enforcement accessible to teams not using Terraform Cloud. Organizations using OPA across Kubernetes, Terraform, and Envoy achieve a unified policy language where security engineers write Rego once and enforce it everywhere, reducing the cognitive overhead of maintaining separate policy syntaxes for each tool in the stack.

---

## Group 18: Drift Detection and Remediation

### Example 63: Terraform Drift Detection

Drift occurs when infrastructure state diverges from what Terraform's state file records, typically from manual console changes or external automation. Detecting and remediating drift is critical for IaC discipline.

```hcl
# drift-detection/main.tf
# => Infrastructure configuration with drift detection workflow

resource "aws_security_group" "app" {
  name        = "app-security-group"
  description = "Security group for application tier"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]    # => Allow HTTPS from anywhere
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]    # => Allow HTTP from anywhere (redirect to HTTPS)
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"              # => -1 means all protocols
    cidr_blocks = ["0.0.0.0/0"]    # => Allow all outbound traffic
  }

  lifecycle {
    ignore_changes = [description]  # => Ignore description drift
    # => Use ignore_changes when certain attributes are managed outside Terraform
    # => Example: Some tools append metadata to descriptions automatically
  }
}
```

**Drift detection CI job** (`scripts/detect-drift.sh`):

```bash
#!/bin/bash
# => Drift detection script for scheduled CI execution

set -euo pipefail
# => -e: exit on error, -u: treat unset vars as error, -o pipefail: pipe failures propagate

terraform refresh
# => Sync state file with actual cloud state (reads current resource attributes)
# => Updates local state without changing infrastructure
# => Deprecated in favor of terraform apply -refresh-only

terraform plan -refresh-only -detailed-exitcode
# => -refresh-only: only refresh state, no config changes
# => -detailed-exitcode: exit 0=no changes, 1=error, 2=changes detected
EXIT_CODE=$?
# => Capture exit code before it's overwritten

if [ $EXIT_CODE -eq 2 ]; then
  echo "DRIFT DETECTED: Infrastructure differs from Terraform state"
  # => Exit code 2 means plan found differences (drift)
  echo "Review the plan above and decide: apply to remediate or import manual changes"
  exit 1                            # => Fail CI job to alert team
  # => Team must decide: override drift (terraform apply) or accept drift (terraform import)
elif [ $EXIT_CODE -eq 0 ]; then
  echo "No drift detected: Infrastructure matches Terraform state"
  # => Exit code 0 means no differences found
  exit 0                            # => Pass CI job
fi
```

**Key Takeaway**: Run `terraform plan -refresh-only -detailed-exitcode` on a schedule to detect configuration drift early, before it causes outages or security incidents.

**Why It Matters**: Infrastructure drift is insidious—it starts with a "quick fix" in the AWS console and ends with a production incident when Terraform's next apply reverts the manual change. Netflix and similar companies run drift detection every hour, treating any drift as a high-priority alert because undetected drift means the state file no longer accurately represents production, making capacity planning and disaster recovery planning unreliable.

---

### Example 64: Terraform Import for Existing Resources

When infrastructure exists before Terraform management begins, `terraform import` brings those resources under IaC control without destroying and recreating them.

```hcl
# import/main.tf
# => Configuration matching existing infrastructure to be imported

resource "aws_instance" "legacy_app" {
  ami           = "ami-0abcdef1234567890"   # => Must match existing instance
  instance_type = "t3.large"               # => Must match existing instance type
  # => All attributes must match actual resource to avoid plan showing changes

  tags = {
    Name        = "legacy-app-server"      # => Tag on existing instance
    Environment = "production"             # => Existing tag
  }

  # Lifecycle block prevents accidental destruction during import
  lifecycle {
    prevent_destroy = true                 # => Block terraform destroy for this resource
    # => Safety net: prevents import followed by accidental destroy
  }
}
```

**Import workflow** (Terraform 1.5+ import blocks):

```hcl
# import/imports.tf
# => Terraform 1.5+ declarative import blocks (replaces CLI import command)

import {
  to = aws_instance.legacy_app              # => Target resource in configuration
  id = "i-0abc123def456789"                # => Cloud resource ID to import
  # => ID format varies by resource type:
  # => EC2 instance: i-xxxxx
  # => S3 bucket: bucket-name
  # => RDS instance: db-identifier
  # => Security group: sg-xxxxx
}

import {
  to = aws_s3_bucket.legacy_data
  id = "my-legacy-bucket-name"            # => S3 bucket name is the ID
}

# => After running terraform plan with import blocks:
# => Terraform generates resource configuration from actual state
# => terraform plan -generate-config-out=generated.tf
# => Review generated.tf, copy to main.tf, then run terraform apply
```

**Key Takeaway**: Terraform 1.5+ import blocks enable declarative, reviewable import workflows that generate starter configuration from existing resources, replacing error-prone manual `terraform import` CLI commands.

**Why It Matters**: Most organizations have years of manually-created cloud infrastructure before adopting IaC. The ability to import existing resources without destroying them is the critical bridge from "ad-hoc infrastructure" to "fully managed IaC." The Terraform 1.5+ `generate-config-out` flag accelerates this migration by automatically writing the HCL configuration block, which previously required hours of manual reverse-engineering from the AWS console.

---

## Group 19: Blue-Green and Immutable Infrastructure

### Example 65: Blue-Green Infrastructure Deployment

Blue-green deployments maintain two identical environments, switching traffic between them for zero-downtime releases. Terraform manages both environments as code.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Load Balancer"] -->|"Active (100%)"| B["Blue Env v1.0"]
  A -.->|"Idle"| C["Green Env v1.1"]
  D["Deploy v1.1"] --> C
  E["Switch Traffic"] --> A

  subgraph After["After Cutover"]
    F["Load Balancer"] -->|"Active (100%)"| G["Green Env v1.1"]
    F -.->|"Idle"| H["Blue Env v1.0"]
  end

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#0173B2,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#CA9161,stroke:#000,color:#fff
  style F fill:#0173B2,stroke:#000,color:#fff
  style G fill:#029E73,stroke:#000,color:#fff
  style H fill:#CC78BC,stroke:#000,color:#fff
```

```hcl
# blue-green/main.tf
# => Blue-green infrastructure using AWS Auto Scaling Groups

variable "active_color" {
  type        = string
  description = "Currently active environment: 'blue' or 'green'"
  default     = "blue"              # => Toggle between deployments by changing this
  # => Change to "green" to shift traffic to new environment
}

locals {
  colors = ["blue", "green"]        # => Both environments always exist
  # => Inactive environment receives zero traffic but stays provisioned
}

# Launch templates for both environments
resource "aws_launch_template" "app" {
  for_each      = toset(local.colors)   # => Creates one launch template per color
  name          = "app-${each.key}"     # => app-blue, app-green
  image_id      = var.ami_ids[each.key] # => Different AMI per environment
  # => ami_ids map: { blue = "ami-111", green = "ami-222" }
  instance_type = "t3.medium"

  user_data = base64encode(templatefile("userdata.sh.tpl", {
    color = each.key                # => Pass color to startup script
    # => Startup script configures environment-specific settings
  }))
}

# Auto Scaling Groups for both environments
resource "aws_autoscaling_group" "app" {
  for_each = toset(local.colors)

  name                = "app-asg-${each.key}"
  min_size            = each.key == var.active_color ? 2 : 0
  # => Active environment: minimum 2 instances for high availability
  # => Inactive environment: scaled to 0 (no cost while idle)
  max_size            = 10
  desired_capacity    = each.key == var.active_color ? 3 : 0
  # => Active environment runs at desired capacity
  # => Inactive environment: 0 instances (can be pre-warmed before cutover)

  target_group_arns = each.key == var.active_color ? [aws_lb_target_group.active.arn] : []
  # => Only active environment attached to load balancer target group
  # => Empty list for inactive: instances exist but receive no traffic

  launch_template {
    id      = aws_launch_template.app[each.key].id
    version = "$Latest"             # => Always use latest launch template version
  }
}

# Load balancer target group (points to active environment)
resource "aws_lb_target_group" "active" {
  name     = "app-active-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  # => Target group always represents the "active" environment
  # => Switching active_color variable and re-applying moves traffic
}
```

**Key Takeaway**: Model blue-green deployments in Terraform by parameterizing `min_size`/`desired_capacity` and `target_group_arns` on the `active_color` variable, so flipping one variable value and running `terraform apply` executes the full cutover.

**Why It Matters**: Blue-green deployment reduces deployment risk from hours (rolling updates that might leave inconsistent versions running) to seconds (atomic traffic switch). Amazon, Etsy, and LinkedIn publish that blue-green deployments allow them to deploy dozens of times per day while maintaining five-nines availability—because rollback is equally fast: just switch the active color back.

---

### Example 66: Immutable Infrastructure with AMI Baking

Immutable infrastructure replaces mutable, in-place server updates with complete image replacements. HashiCorp Packer builds immutable AMIs that Terraform then deploys.

```hcl
# immutable/packer-build.pkr.hcl
# => Packer configuration for baking application into AMI

packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "~> 1"               # => AWS Packer plugin
    }
  }
}

source "amazon-ebs" "app_image" {
  ami_name      = "my-app-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  # => Timestamp in name ensures unique AMI per build
  # => Example: my-app-2026-03-20-1430
  instance_type = "t3.small"         # => Builder instance (terminated after AMI creation)
  region        = "us-east-1"
  source_ami_filter {
    filters = {
      name                = "amzn2-ami-hvm-*-x86_64-gp2"
      virtualization-type = "hvm"    # => Hardware virtualization
    }
    owners      = ["amazon"]         # => Trust only Amazon-published base AMIs
    most_recent = true               # => Use latest matching base AMI
  }
  ssh_username = "ec2-user"          # => Default username for Amazon Linux 2
}

build {
  sources = ["source.amazon-ebs.app_image"]

  provisioner "shell" {
    inline = [
      "sudo yum update -y",          # => Apply all OS security patches
      "sudo yum install -y java-17",  # => Install Java runtime
      "sudo useradd --system app",    # => Create system user (no login shell)
    ]
    # => All provisioning happens at AMI build time, not boot time
    # => Result: instances start in seconds (no boot-time provisioning)
  }

  provisioner "file" {
    source      = "target/app.jar"   # => Application JAR from build pipeline
    destination = "/opt/app/app.jar" # => Destination in AMI
    # => Application binary baked into AMI, not downloaded at boot
  }

  post-processor "manifest" {
    output = "packer-manifest.json"  # => Writes AMI ID to file for Terraform
    # => Terraform reads this file to know which AMI to deploy
  }
}
```

**Terraform deployment** (`immutable/main.tf`):

```hcl
# Read AMI ID from Packer manifest
locals {
  packer_manifest = jsondecode(file("packer-manifest.json"))
  # => jsondecode converts JSON string to Terraform object
  app_ami_id      = local.packer_manifest.builds[0].artifact_id
  # => artifact_id format: "us-east-1:ami-0abc123"
  # => Split to extract just the AMI ID
  ami_id = split(":", local.app_ami_id)[1]
  # => Result: "ami-0abc123"
}

resource "aws_launch_template" "app" {
  name_prefix   = "app-immutable-"
  image_id      = local.ami_id      # => AMI baked by Packer
  instance_type = "t3.medium"

  lifecycle {
    create_before_destroy = true    # => New launch template before old one destroyed
    # => Prevents downtime: new ASG instances launch before old instances terminate
  }
}
```

**Key Takeaway**: Immutable infrastructure bakes application code and configuration into AMIs at build time, so deployment means replacing instances with new ones rather than modifying running servers in place.

**Why It Matters**: Mutable servers accumulate "configuration drift" over months of patches and manual changes until no one knows exactly what's installed. Immutable infrastructure eliminates this entirely: every instance is identical to what Packer built, every deployment is traceable to a specific AMI ID, and rollback is simply redeploying the previous AMI. Netflix's Chaos Engineering practices depend on immutable infrastructure—they can terminate any server at any time because replacement is instant and predictable.

---

## Group 20: GitOps for Infrastructure

### Example 67: GitOps Workflow with Atlantis

Atlantis is an open-source Terraform pull request automation server that implements GitOps for infrastructure: every change goes through a pull request with automated plan output and approval gates.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
  participant Dev as Developer
  participant GH as GitHub
  participant At as Atlantis
  participant TF as Terraform
  participant Cloud as Cloud Provider

  Dev->>GH: Push branch + open PR
  GH->>At: Webhook: PR opened
  At->>TF: terraform plan
  TF->>Cloud: Read current state
  Cloud-->>TF: Current state
  TF-->>At: Plan output
  At->>GH: Post plan as PR comment
  Dev->>GH: Comment "atlantis apply"
  GH->>At: Webhook: apply comment
  At->>TF: terraform apply
  TF->>Cloud: Apply changes
  Cloud-->>TF: Applied
  At->>GH: Post apply result
```

```yaml
# atlantis.yaml
# => Atlantis project configuration (in repository root)
version: 3 # => Atlantis config version

projects:
  - name: networking # => Project display name
    dir: infrastructure/networking # => Directory containing Terraform code
    workspace: production # => Terraform workspace (maps to Terraform Cloud workspace)
    autoplan:
      enabled: true # => Auto-run plan on PR changes
      when_modified:
        - "**/*.tf" # => Glob: any .tf file in the directory
        - "**/*.tfvars" # => Include variable files
        - "../modules/**/*.tf" # => Replan if shared modules change
    apply_requirements:
      - approved # => Require PR approval before apply
      - mergeable # => Require passing CI checks
    # => apply_requirements prevents rogue applies without code review

  - name: compute
    dir: infrastructure/compute
    workspace: production
    depends_on:
      - networking # => Apply compute only after networking succeeds
      # => Atlantis enforces apply ordering based on depends_on
    autoplan:
      enabled: true
      when_modified:
        - "**/*.tf"
    apply_requirements:
      - approved
      - mergeable
```

**Key Takeaway**: Atlantis implements GitOps for Terraform by triggering plans on PR open and blocking applies until the plan is reviewed and approved, making every infrastructure change auditable and reversible.

**Why It Matters**: GitOps for infrastructure provides the same benefits as GitOps for application deployments: every change has a pull request, a plan output, an approver, and a commit hash in the audit trail. Shopify's infrastructure team reports that Atlantis eliminated "cowboy deploys"—infrastructure changes applied directly from developer laptops—reducing their production incidents from infrastructure changes by 60% because every change now goes through automated planning and human review.

---

### Example 68: Infrastructure Pipeline with GitHub Actions

A complete CI/CD pipeline for Terraform integrates formatting checks, validation, security scanning, and automated planning in a GitHub Actions workflow.

```yaml
# .github/workflows/terraform.yml
# => GitHub Actions workflow for Terraform CI/CD

name: Terraform CI/CD

on:
  pull_request:
    paths:
      - "infrastructure/**" # => Only trigger on infra changes
      - ".github/workflows/terraform.yml"
  push:
    branches:
      - main # => Trigger apply only on main branch merge

env:
  TF_VERSION: "1.7.0" # => Pin Terraform version for reproducibility
  WORKING_DIR: "./infrastructure" # => Root Terraform directory

jobs:
  terraform-check:
    name: Format and Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # => Checkout repository code

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          # => Installs exact Terraform version from env var
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
          # => Token for Terraform Cloud (stored as GitHub secret)

      - name: Terraform Format Check
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform fmt -check -recursive
        # => -check: exit 1 if files need formatting (don't modify files)
        # => -recursive: check all subdirectories
        # => Enforces consistent HCL formatting across team

      - name: Terraform Init
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform init -backend=false
        # => -backend=false: initialize without connecting to remote state
        # => Validates provider requirements without needing credentials

      - name: Terraform Validate
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform validate
        # => Validates HCL syntax and internal consistency
        # => Catches type errors, missing required arguments, invalid references
        # => Does NOT check against cloud (uses -backend=false from init)

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infrastructure/
          framework: terraform # => Scan Terraform files specifically
          output_format: sarif # => GitHub-compatible security findings format
          soft_fail: true # => Don't fail pipeline, report as warnings
          # => Checkov checks: public S3 buckets, unencrypted storage, open security groups

  terraform-plan:
    name: Plan
    runs-on: ubuntu-latest
    needs: [terraform-check] # => Only plan if checks pass
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
          cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

      - name: Terraform Plan
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform plan -no-color -out=tfplan
        # => -no-color: clean output for PR comments (no ANSI escape codes)
        # => -out=tfplan: save plan for apply step (prevents plan/apply mismatch)
        id: plan

      - name: Post Plan to PR
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan\n\`\`\`\n${{ steps.plan.outputs.stdout }}\n\`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });
          # => Posts plan output as PR comment for reviewer visibility
```

**Key Takeaway**: A Terraform CI/CD pipeline combines format checks, validation, security scanning, and plan output in a pull request workflow that gates infrastructure changes on human approval.

**Why It Matters**: An automated Terraform pipeline eliminates the most common IaC team problems: unformatted code causing merge conflicts, invalid configurations reaching production, and security misconfigurations slipping through code review. GitHub's own infrastructure team reports that automated plan-in-PR workflows reduced their infrastructure deployment cycle time by 40% by making review faster (reviewers see exact changes) while simultaneously reducing incidents from untested infrastructure changes.

---

## Group 21: Infrastructure Testing

### Example 69: Terratest for Infrastructure Testing

Terratest is a Go library that writes automated tests for Terraform infrastructure by deploying real infrastructure, running assertions, and tearing it down.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["Test Code (Go)"] --> B["terraform init/apply"]
  B --> C["Real AWS/GCP/Azure"]
  C --> D["Assertions"]
  D --> E{Pass?}
  E -->|Yes| F["terraform destroy"]
  E -->|No| G["Log failure + destroy"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#CA9161,stroke:#000,color:#fff
  style D fill:#CC78BC,stroke:#000,color:#fff
  style E fill:#DE8F05,stroke:#000,color:#fff
  style F fill:#029E73,stroke:#000,color:#fff
  style G fill:#CA9161,stroke:#000,color:#fff
```

```go
// test/vpc_test.go
// => Terratest integration test for VPC module

package test

import (
 "testing"

 "github.com/gruntwork-io/terratest/modules/aws"
 "github.com/gruntwork-io/terratest/modules/terraform"
 "github.com/stretchr/testify/assert"
)

func TestVPCModule(t *testing.T) {
 t.Parallel() // => Run tests concurrently to reduce total test time

 terraformOptions := &terraform.Options{
  TerraformDir: "../modules/vpc", // => Path to Terraform module under test
  Vars: map[string]interface{}{
   "vpc_cidr":    "10.99.0.0/16", // => Non-overlapping CIDR for test isolation
   "environment": "test",          // => Tag resources as test for cleanup
   "region":      "us-east-1",
  },
  NoColor: true, // => Clean output in CI logs
 }

 // Ensure resources are destroyed after test (even on failure)
 defer terraform.Destroy(t, terraformOptions)
 // => defer runs Destroy even if test panics
 // => Critical: prevents orphaned cloud resources from accumulating cost

 // Deploy infrastructure
 terraform.InitAndApply(t, terraformOptions)
 // => Runs terraform init and terraform apply
 // => Blocks until apply completes (real cloud resources created)

 // Read output values from Terraform
 vpcID := terraform.Output(t, terraformOptions, "vpc_id")
 // => Reads "vpc_id" output from Terraform state
 subnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
 // => Reads list output as Go string slice

 // Assert VPC was created
 assert.NotEmpty(t, vpcID, "VPC ID should not be empty")
 // => VPC ID format: vpc-0abc123def456789

 // Assert subnets exist using AWS SDK
 vpc := aws.GetVpcById(t, vpcID, "us-east-1")
 // => aws.GetVpcById queries AWS API directly (not Terraform state)
 // => Validates infrastructure exists in cloud, not just in state file

 assert.Equal(t, "10.99.0.0/16", vpc.CidrBlock,
  "VPC CIDR should match input variable")
 // => Verifies Terraform created VPC with correct CIDR

 assert.Len(t, subnetIDs, 3,
  "Should create 3 private subnets (one per AZ)")
 // => Module should distribute subnets across availability zones

 // Validate subnet CIDRs are within VPC CIDR
 for _, subnetID := range subnetIDs {
  subnet := aws.GetSubnetById(t, subnetID, "us-east-1")
  assert.Contains(t, subnet.CidrBlock, "10.99.",
   "Subnet CIDR should be within VPC CIDR")
  // => Each subnet should be a slice of the VPC CIDR range
 }
}
```

**Key Takeaway**: Terratest tests real infrastructure by deploying to actual cloud accounts, running assertions against cloud APIs, and tearing down resources, providing confidence that modules behave correctly before production deployment.

**Why It Matters**: Static analysis (terraform validate) and policy checks catch syntax and compliance errors but cannot verify that a VPC module actually creates the expected subnets with the correct routing. Terratest catches the category of bugs that only appear at runtime: IAM permission issues, service quota exceeded errors, and cross-resource dependencies. Teams at Gruntwork (Terratest's creator) report that infrastructure tests catch 3x more production-impacting bugs than static analysis alone, despite the higher runtime cost of real deployment.

---

### Example 70: Module Contract Testing with Terraform Unit Tests

Terraform 1.6+ includes a built-in testing framework (`terraform test`) that runs unit and integration tests against modules without requiring external Go code.

```hcl
# modules/compute/main.tf
# => Compute module under test

variable "instance_count" {
  type        = number
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 20
    error_message = "Instance count must be between 1 and 20."
    # => Validation runs during plan, before any resources created
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
    # => Restrict to known environments to prevent typos
  }
}

output "instance_tags" {
  value = {
    Environment = var.environment
    Count       = tostring(var.instance_count)
    ManagedBy   = "terraform"
  }
  # => Output used by test assertions
}
```

```hcl
# modules/compute/compute_test.tftest.hcl
# => Terraform native test file (*.tftest.hcl extension)
# => Run with: terraform test

run "valid_production_config" {
  # => Test case name (describes the scenario being tested)

  variables {
    instance_count = 3              # => Valid: within 1-20 range
    environment    = "production"   # => Valid: in allowed list
  }

  # => command defaults to "plan" (doesn't create real resources)
  # => Use command = "apply" for integration tests that create resources

  assert {
    condition     = output.instance_tags.Environment == "production"
    error_message = "Environment tag should be 'production'"
    # => Validate output values without creating infrastructure
  }

  assert {
    condition     = output.instance_tags.ManagedBy == "terraform"
    error_message = "ManagedBy tag should be 'terraform'"
    # => Multiple assert blocks in one run block all evaluated
  }
}

run "invalid_instance_count_rejected" {
  variables {
    instance_count = 25             # => Invalid: exceeds maximum of 20
    environment    = "production"
  }

  expect_failures = [
    var.instance_count,             # => Expect this variable's validation to fail
    # => Test passes only if this validation error IS raised
    # => Validates negative cases: bad input produces expected errors
  ]
}

run "invalid_environment_rejected" {
  variables {
    instance_count = 1
    environment    = "staging-v2"   # => Invalid: not in allowed list
  }

  expect_failures = [var.environment]
  # => Test passes only if environment validation rejects "staging-v2"
}
```

**Key Takeaway**: Terraform's native `terraform test` framework validates module logic—including variable validations, output values, and conditional resource creation—without external tooling or real cloud deployments.

**Why It Matters**: Built-in testing lowers the barrier to testing infrastructure modules. Previously, teams needed Go proficiency to use Terratest; now any Terraform practitioner can write tests in HCL. Module contract tests that validate input validation logic and output correctness run in seconds without cloud credentials, making them appropriate for every commit in a CI pipeline—catching interface-breaking changes before they affect downstream module consumers.

---

## Group 22: Secrets Management

### Example 71: HashiCorp Vault Integration

Vault provides secrets management for Terraform by injecting secrets at plan/apply time, ensuring credentials never appear in state files or configuration repositories.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Terraform"] -->|"AppRole Auth"| B["Vault"]
  B -->|"Dynamic Secret"| C["AWS STS Credentials"]
  B -->|"KV Secret"| D["DB Password"]
  C --> E["AWS Resources"]
  D --> F["RDS Instance"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#029E73,stroke:#000,color:#fff
  style E fill:#CA9161,stroke:#000,color:#fff
  style F fill:#CA9161,stroke:#000,color:#fff
```

```hcl
# vault-integration/main.tf
# => Terraform + Vault integration for secrets management

terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"           # => Vault provider for secret retrieval
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "vault" {
  address = "https://vault.internal.example.com"
  # => Vault server URL
  # => Authentication via VAULT_TOKEN env var or AppRole
  # => Never hardcode Vault tokens in configuration
}

# Retrieve dynamic AWS credentials from Vault
data "vault_aws_access_credentials" "deploy" {
  backend = "aws"                  # => Vault AWS secrets engine mount path
  role    = "terraform-deployer"   # => Vault role with specific AWS permissions
  # => Vault generates short-lived AWS credentials (TTL: 15 minutes)
  # => Each terraform apply gets unique credentials, not shared long-lived keys
  # => Credentials automatically revoked after TTL expires
}

provider "aws" {
  access_key = data.vault_aws_access_credentials.deploy.access_key
  # => Dynamic access key from Vault (not from ~/.aws/credentials)
  secret_key = data.vault_aws_access_credentials.deploy.secret_key
  # => Dynamic secret key from Vault
  region     = "us-east-1"
  # => Credentials valid only for terraform-deployer role permissions
}

# Read static secret from Vault KV store
data "vault_kv_secret_v2" "db_credentials" {
  mount = "secret"                 # => KV secrets engine mount path
  name  = "production/database"    # => Secret path within the mount
  # => Returns map of key-value pairs stored at this path
}

resource "aws_db_instance" "app" {
  identifier        = "app-db"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 20

  username = data.vault_kv_secret_v2.db_credentials.data["username"]
  # => Read username from Vault KV secret
  # => .data["username"] accesses the "username" key in the secret map
  password = data.vault_kv_secret_v2.db_credentials.data["password"]
  # => Password from Vault, never appears in .tf files or git history
  # => Note: password still appears in Terraform state (see lifecycle below)

  lifecycle {
    ignore_changes = [password]    # => Don't detect drift on password
    # => Vault might rotate the password; ignore_changes prevents re-applying
  }
}
```

**Key Takeaway**: The Vault provider retrieves secrets dynamically at plan/apply time, preventing credential exposure in Terraform configuration files and git history while enabling automatic credential rotation.

**Why It Matters**: Hardcoded secrets in Terraform configuration—or even in environment variables on developer laptops—are one of the most common cloud security incidents. HashiCorp's State of Security survey found that 83% of organizations had experienced a credentials-related security incident. Vault's dynamic secrets model means there are no long-lived credentials to steal: each Terraform run gets unique credentials that expire after 15 minutes, dramatically reducing the blast radius of any compromise.

---

### Example 72: Ansible Vault for Ansible Secrets

Ansible Vault encrypts sensitive variables within playbooks, allowing secrets to be committed to version control while remaining protected.

```yaml
# group_vars/production/vault.yml
# => Ansible Vault encrypted file (encrypted by ansible-vault encrypt)
# => Actual file content: $ANSIBLE_VAULT;1.1;AES256 followed by encrypted bytes
# => Decrypted content shown below for documentation

# ansible-vault decrypt group_vars/production/vault.yml
# => Decrypted view (never stored in plaintext):
vault_db_password: "super-secret-db-password-here"
vault_api_key: "production-api-key-12345"
vault_ssl_private_key: |
  -----BEGIN RSA PRIVATE KEY-----
  (key content)
  -----END RSA PRIVATE KEY-----
```

```yaml
# group_vars/production/vars.yml
# => Non-sensitive variables reference vault variables
# => This file is NOT encrypted (safe to commit as-is)

db_password: "{{ vault_db_password }}"
# => Reference vault variable via Jinja2 template
# => Ansible merges vault and regular vars at runtime
# => Vault vars prefixed with "vault_" by convention

api_key: "{{ vault_api_key }}"
# => Pattern: vault_<name> in encrypted file, <name> in regular vars
# => Playbooks reference api_key (not vault_api_key directly)
```

```yaml
# playbooks/configure-app.yml
# => Playbook using vault-encrypted variables

- name: Configure application server
  hosts: production_app
  become: true # => Run as root (sudo)
  vars_files:
    - "../group_vars/production/vars.yml"
    # => Includes both regular vars and vault references

  tasks:
    - name: Write application configuration
      template:
        src: app-config.j2 # => Jinja2 template file
        dest: /etc/app/config.yaml # => Destination on remote host
        owner: app # => File owner
        mode: "0600" # => Read-only for owner (secrets file)
        # => mode: "0600" prevents other users from reading the config
      vars:
        database_password: "{{ db_password }}"
        # => db_password references vault_db_password via group_vars chain

    - name: Configure SSL certificate
      copy:
        content: "{{ vault_ssl_private_key }}"
        dest: /etc/ssl/private/app.key
        owner: root
        group: ssl-cert
        mode: "0640" # => Owner read-write, group read
```

```bash
# Running playbooks with Vault
ansible-playbook playbooks/configure-app.yml --ask-vault-pass
# => Prompts for vault password interactively (development use)

ansible-playbook playbooks/configure-app.yml --vault-password-file ~/.vault_pass
# => Reads vault password from file (CI/CD use)
# => ~/.vault_pass should be mode 600, stored in secrets manager

ansible-vault edit group_vars/production/vault.yml
# => Opens encrypted file in $EDITOR for safe editing
# => Decrypts in memory, saves re-encrypted to disk
```

**Key Takeaway**: Ansible Vault encrypts secrets within variable files using AES-256, enabling secrets to live in version control encrypted while being decrypted automatically during playbook execution.

**Why It Matters**: The alternative to Ansible Vault—storing secrets in environment variables or separate untracked files—creates a class of reproducibility bugs where playbooks work on one machine but fail on another because secrets weren't shared. Vault-encrypted files are fully committed to git, making the entire playbook self-contained and reproducible from any machine that has the vault password, which itself can be stored in a centralized secrets manager like AWS Secrets Manager or HashiCorp Vault.

---

## Group 23: Advanced Terraform Patterns

### Example 73: Pulumi TypeScript Comparison

Pulumi allows writing infrastructure as real programming languages, offering conditionals, loops, and abstractions unavailable in HCL. This example compares equivalent infrastructure in Terraform HCL and Pulumi TypeScript.

**Terraform HCL approach**:

```hcl
# terraform-approach/main.tf
# => Terraform HCL: limited programming constructs

variable "environments" {
  type    = list(string)
  default = ["dev", "staging", "production"]
  # => Create VPC for each environment
}

resource "aws_vpc" "env" {
  for_each   = toset(var.environments) # => Convert list to set for for_each
  cidr_block = "10.${index(var.environments, each.key)}.0.0/16"
  # => Workaround: index() to get position, build CIDR via interpolation
  # => Limitation: index() requires knowing list contents at plan time
  # => Cannot use complex logic (conditionals on computed values) in for_each

  tags = { Name = "${each.key}-vpc" }
}
```

HCL limitations: no function definitions, no complex conditionals on computed values, no native loops with arbitrary logic.

**Pulumi TypeScript approach**:

```typescript
// pulumi-approach/index.ts
// => Pulumi TypeScript: full programming language capabilities

import * as aws from "@pulumi/aws";
// => Import Pulumi AWS SDK (installed via npm)

const environments = ["dev", "staging", "production"];
// => TypeScript array: familiar data structure

// TypeScript function for CIDR calculation
function getVpcCidr(index: number): string {
  return `10.${index}.0.0/16`;
  // => Real function definition (impossible in HCL)
  // => Can contain arbitrary logic: lookups, calculations, API calls
}

// TypeScript map with type safety
const vpcs = Object.fromEntries(
  environments.map((env, index) => {
    // => .map() with index: native TypeScript array method
    const vpc = new aws.ec2.Vpc(`${env}-vpc`, {
      cidrBlock: getVpcCidr(index), // => Call TypeScript function
      tags: { Name: `${env}-vpc`, Environment: env },
    });
    return [env, vpc]; // => Build map entry
  }),
);
// => vpcs is { dev: VpcResource, staging: VpcResource, production: VpcResource }

// Export VPC IDs (TypeScript type: Record<string, pulumi.Output<string>>)
export const vpcIds = Object.fromEntries(
  Object.entries(vpcs).map(([env, vpc]) => [env, vpc.id]),
  // => vpc.id is a Pulumi Output<string> (resolved after deployment)
);
```

**When to choose Pulumi over Terraform**:

- Complex conditional logic based on computed values
- Reusable infrastructure components as TypeScript classes
- Integration with existing TypeScript/JavaScript codebase
- Programmatic infrastructure generation from APIs or databases

**Key Takeaway**: Pulumi enables infrastructure as actual code with full programming language constructs, while Terraform HCL provides a declarative DSL with limited but often sufficient functionality for most infrastructure patterns.

**Why It Matters**: Terraform's declarative model handles 80% of infrastructure needs elegantly, but teams writing complex multi-environment, multi-region configurations often hit HCL's limits: no functions, no complex conditionals on unknowns, no native type system. Pulumi's approach, adopted by teams at Mercedes-Benz, Snowflake, and Cockroach Labs, enables infrastructure logic as complex as application code while maintaining the same declarative deployment model where Pulumi tracks what needs to change.

---

### Example 74: Terraform CDK (CDKTF) Concept

CDKTF (CDK for Terraform) generates Terraform HCL JSON from TypeScript/Python/Java code, combining the expressiveness of programming languages with the Terraform ecosystem (all providers, all backends).

```typescript
// cdktf/main.ts
// => CDKTF generates Terraform HCL JSON from TypeScript

import { App, TerraformStack, TerraformOutput } from "cdktf";
// => App: root construct, TerraformStack: maps to Terraform root module

import { AwsProvider, ec2 } from "@cdktf/provider-aws";
// => Type-safe AWS provider bindings generated from Terraform provider schema

import { Construct } from "constructs";
// => Construct: base class for all CDKTF components (like CDK for AWS)

class InfrastructureStack extends TerraformStack {
  // => TerraformStack generates a single Terraform root module
  // => Extending TerraformStack creates a deployable unit

  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, "aws", {
      region: "us-east-1",
      // => AwsProvider generates: provider "aws" { region = "us-east-1" }
    });

    // TypeScript array of subnet configs
    const subnetConfigs = [
      { cidr: "10.0.1.0/24", az: "us-east-1a" },
      { cidr: "10.0.2.0/24", az: "us-east-1b" },
      { cidr: "10.0.3.0/24", az: "us-east-1c" },
    ];
    // => Using real TypeScript array (no HCL for_each limitations)

    const vpc = new ec2.Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16", // => Generates: resource "aws_vpc" "main-vpc" { ... }
    });

    // Create subnets using TypeScript .map()
    const subnets = subnetConfigs.map(
      (config, index) =>
        new ec2.Subnet(this, `subnet-${index}`, {
          vpcId: vpc.id, // => vpc.id references the VPC resource (generates interpolation)
          cidrBlock: config.cidr,
          availabilityZone: config.az,
        }),
      // => Generates: resource "aws_subnet" "subnet-0", "subnet-1", "subnet-2"
    );

    new TerraformOutput(this, "subnet-ids", {
      value: subnets.map((s) => s.id),
      // => Generates: output "subnet-ids" { value = [...] }
      // => TypeScript map() generates Terraform list output
    });
  }
}

const app = new App(); // => Create CDKTF app (root of construct tree)
new InfrastructureStack(app, "my-infra");
// => Register stack with app

app.synth();
// => Synthesize TypeScript code into cdktf.out/ directory containing Terraform JSON
// => Run: cdktf deploy (deploys synthesized Terraform JSON)
// => Run: cdktf diff (equivalent to terraform plan)
```

**Key Takeaway**: CDKTF synthesizes Terraform JSON from TypeScript/Python/Java, giving you full programming language expressiveness while targeting the complete Terraform provider ecosystem and all existing Terraform backends.

**Why It Matters**: CDKTF occupies a unique position: organizations already invested in Terraform providers and state management can adopt programming language abstractions without migrating to Pulumi's separate state system. Teams at Accenture and Thoughtworks use CDKTF to build reusable infrastructure "constructs"—similar to AWS CDK constructs—that encapsulate entire application tiers (VPC + ECS + RDS) as a single TypeScript class that development teams instantiate with three lines of code.

---

## Group 24: Cost and Compliance

### Example 75: Infrastructure Cost Estimation with Infracost

Infracost integrates with Terraform to estimate cloud costs before applying changes, surfacing monthly cost impacts in pull requests.

```yaml
# .github/workflows/infracost.yml
# => GitHub Actions workflow for cost estimation

name: Infracost Cost Estimation

on:
  pull_request:
    paths:
      - "infrastructure/**"

jobs:
  infracost:
    name: Estimate Cost
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write # => Required to post PR comment

    steps:
      - uses: actions/checkout@v4

      - name: Setup Infracost
        uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}
          # => API key from infracost.io (free tier available)

      - name: Generate Infracost diff
        run: |
          # Generate cost estimate for PR branch
          infracost breakdown --path infrastructure/ \
            --format json \
            --out-file infracost-base.json
          # => breakdown: estimate costs for all resources in the plan
          # => --format json: machine-readable output for comparison

          # Compare to baseline (main branch)
          infracost diff \
            --path infrastructure/ \
            --compare-to infracost-base.json \
            --format json \
            --out-file infracost-diff.json
          # => diff: shows cost change between branches
          # => Output includes: monthly cost delta, resource-by-resource breakdown
        env:
          INFRACOST_TERRAFORM_CLOUD_TOKEN: ${{ secrets.TF_API_TOKEN }}
          # => Required if using Terraform Cloud for remote state

      - name: Post Infracost comment
        uses: infracost/actions/comment@v3
        with:
          path: infracost-diff.json
          behavior: update # => Update existing comment on re-runs
          # => Posts table like:
          # =>   Resource            Monthly Cost    Change
          # =>   aws_instance.app    $73.00          +$36.50 (+100%)
          # =>   aws_db_instance.db  $52.00          No change
          # =>   Total               $125.00         +$36.50
```

```hcl
# infrastructure/main.tf
# => Annotated for cost awareness

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.large"        # => ~$60/month in us-east-1 (on-demand)
  # => COST IMPACT: instance_type is the primary cost driver
  # => t3.large: 2 vCPU, 8GB RAM
  # => Consider: t3.medium ($30/month) for non-prod, reserved instances for 40% discount

  ebs_optimized = true              # => ~$0/month for t3 (included)
  # => Adds dedicated EBS bandwidth channel

  root_block_device {
    volume_size = 100               # => 100 GB gp3: ~$8/month
    volume_type = "gp3"             # => gp3 cheaper than gp2 for same IOPS
    # => COST IMPACT: over-provisioning storage is common waste
    # => Infracost will show this as separate line item
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  # => COST IMPACT: NAT Gateway costs ~$32/month base + $0.045/GB data
  # => Often the hidden cost surprise in VPC architectures
  # => Alternative: NAT instance (EC2) is cheaper but less reliable
}
```

**Key Takeaway**: Infracost surfaces cloud cost impacts in pull requests before infrastructure changes are applied, preventing expensive surprises from infrastructure changes that seem small but have large cost implications.

**Why It Matters**: Infrastructure cost overruns are almost always caused by incremental decisions that seemed reasonable in isolation: "just add a NAT Gateway," "bump instance type for performance," "add Multi-AZ for reliability." Infracost makes each decision's monthly cost visible at code review time, when changing it is free. Spotify's infrastructure team reports that surfacing costs in PRs reduced their unexpected cloud bill growth by 30% in the first quarter, because engineers started choosing cost-effective alternatives when alternatives were equally viable.

---

### Example 76: Compliance as Code with SOPS

SOPS (Secrets OPerationS) encrypts entire files for storage in git while integrating with cloud KMS services for key management, enabling auditable, compliant secrets management.

```yaml
# .sops.yaml
# => SOPS configuration file (in repository root)

creation_rules:
  - path_regex: environments/production/.*\.yaml$
    # => Match: any .yaml file under environments/production/
    kms: arn:aws:kms:us-east-1:123456789:key/my-kms-key-id
    # => AWS KMS key to encrypt/decrypt production secrets
    # => KMS key policy controls who can encrypt/decrypt (IAM-based)
    # => Audit trail: KMS CloudTrail logs every decrypt operation

  - path_regex: environments/staging/.*\.yaml$
    kms: arn:aws:kms:us-east-1:123456789:key/staging-kms-key-id
    # => Separate KMS key for staging (different IAM access)
    # => Production engineers cannot decrypt staging secrets
    # => (and vice versa, enforcing least privilege)

  - path_regex: .*\.yaml$
    pgp: "FINGERPRINT1,FINGERPRINT2"
    # => Fallback: PGP encryption for non-environment files
    # => Encrypted for multiple recipients (each can decrypt)
```

```yaml
# environments/production/secrets.enc.yaml
# => SOPS-encrypted file (stored in git in this encrypted form)
# => After: sops --encrypt environments/production/secrets.enc.yaml

# Encrypted file format (actual git content):
# db_password: ENC[AES256_GCM,data:xyz123...,tag:abc456,type:str]
# api_key: ENC[AES256_GCM,data:def789...,tag:ghi012,type:str]
# sops:
#   kms: [{ arn: "arn:aws:kms:...", enc: "AQICAHi...", created_at: "..." }]
#   version: "3.7.3"

# After: sops --decrypt environments/production/secrets.enc.yaml
# (Decrypted view - never stored in plaintext):
db_password: "production-db-password-here"
api_key: "production-api-key-here"
```

```hcl
# sops-terraform/main.tf
# => Terraform reading SOPS-encrypted values

data "sops_file" "prod_secrets" {
  source_file = "${path.module}/environments/production/secrets.enc.yaml"
  # => sops provider decrypts file using KMS at plan/apply time
  # => Requires AWS credentials with kms:Decrypt permission
  # => Decrypted values available as data.sops_file.prod_secrets.data["key"]
}

resource "aws_db_instance" "prod" {
  identifier = "prod-database"
  engine     = "postgres"

  username = "app_user"
  password = data.sops_file.prod_secrets.data["db_password"]
  # => Password decrypted from SOPS-encrypted file at apply time
  # => Never appears in .tf files or environment variables
  # => Decrypt audit trail logged in AWS CloudTrail (KMS usage)
}
```

**Key Takeaway**: SOPS encrypts secrets files using cloud KMS keys and stores encrypted files in git, providing both version-controlled secrets history and IAM-controlled access with a full audit trail.

**Why It Matters**: Compliance frameworks like SOC 2, PCI-DSS, and HIPAA require demonstrating that access to production secrets is logged, audited, and revocable. SOPS with KMS provides all three: CloudTrail logs every decrypt operation, KMS key policies define exactly who can access secrets, and rotating secrets requires only updating the encrypted file and its KMS key—no environment variables to update across servers. Airbnb and Datadog use SOPS in their infrastructure pipelines for exactly this audit capability.

---

## Group 25: Disaster Recovery and Auto-Scaling

### Example 77: Disaster Recovery Automation

Infrastructure as Code enables fully automated disaster recovery by defining recovery infrastructure as code that can be deployed in minutes to any region.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Primary Region us-east-1"] -->|"RDS Replication"| B["DR Region us-west-2"]
  A -->|"S3 Replication"| C["DR Storage"]
  D["DR Trigger: Runbook"] -->|"terraform apply"| B
  B --> E["Fully Operational DR"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#029E73,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#CA9161,stroke:#000,color:#fff
```

```hcl
# disaster-recovery/main.tf
# => Disaster recovery infrastructure (deployed to secondary region)

variable "dr_mode" {
  type        = bool
  description = "Set to true to activate full DR environment"
  default     = false               # => Normally false (pilot light mode)
  # => pilot light: minimal DR infrastructure, scaled up on activation
}

provider "aws" {
  alias  = "primary"
  region = "us-east-1"             # => Primary region provider
}

provider "aws" {
  alias  = "dr"
  region = "us-west-2"             # => DR region provider
}

# RDS read replica in DR region
resource "aws_db_instance" "dr_replica" {
  provider             = aws.dr    # => Deploy to DR region
  identifier           = "app-db-dr-replica"
  replicate_source_db  = aws_db_instance.primary.arn
  # => Cross-region read replica: data continuously synced from primary
  # => Lag typically < 1 second (near-synchronous replication)
  # => On activation: promote replica to standalone (terraform apply -var dr_mode=true)

  instance_class    = var.dr_mode ? "db.t3.large" : "db.t3.micro"
  # => Normal: tiny instance (pilot light, minimal cost)
  # => DR activated: scale to production size
  multi_az          = var.dr_mode  # => Multi-AZ only when activated
  # => Single AZ for standby, Multi-AZ when serving production traffic
}

# DNS failover
resource "aws_route53_record" "app" {
  zone_id = var.hosted_zone_id
  name    = "app.example.com"
  type    = "A"

  failover_routing_policy {
    type = var.dr_mode ? "SECONDARY" : "PRIMARY"
    # => Normal: Route53 routes to primary region
    # => DR activated: this record becomes the secondary (target)
  }

  health_check_id = aws_route53_health_check.primary.id
  # => Route53 monitors primary endpoint health
  # => Automatic failover if health check fails
  set_identifier = "primary-or-dr"
  alias {
    name                   = var.dr_mode ? aws_lb.dr.dns_name : aws_lb.primary.dns_name
    zone_id                = var.dr_mode ? aws_lb.dr.zone_id : aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}
```

**Key Takeaway**: Model disaster recovery as a Terraform variable (`dr_mode`) that scales infrastructure from minimal pilot-light mode to full production capacity, enabling rehearsed, repeatable recovery in minutes rather than hours.

**Why It Matters**: Manual DR procedures documented in runbooks degrade over time as they're never tested; by the time a disaster strikes, the runbook is months out of date. Codifying DR as Terraform configuration means the recovery procedure is tested every time the code is validated in CI, and activation is `terraform apply -var="dr_mode=true"`. AWS case studies show organizations that practice IaC-driven DR achieve RTO (Recovery Time Objective) of under 30 minutes versus 4+ hours for manual DR procedures.

---

### Example 78: Auto-Scaling Infrastructure Patterns

Infrastructure as Code defines the scaling policies and triggers that automatically adjust capacity based on demand, from basic CPU scaling to custom metric scaling.

```hcl
# auto-scaling/main.tf
# => Advanced auto-scaling configuration

resource "aws_autoscaling_group" "app" {
  name                      = "app-asg"
  min_size                  = 2              # => Never scale below 2 (HA minimum)
  max_size                  = 50             # => Cap at 50 to control costs
  desired_capacity          = 3             # => Starting point
  health_check_type         = "ELB"         # => Use load balancer health checks
  health_check_grace_period = 300           # => 5 minutes for instance warm-up
  # => Grace period prevents terminating instances that are still starting

  vpc_zone_identifier = var.private_subnet_ids
  # => Deploy across multiple AZs for fault tolerance

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"            # => Replace instances one at a time
    preferences {
      min_healthy_percentage = 90   # => Keep 90% healthy during refresh
      # => 10 instances: replaces at most 1 at a time (10% of 10 = 1)
      instance_warmup = 300         # => Wait 5 min before refreshing next
    }
    # => instance_refresh triggers rolling replacement when launch template changes
    # => terraform apply with new launch template automatically refreshes ASG
  }

  tag {
    key                 = "Name"
    value               = "app-instance"
    propagate_at_launch = true      # => Apply tag to every instance launched
  }
}

# Target tracking scaling - CPU
resource "aws_autoscaling_policy" "cpu_scale_out" {
  name                   = "cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  # => TargetTracking: Auto Scaling adjusts to maintain target metric

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
      # => Pre-built metric: average CPU across all instances in ASG
    }
    target_value = 60.0             # => Target: 60% average CPU utilization
    # => Scale out (add instances) when avg CPU > 60%
    # => Scale in (remove instances) when avg CPU < 60%
    # => Auto Scaling calculates required instance count automatically
  }
}

# Step scaling based on SQS queue depth
resource "aws_autoscaling_policy" "queue_scale_out" {
  name                   = "queue-depth-scale-out"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "StepScaling"
  # => StepScaling: add different numbers of instances based on metric severity

  step_adjustment {
    metric_interval_lower_bound = 0    # => Queue depth 100-500
    metric_interval_upper_bound = 400
    scaling_adjustment          = 2    # => Add 2 instances
  }

  step_adjustment {
    metric_interval_lower_bound = 400  # => Queue depth 500-1000
    metric_interval_upper_bound = 900
    scaling_adjustment          = 5    # => Add 5 instances (more aggressive)
  }

  step_adjustment {
    metric_interval_lower_bound = 900  # => Queue depth > 1000
    scaling_adjustment          = 10   # => Add 10 instances (emergency scale-out)
    # => No upper bound: handles any queue depth above threshold
  }
  adjustment_type = "ChangeInCapacity"  # => Relative adjustment (add/remove)
}
```

**Key Takeaway**: Define both target-tracking scaling (for steady-state metrics like CPU) and step scaling (for event-driven spikes like queue depth) to handle both gradual load increases and sudden traffic bursts.

**Why It Matters**: Hard-coded `desired_capacity` in Terraform is a common anti-pattern for production systems—it creates a choice between over-provisioning (waste) and under-provisioning (incidents). IaC-defined scaling policies encode your scaling strategy as code: reviewable, testable, and auditable. Stripe's infrastructure team publicly documented that IaC-defined auto-scaling—with carefully tuned step policies for different traffic patterns—reduced their compute costs by 35% while improving availability during traffic spikes compared to manually managed capacity.

---

## Group 26: Dependency Graphs and State

### Example 79: Infrastructure Dependency Graphs

Terraform builds an implicit dependency graph from resource references. Understanding and managing this graph is critical for optimizing plan/apply performance and avoiding circular dependencies.

```hcl
# dependency-graph/main.tf
# => Illustrating Terraform's dependency resolution

# Root resource: no dependencies
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"       # => Created first (no dependencies)
  # => All other resources in this file depend on this VPC
}

# Depends on VPC (implicit via vpc_id reference)
resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id     # => implicit dependency: subnet waits for VPC
  cidr_block = "10.0.1.0/24"
  # => terraform graph shows edge: aws_subnet.public -> aws_vpc.main
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id     # => Also depends on VPC
  cidr_block = "10.0.2.0/24"
  # => aws_subnet.public and aws_subnet.private are independent (parallel creation)
}

# Depends on VPC and subnet (implicit)
resource "aws_db_subnet_group" "main" {
  name       = "main"
  subnet_ids = [aws_subnet.private.id]
  # => Implicit dependency: waits for private subnet
}

# Explicit dependency using depends_on
resource "aws_db_instance" "app" {
  identifier     = "app-db"
  engine         = "postgres"
  instance_class = "db.t3.micro"
  db_subnet_group_name = aws_db_subnet_group.main.name
  # => Implicit dependency: waits for subnet group

  depends_on = [aws_vpc.main]      # => Explicit dependency (usually unnecessary)
  # => Use depends_on ONLY when dependency not captured by reference
  # => Example: IAM policy changes that affect resource behavior without reference
  # => Overuse of depends_on forces sequential apply instead of parallel
}

# Data source with explicit dependency
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [aws_vpc.main.id]     # => Implicit: data source reads after VPC created
  }
  depends_on = [aws_subnet.private]  # => Wait for subnet creation
  # => Data source might be cached; depends_on forces re-read after subnet creation
}
```

**Viewing the dependency graph**:

```bash
terraform graph | dot -Tsvg > infrastructure-graph.svg
# => terraform graph outputs Graphviz DOT format
# => dot converts DOT to SVG image
# => Visualize entire dependency tree to identify bottlenecks and cycles

terraform graph -type=plan | dot -Tsvg > plan-graph.svg
# => -type=plan: show only resources affected by current plan
# => Useful for understanding what a specific change will affect
```

**Key Takeaway**: Terraform automatically parallelizes resource creation for independent resources and serializes dependent ones; use implicit references over explicit `depends_on` whenever possible to maximize parallelism.

**Why It Matters**: Understanding the dependency graph is the difference between a 5-minute `terraform apply` and a 30-minute one. A poorly designed module with unnecessary `depends_on` relationships forces sequential resource creation, serializing what could be parallel. Teams managing large-scale infrastructure at companies like HashiCorp and Databricks tune their module dependency graphs by visualizing them, identifying bottlenecks, and removing unnecessary sequential constraints—reducing apply times from 20+ minutes to under 5 minutes.

---

### Example 80: State Migration Strategies

Terraform state files require maintenance as configurations evolve. State migration commands move, rename, and reorganize state entries without destroying and recreating resources.

```bash
# state-migration/commands.sh
# => Terraform state manipulation commands for safe migrations

# List all resources in current state
terraform state list
# => Output example:
# => aws_vpc.main
# => aws_subnet.public
# => aws_instance.app[0]
# => aws_instance.app[1]
# => module.networking.aws_vpc.main

# Show state of specific resource
terraform state show aws_vpc.main
# => Prints all attributes of resource from state file
# => Useful for debugging plan differences (what Terraform thinks exists)

# Move resource within state (rename)
terraform state mv aws_instance.app aws_instance.web
# => Renames state entry: aws_instance.app -> aws_instance.web
# => NO infrastructure changes (cloud resource unchanged)
# => Required when renaming resources in .tf files

# Move resource into module
terraform state mv aws_vpc.main module.networking.aws_vpc.main
# => Moves resource into module scope
# => Required when refactoring flat config into modules

# Move resource to different state file
terraform state mv \
  -state=old-infra.tfstate \
  -state-out=new-infra.tfstate \
  aws_vpc.main module.networking.aws_vpc.main
# => Cross-state migration (split large monolithic state into modules)
# => -state: source state file
# => -state-out: destination state file

# Remove resource from state (without destroying)
terraform state rm aws_instance.legacy
# => Removes from Terraform management (resource still exists in cloud)
# => Use case: resource will be managed by different Terraform config
# => Use case: resource was imported accidentally and needs re-importing

# Pull current remote state to local file for inspection
terraform state pull > backup.tfstate
# => Writes current remote state to local file
# => Create backup before any state surgery
# => Always backup before state manipulation commands
```

```hcl
# state-migration/moved.tf
# => Terraform 1.1+ moved blocks: declarative state migration

# Moved block: documents and applies state rename
moved {
  from = aws_instance.app         # => Old resource address
  to   = aws_instance.web_server  # => New resource address
  # => Running terraform plan after adding this block shows "move" in plan
  # => Running terraform apply executes the state rename automatically
  # => Cleaner than CLI terraform state mv (tracked in version control)
}

moved {
  from = aws_vpc.main
  to   = module.networking.aws_vpc.main
  # => Move flat resource into module scope
  # => Enables incremental module refactoring without resource destruction
}
```

**Key Takeaway**: Use `moved` blocks in Terraform 1.1+ for declarative, version-controlled state migrations when refactoring; fall back to `terraform state mv` CLI commands for complex multi-file migrations.

**Why It Matters**: State migration without destroying resources is essential for evolving large infrastructure codebases. The alternative—`terraform destroy` followed by `terraform apply`—causes production downtime for every refactor. Teams at HashiCorp estimate that mature infrastructure codebases undergo major refactoring every 6-12 months as they decompose monolithic configurations into modules, making safe state migration a core operational capability rather than an emergency procedure.

---

## Group 27: Large-Scale Module Composition

### Example 81: Large-Scale Module Composition

Enterprise-scale infrastructure uses nested module composition to build complex, reusable infrastructure from smaller building blocks.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Root Module"] --> B["module.networking"]
  A --> C["module.compute"]
  A --> D["module.database"]
  B --> E["module.vpc"]
  B --> F["module.security-groups"]
  C --> G["module.asg"]
  C --> H["module.alb"]
  D --> I["module.rds"]
  D --> J["module.elasticache"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#DE8F05,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#029E73,stroke:#000,color:#fff
  style F fill:#029E73,stroke:#000,color:#fff
  style G fill:#029E73,stroke:#000,color:#fff
  style H fill:#029E73,stroke:#000,color:#fff
  style I fill:#CA9161,stroke:#000,color:#fff
  style J fill:#CA9161,stroke:#000,color:#fff
```

```hcl
# large-scale/modules/networking/main.tf
# => Networking composite module (composes vpc + security-groups submodules)

variable "environment" { type = string }
variable "vpc_cidr"    { type = string }

module "vpc" {
  source = "./vpc"                  # => Local submodule path
  cidr   = var.vpc_cidr
  # => Networking module delegates VPC creation to vpc submodule
}

module "security_groups" {
  source = "./security-groups"      # => Security groups submodule
  vpc_id = module.vpc.vpc_id        # => Pass VPC ID from vpc submodule
  # => module.vpc.vpc_id references output from vpc submodule
}

output "vpc_id" {
  value = module.vpc.vpc_id         # => Re-export from submodule
  # => Root module accesses module.networking.vpc_id (not module.networking.module.vpc.vpc_id)
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "app_security_group_id" {
  value = module.security_groups.app_sg_id
}
```

```hcl
# large-scale/environments/production/main.tf
# => Root module for production environment

module "networking" {
  source      = "../../modules/networking"
  # => Relative path to networking composite module
  environment = "production"
  vpc_cidr    = "10.0.0.0/16"
}

module "compute" {
  source = "../../modules/compute"

  vpc_id             = module.networking.vpc_id
  # => Passes VPC ID from networking module to compute module
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.networking.app_security_group_id]
  instance_type      = "t3.large"
  min_capacity       = 3
  max_capacity       = 30
}

module "database" {
  source = "../../modules/database"

  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids
  app_security_group_id = module.networking.app_security_group_id
  # => Database only accepts connections from app security group
  instance_class = "db.r6g.large"
  multi_az       = true             # => Production: Multi-AZ required
}
```

**Key Takeaway**: Compose large infrastructure configurations from small, single-purpose modules that expose clean interfaces (outputs) and accept parameters (variables), enabling reuse across environments while maintaining environment-specific configuration.

**Why It Matters**: Enterprise infrastructure codebases without module composition become "configuration monoliths"—single 5,000-line `main.tf` files that no one understands completely and no one dares refactor. Module composition enables teams to own specific infrastructure layers (the networking team owns the networking module, the database team owns the RDS module) while the platform team composes them into environments. This organizational pattern, adopted by Airbnb, Lyft, and Uber's infrastructure teams, enables independent iteration on infrastructure components without cross-team coordination for every change.

---

### Example 82: Terraform Registry Module Versioning

The Terraform Registry hosts community and official modules with semantic versioning. Managing module versions precisely is critical for infrastructure reproducibility.

```hcl
# registry-modules/main.tf
# => Using Terraform Registry modules with strict versioning

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"          # => Patch updates allowed, minor/major blocked
      # => ~> 5.31 allows: 5.31.1, 5.31.2 but NOT 5.32.0
      # => More restrictive than ~> 5.0 (allows all 5.x minor versions)
    }
  }
}

# Official AWS VPC module from Terraform Registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.2"                # => Exact pin (most restrictive)
  # => Exact version prevents automatic updates
  # => Recommended for production: explicit update decision required
  # => Alternative: "~> 5.5" allows patch updates within 5.5.x

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false   # => One NAT per AZ (HA, but 3x cost)
  enable_vpn_gateway     = false   # => Not using VPN
  enable_dns_hostnames   = true    # => EC2 instances get DNS names
}

# AWS EKS module with version constraint
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"              # => All 20.x versions allowed
  # => Allows automatic minor and patch updates within major version 20
  # => Trade-off: less control but automatic security patches

  cluster_name    = "production-cluster"
  cluster_version = "1.29"         # => Kubernetes version (independent of module version)

  vpc_id     = module.vpc.vpc_id    # => Reference VPC module output
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true  # => Allow kubectl from internet
  # => For production: restrict to corporate IP ranges or VPN only
}

# Lock file ensures same versions on all machines
# => .terraform.lock.hcl (auto-generated by terraform init)
# => Commit to git: ensures team members and CI use identical provider versions
# => Update with: terraform providers lock (for all platforms)
# =>           or: terraform init -upgrade (upgrades within constraints)
```

**Key Takeaway**: Pin registry module versions exactly in production (`version = "5.5.2"`) and use constraint expressions (`~> 5.5`) for development, always committing `.terraform.lock.hcl` to git for cross-team reproducibility.

**Why It Matters**: The Terraform Registry hosts hundreds of community modules with frequent releases. A module update that changes default values or resource schemas can cause unexpected plan diffs or worse—resource recreation. HashiCorp's own VPC module has had multiple minor releases that changed default settings. Teams that pin exact versions and review the module changelog before updating maintain reproducible infrastructure; teams using loose version constraints like `>= 1.0` risk `terraform init` installing different module versions on different machines, making "works on my machine" a real infrastructure problem.

---

## Group 28: Advanced Ansible Patterns

### Example 83: Ansible Dynamic Inventory

Dynamic inventory queries cloud APIs to build host lists automatically, eliminating the need to maintain static inventory files as infrastructure scales.

```python
# dynamic-inventory/aws_inventory.py
# => Custom dynamic inventory script for AWS EC2
# => Called by: ansible-playbook -i aws_inventory.py playbook.yml

#!/usr/bin/env python3

import json
import boto3
import sys
# => boto3: AWS SDK for Python (reads EC2 instance data)

def get_inventory():
    ec2 = boto3.client("ec2", region_name="us-east-1")
    # => Create EC2 client using AWS credentials from environment

    response = ec2.describe_instances(
        Filters=[
            {"Name": "instance-state-name", "Values": ["running"]},
            # => Only running instances (exclude stopped, terminated)
            {"Name": "tag:ManagedBy", "Values": ["terraform"]},
            # => Only Terraform-managed instances (exclude manually created)
        ]
    )
    # => response["Reservations"] contains list of instance groups

    inventory = {
        "_meta": {"hostvars": {}},
        # => _meta.hostvars: per-host variables (Ansible standard format)
        "all": {"hosts": [], "vars": {}},
        # => "all" group contains every host
    }

    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            ip = instance.get("PrivateIpAddress", "")
            # => Use private IP for internal access (adjust to PublicIpAddress if needed)
            if not ip:
                continue           # => Skip instances without IP (rare edge case)

            # Add to all hosts
            inventory["all"]["hosts"].append(ip)
            # => Every instance belongs to "all" group

            # Build per-host variables
            tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}
            # => Convert AWS tag list to dictionary: [{"Key":"Env","Value":"prod"}] -> {"Env":"prod"}

            inventory["_meta"]["hostvars"][ip] = {
                "ansible_host": ip,
                "instance_id": instance["InstanceId"],
                # => Pass instance ID as Ansible variable (useful for AWS operations)
                "environment": tags.get("Environment", "unknown"),
                # => Tag value as variable (available in playbooks as {{ environment }})
                "role": tags.get("Role", "generic"),
                # => Role tag: "web", "app", "db" (determines which playbooks apply)
            }

            # Group by environment tag
            env = tags.get("Environment", "ungrouped")
            if env not in inventory:
                inventory[env] = {"hosts": []}
                # => Create group if first instance for this environment
            inventory[env]["hosts"].append(ip)
            # => Example: inventory["production"]["hosts"] = ["10.0.1.5", "10.0.1.6"]

            # Group by role tag
            role = tags.get("Role", "ungrouped")
            if role not in inventory:
                inventory[role] = {"hosts": []}
            inventory[role]["hosts"].append(ip)
            # => Example: inventory["web"]["hosts"] = ["10.0.1.5"]

    return inventory

if __name__ == "__main__":
    if "--list" in sys.argv:
        print(json.dumps(get_inventory(), indent=2))
        # => --list: return full inventory (called by Ansible at start)
    elif "--host" in sys.argv:
        print(json.dumps({}))
        # => --host: return per-host vars (we use _meta instead, faster)
```

**Key Takeaway**: Dynamic inventory scripts query cloud APIs to generate host groups from infrastructure tags, ensuring Ansible always operates on the current set of running instances without manual inventory maintenance.

**Why It Matters**: Static inventory files are a maintenance burden that breaks immediately when infrastructure scales: adding three new servers requires updating both Terraform configuration AND the Ansible inventory file. Dynamic inventory solves this with eventual consistency—Ansible always discovers the current state of infrastructure at playbook run time. Organizations with auto-scaling infrastructure, where instance counts change hourly, require dynamic inventory; static inventory would be wrong within minutes of any scale event.

---

### Example 84: Ansible Roles for Configuration Management

Ansible roles organize playbooks into reusable units with a standard directory structure, enabling configuration components (web server, database client, monitoring agent) to be composed across different server types.

```yaml
# roles/nginx/tasks/main.yml
# => Nginx role tasks file
# => Role applied with: - role: nginx in playbook

- name: Install nginx package
  package:
    name: nginx # => platform-agnostic package install
    state: present # => "present": install if not present
    # => "latest": always update to latest (avoid in production: unpredictable)
  # => package module: uses apt on Ubuntu, yum on RHEL automatically

- name: Deploy nginx configuration
  template:
    src: nginx.conf.j2 # => Jinja2 template in roles/nginx/templates/
    dest: /etc/nginx/nginx.conf # => Destination on managed host
    owner: root
    group: root
    mode: "0644" # => World-readable config (not sensitive)
    validate: "nginx -t -c %s" # => Validate config before deploying
    # => validate runs nginx config test; if fails, file is NOT deployed
    # => Prevents deploying broken config that would crash nginx
  notify: Restart nginx # => Trigger handler if config changes

- name: Deploy virtual host configs
  template:
    src: "vhost.conf.j2"
    dest: "/etc/nginx/conf.d/{{ item.name }}.conf"
    # => item.name from loop (each virtual host gets its own config file)
  loop: "{{ nginx_virtual_hosts }}"
  # => nginx_virtual_hosts: list variable from role defaults or playbook vars
  # => Loop creates one task execution per virtual host
  notify: Reload nginx # => Reload (not restart) for vhost changes

- name: Ensure nginx service enabled and running
  service:
    name: nginx
    state: started # => Ensure nginx is running
    enabled: true # => Enable at system boot
    # => Idempotent: no-op if already running and enabled
```

```yaml
# roles/nginx/handlers/main.yml
# => Handlers: tasks triggered by notify, run once at end of play

- name: Restart nginx
  service:
    name: nginx
    state: restarted # => Full restart (required for major config changes)
    # => Handlers run at end of play, not immediately when notified
    # => Multiple notifications for "Restart nginx" trigger only ONE restart

- name: Reload nginx
  service:
    name: nginx
    state: reloaded # => Graceful reload (no downtime for active connections)
    # => Reloaded sends SIGHUP to nginx master process
    # => Nginx gracefully replaces workers without dropping connections
```

```yaml
# playbooks/web-server.yml
# => Playbook composing multiple roles

- name: Configure web server
  hosts: web # => Apply to "web" inventory group
  become: true

  roles:
    - role: common # => Base role (OS hardening, monitoring agent)
      # => common role applied first (dependency order)
    - role: nginx # => Web server role
      vars:
        nginx_virtual_hosts:
          - name: "app"
            server_name: "app.example.com"
            upstream: "127.0.0.1:8080"
      # => Role vars override role defaults for this playbook invocation
    - role: filebeat # => Log shipping role
      # => Applied after nginx: filebeat monitors nginx log files
```

**Key Takeaway**: Ansible roles provide a standard directory structure for reusable configuration components, enabling server types to be defined as compositions of roles rather than monolithic playbooks.

**Why It Matters**: Playbook sprawl—dozens of individual playbooks with duplicated tasks—is the Ansible equivalent of copy-paste programming. Roles solve this by making configuration components composable: the `nginx` role installs and configures nginx identically on web servers, API gateways, and load balancers, with role variables handling the differences. Red Hat's Ansible Galaxy hosts 5,000+ community roles, meaning teams can deploy enterprise-grade PostgreSQL, Elasticsearch, or Kubernetes configurations by including a single role rather than writing hundreds of tasks from scratch.

---

## Group 29: Synthesis and Best Practices

### Example 85: IaC Architecture Decision Framework

Advanced IaC practitioners choose between Terraform, Pulumi, Ansible, and cloud-native tools based on specific use cases. This example demonstrates the decision framework and integrates concepts from throughout this tutorial.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Infrastructure Need"] --> B{Provisioning or Configuration?}
  B -->|"Provision cloud resources"| C{Team preference}
  B -->|"Configure existing servers"| D["Ansible / Chef / Puppet"]
  C -->|"Declarative DSL preferred"| E["Terraform / OpenTofu"]
  C -->|"Full programming language"| F{Ecosystem preference}
  F -->|"Keep Terraform state/providers"| G["CDKTF"]
  F -->|"New state system OK"| H["Pulumi"]
  E --> I{Scale}
  I -->|"Single team, <500 resources"| J["Terraform OSS"]
  I -->|"Multiple teams, >500 resources"| K["Terraform Cloud/Enterprise"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#CA9161,stroke:#000,color:#fff
  style D fill:#029E73,stroke:#000,color:#fff
  style E fill:#CC78BC,stroke:#000,color:#fff
  style F fill:#CA9161,stroke:#000,color:#fff
  style G fill:#0173B2,stroke:#000,color:#fff
  style H fill:#0173B2,stroke:#000,color:#fff
  style I fill:#DE8F05,stroke:#000,color:#fff
  style J fill:#029E73,stroke:#000,color:#fff
  style K fill:#029E73,stroke:#000,color:#fff
```

```hcl
# synthesis/production-ready-module/main.tf
# => Production-ready module incorporating advanced IaC patterns

# Module metadata for documentation
locals {
  module_name    = "production-app-platform"
  module_version = "3.2.0"          # => Module version for change tracking
  # => Combine all patterns from this tutorial series
}

terraform {
  required_version = ">= 1.6"       # => Require Terraform with test framework
  # => Ensures terraform test command available
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# Input variables with comprehensive validation
variable "config" {
  type = object({
    environment    = string
    region         = string
    instance_count = number
    instance_type  = string
    enable_ha      = bool
  })
  # => Object type: group related variables into a single structured input
  # => Consumer passes one object instead of N separate variables

  validation {
    condition = contains(
      ["dev", "staging", "production"], var.config.environment
    )
    error_message = "environment must be dev, staging, or production"
    # => Validation at variable level (catches errors before any resource creation)
  }

  validation {
    condition = var.config.instance_count >= 1 && (
      var.config.environment != "production" || var.config.enable_ha
    )
    error_message = "Production deployments must have HA enabled"
    # => Cross-variable validation: production requires enable_ha = true
    # => Encodes operational requirements as code (not documentation)
  }
}

# Conditional resource creation based on validated config
resource "aws_autoscaling_group" "app" {
  name         = "${local.module_name}-${var.config.environment}"
  min_size     = var.config.enable_ha ? 2 : 1
  # => HA: minimum 2 instances across AZs
  # => Non-HA: single instance (acceptable for dev)
  max_size     = var.config.environment == "production" ? 50 : 5
  # => Production: allow scaling to 50 instances
  # => Non-production: cap at 5 (cost control)
  desired_capacity = var.config.instance_count

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = {
      Name        = "${local.module_name}-${var.config.environment}"
      Environment = var.config.environment
      Module      = local.module_name
      Version     = local.module_version
      ManagedBy   = "terraform"
    }
    # => dynamic block generates one tag block per map entry
    # => Avoids repeating tag { } block for each tag key
    content {
      key                 = tag.key    # => Map key becomes tag key
      value               = tag.value  # => Map value becomes tag value
      propagate_at_launch = true       # => Apply to all ASG instances
    }
  }
}

# Outputs designed for downstream consumption
output "platform_info" {
  value = {
    asg_name     = aws_autoscaling_group.app.name
    environment  = var.config.environment
    ha_enabled   = var.config.enable_ha
    module_version = local.module_version
  }
  # => Structured output enables downstream modules to access specific fields
  # => module.app_platform.platform_info.asg_name
  description = "Platform deployment information for downstream consumption"
}
```

**Key Takeaway**: Production-ready IaC modules combine comprehensive input validation, conditional resource creation, dynamic blocks for DRY configuration, and structured outputs that encode operational requirements as testable code rather than documentation.

**Why It Matters**: The gap between working infrastructure code and production-ready infrastructure code is exactly the gap covered in this advanced tutorial: policy enforcement, drift detection, immutability, secrets management, testing, and cost visibility. Organizations that treat their infrastructure code with the same engineering rigor as application code—code review, automated testing, version pinning, modularization—achieve dramatically better reliability and security outcomes than those treating IaC as "just scripts." The principles remain constant whether you use Terraform, Pulumi, or Ansible: infrastructure is software, and software quality practices apply.

---

This advanced tutorial completes the 75-95% coverage of Infrastructure as Code patterns. For deeper exploration of each tool, see the individual tutorials for [Terraform](/en/learn/software-engineering/infrastructure/tools/terraform), [Ansible](/en/learn/software-engineering/infrastructure/tools/ansible), and [Docker](/en/learn/software-engineering/infrastructure/tools/docker).
