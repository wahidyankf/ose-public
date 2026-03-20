---
title: "Intermediate"
weight: 10000002
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Examples 29-57: Terraform modules, remote state, workspaces, import, dynamic blocks, lifecycle rules, provisioners, Ansible roles, handlers, templates, vault, and multi-environment patterns (35-70% coverage)"
tags:
  [
    "infrastructure-as-code",
    "iac",
    "tutorial",
    "by-example",
    "code-first",
    "intermediate",
    "terraform",
    "ansible",
    "modules",
    "state",
    "roles",
    "vault",
  ]
---

Learn intermediate Infrastructure as Code patterns through 29 annotated examples. Topics span Terraform modules, remote state backends, workspaces, import workflows, dynamic blocks, conditional resources, lifecycle rules, provisioners, and Ansible roles, handlers, Jinja2 templates, Vault secrets, and multi-environment patterns. Each example is self-contained and demonstrates production-proven techniques.

## Group 8: Terraform Modules

### Example 29: Local Module with Input Variables

Terraform modules group related resources into reusable units. A local module lives inside the project directory and is called via a `module` block, passing input variables defined in the module's `variables.tf`.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["Root main.tf<br/>module caller"] --> B["modules/network/<br/>main.tf"]
  B --> C["aws_vpc resource"]
  B --> D["aws_subnet resource"]
  A -->|"var.vpc_cidr"| B

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#029E73,stroke:#000,color:#fff
```

**`modules/network/variables.tf`**:

```hcl
# Input variables declare the module's public API
variable "vpc_cidr" {
  # => Module input: CIDR block string (e.g. "10.0.0.0/16")
  description = "CIDR block for the VPC"
  # => Documents the variable for terraform plan output
  type        = string
  # => Enforces type at plan time; rejects non-string values
}

variable "environment" {
  # => Used to tag resources and form naming conventions
  description = "Deployment environment (dev/staging/prod)"
  type        = string
}
```

**`modules/network/main.tf`**:

```hcl
terraform {
  required_version = ">= 1.5"
  # => Minimum Terraform CLI version for this module
}

resource "aws_vpc" "main" {
  # => Creates an AWS VPC using the caller-supplied CIDR
  cidr_block = var.vpc_cidr
  # => var.vpc_cidr reads the module input variable
  # => e.g. "10.0.0.0/16" produces a /16 VPC

  tags = {
    Name        = "${var.environment}-vpc"
    # => Interpolation: "dev-vpc", "staging-vpc", etc.
    Environment = var.environment
    # => Tag used for cost allocation and filtering
  }
}
```

**Root `main.tf`** — calling the module:

```hcl
module "network" {
  # => Block type "module" with local label "network"
  source = "./modules/network"
  # => Relative path to the module directory

  vpc_cidr    = "10.0.0.0/16"
  # => Passes string to var.vpc_cidr inside the module
  environment = "dev"
  # => Passes string to var.environment inside the module
}
```

**Key Takeaway**: Local modules encapsulate related resources behind input variables; the `source` attribute with a relative path is all that is needed to call a module inside the same repository.

**Why It Matters**: Modules are the primary reuse mechanism in Terraform, equivalent to functions in application code. Without modules, copy-pasted resource blocks across environments create drift; a single module change propagates to every caller. Teams that ship modules as internal libraries reduce per-environment configuration by 60-80% and catch misconfigurations at plan time through type constraints on input variables.

---

### Example 30: Module Output Values and Cross-Module Reference

Module outputs expose resource attributes to the calling configuration, enabling modules to pass VPC IDs, subnet IDs, and ARNs to downstream modules without tight coupling.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["module.network"] -->|"output: vpc_id"| B["Root config"]
  B -->|"module.network.vpc_id"| C["module.compute"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
```

**`modules/network/outputs.tf`**:

```hcl
output "vpc_id" {
  # => Exposes the VPC ID to the calling configuration
  description = "ID of the created VPC"
  # => Terraform plan and docs will display this description
  value       = aws_vpc.main.id
  # => aws_vpc.main.id is populated after apply
  # => e.g. "vpc-0a1b2c3d4e5f6789"
}

output "vpc_cidr" {
  # => Secondary output: re-export the CIDR for chaining
  description = "CIDR block of the created VPC"
  value       = aws_vpc.main.cidr_block
  # => Returns the same CIDR passed in, confirming apply succeeded
}
```

**Root `main.tf`** — consuming the output:

```hcl
module "network" {
  source      = "./modules/network"
  vpc_cidr    = "10.0.0.0/16"
  environment = "dev"
}

module "compute" {
  source = "./modules/compute"

  vpc_id = module.network.vpc_id
  # => module.<LABEL>.<OUTPUT_NAME> syntax
  # => Terraform builds an implicit dependency: compute waits for network
  environment = "dev"
}

output "network_vpc_id" {
  # => Root-level output exposes module output to operators
  value = module.network.vpc_id
  # => Printed after "terraform apply" completes
}
```

**Key Takeaway**: Module outputs are the only sanctioned way to share resource attributes between modules; referencing `module.<label>.<output>` automatically creates an implicit dependency that Terraform uses to sequence apply operations.

**Why It Matters**: Output chaining replaces hard-coded IDs and manual copy-paste between configuration files. When a VPC is recreated (e.g., during a disaster recovery drill), downstream modules receive the new ID automatically on the next plan without any manual editing. This dependency graph is also what enables Terraform's parallel apply: independent modules run concurrently while dependent ones wait, reducing apply time by 30-50% on large configurations.

---

### Example 31: Registry Module (Terraform Registry)

The public Terraform Registry hosts community and vendor modules. Registry modules are referenced by `source = "namespace/module/provider"` and versioned with a `version` constraint, removing the need to write common infrastructure from scratch.

```hcl
module "s3_bucket" {
  # => Registry source format: <namespace>/<module>/<provider>
  source  = "terraform-aws-modules/s3-bucket/aws"
  # => Downloads from registry.terraform.io on first init
  version = "~> 4.0"
  # => Pessimistic constraint: allow 4.x, reject 5.0+
  # => "~> 4.0" is equivalent to ">= 4.0, < 5.0"

  bucket = "my-app-assets-2025"
  # => Input variable: globally unique S3 bucket name
  acl    = "private"
  # => Input variable: access control list setting

  versioning = {
    # => Input variable: object-level versioning config
    enabled = true
    # => Enables S3 versioning for point-in-time recovery
  }

  tags = {
    Terraform   = "true"
    # => Standard tag indicating Terraform manages this resource
    Environment = "production"
  }
}

output "bucket_arn" {
  # => Output the ARN for use in IAM policies downstream
  value = module.s3_bucket.s3_bucket_arn
  # => Module exposes this output from the registry module
}
```

**Key Takeaway**: Registry modules are pinned with a `version` constraint; always pin to a minor version range (`~> 4.0`) rather than a floating reference to prevent unexpected breaking changes on `terraform init -upgrade`.

**Why It Matters**: The Terraform Registry has thousands of battle-tested modules for AWS, GCP, and Azure, replacing hundreds of lines of bespoke HCL with a single `module` block. Organizations that consume registry modules instead of writing raw resources reduce time-to-production for new services from days to hours. Pinning versions prevents supply-chain incidents where a module update breaks production deployments silently.

---

## Group 9: State Management

### Example 32: Remote Backend with S3 and DynamoDB State Locking

Terraform state tracks the current infrastructure reality. By default it is stored locally in `terraform.tfstate`, which is unsafe for teams. S3 backend with DynamoDB locking provides shared, consistent state with conflict prevention.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
  participant E1 as Engineer 1
  participant TF as Terraform CLI
  participant DY as DynamoDB Lock Table
  participant S3 as S3 State Bucket

  E1->>TF: terraform apply
  TF->>DY: Acquire lock (LockID)
  DY-->>TF: Lock granted
  TF->>S3: Read state
  TF->>S3: Write updated state
  TF->>DY: Release lock
```

```hcl
terraform {
  # => Terraform block configures CLI behavior and providers
  required_version = ">= 1.5"

  backend "s3" {
    # => Backend block is NOT a resource; it configures state storage
    bucket = "my-org-terraform-state"
    # => S3 bucket that stores the tfstate file
    # => Must exist before running "terraform init"

    key    = "prod/vpc/terraform.tfstate"
    # => Path within the bucket (acts like a folder + filename)
    # => Use path conventions: <env>/<component>/terraform.tfstate

    region = "us-east-1"
    # => AWS region where the S3 bucket lives

    encrypt = true
    # => Enables server-side encryption of the state file
    # => Critical: state contains secrets (passwords, private keys)

    dynamodb_table = "terraform-state-lock"
    # => DynamoDB table for distributed locking
    # => Prevents two concurrent applies from corrupting state
    # => Table must have a partition key named "LockID" (String)
  }
}
```

**Key Takeaway**: The `backend "s3"` block is evaluated at `terraform init`, not at apply time; change it by running `terraform init -reconfigure` or `terraform init -migrate-state` to move existing state.

**Why It Matters**: Teams without remote state suffer from "state file conflicts" — two engineers apply simultaneously, the second overwrites the first's state, and Terraform loses track of real infrastructure. DynamoDB locking prevents this with atomic compare-and-swap semantics. S3 encryption protects secrets embedded in state (RDS passwords, API keys) and satisfies SOC 2 and ISO 27001 audit requirements. Every team beyond solo development should use a remote backend.

---

### Example 33: Terraform Workspaces for Environment Isolation

Workspaces let a single configuration manage multiple environments (dev, staging, prod) by isolating state files. Each workspace stores its own `terraform.tfstate` within the same backend.

```hcl
# main.tf — workspace-aware configuration

locals {
  # => locals block defines computed values (not inputs, not outputs)
  environment = terraform.workspace
  # => terraform.workspace is a built-in string: "default", "dev", "prod"
  # => Use it to branch configuration per workspace

  instance_size = {
    # => Map lookup: different sizes per environment
    default = "t3.micro"
    # => "default" workspace gets the smallest instance
    dev     = "t3.micro"
    # => Developer workspace: cheap, disposable
    staging = "t3.small"
    # => Staging: slightly larger for realistic load testing
    prod    = "t3.large"
    # => Production: full-size for real traffic
  }
}

resource "aws_instance" "app" {
  # => EC2 instance sized by workspace via local lookup
  ami           = "ami-0c02fb55956c7d316"
  instance_type = local.instance_size[terraform.workspace]
  # => Reads the map key matching the current workspace
  # => e.g., in "prod" workspace: instance_type = "t3.large"

  tags = {
    Name        = "${local.environment}-app-server"
    # => Tag reflects workspace name for easy identification
    Environment = local.environment
  }
}
```

**Workspace CLI commands (not HCL)**:

```bash
terraform workspace new dev      # => Creates "dev" workspace and switches to it
terraform workspace new prod     # => Creates "prod" workspace
terraform workspace select dev   # => Switches active workspace to "dev"
terraform workspace list         # => Lists all workspaces; active has asterisk (*)
terraform workspace show         # => Prints current workspace name
```

**Key Takeaway**: `terraform.workspace` is a string you read inside HCL to branch resource configurations; workspaces share the same code but maintain separate state files, making them ideal for same-region multi-environment setups.

**Why It Matters**: Without workspaces, teams create separate directories per environment and synchronize code changes manually — a process that breeds drift. Workspaces eliminate duplicate code while keeping state isolated so a `terraform destroy` in dev cannot affect prod. The trade-off versus separate root modules is that workspaces share providers and backends; teams with very different prod versus dev configurations (separate accounts, separate regions) often prefer separate root modules instead.

---

### Example 34: `terraform import` — Adopting Existing Resources

`terraform import` brings manually-created or legacy infrastructure under Terraform management. It populates the state file with the existing resource's attributes but does NOT generate HCL configuration.

```hcl
# Step 1: Write the resource block to match the real infrastructure
# This HCL must exist BEFORE running "terraform import"

resource "aws_s3_bucket" "legacy_assets" {
  # => Resource address: aws_s3_bucket.legacy_assets
  # => Must match the address used in the import command
  bucket = "my-company-assets-legacy"
  # => The actual bucket name that already exists in AWS
}
```

**CLI import command (not HCL)**:

```bash
# terraform import <resource_address> <provider_id>
terraform import aws_s3_bucket.legacy_assets my-company-assets-legacy
# => Reads the real S3 bucket from AWS API
# => Writes current attributes to state: aws_s3_bucket.legacy_assets
# => Does NOT modify the bucket; read-only API call during import

terraform plan
# => After import, plan shows any drift between HCL and real state
# => Fix HCL until "No changes" is shown before applying
```

**Key Takeaway**: `terraform import` only writes to state; you must write the matching HCL resource block yourself, then iterate on `terraform plan` until the plan shows no changes before making any modifications.

**Why It Matters**: Most organizations have years of manually-created infrastructure that needs to be managed as code for compliance and disaster recovery. Import is the migration path from ClickOps to IaC without destroying and recreating resources. The two-step workflow (import + reconcile plan) catches attribute drift early — discovering that a legacy security group has 47 rules instead of the expected 5 is far safer before Terraform starts managing it than after.

---

### Example 35: Data Sources for Cross-Stack References

Data sources query existing infrastructure or external systems without creating resources. They bridge separately-managed stacks (e.g., reading a VPC created by a networking team into a compute stack).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["networking stack<br/>Owns VPC"] -->|"AWS API"| B["data.aws_vpc.shared"]
  B -->|"data.aws_vpc.shared.id"| C["compute stack<br/>Reads VPC ID"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
```

```hcl
# Read a VPC that exists in AWS but is not managed by THIS configuration
data "aws_vpc" "shared" {
  # => data block: reads from AWS, never creates or modifies
  filter {
    # => Filter narrows lookup to a specific VPC by tag
    name   = "tag:Environment"
    # => AWS tag key to filter on
    values = ["production"]
    # => Returns VPC where tag "Environment" = "production"
    # => Error if zero or multiple VPCs match
  }
}

data "aws_subnets" "private" {
  # => Reads subnet IDs matching the shared VPC
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.shared.id]
    # => data.aws_vpc.shared.id resolved at plan time
    # => Implicit dependency: subnets query waits for VPC data source
  }

  filter {
    name   = "tag:Tier"
    values = ["private"]
    # => Further narrows to private-tier subnets
  }
}

resource "aws_instance" "app" {
  # => Uses VPC and subnets from the data sources
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"
  subnet_id     = data.aws_subnets.private.ids[0]
  # => data.aws_subnets.private.ids is a list of subnet ID strings
  # => [0] picks the first subnet (deterministic ordering assumed)

  vpc_security_group_ids = [data.aws_vpc.shared.id]
  # => Reads VPC ID for security group scoping

  tags = {
    ManagedBy = "terraform"
  }
}
```

**Key Takeaway**: Data sources use `data.<TYPE>.<NAME>.<ATTRIBUTE>` syntax and create implicit dependencies just like resource references; they perform API reads at plan time so values are known before apply begins.

**Why It Matters**: Large organizations decompose infrastructure into independent Terraform stacks (networking, security, compute, databases) managed by different teams. Data sources are the coupling mechanism: the compute team reads the VPC ID from a data source instead of hard-coding it, so the networking team can recreate or rename the VPC without breaking compute. This decoupling is essential for GitOps workflows where separate pipelines own separate stacks.

---

## Group 10: Dynamic Configuration

### Example 36: `dynamic` Blocks for Repeated Nested Structures

The `dynamic` block generates repeated nested blocks within a resource definition from a list or map, eliminating copy-pasted ingress/egress rules, listener configurations, or disk attachments.

```hcl
variable "ingress_rules" {
  # => Input: list of objects, each describing one firewall rule
  description = "List of ingress firewall rules"
  type = list(object({
    from_port   = number
    # => Start of port range (e.g. 443)
    to_port     = number
    # => End of port range (e.g. 443; same as from_port for single port)
    protocol    = string
    # => IP protocol: "tcp", "udp", "-1" (all)
    cidr_blocks = list(string)
    # => List of CIDR source ranges (e.g. ["0.0.0.0/0"])
  }))
  default = [
    { from_port = 80,  to_port = 80,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 22,  to_port = 22,  protocol = "tcp", cidr_blocks = ["10.0.0.0/8"] },
  ]
  # => Default: HTTP, HTTPS public + SSH internal-only
}

resource "aws_security_group" "web" {
  # => Security group with dynamic ingress rules
  name        = "web-sg"
  description = "Web server security group"
  vpc_id      = "vpc-0a1b2c3d"
  # => VPC where the security group is created

  dynamic "ingress" {
    # => dynamic block: iterates over var.ingress_rules
    for_each = var.ingress_rules
    # => for_each evaluates the list at plan time
    # => Each element becomes one "ingress" nested block

    content {
      # => content block maps iterator attributes to block arguments
      from_port   = ingress.value.from_port
      # => ingress.value accesses the current list element object
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  egress {
    # => Static egress: allow all outbound (common pattern)
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    # => "-1" means all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**Key Takeaway**: The `dynamic` block iterator variable name matches the nested block type (`ingress` in `dynamic "ingress"`); access the current element with `<iterator_name>.value` and the index with `<iterator_name>.key`.

**Why It Matters**: Security groups with 20+ rules, ALB listener rule sets, and EBS disk attachments are impractical to write statically. Dynamic blocks reduce a 100-line security group definition to a 20-line block plus a variable. They also enable policy-as-data patterns: store firewall rules in YAML, parse them with `yamldecode`, and pass them to the dynamic block — turning security policy management into a data pipeline instead of HCL editing.

---

### Example 37: Conditional Resources with `count`

The `count` meta-argument sets how many instances of a resource to create. Setting it to `0` or `1` based on a boolean variable conditionally creates or skips a resource entirely.

```hcl
variable "enable_bastion" {
  # => Feature flag: true creates the bastion, false skips it
  description = "Whether to create a bastion host"
  type        = bool
  default     = false
  # => Default: no bastion (follow least-privilege)
}

variable "environment" {
  type    = string
  default = "dev"
}

resource "aws_instance" "bastion" {
  # => Bastion host: conditionally created via count
  count = var.enable_bastion ? 1 : 0
  # => Conditional expression: (condition ? true_val : false_val)
  # => count = 1 → resource created as aws_instance.bastion[0]
  # => count = 0 → resource skipped; plan shows "0 to add"

  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.nano"
  # => Minimal instance size; bastion only forwards SSH

  tags = {
    Name = "${var.environment}-bastion"
  }
}

output "bastion_ip" {
  # => Output only meaningful when bastion exists
  value = var.enable_bastion ? aws_instance.bastion[0].public_ip : null
  # => [0] index required because count produces a list
  # => null output when bastion disabled: output = (known after apply) → null
}
```

**Key Takeaway**: When `count > 1`, Terraform creates a list of resource instances addressed as `resource_type.name[index]`; always use conditional expressions to guard output references to count-based resources to avoid index-out-of-range errors.

**Why It Matters**: Feature flags via `count` are how teams implement environment-specific infrastructure without duplicating configurations. A bastion host makes sense in staging and prod but wastes money in per-developer dev environments. The same pattern controls expensive resources: NAT gateways, ElasticSearch clusters, WAF rules. Pairing boolean variables with `count` enables a single configuration to handle all environments while keeping costs proportional to environment tier.

---

### Example 38: Conditional Resources with `for_each`

`for_each` accepts a map or set and creates one resource instance per key, enabling named instances that survive reordering. It supersedes `count` for most conditional and multi-instance patterns.

```hcl
variable "create_read_replicas" {
  description = "Set of replica identifiers to create (empty set = no replicas)"
  type        = set(string)
  default     = []
  # => Empty set: no replicas created (dev/test environments)
  # => ["replica-1", "replica-2"]: two replicas (prod environment)
}

resource "aws_db_instance" "replica" {
  # => for_each creates one RDS replica per set element
  for_each = var.create_read_replicas
  # => each.key = identifier string (e.g. "replica-1")
  # => each.value = same as key for a set (sets have no distinct value)

  identifier        = "myapp-${each.key}"
  # => Unique DB identifier per replica: "myapp-replica-1"
  instance_class    = "db.t3.medium"
  replicate_source_db = "myapp-primary"
  # => Points to the primary DB instance identifier

  tags = {
    Name        = "myapp-${each.key}"
    Environment = "production"
  }
}

output "replica_endpoints" {
  # => Map output: one endpoint per replica
  value = { for k, v in aws_db_instance.replica : k => v.endpoint }
  # => for expression builds a map: { "replica-1" = "myapp-replica-1.xxx.rds.amazonaws.com" }
  # => k = replica identifier, v = full resource object
}
```

**Key Takeaway**: `for_each` addresses instances by their map key (`resource_type.name["key"]`) rather than by index; removing one element from the middle of the collection destroys only that instance, whereas removing from a `count`-based list shifts all higher indexes and destroys them unnecessarily.

**Why It Matters**: The `count` versus `for_each` choice has real operational consequences. A team that manages five EC2 instances with `count` and removes instance 2 triggers destruction of instances 2, 3, 4, and 5 (index shift), then recreation — causing unplanned downtime. `for_each` with named keys targets only the removed instance. Migrating from `count` to `for_each` after a production incident is a lesson learned expensively; choosing `for_each` from the start for multi-instance resources is considered best practice.

---

## Group 11: Lifecycle and Validation

### Example 39: `lifecycle` Rules — `prevent_destroy` and `ignore_changes`

The `lifecycle` meta-argument customizes Terraform's create/update/destroy behavior. `prevent_destroy` adds a safety guard on stateful resources; `ignore_changes` prevents drift detection on attributes managed outside Terraform.

```hcl
resource "aws_db_instance" "primary" {
  # => Production database with lifecycle guards
  identifier        = "myapp-prod-db"
  engine            = "postgres"
  engine_version    = "15.3"
  instance_class    = "db.t3.medium"
  username          = "dbadmin"
  password          = var.db_password
  # => Reads from variable to avoid plaintext secret in HCL
  allocated_storage = 100

  lifecycle {
    # => lifecycle block: configures Terraform's behavior for this resource

    prevent_destroy = true
    # => Causes "terraform destroy" and config deletions to FAIL with error
    # => Protects databases, S3 buckets, and stateful storage
    # => Must set prevent_destroy = false and re-plan to remove resource

    ignore_changes = [
      password,
      # => AWS Secrets Manager rotates the password automatically
      # => Without ignore_changes, Terraform would revert rotation on next apply
      engine_version,
      # => Minor version auto-upgrades applied by AWS maintenance window
      # => Terraform would otherwise downgrade to HCL version after each window
    ]
  }

  tags = {
    Name        = "myapp-prod-db"
    Environment = "production"
  }
}
```

**Key Takeaway**: `prevent_destroy` fails the plan rather than just warning; it acts as an explicit confirmation gate requiring a two-step process (remove the guard, then apply the destroy), protecting against accidental deletion during refactoring.

**Why It Matters**: Production database deletion is the most common catastrophic Terraform incident. `prevent_destroy` makes such deletions require deliberate two-step process — removing the guard, committing, planning, and applying — giving pull request review a chance to catch the change. `ignore_changes` complements it by letting operational systems (secret rotation, auto-scaling, maintenance) modify attributes without triggering Terraform drift alerts, reducing alert fatigue in monitoring pipelines.

---

### Example 40: Variable Validation Rules

The `validation` block inside a `variable` definition enforces business rules at plan time, producing clear error messages before any API calls are made.

```hcl
variable "environment" {
  description = "Deployment environment"
  type        = string

  validation {
    # => validation block: evaluated during "terraform plan"
    condition     = contains(["dev", "staging", "prod"], var.environment)
    # => contains(list, value): returns true if value is in list
    # => Plan fails if environment is not one of the three allowed values
    error_message = "environment must be one of: dev, staging, prod."
    # => Shown to the operator when condition is false
    # => Good messages name the allowed values explicitly
  }
}

variable "instance_count" {
  description = "Number of application instances"
  type        = number

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 20
    # => && is logical AND; both conditions must be true
    # => Prevents misconfiguration: 0 instances (outage) or 100 (cost explosion)
    error_message = "instance_count must be between 1 and 20 inclusive."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    # => can(): returns true if expression succeeds without error
    # => cidrhost() fails on invalid CIDR, so can() catches invalid input
    # => Validates CIDR format (e.g. "10.0.0.0/16" passes; "10.0.0" fails)
    error_message = "vpc_cidr must be a valid IPv4 CIDR block (e.g. 10.0.0.0/16)."
  }
}
```

**Key Takeaway**: Validation conditions can use any Terraform expression including built-in functions (`contains`, `can`, `regex`, `length`); they run entirely at plan time in the CLI, producing friendly errors before the provider makes a single API call.

**Why It Matters**: Validation catches misconfiguration at the earliest possible moment — before any infrastructure changes — rather than at apply time after partial resource creation. A team that enforces environment naming through validation prevents environment-tag drift that breaks cost allocation dashboards and compliance reports. CIDR validation prevents the hour-long debugging session caused by passing "10.0.1.0" (missing prefix length) to a VPC resource that returns a cryptic AWS API error.

---

## Group 12: Provisioners and Null Resource

### Example 41: `local-exec` Provisioner

The `local-exec` provisioner runs a command on the machine executing Terraform (the workstation or CI runner) after a resource is created. It bridges Terraform and external systems that lack a provider.

```hcl
resource "aws_instance" "app" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"

  provisioner "local-exec" {
    # => Runs AFTER the EC2 instance is created and Terraform has its ID
    command = "echo ${self.public_ip} >> known_hosts.txt"
    # => self.public_ip: reference to the parent resource's attribute
    # => self is only valid inside provisioner blocks
    # => Appends the new instance's IP to a local file

    interpreter = ["/bin/bash", "-c"]
    # => Optional: set the shell interpreter
    # => Default on Unix: ["/bin/sh", "-c"]
    # => Default on Windows: ["cmd", "/C"]
  }

  provisioner "local-exec" {
    # => Multiple provisioner blocks execute in declaration order
    when    = destroy
    # => when = destroy: runs BEFORE the resource is destroyed
    # => when = create (default): runs after resource creation
    command = "echo Destroying ${self.id} >> destroy_log.txt"
    # => Logs the instance ID to an audit file before teardown
  }

  tags = {
    Name = "app-server"
  }
}
```

**Key Takeaway**: Provisioners are a last resort; use them only when no Terraform provider or `null_resource` approach exists, because provisioner failures leave resources in a tainted state and are not tracked in the state file.

**Why It Matters**: Provisioners bridge the gap between declarative IaC and imperative operational tasks: triggering a deployment pipeline after an EC2 instance registers with a load balancer, notifying PagerDuty after infrastructure changes, or writing dynamic inventory files for Ansible. The `when = destroy` variant enables pre-destruction cleanup like deregistering from service discovery. However, because provisioner outputs are opaque to Terraform, teams limit their use and prefer purpose-built providers (aws_ssm_document, null_resource with triggers) for reproducibility.

---

### Example 42: `remote-exec` Provisioner

The `remote-exec` provisioner runs commands on the newly-created remote resource via SSH or WinRM. It bootstraps software before a configuration management tool takes over.

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"
  key_name      = aws_key_pair.deployer.key_name
  # => SSH key pair must exist for remote-exec to connect

  connection {
    # => connection block describes how to reach the instance
    type        = "ssh"
    # => Protocol: "ssh" (Linux) or "winrm" (Windows)
    user        = "ec2-user"
    # => AMI-specific SSH user (Amazon Linux 2: ec2-user, Ubuntu: ubuntu)
    private_key = file("~/.ssh/id_rsa")
    # => file() reads the private key from disk at plan time
    host        = self.public_ip
    # => self.public_ip: instance IP resolved after creation
  }

  provisioner "remote-exec" {
    # => Commands executed on the remote instance via SSH
    inline = [
      "sudo yum update -y",
      # => Updates all packages; blocking call (waits for completion)
      "sudo yum install -y nginx",
      # => Installs nginx web server
      "sudo systemctl enable nginx",
      # => Enables nginx to start on reboot
      "sudo systemctl start nginx",
      # => Starts nginx immediately
    ]
  }

  tags = {
    Name = "web-server"
  }
}
```

**Key Takeaway**: `remote-exec` requires a `connection` block; the `inline` argument runs commands sequentially and any non-zero exit code taints the resource and halts apply, providing implicit error handling.

**Why It Matters**: `remote-exec` handles the bootstrap gap between "instance exists in AWS" and "instance is managed by Ansible/Chef/Puppet." In immutable infrastructure pipelines, it installs the configuration management agent, registers with the orchestration server, and confirms health before Terraform marks the instance as successfully created. Teams who omit remote-exec bootstrapping and rely on cloud-init alone encounter race conditions where downstream Terraform resources (load balancer registrations, Route53 records) succeed before the instance is ready to serve traffic.

---

### Example 43: `null_resource` with Triggers

`null_resource` is a synthetic resource that holds no real infrastructure but runs provisioners. The `triggers` map re-runs provisioners when any trigger value changes, enabling cache-busting and re-execution patterns.

```hcl
resource "null_resource" "deploy_app" {
  # => null_resource: exists only in Terraform state; no real cloud resource
  triggers = {
    # => triggers map: provisioners re-run whenever any value changes
    app_version = var.app_version
    # => Changing var.app_version (e.g. "1.2.3" → "1.3.0") triggers re-run
    instance_id = aws_instance.app.id
    # => Replacing the EC2 instance also triggers re-deployment
    deploy_hash = sha256(file("${path.module}/deploy.sh"))
    # => sha256(file()) computes hash of the deploy script
    # => Script content change triggers re-deployment even if version unchanged
  }

  provisioner "local-exec" {
    command = "bash deploy.sh ${aws_instance.app.public_ip} ${var.app_version}"
    # => Runs deploy.sh with the instance IP and app version
    # => Re-runs only when triggers map has changed values
  }

  depends_on = [aws_instance.app]
  # => Explicit dependency: deploy waits for the instance to be ready
  # => depends_on needed because null_resource does not reference instance attributes
}
```

**Key Takeaway**: `null_resource` with `triggers` achieves idempotent re-execution: the provisioner runs exactly once per unique combination of trigger values, tracked in state, making re-deployment reliable and auditable.

**Why It Matters**: Deployment workflows often need to re-run when code changes but not on every Terraform apply. Without `null_resource` triggers, teams either always re-deploy (slow, disruptive) or never re-deploy (requires out-of-band processes). The trigger pattern gives Terraform awareness of application versioning: it records the last deployed version in state, enabling `terraform plan` to show pending deployments alongside infrastructure changes in a single review step.

---

## Group 13: Remote State and Output Chaining

### Example 44: `terraform_remote_state` Data Source

`terraform_remote_state` reads outputs from another Terraform state file, enabling loosely-coupled cross-stack references without direct module calls.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["networking stack<br/>Outputs: vpc_id, subnet_ids"] -->|"S3 state file"| B["terraform_remote_state.networking"]
  B -->|"outputs.vpc_id"| C["compute stack<br/>Uses VPC ID"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
```

**Networking stack `outputs.tf`** (separate Terraform root):

```hcl
output "vpc_id" {
  # => Must be defined in the source stack for remote_state to read it
  description = "Shared VPC ID for all compute stacks"
  value       = aws_vpc.main.id
  # => e.g. "vpc-0a1b2c3d4e5f6789"
}

output "private_subnet_ids" {
  description = "Private subnet IDs for compute placement"
  value       = aws_subnet.private[*].id
  # => [*] splat: collects IDs from all subnet instances into a list
}
```

**Compute stack `main.tf`** (different Terraform root):

```hcl
data "terraform_remote_state" "networking" {
  # => Reads outputs from the networking stack's state file
  backend = "s3"
  # => Must match the backend type of the source stack

  config = {
    bucket = "my-org-terraform-state"
    key    = "prod/networking/terraform.tfstate"
    # => Path to the networking stack's state file in S3
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"

  subnet_id = data.terraform_remote_state.networking.outputs.private_subnet_ids[0]
  # => data.terraform_remote_state.<NAME>.outputs.<OUTPUT_NAME>
  # => Reads the private_subnet_ids output from the networking stack
  # => [0] picks the first private subnet

  tags = {
    Name  = "app-server"
    VpcId = data.terraform_remote_state.networking.outputs.vpc_id
    # => Also tags instance with VPC ID for easy filtering
  }
}
```

**Key Takeaway**: `terraform_remote_state` accesses only the `outputs` map of another stack's state; the consuming stack has no visibility into the source stack's resources, only its declared outputs, enforcing a clean interface contract.

**Why It Matters**: Cross-stack remote state is the standard pattern in platform engineering for decoupling team ownership boundaries. The networking team owns VPC creation; the compute team consumes the VPC ID via remote state. Changes to the VPC (adding subnets) do not require edits to compute configurations. This decoupling enables separate deployment cadences, separate state lock scopes, and separate access controls — critical properties for organizations running dozens of Terraform stacks in parallel.

---

## Group 14: Ansible Roles

### Example 45: Role Structure and `ansible-galaxy init`

Ansible roles provide a standardized directory structure for grouping tasks, handlers, variables, files, and templates. The `ansible-galaxy init` command scaffolds the full structure.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["roles/webserver/"] --> B["tasks/main.yml<br/>Task list"]
  A --> C["handlers/main.yml<br/>Notification handlers"]
  A --> D["templates/<br/>Jinja2 templates"]
  A --> E["files/<br/>Static files"]
  A --> F["defaults/main.yml<br/>Default variables"]
  A --> G["vars/main.yml<br/>Role variables"]
  A --> H["meta/main.yml<br/>Dependencies"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#CC78BC,stroke:#000,color:#fff
  style E fill:#CA9161,stroke:#000,color:#fff
  style F fill:#DE8F05,stroke:#000,color:#fff
  style G fill:#029E73,stroke:#000,color:#fff
  style H fill:#CC78BC,stroke:#000,color:#fff
```

**`roles/webserver/defaults/main.yml`**:

```yaml
---
# defaults/main.yml: lowest-precedence variables
# => These values are easily overridden by inventory or playbook vars

http_port: 80
# => Default HTTP port; override to 8080 in container environments
https_port: 443
# => Default HTTPS port

document_root: /var/www/html
# => Web root directory; override per virtual host configuration

server_name: localhost
# => Nginx server_name directive value; override in inventory per host
```

**`roles/webserver/tasks/main.yml`**:

```yaml
---
# tasks/main.yml: entry point for the role's task list

- name: Install nginx
  # => Task name shown in ansible-playbook output
  ansible.builtin.package:
    # => ansible.builtin.package: OS-agnostic package installation
    # => Uses yum on RHEL/CentOS, apt on Debian/Ubuntu automatically
    name: nginx
    # => Package name (same across major distros)
    state: present
    # => present: install if missing; latest: always upgrade
  become: true
  # => become: true = sudo privilege escalation for this task

- name: Ensure document root exists
  ansible.builtin.file:
    # => Creates directory if it does not exist
    path: "{{ document_root }}"
    # => Jinja2: reads the defaults/main.yml variable
    state: directory
    # => directory: create as directory; file: create as file; absent: delete
    mode: "0755"
    # => Octal permissions: rwxr-xr-x
  become: true

- name: Deploy nginx configuration
  ansible.builtin.template:
    # => template module: renders Jinja2 template and copies to host
    src: nginx.conf.j2
    # => Relative to roles/webserver/templates/
    dest: /etc/nginx/nginx.conf
    # => Destination on the managed host
    mode: "0644"
    # => File permissions: rw-r--r--
  notify: restart nginx
  # => notify: triggers handler named "restart nginx" if task changed
  become: true
```

**Key Takeaway**: Role structure separates concerns — tasks define WHAT to do, handlers define WHEN to react to changes, templates define HOW to render files, and defaults define sane initial values — making the role independently testable with tools like Molecule.

**Why It Matters**: Roles are the unit of reuse and distribution in Ansible. A well-structured webserver role can be consumed by a playbook in one line, published to Ansible Galaxy for the community, and tested independently. Teams that organize automation as roles rather than monolithic playbooks see significantly faster onboarding for new engineers, because a role's directory structure is a universally understood contract. Ansible Galaxy hosts thousands of roles, enabling companies to skip writing commodity automation.

---

### Example 46: Handlers and Notifications

Handlers are tasks that run once at the end of a play when notified by other tasks. They decouple service restarts from individual configuration changes, preventing multiple restarts when several files change.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
  participant T1 as Task: Deploy config
  participant T2 as Task: Deploy SSL cert
  participant HQ as Handler Queue
  participant H as Handler: restart nginx

  T1->>HQ: notify "restart nginx" (changed)
  T2->>HQ: notify "restart nginx" (changed)
  HQ-->>H: Execute once at end of play
```

**`roles/webserver/handlers/main.yml`**:

```yaml
---
# handlers/main.yml: triggered by notify directives

- name: restart nginx
  # => Handler name must match the string in "notify: restart nginx" exactly
  ansible.builtin.service:
    # => service module manages systemd/init.d services
    name: nginx
    # => Service name as registered with systemd
    state: restarted
    # => restarted: stops then starts (applies config changes)
    # => reloaded: sends SIGHUP (graceful reload, no downtime)
  become: true

- name: reload nginx
  # => Separate handler for graceful reload (no connection drops)
  ansible.builtin.service:
    name: nginx
    state: reloaded
    # => nginx -s reload: validates config then gracefully reloads
  become: true

- name: restart postgresql
  # => Handlers are not limited to the role's primary service
  ansible.builtin.service:
    name: postgresql
    state: restarted
  become: true
```

**Task file using handlers**:

```yaml
---
- name: Deploy nginx main config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    mode: "0644"
  notify: reload nginx
  # => Notifies "reload nginx" handler if this task reports "changed"
  # => If template is already up-to-date, task is "ok" and handler NOT notified
  become: true

- name: Deploy nginx SSL config
  ansible.builtin.template:
    src: ssl.conf.j2
    dest: /etc/nginx/conf.d/ssl.conf
    mode: "0644"
  notify: reload nginx
  # => Both tasks notify the same handler; it runs only once
  become: true
```

**Key Takeaway**: Handlers deduplicate service restarts: no matter how many tasks notify the same handler in a single play run, the handler executes exactly once after all notifying tasks complete, preserving idempotency.

**Why It Matters**: Without handlers, automation scripts restart services after every file change, causing multiple unnecessary downtime windows and making idempotent re-runs disruptive. A role that deploys 10 nginx config files would restart nginx 10 times without handlers versus once with them. Handlers also serve as documentation of the dependency between configuration and service state: reviewers immediately understand that changing `nginx.conf.j2` triggers a reload, preventing silent misconfigurations from sitting unnoticed until the next manual restart.

---

### Example 47: Jinja2 Templates with `ansible.builtin.template`

The `template` module renders Jinja2 template files on the control node and copies the rendered output to the managed host. Templates use `{{ variable }}` for values and `{% %}` for control structures.

**`roles/webserver/templates/nginx.conf.j2`**:

```jinja
# Managed by Ansible — do not edit manually
# Generated: {{ ansible_date_time.iso8601 }}
{# ansible_date_time.iso8601 is a magic variable with current timestamp #}
{# Lines starting with {# are Jinja2 comments; stripped from output #}

user www-data;
worker_processes {{ ansible_processor_vcpus | default(2) }};
{# ansible_processor_vcpus: gathered fact (CPU count) #}
{# | default(2): fallback if fact not gathered (e.g. gather_facts: false) #}

error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections {{ nginx_worker_connections | default(1024) }};
    {# Role variable with default; override in inventory for high-traffic hosts #}
}

http {
    server {
        listen {{ http_port }};
        {# http_port: from role defaults (80) or inventory override #}
        server_name {{ server_name }};
        {# server_name: set per-host in inventory for virtual hosting #}

        root {{ document_root }};
        {# document_root: path to web files on the managed host #}

        {% if enable_ssl | default(false) %}
        {# Jinja2 if block: only renders if enable_ssl is truthy #}
        listen {{ https_port }} ssl;
        ssl_certificate /etc/ssl/certs/{{ server_name }}.crt;
        ssl_certificate_key /etc/ssl/private/{{ server_name }}.key;
        {% endif %}
        {# {% endif %} closes the Jinja2 if block #}
    }
}
```

**Key Takeaway**: Jinja2 templates use `{{ var }}` for variable substitution, `{% if/for %}...{% endif/endfor %}` for logic, and `{# #}` for comments that disappear from the rendered output; filters like `| default(value)` provide fallbacks for optional variables.

**Why It Matters**: Templates are how Ansible turns a single generic configuration file into host-specific configurations. Without templates, teams either maintain separate config files per server (unmanageable at scale) or write brittle `lineinfile` tasks that cannot handle conditional sections. A well-written template generates an nginx config for a single-HTTP server in dev, an SSL-enabled virtual-host server in staging, and a high-concurrency tuned config in prod — all from one template file and inventory variables.

---

### Example 48: Ansible Vault for Secrets Management

Ansible Vault encrypts sensitive variables (passwords, API keys, TLS certificates) within YAML files using AES-256-CBC. Encrypted files are safe to commit to version control.

```yaml
# Creating and using vault-encrypted variables

# Step 1: Create an encrypted variable file
# ansible-vault create group_vars/prod/vault.yml
# => Opens $EDITOR with an empty file; save to encrypt
# => Prompts for vault password

# Step 2: Contents of vault.yml (before encryption)
---
vault_db_password: "s3cr3t-production-password"
# => vault_ prefix convention: marks variables as vault-sourced
# => Plain text only visible during edit; stored encrypted

vault_api_key: "sk-prod-abc123xyz789"
# => API key for external service integration

vault_ssl_private_key: |
  -----BEGIN RSA PRIVATE KEY-----
  MIIEowIBAAKCAQEA...
  -----END RSA PRIVATE KEY-----
  # => Multiline string (|): literal block scalar in YAML
  # => Private key stored encrypted in version control
```

**`group_vars/prod/vars.yml`** (plain text, references vault vars):

```yaml
---
# Plain variable file references vault variables
db_password: "{{ vault_db_password }}"
# => Indirection: exposes vault variable under an environment-agnostic name
# => Playbook uses db_password; actual value comes from vault

api_key: "{{ vault_api_key }}"
# => Same pattern for API keys

db_host: "prod-db.internal.example.com"
# => Non-sensitive values stay in plain vars file
db_port: 5432
# => Mixing vault and plain vars in same directory is intentional
```

**Playbook using vault variables**:

```yaml
---
- name: Configure application database
  hosts: app_servers
  vars_files:
    - group_vars/prod/vars.yml
    # => Loads both plain vars and vault vars (Ansible merges them)
    - group_vars/prod/vault.yml
    # => Vault file decrypted at runtime using --vault-password-file or prompt

  tasks:
    - name: Write application config
      ansible.builtin.template:
        src: app_config.j2
        dest: /etc/app/config.yml
        mode: "0600"
        # => 0600: rw------- (owner read/write only; secret file)
      no_log: true
      # => no_log: true prevents task output from logging secret values
      # => Critical for tasks that handle passwords or private keys
```

**Key Takeaway**: Vault encrypts the YAML file at rest and in version control; Ansible decrypts at runtime using a vault password provided via `--vault-password-file`, `--ask-vault-pass`, or the `ANSIBLE_VAULT_PASSWORD_FILE` environment variable.

**Why It Matters**: Storing secrets in plain text in Git repositories is the most common cause of credential leaks, frequently discovered through GitHub secret scanning alerts. Ansible Vault solves this by making encryption the default workflow for secrets — the encrypted file is committed, the vault password is stored separately in a secret manager (AWS Secrets Manager, HashiCorp Vault) and injected at CI runtime. Teams using Vault alongside `no_log: true` satisfy SOC 2 access control requirements for secrets handling without adopting a separate secrets management tool.

---

## Group 15: Ansible Control Flow

### Example 49: Conditionals with `when`

The `when` directive skips a task when its Jinja2 expression evaluates to false. Conditionals gate tasks on gathered facts (OS family, distribution version), variables, or previous task results.

```yaml
---
- name: OS-aware package installation
  hosts: all
  gather_facts: true
  # => gather_facts: true (default): collects ansible_os_family, ansible_distribution, etc.

  tasks:
    - name: Install nginx on Debian-family systems
      ansible.builtin.apt:
        # => apt module: Debian/Ubuntu package manager
        name: nginx
        state: present
        update_cache: true
        # => update_cache: runs "apt update" before installing
      when: ansible_os_family == "Debian"
      # => when: skips task if os family is not Debian
      # => ansible_os_family is a gathered fact: "Debian", "RedHat", "Suse", etc.
      become: true

    - name: Install nginx on RedHat-family systems
      ansible.builtin.dnf:
        # => dnf module: RHEL 8+/Fedora package manager
        name: nginx
        state: present
      when: ansible_os_family == "RedHat"
      # => Only runs on RHEL/CentOS/Fedora/Amazon Linux
      become: true

    - name: Enable TLS only on production
      ansible.builtin.template:
        src: ssl.conf.j2
        dest: /etc/nginx/conf.d/ssl.conf
      when:
        # => List of conditions: ALL must be true (logical AND)
        - ansible_os_family == "Debian"
        # => Only on Debian systems
        - environment == "prod"
        # => Only in production environment variable
        - ssl_enabled | default(false)
        # => Only when ssl_enabled is explicitly set true
      become: true

    - name: Skip on unsupported distribution
      ansible.builtin.debug:
        msg: "Skipping: {{ ansible_distribution }} not supported"
        # => ansible_distribution: "Ubuntu", "CentOS", "Amazon", etc.
      when: ansible_distribution not in ["Ubuntu", "CentOS", "Amazon"]
      # => not in: boolean NOT membership test
```

**Key Takeaway**: A list of `when` conditions applies logical AND (all must be true); use `or` explicitly in a single condition string for OR logic; `when` conditions are Jinja2 expressions but without the `{{ }}` delimiters.

**Why It Matters**: Heterogeneous server fleets are the norm in organizations running a mix of Ubuntu LTS, Amazon Linux, and RHEL. Without `when` conditionals, separate playbooks per OS family proliferate, creating maintenance debt. A single playbook with conditional package managers handles the full fleet, and adding support for a new OS requires one new `when` clause rather than a new playbook. The `when` directive also gates irreversible operations (data migrations, disk formatting) on safety checks, preventing accidental execution in the wrong environment.

---

### Example 50: Loops with `loop` and `with_items`

The `loop` directive repeats a task over a list of items, replacing repetitive task definitions. `loop` supersedes the older `with_items` directive with identical semantics but Jinja2 filter support.

```yaml
---
- name: User and directory management
  hosts: all
  become: true

  vars:
    app_users:
      # => List of user objects to create
      - name: deploy
        groups: www-data
        # => Secondary group membership
        shell: /bin/bash
      - name: monitor
        groups: adm
        shell: /usr/sbin/nologin
        # => No-login shell for service accounts
      - name: backup
        groups: backup
        shell: /usr/sbin/nologin

    log_directories:
      # => List of directories to create with permissions
      - path: /var/log/app
        mode: "0755"
      - path: /var/log/app/errors
        mode: "0750"
        # => Restricted: owner and group only
      - path: /var/log/app/access
        mode: "0755"

  tasks:
    - name: Create application users
      ansible.builtin.user:
        # => user module manages Linux user accounts
        name: "{{ item.name }}"
        # => item: current loop element (the user object)
        # => item.name: accesses the "name" key of the dict
        groups: "{{ item.groups }}"
        shell: "{{ item.shell }}"
        state: present
        # => present: create if missing; absent: delete
      loop: "{{ app_users }}"
      # => loop: iterates over the app_users list
      # => Each iteration: item = { name: "deploy", groups: "www-data", ... }

    - name: Create log directories
      ansible.builtin.file:
        path: "{{ item.path }}"
        # => item.path from the log_directories list
        state: directory
        mode: "{{ item.mode }}"
        # => item.mode from the list; per-directory permissions
        owner: root
        group: root
      loop: "{{ log_directories }}"
      # => loop: one task execution per log directory

    - name: Install required packages
      ansible.builtin.package:
        name: "{{ item }}"
        # => item: plain string when looping over a simple list
        state: present
      loop:
        # => Inline list: alternative to vars for short lists
        - curl
        - jq
        - htop
        - git
```

**Key Takeaway**: `loop` with a list of objects accesses attributes via `item.key`; with a plain list it accesses the value directly via `item`; add `loop_control.label: "{{ item.name }}"` to customize verbose output when looping over complex objects.

**Why It Matters**: Creating 20 users, 15 directories, or 30 firewall rules as individual tasks produces unreadable playbooks that break when requirements change. Loops reduce N tasks to 1 task plus a YAML list, making additions and removals a one-line YAML edit rather than a new task block. The loop variable also enables `when` conditions inside the loop (`when: item.name != "root"`), combining iteration and conditional logic for nuanced configuration policies.

---

## Group 16: Multi-Environment Patterns

### Example 51: Directory Layout for Multi-Environment Terraform

Production Terraform projects separate environments into distinct root modules sharing modules as libraries. This structure gives each environment its own state file, variables, and apply cadence.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  A["infrastructure/"] --> B["modules/<br/>Shared modules"]
  A --> C["environments/dev/"]
  A --> D["environments/staging/"]
  A --> E["environments/prod/"]
  C --> B
  D --> B
  E --> B

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#029E73,stroke:#000,color:#fff
  style C fill:#DE8F05,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#DE8F05,stroke:#000,color:#fff
```

**Directory structure (not HCL)**:

```
infrastructure/
├── modules/
│   ├── network/       # => Shared VPC, subnets, routing module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── compute/       # => Shared EC2/ECS compute module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf        # => Calls shared modules
│   │   ├── terraform.tfvars  # => Dev-specific variable values
│   │   └── backend.tf     # => Dev-specific remote state config
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
```

**`environments/prod/main.tf`**:

```hcl
module "network" {
  source = "../../modules/network"
  # => Relative path to shared module
  # => Both dev and prod call this same module

  vpc_cidr    = var.vpc_cidr
  # => var.vpc_cidr comes from environments/prod/terraform.tfvars
  environment = "prod"
}

module "compute" {
  source = "../../modules/compute"
  vpc_id      = module.network.vpc_id
  # => Cross-module reference: compute consumes network output
  instance_type = var.instance_type
  # => prod instance_type = "t3.large" (from terraform.tfvars)
  environment = "prod"
}
```

**`environments/prod/terraform.tfvars`**:

```hcl
vpc_cidr      = "10.2.0.0/16"
# => Prod VPC CIDR: separate address space from dev (10.0.0.0/16)
instance_type = "t3.large"
# => Production-sized instances
min_capacity  = 3
# => Auto-scaling minimum: 3 instances for HA in prod
max_capacity  = 20
```

**Key Takeaway**: Separate root modules per environment give each environment independent state, independent applies, and independent variable files; shared modules prevent code duplication while environment-specific `terraform.tfvars` files control sizing and feature flags.

**Why It Matters**: Teams that use a single root module with workspaces for all environments discover that a mistyped workspace name can apply production changes to dev or vice versa. Separate directories with separate CI pipeline jobs eliminate this risk by making environment targeting explicit at the pipeline configuration level. The clear directory hierarchy also makes onboarding faster — new engineers can navigate to `environments/dev/` and understand the scope of a change without parsing workspace logic.

---

### Example 52: Ansible Inventory for Multi-Environment Targets

Ansible inventory defines which hosts belong to which groups. Directory-based inventory with `group_vars` and `host_vars` enables per-environment and per-host variable overrides with predictable precedence.

**Directory inventory structure**:

```
ansible/
├── inventories/
│   ├── dev/
│   │   ├── hosts.yml          # => Dev host definitions
│   │   └── group_vars/
│   │       ├── all.yml        # => Variables for all dev hosts
│   │       └── webservers.yml # => Variables for webserver group
│   └── prod/
│       ├── hosts.yml          # => Prod host definitions
│       └── group_vars/
│           ├── all.yml        # => Variables for all prod hosts
│           └── webservers.yml # => Different values for prod
├── roles/
│   └── webserver/
└── site.yml                   # => Master playbook
```

**`inventories/prod/hosts.yml`**:

```yaml
---
all:
  # => all: top-level group; every host is implicitly a member
  children:
    # => children: nested group definitions
    webservers:
      # => Group name used in playbook "hosts:" directive
      hosts:
        web-prod-01.example.com:
          # => Hostname or IP; becomes ansible_host if it resolves
          ansible_user: ec2-user
          # => SSH user for this specific host (host_var)
        web-prod-02.example.com:
          ansible_user: ec2-user
        web-prod-03.example.com:
          ansible_user: ec2-user
    databases:
      hosts:
        db-prod-01.example.com:
          ansible_user: ec2-user
          ansible_port: 2222
          # => Non-standard SSH port for database servers
```

**`inventories/prod/group_vars/webservers.yml`**:

```yaml
---
# Variables applied to all hosts in the "webservers" group
# in the PROD inventory (overrides dev inventory group_vars)

environment: prod
# => Used in role templates and conditionals

http_port: 80
https_port: 443
enable_ssl: true
# => SSL enabled in prod; disabled in dev inventory equivalent

nginx_worker_connections: 4096
# => Higher limit for prod traffic; dev uses default (1024)

document_root: /var/www/html
server_name: www.example.com
# => Production domain name
```

**Key Takeaway**: Ansible applies variables in precedence order from lowest (role defaults) to highest (extra vars via `-e`); directory inventory with `group_vars/<group>.yml` files at the inventory directory level applies group variables specific to that inventory, enabling clean environment separation without playbook changes.

**Why It Matters**: Multi-environment inventory management is where Ansible projects either succeed or devolve into unmaintainable spaghetti. The directory-per-inventory pattern makes `ansible-playbook -i inventories/prod site.yml` explicitly target production, with no ambiguity. A merged flat inventory with environment variables causes accidental production changes during dev testing. Separate inventories also enable separate CI pipelines: dev pipeline uses `inventories/dev`, prod pipeline requires approval and uses `inventories/prod`.

---

### Example 53: Ansible Conditionals with Registered Variables

The `register` directive captures a task's result into a variable for later use in `when` conditions, `debug` output, and subsequent task logic, enabling adaptive playbooks that respond to the current state of managed systems.

```yaml
---
- name: Adaptive service management
  hosts: webservers
  become: true

  tasks:
    - name: Check if nginx config is valid
      ansible.builtin.command:
        cmd: nginx -t
        # => nginx -t: tests configuration syntax without reloading
      register: nginx_config_test
      # => register: stores the task result in variable "nginx_config_test"
      # => nginx_config_test.rc: return code (0 = valid, 1 = invalid)
      # => nginx_config_test.stderr: nginx -t writes output to stderr
      changed_when: false
      # => This task only reads config; never reports "changed"
      failed_when: false
      # => failed_when: false prevents play abort on non-zero rc
      # => We handle the failure ourselves in the next task

    - name: Display nginx config errors
      ansible.builtin.debug:
        msg: "nginx config error: {{ nginx_config_test.stderr }}"
        # => .stderr: captures nginx -t error output (e.g. "unknown directive")
      when: nginx_config_test.rc != 0
      # => Only shows error when nginx -t exited non-zero

    - name: Reload nginx if config is valid
      ansible.builtin.service:
        name: nginx
        state: reloaded
      when: nginx_config_test.rc == 0
      # => Only reloads when config test passed
      # => Prevents reloading with broken config (nginx would reject it anyway)

    - name: Check if application process is running
      ansible.builtin.command:
        cmd: pgrep -f myapp
        # => pgrep -f: searches full command line, returns PIDs
      register: app_running
      # => app_running.rc: 0 if process found, 1 if not found
      changed_when: false
      failed_when: false

    - name: Start application if not running
      ansible.builtin.service:
        name: myapp
        state: started
      when: app_running.rc != 0
      # => Only starts app if pgrep returned non-zero (process not found)
```

**Key Takeaway**: Registered variables expose `.rc` (return code), `.stdout`, `.stderr`, `.stdout_lines` (list), and `.failed` (boolean) attributes; use `failed_when: false` with `register` to inspect exit codes manually rather than letting Ansible fail the play automatically.

**Why It Matters**: Idempotent automation requires knowing what state a system is already in before deciding what to do. Without `register`, playbooks blindly apply changes and restart services even when nothing changed, causing unnecessary downtime. The `register` + `when` pattern implements check-then-act logic: validate nginx config before reloading (prevents outages from bad configs), verify process state before starting (avoids double-start errors), check disk space before writing large files. This pattern turns Ansible from a command runner into a state machine.

---

## Group 17: Advanced Terraform Patterns

### Example 54: `for` Expressions and Collection Transformations

Terraform `for` expressions transform maps and lists into new collections, enabling data shaping between variable inputs and resource configurations without external tooling.

```hcl
variable "instances" {
  # => Input: map of instance names to their configuration objects
  description = "Map of instance name to configuration"
  type = map(object({
    instance_type = string
    environment   = string
  }))
  default = {
    "web-1" = { instance_type = "t3.micro",  environment = "dev" }
    "web-2" = { instance_type = "t3.small",  environment = "staging" }
    "api-1" = { instance_type = "t3.medium", environment = "prod" }
  }
}

locals {
  # => locals: computed values derived from inputs

  # Transform: keep only prod instances
  prod_instances = {
    for k, v in var.instances :
    # => for k, v in <map>: iterates with key k and value v
    k => v
    # => k => v: output key => output value
    if v.environment == "prod"
    # => if filter: only include elements where condition is true
    # => Result: { "api-1" = { instance_type = "t3.medium", environment = "prod" } }
  }

  # Transform: extract just the instance type values as a map
  instance_type_map = {
    for k, v in var.instances : k => v.instance_type
    # => Produces: { "web-1" = "t3.micro", "web-2" = "t3.small", "api-1" = "t3.medium" }
  }

  # Transform: list of unique environments
  environments = toset([
    for k, v in var.instances : v.environment
    # => [] list for expression: collects environment values
    # => toset(): deduplicates to unique values
    # => Result: toset(["dev", "staging", "prod"])
  ])
}

resource "aws_instance" "servers" {
  # => for_each over prod_instances map creates only prod resources
  for_each      = local.prod_instances
  ami           = "ami-0c02fb55956c7d316"
  instance_type = each.value.instance_type
  # => each.value accesses the object for this iteration

  tags = {
    Name        = each.key
    Environment = each.value.environment
  }
}

output "prod_instance_ids" {
  # => Output: map of prod instance names to IDs
  value = { for k, v in aws_instance.servers : k => v.id }
  # => for expression over resource: transforms resource map to ID map
}
```

**Key Takeaway**: Terraform `for` expressions follow the pattern `[for item in list : transform]` for lists and `{for k, v in map : key => value if condition}` for maps; the optional `if` clause filters elements before transformation.

**Why It Matters**: Configuration data often arrives in one shape (a flat list from a YAML file) and needs to be consumed in another shape (a map keyed by identifier for `for_each`). Without `for` expressions, teams write external Python scripts or preprocessing steps to reshape data before passing it to Terraform. Inline `for` expressions keep transformation logic inside the configuration, visible in `terraform plan`, and subject to the same version control and review processes as the rest of the infrastructure code.

---

### Example 55: `locals` for Expression Reuse and Complexity Management

The `locals` block defines named computed values within a configuration. Locals reduce repetition, name complex expressions for readability, and centralize values that appear in multiple resources.

```hcl
variable "project"     { type = string; default = "myapp" }
variable "environment" { type = string; default = "prod" }
variable "region"      { type = string; default = "us-east-1" }

locals {
  # => locals block: computed once, referenced multiple times

  # Name prefix used by all resources
  name_prefix = "${var.project}-${var.environment}"
  # => "myapp-prod"; avoid repeating interpolation in every resource

  # Common tags applied to all resources
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Region      = var.region
    ManagedBy   = "terraform"
    # => ManagedBy tag: identifies Terraform-managed resources in console
  }

  # Computed: region-to-AMI mapping (avoids hard-coding region-specific AMIs)
  ami_ids = {
    "us-east-1" = "ami-0c02fb55956c7d316"
    # => US East: Amazon Linux 2 AMI
    "us-west-2" = "ami-0ceecbb0f30a902a6"
    # => US West: Amazon Linux 2 AMI (different ID per region)
    "eu-west-1" = "ami-07d9160fa81ccffb5"
    # => EU West: Amazon Linux 2 AMI
  }

  # Lookup: select AMI for the current region
  current_ami = local.ami_ids[var.region]
  # => Fails at plan time if var.region not in the map (index error)
  # => Safer: lookup(local.ami_ids, var.region, "ami-default")
}

resource "aws_instance" "app" {
  ami           = local.current_ami
  # => local.current_ami: resolved AMI for the current region
  instance_type = "t3.small"

  tags = merge(local.common_tags, {
    # => merge(): combines two maps; second map wins on key conflict
    Name = "${local.name_prefix}-app"
    # => "myapp-prod-app"
    Role = "application"
    # => Resource-specific tag merged with common tags
  })
}

resource "aws_security_group" "app" {
  name = "${local.name_prefix}-sg"
  # => Reuses name_prefix: "myapp-prod-sg"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg"
    Role = "security"
  })
}
```

**Key Takeaway**: Locals are evaluated once and cached during a plan/apply run; they can reference other locals (Terraform resolves dependencies automatically) but cannot reference resources or data sources that haven't been read yet.

**Why It Matters**: The `common_tags` local pattern is ubiquitous in Terraform codebases because consistent resource tagging is mandatory for cost allocation, compliance auditing, and auto-remediation. Without a `locals` block, teams either copy the tags map into every resource (40 resources × 6 tags = 240 lines of duplication) or accept inconsistent tagging when someone adds a resource and forgets to copy the tags. Centralizing tags in `local.common_tags` means adding a new required tag is a one-line change that propagates to all resources automatically.

---

### Example 56: `depends_on` for Explicit Dependency Management

Terraform automatically detects dependencies from attribute references, but some dependencies are invisible to its graph — particularly IAM policy propagation delays and cross-resource ordering requirements. `depends_on` makes these explicit.

```hcl
resource "aws_iam_role" "lambda_exec" {
  # => IAM role that the Lambda function will assume
  name = "myapp-lambda-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  # => jsonencode(): converts HCL object to JSON string
  # => IAM policies must be JSON strings, not HCL objects
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  # => Attaches AWS-managed policy for CloudWatch logging
  role       = aws_iam_role.lambda_exec.name
  # => Implicit dependency: reads role name from the role resource
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "app" {
  # => Lambda function that needs the IAM role with policies attached
  function_name = "myapp-handler"
  role          = aws_iam_role.lambda_exec.arn
  # => Implicit dependency on the role (reads the ARN)
  # => BUT: Terraform might create Lambda before policy attachment propagates in IAM
  # =>  IAM changes take 5-10 seconds to propagate globally in AWS

  filename      = "function.zip"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    # => Explicit dependency: wait for policy attachment before creating Lambda
    # => Without this, Lambda creation races with IAM propagation
    # => apply may succeed but first invocation fails with permission denied
  ]
}
```

**Key Takeaway**: Use `depends_on` only when Terraform cannot detect the dependency from attribute references — IAM propagation delays, cross-stack ordering, and service initialization windows are the primary cases; overusing `depends_on` serializes the apply graph and slows deployments.

**Why It Matters**: IAM propagation race conditions are among the most frustrating Terraform bugs because they are intermittent: apply succeeds 9 times in 10 but fails during a critical deployment. The `depends_on` pattern on Lambda-to-IAM-policy-attachment is a standard fix documented in AWS Terraform provider notes. Explicit dependencies also serve as documentation: a future engineer reading the configuration immediately understands why Lambda creation waits for the policy attachment rather than assuming it is an oversight. Tracking these ordering requirements in code prevents subtle production incidents.

---

### Example 57: `moved` Block for State Refactoring Without Destroy

The `moved` block tells Terraform that a resource has been renamed or moved to a module without destroying and recreating it. It is the safe migration path for state refactoring.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["Old state address<br/>aws_instance.web_server"] -->|"moved block"| B["New state address<br/>module.compute.aws_instance.app"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#029E73,stroke:#000,color:#fff
```

**Before refactoring** (old `main.tf`):

```hcl
# Old structure: resource at root level
resource "aws_instance" "web_server" {
  # => State address: aws_instance.web_server
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"
  tags = { Name = "web-server" }
}
```

**After refactoring** (new `main.tf` with `moved` block):

```hcl
# New structure: resource now inside a module
module "compute" {
  source = "./modules/compute"
  # => Resource is now at: module.compute.aws_instance.app
}

moved {
  from = aws_instance.web_server
  # => The old state address (before refactoring)
  to   = module.compute.aws_instance.app
  # => The new state address (after moving into module)
  # => Terraform updates state file to new address
  # => No destroy/create cycle; EC2 instance continues running
}
```

**`modules/compute/main.tf`** (new module):

```hcl
resource "aws_instance" "app" {
  # => New name inside module: "app" (was "web_server")
  # => moved block maps old address to this new address
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.small"
  tags = { Name = "web-server" }
  # => Tags unchanged: ensures no resource recreation
}
```

**Key Takeaway**: The `moved` block only updates Terraform state; it does not modify the actual infrastructure — if `from` and `to` resources have different configurations, Terraform will plan an in-place update or replacement after the state migration.

**Why It Matters**: Infrastructure refactoring — moving resources into modules, renaming for convention compliance, reorganizing root modules — is a routine maintenance activity. Without `moved` blocks, refactoring requires `terraform state mv` CLI commands that are error-prone, not version-controlled, and require console access. The `moved` block puts refactoring intent into code, making it reviewable in pull requests, repeatable across environments, and safe for team members who apply the change without knowing the old state addresses. It eliminates the most common source of unintended infrastructure replacements during configuration cleanup.
