---
title: "Beginner"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000001
description: "Examples 1-28: Terraform fundamentals covering HCL syntax, providers, resources, variables, data sources, and state management basics (0-40% coverage)"
tags: ["terraform", "tutorial", "by-example", "beginner", "hcl", "providers", "resources", "iac"]
---

Learn Terraform fundamentals through 28 annotated code examples. Each example is self-contained, runnable, and heavily commented to show what each line does, expected outputs, and key takeaways.

## Group 1: Hello World & Installation

### Example 1: Hello World - Minimal Configuration

Terraform configurations are HCL files describing infrastructure resources. Every configuration needs a provider block and at least one resource. This minimal example demonstrates Terraform execution flow without creating real cloud resources.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["main.tf<br/>Configuration"] --> B["terraform init<br/>Download Providers"]
 B --> C["terraform plan<br/>Preview Changes"]
 C --> D["terraform apply<br/>Create Resources"]
 D --> E["terraform.tfstate<br/>State File"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CA9161,color:#fff
```

**Code**:

```hcl
# main.tf
# => Single file Terraform configuration (convention: main.tf)
terraform {
 # => terraform block configures Terraform behavior and requirements
 required_version = ">= 1.0" # => Minimum Terraform version required
 # => Blocks older versions from running this configuration
 # => Ensures version 1.0+ features available
}

# Local provider for testing (no cloud credentials needed)
provider "local" {
 # => Provider block initializes the local provider for file operations
 # => Local provider enables testing without cloud accounts
 # => No configuration arguments needed for local provider
}

# Create a local file resource
resource "local_file" "hello" {
 # => resource block defines infrastructure component to manage
 # => "local_file" is resource type, "hello" is resource name
 # => path.module is the current module directory path
 filename = "${path.module}/hello.txt" # => path.module resolves to directory containing this .tf file
 # => ${} interpolation syntax embeds expressions in strings
 content = "Hello, Terraform!" # => File content to write
 # => terraform plan shows: +local_file.hello (will be created)
 # => terraform apply creates hello.txt in current directory
 # => State tracks filename, content, and file permissions
}

# Output the file path
output "file_path" {
 # => output block exposes values after terraform apply
 value = local_file.hello.filename # => Reference resource attribute
 # => Dot notation: resource_type.resource_name.attribute
 # => Output: file_path = "./hello.txt"
 # => Outputs appear after terraform apply completes
}
```

**Run**:

```bash
# $ terraform init # => Downloads local provider plugin
# $ terraform plan # => Shows: Plan: 1 to add, 0 to change, 0 to destroy
# $ terraform apply # => Prompts for confirmation, creates hello.txt
# $ cat hello.txt # => Hello, Terraform!
# $ terraform destroy # => Removes hello.txt
```

**Key Takeaway**: Terraform workflow is init → plan → apply → destroy. The `terraform plan` command is critical for previewing changes before applying them. Always review the plan output before running apply in production.

**Why It Matters**: Terraform's plan/apply workflow prevents the production disasters common with manual console changes (ClickOps). This safety mechanism, combined with version-controlled HCL, makes infrastructure changes as safe and reviewable as application code, preventing the "works on my machine" problems that plague manual provisioning. Teams using this workflow reduce unplanned outages by treating every infrastructure change as a code review.

---

### Example 2: Terraform CLI Basics

Understanding Terraform CLI commands enables effective infrastructure management. Each command serves a specific purpose in the Terraform workflow.

**Code**:

```hcl
# version_check.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version

 required_providers {
 # => Provider configuration
 local = { # => Map/object definition
 source = "hashicorp/local" # => Provider source address
 # => Sets source
 version = "~> 2.0" # => Allow patch updates (2.0.x)
 # => Sets version
 }
 }
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "demo" {
# => Resource definition
 filename = "demo.txt" # => String value
 # => Sets filename
 content = "Terraform version: ${terraform.version}" # => Built-in variable
 # => Sets content
}





```

**CLI Commands**:

```bash
# Display Terraform version
# $ terraform version
# => Terraform v1.9.0 on darwin_amd64

# Format HCL files to canonical style
# $ terraform fmt
# => Rewrites .tf files with consistent formatting

# Validate configuration syntax
# $ terraform validate
# => Success! The configuration is valid.

# Show current state
# $ terraform show
# => Displays resources in state file

# List resources in state
# $ terraform state list
# => local_file.demo

# Output values
# $ terraform output
# => Shows all output values from configuration

# Generate dependency graph
# $ terraform graph | dot -Tpng > graph.png
# => Creates visual dependency graph (requires graphviz)


```

**Key Takeaway**: Use `terraform fmt` before commits to maintain consistent formatting. Use `terraform validate` to catch syntax errors early. Use `terraform show` and `state list` to inspect infrastructure state without modifying resources.

**Why It Matters**: Terraform's CLI commands enable safe infrastructure inspection without AWS console access—critical when managing thousands of resources across multiple accounts. The `terraform validate` command catches syntax errors before cloud API calls, preventing failed deployments that waste time and money. The `terraform fmt` command enforces consistent style across teams, making code reviews as straightforward as application code reviews, supporting the Infrastructure as Code principle that infrastructure should have the same quality standards as software.

---

## Group 2: HCL Syntax Basics

### Example 3: HCL Block Types

HCL (HashiCorp Configuration Language) has four main block types: terraform, provider, resource, and data. Understanding block structure is fundamental to writing Terraform configurations.

**Code**:

```hcl
# hcl_blocks.tf

# Terraform block - configuration settings
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => Constraint on Terraform binary version
 # => Sets required_version

 required_providers { # => Provider dependencies
 # => Sets required_providers { #
 local = { # => Map/object definition
 source = "hashicorp/local" # => String value
 # => Provider source location
 version = "~> 2.0" # => String value
 # => Sets version
 }
 }

 backend "local" { # => State storage backend
 # => Sets backend "local" { #
 path = "terraform.tfstate" # => Local file backend (default)
 # => Sets path
 }
}

# Provider block - provider configuration
provider "local" {
# => Provider configuration
 # => No arguments needed for local provider
 # => Other providers require credentials, regions, etc.
}

# Resource block - infrastructure component
resource "local_file" "example" { # => resource type = local_file
# => Sets resource "local_file" "example" { #
 filename = "example.txt" # => resource name = example
 # => Sets filename
 content = "Block syntax example" # => Argument: content
 # => Sets content

 file_permission = "0644" # => Argument: permissions
 # => Full identifier: local_file.example
}

# Data source block - query existing resources
data "local_file" "existing" {
# => Data source
 filename = "example.txt" # => Read existing file
 # => Data sources don't create resources, only read
 # => Full identifier: data.local_file.existing
}

# Output block - expose values
output "file_content" {
# => Output value
 value = data.local_file.existing.content # => Reference data source
 # => Sets value
 description = "Content of the example file" # => Optional description
 # => Shown after terraform apply
}

```

**Key Takeaway**: HCL blocks follow pattern `block_type "label1" "label2" { arguments }`. Resources have two labels (type and name), data sources have two labels, providers have one label. Use dot notation to reference blocks: `resource_type.name.attribute`.

**Why It Matters**: HCL's declarative block syntax makes infrastructure configuration readable by non-programmers, unlike imperative shell scripts that require programming expertise. This enables collaboration between infrastructure teams, security teams, and auditors—all can review Terraform code and understand "what will be created" without decoding complex logic. The consistent block structure across all providers (AWS, Azure, GCP, Kubernetes) means learning Terraform once enables managing any infrastructure, avoiding vendor-specific scripting languages that lock teams into single clouds.

---

### Example 4: HCL Data Types and Expressions

HCL supports multiple data types: strings, numbers, booleans, lists, maps, and objects. Expressions enable dynamic values through interpolation, functions, and operators.

**Code**:

```hcl
# data_types.tf
terraform {
# => Terraform configuration block
# => Controls Terraform behavior and requirements
 required_version = ">= 1.0" # => String value
 # => Sets required_version constraint
 # => Validates Terraform binary version before execution
}

provider "local" {}
# => Local provider for file-based examples
# => Initializes local provider (no arguments needed)

# Local values - reusable expressions
locals {
# => locals block defines computed values for reuse
# => Local values available as local.name throughout configuration
 # Primitive types
 string_value = "hello" # => String type
 # => Sets string_value to "hello"
 number_value = 42 # => Number type (int or float)
 # => Sets number_value
 bool_value = true # => Boolean type
 # => Sets bool_value

 # Collection types
 list_value = ["item1", "item2", "item3"] # => List (ordered)
 # => Sets list_value
 map_value = { key1 = "value1", key2 = "value2" } # => Map (key-value)
 # => Sets map_value
 set_value = toset(["a", "b", "c"]) # => Set (unique, unordered)
 # => Sets set_value

 # Object type (structured)
 object_value = { # => Map/object definition
 name = "example" # => String value
 # => Sets name
 port = 8080 # => Numeric value
 # => Sets port
 enabled = true # => Boolean value
 # => Sets enabled
 }

 # String interpolation
 interpolated = "Value is ${local.number_value}" # => "Value is 42"
 # => Sets interpolated

 # String template with directives
 template = <<-EOT
 # => Sets template
 Name: ${local.object_value.name}
 # => Terraform configuration
 Port: ${local.object_value.port}
 # => Terraform configuration
 EOT
 # => Multi-line string with interpolation

 # Conditional expression
 conditional = local.bool_value ? "yes" : "no" # => Ternary operator
 # => Sets conditional

 # Arithmetic operations
 arithmetic = local.number_value * 2 + 10 # => 42 * 2 + 10 = 94
 # => Sets arithmetic

 # String operations
 uppercase = upper(local.string_value) # => "HELLO"
 # => Sets uppercase
 concatenated = "${local.string_value}-world" # => "hello-world"
 # => Sets concatenated

 # List operations
 first_item = local.list_value[0] # => "item1" (index access)
 # => Sets first_item
 list_length = length(local.list_value) # => 3
 # => Sets list_length

 # Map operations
 map_lookup = local.map_value["key1"] # => "value1" (key access)
 # => Sets map_lookup
}

resource "local_file" "types_demo" {
# => Resource definition
 filename = "types.txt"
 # => Output file path
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 String: ${local.string_value}
 # => Terraform configuration
 Number: ${local.number_value}
 # => Terraform configuration
 Boolean: ${local.bool_value}
 # => Terraform configuration
 List: ${join(", ", local.list_value)}
 # => Terraform configuration
 Conditional: ${local.conditional}
 # => Terraform configuration
 Arithmetic: ${local.arithmetic}
 # => Terraform configuration
 EOT
 # => Terraform configuration
}

output "demonstrations" {
# => Output value
 value = {
 # => Output value
 interpolated = local.interpolated
 # => Sets interpolated
 uppercase = local.uppercase
 # => Sets uppercase
 list_length = local.list_length
 # => Sets list_length
 first_item = local.first_item
 # => Sets first_item
 }
 # => Shows all computed values
}






```

**Key Takeaway**: Use `locals` block for computed values shared across configuration. Use `${}` for string interpolation. HCL supports rich expressions including conditionals, arithmetic, and built-in functions. Reference built-in functions at terraform.io/language/functions.

**Why It Matters**: HCL's data types and expressions eliminate the need for external scripting languages (Python, Bash) to generate configuration. This keeps infrastructure logic in one place where Terraform's plan command can validate it, instead of scattered across shell scripts that might fail mid-deployment without safety checks. Centralized configuration also simplifies auditing and compliance reviews.

---

### Example 5: Comments and Documentation

Proper documentation through comments and descriptions makes Terraform configurations maintainable. HCL supports single-line and multi-line comments.

**Code**:

```hcl
# comments.tf
# => File name demonstrates comment and documentation patterns

# Single-line comment using hash
# => Hash-style comment (most common in HCL)
// Single-line comment using double-slash (both valid)
// => Slash-style comment (alternative syntax)

/*
# => Terraform configuration
 Multi-line comment
 # => Terraform configuration
 using C-style syntax
 # => Terraform configuration
 spans multiple lines
 # => Terraform configuration
*/
# => Multi-line comment block for documentation sections

terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # Inline comment
 # => Minimum Terraform version
 # => Sets required_version
 # => Inline comment appears after code on same line
}

provider "local" {}
# => Local provider for file-based examples

# Resource with documentation
resource "local_file" "documented" {
# => Resource definition for documented file
 filename = "documented.txt" # => String value
 # => Sets filename
 # => Creates file in current directory
 content = "Well-documented configuration" # => String value
 # => Sets content
 # => File contents written to documented.txt

 # File permissions in octal notation
 file_permission = "0644" # rw-r--r-- (owner: rw, group: r, other: r)
 # => Sets file_permission in octal format
 # => 0644: owner read/write, group read, other read
}

# Variable with description
variable "environment" {
# => Input variable for environment name
 description = <<-EOT
 # => Human-readable description
 # => Sets description using heredoc syntax
 Environment name for resource tagging.
 # => Terraform configuration
 Valid values: development, staging, production
 # => Terraform configuration
 EOT
 # => Multi-line description appears in terraform plan output
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "development"
 # => Default value if not specified
 # => Sets default value if variable not provided
 # => Makes variable optional (no default = required)

 # Validation rule with explanation
 validation {
 # => Validation block prevents invalid values
 condition = contains(["development", "staging", "production"], var.environment)
 # => Sets condition expression (must evaluate to true)
 # => contains checks if var.environment in allowed list
 error_message = "Environment must be development, staging, or production."
 # => Sets error_message shown when validation fails
 # => Displayed to user during terraform plan/apply
 }
}

# Output with description
output "file_info" {
# => Output value exposes file information
 description = "Information about the created file"
 # => Human-readable description
 # => Sets description (appears in terraform output command)
 value = {
 # => Output value
 # => Map value with multiple attributes
 filename = local_file.documented.filename
 # => Output file path
 # => References filename attribute from resource
 # => Value: "documented.txt"
 permissions = local_file.documented.file_permission
 # => References file_permission attribute
 # => Value: "0644"
 }
 # => Output available after terraform apply completes
}





```

**Key Takeaway**: Use `#` or `//` for single-line comments, `/* */` for multi-line. Add `description` to variables and outputs for documentation. Use inline comments to explain non-obvious configuration choices. Documentation is essential for team collaboration and future maintenance.

**Why It Matters**: Well-documented Terraform code enables safe infrastructure changes during oncall incidents when the original author isn't available. Variable descriptions appear in Terraform Cloud UI and documentation generators, helping new team members understand required inputs without reading source code. This documentation-in-code approach means infrastructure knowledge lives in version control instead of outdated wiki pages, reducing the "tribal knowledge" problem that causes production outages when experienced engineers leave the team.

---

### Example 6: HCL Functions

Terraform provides 100+ built-in functions for string manipulation, collection operations, numeric calculations, encoding, filesystem operations, and more. Functions cannot be user-defined.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Input String:<br/> Hello, Terraform! "] --> B["trimspace#40;#41;<br/>Remove whitespace"]
 B --> C["Trimmed:<br/>Hello, Terraform!"]
 C --> D1["lower#40;#41;<br/>To lowercase"]
 C --> D2["upper#40;#41;<br/>To uppercase"]
 C --> D3["replace#40;#41;<br/>Substitute text"]
 D1 --> E1["hello, terraform!"]
 D2 --> E2["HELLO, TERRAFORM!"]
 D3 --> E3["Hello, HCL!"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D1 fill:#CC78BC,color:#fff
 style D2 fill:#CC78BC,color:#fff
 style D3 fill:#CC78BC,color:#fff
 style E1 fill:#CA9161,color:#fff
 style E2 fill:#CA9161,color:#fff
 style E3 fill:#CA9161,color:#fff
```

**Code**:

```hcl
# functions.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

locals {
# => locals block contains function demonstrations
 # String functions
 original = " Hello, Terraform! " # => String value
 # => Sets original with whitespace padding for trimspace demo
 trimmed = trimspace(local.original) # => "Hello, Terraform!" (remove whitespace)
 # => trimspace removes leading and trailing whitespace
 lowercased = lower(local.trimmed) # => "hello, terraform!"
 # => lower converts all characters to lowercase
 # => Sets lowercased for comparison
 uppercased = upper(local.trimmed) # => "HELLO, TERRAFORM!"
 # => upper converts all characters to uppercase
 # => Sets uppercased for comparison
 replaced = replace(local.trimmed, "Terraform", "HCL") # => "Hello, HCL!"
 # => replace(string, search, replacement) performs text substitution
 # => Sets replaced with modified string
 split_result = split(", ", local.trimmed) # => ["Hello", "Terraform!"]
 # => split(separator, string) creates list from delimited string
 # => Sets split_result as two-element list
 joined = join("-", split(", ", local.trimmed)) # => "Hello-Terraform!"
 # => join(separator, list) concatenates list elements with separator
 # => Combines split and join for transformation

 # Numeric functions
 numbers = [10, 5, 20, 15] # => List definition
 # => Sets numbers list for numeric function demos
 max_num = max(local.numbers..) # => 20 (variadic expansion)
 # => .. operator expands list into separate arguments
 # => max() returns largest value
 min_num = min(local.numbers..) # => 5
 # => min() returns smallest value
 # => Sets min_num to 5
 sum_num = sum(local.numbers) # => 50
 # => sum adds all elements (10 + 5 + 20 + 15 = 50)
 # => Sets sum_num to total

 # Collection functions
 list = ["a", "b", "c", "d"] # => List definition
 # => Sets list with four elements for collection demos
 list_length = length(local.list) # => 4
 # => length() returns number of elements in collection
 # => Sets list_length to 4
 contains_b = contains(local.list, "b") # => true
 # => contains checks if element exists in list
 # => Returns boolean result
 first_elem = element(local.list, 0) # => "a"
 # => element accesses list by index (0-based)
 # => Retrieves first element safely
 last_elem = element(local.list, length(local.list) - 1) # => "d"
 # => Combines element() and length() to get last item
 # => Sets last_elem to "d"
 reversed = reverse(local.list) # => ["d", "c", "b", "a"]
 # => reverse() flips list order
 # => Sets reversed to backward list
 sorted = sort(local.list) # => ["a", "b", "c", "d"]
 # => sort() orders elements alphabetically
 # => Sets sorted (already sorted in this case)
 distinct = distinct(["a", "b", "a", "c"]) # => ["a", "b", "c"]
 # => distinct removes duplicate values
 # => Returns unique elements only

 # Map functions
 map_data = { env = "prod", region = "us-east-1", team = "platform" }
 # => Sets map_data with three key-value pairs
 map_keys = keys(local.map_data) # => ["env", "region", "team"]
 # => keys extracts all map keys as list
 # => Order not guaranteed in maps
 map_values = values(local.map_data) # => ["prod", "us-east-1", "platform"]
 # => values extracts all map values as list
 # => Sets map_values corresponding to keys
 merged_map = merge(local.map_data, { tier = "web" }) # => Adds tier key
 # => merge combines maps (right map overwrites left on key collision)
 # => Results in four-key map

 # Type conversion
 string_to_num = tonumber("42") # => 42 (number type)
 # => tonumber converts string to number (fails if non-numeric)
 # => Useful for parsing user input
 num_to_string = tostring(42) # => "42" (string type)
 # => tostring converts number to string representation
 # => Sets num_to_string for string operations
 to_set = toset(["a", "b", "a"]) # => Set with unique values
 # => toset creates set (unique, unordered collection)
 # => Removes duplicate "a"

 # Encoding functions
 json_string = jsonencode( # => Converts value to JSON string

 { key = "value" }) # => '{"key":"value"}'
 # => jsonencode converts HCL value to JSON string
 # => Sets json_string for API payloads
 yaml_string = yamlencode( # => Converts value to YAML string

 { key = "value" }) # => 'key: value\n'
 # => yamlencode converts HCL value to YAML string
 # => Sets yaml_string for YAML-based tools
 base64_encoded = base64encode("hello") # => "aGVsbG8="
 # => base64encode encodes string to Base64 format
 # => Common for binary data in text fields
 base64_decoded = base64decode("aGVsbG8=") # => "hello"
 # => base64decode decodes Base64 string to original
 # => Reverses encoding operation

 # Date/Time functions
 timestamp = timestamp() # => "2024-01-15T10:30:00Z" (UTC)
 # => timestamp() returns current time in RFC3339 format
 # => Sets timestamp (always current, changes each apply)
 formatted_date = formatdate("YYYY-MM-DD", timestamp()) # => "2024-01-15"
 # => formatdate applies format string to timestamp
 # => Sets formatted_date with custom format
}

resource "local_file" "functions_demo" {
# => Resource definition
 filename = "functions.txt"
 # => Sets filename
 content = <<-EOT
 # => Sets content
 Original: "${local.original}"
 Trimmed: "${local.trimmed}"
 Uppercase: ${local.uppercased}
 Replaced: ${local.replaced}
 Joined: ${local.joined}

 Max: ${local.max_num}
 Sum: ${local.sum_num}

 List Length: ${local.list_length}
 Reversed: ${jsonencode(local.reversed)}

 Timestamp: ${local.timestamp}
 EOT
}

output "function_results" {
# => Output value
 value = {
 trimmed = local.trimmed
 # => Sets trimmed
 uppercased = local.uppercased
 # => Sets uppercased
 max_num = local.max_num
 # => Sets max_num
 list_length = local.list_length
 # => Sets list_length
 }
}



```

**Key Takeaway**: Terraform functions enable complex transformations without external scripting. Use `..` operator for variadic expansion (spreading list elements as separate arguments). Functions are pure—same input always produces same output. Reference complete function catalog at terraform.io/language/functions.

**Why It Matters**: Built-in functions replace brittle shell scripts and external data sources that complicate infrastructure deployment. Pure functions mean Terraform plans are reproducible—same configuration always produces same plan, unlike shell scripts with hidden dependencies on system state, ensuring infrastructure changes are predictable across team members' machines and CI/CD systems. This reproducibility is essential for reliable automated deployments.

---

## Group 3: Providers & Resources

### Example 7: Provider Configuration

Providers are plugins that manage resources for specific platforms (AWS, Azure, GCP, Kubernetes, etc.). Each provider requires configuration with credentials, regions, and version constraints.

**Note**: Cloud providers (AWS, Azure) require credentials to run. This example uses only the `local` provider so it runs without any cloud account. Cloud provider configuration patterns are shown as comments for reference.

**Code**:

```hcl
# providers.tf
terraform {
 # => terraform block configures Terraform behavior and provider requirements
 required_version = ">= 1.0" # => Minimum Terraform version constraint
 # => Prevents running with incompatible older versions

 required_providers {
 # => required_providers block declares all provider dependencies
 # => Format: { source = "namespace/name", version = "constraint" }

 # Local provider - runs without cloud credentials
 local = {                    # => Map/object definition
 source = "hashicorp/local" # => Provider source (registry.terraform.io/hashicorp/local)
 # => Format: hostname/namespace/type (default hostname: registry.terraform.io)
 version = "~> 2.0"        # => Pessimistic constraint (~> allows rightmost increment)
 # => ~> 2.0 allows 2.x but not 3.0 (prevents breaking changes)
 }

 # Example: AWS provider (requires AWS credentials - shown for reference)
 # aws = {
 # source  = "hashicorp/aws"  # => registry.terraform.io/hashicorp/aws
 # version = "~> 5.0"         # => ~> 5.0 allows 5.x but not 6.0
 # }

 # Example: Azure provider (requires Azure credentials - shown for reference)
 # azurerm = {
 # source  = "hashicorp/azurerm" # => registry.terraform.io/hashicorp/azurerm
 # version = ">= 3.0, < 4.0"    # => Range constraint: 3.x series only
 # }
 }
}

# Local provider configuration (no credentials needed)
provider "local" {} # => No config arguments needed for local provider
# => Local provider manages files on the local filesystem
# => No authentication required - ideal for learning and testing

# Example: AWS provider configuration (shown for reference, requires credentials)
# provider "aws" {
#  region = "us-east-1"          # => AWS region for resources
#  # => Credentials from: AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars
#  # => Or from: ~/.aws/credentials file (aws configure)
#  default_tags {
#    tags = {
#      Environment = "development" # => Applied to all AWS resources
#      ManagedBy   = "Terraform"
#    }
#  }
# }

# Example: Provider alias for multi-region (shown for reference)
# provider "aws" {
#  alias  = "west"     # => Provider alias enables multiple instances
#  region = "us-west-2" # => Different region than default provider
# }

# Runnable resource using local provider (no cloud credentials required)
resource "local_file" "provider_demo" {
 # => local_file resource creates a file on the local filesystem
 filename = "${path.module}/providers.txt" # => Output file path
 # => path.module resolves to directory containing this .tf file
 content = <<-EOT
 # => File/resource content
 # => Heredoc string (<<-EOT strips leading whitespace)
 Provider configuration patterns:
 # => Terraform configuration
 - local: runs without credentials (used in this example)
 # => Terraform configuration
 - aws:   requires AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
 # => Terraform configuration
 - azurerm: requires az login or ARM_* environment variables
 # => Terraform configuration
 Version constraint patterns:
 # => Terraform configuration
 - "~> 5.0" means >= 5.0, < 6.0 (patch + minor updates)
 # => Terraform configuration
 - ">= 3.0, < 4.0" means 3.x series only
 # => Terraform configuration
 EOT
 # => terraform apply creates providers.txt in current directory
}

output "demo_file" {
 # => output block: exposes values after terraform apply
 value = local_file.provider_demo.filename # => Reference: resource_type.name.attribute
 # => Outputs the created file path after apply
 # => Output: demo_file = "./providers.txt"
}


```

**Key Takeaway**: Declare providers in `required_providers` block with source and version. Configure providers with credentials and region. Use provider aliases for multi-region deployments. Version constraints prevent breaking changes: `~> 5.0` means `>= 5.0, < 6.0`.

**Why It Matters**: Terraform's provider ecosystem with 3,000+ providers enables multi-cloud infrastructure without vendor lock-in. Version constraints prevent the "upgrade broke production" incidents common with unversioned scripts, ensuring provider updates are deliberate and tested, not accidental surprises during routine deployments. This consistency makes onboarding new engineers predictable—they use the same provider versions as the rest of the team.

---

### Example 8: Resource Basics

Resources are the most important element in Terraform—they represent infrastructure components to create, update, or delete. Each resource has a type, name, and arguments.

**Code**:

```hcl
# resources.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version
 required_providers {
 # => Provider configuration
 local = { # => Map/object definition
 source = "hashicorp/local" # => String value
 # => Provider source location
 version = "~> 2.0" # => String value
 # => Sets version
 }
 }
}

provider "local" {}
# => Local provider for file-based examples

# Simple resource
resource "local_file" "simple" {
# => Resource definition
 filename = "simple.txt" # => Required argument
 # => Sets filename
 content = "Simple resource example" # => String value
 # => Sets content
}

# Resource with multiple arguments
resource "local_file" "detailed" {
# => Resource definition
 filename = "detailed.txt" # => String value
 # => Sets filename
 content = "Detailed resource" # => String value
 # => Sets content
 file_permission = "0644" # => Optional argument
 # => Sets file_permission
}

# Resource with lifecycle customization
resource "local_file" "lifecycle_demo" {
# => Resource definition
 filename = "lifecycle.txt" # => String value
 # => Sets filename
 content = "Lifecycle example" # => String value
 # => Sets content

 lifecycle {
 # => Lifecycle customization controls resource behavior
 create_before_destroy = true # => Create new before destroying old
 # => Sets create_before_destroy
 prevent_destroy = false # => Prevent accidental deletion (true in prod)
 # => Sets prevent_destroy
 ignore_changes = [content] # => Ignore changes to content attribute
 # => Sets ignore_changes
 }
 # => Lifecycle meta-arguments control resource behavior
}

# Resource with count (multiple instances)
resource "local_file" "counted" {
# => Resource definition
 count = 3 # => Create 3 instances
 # => Creates specified number of instances
 filename = "file_${count.index}.txt" # => count.index: 0, 1, 2
 # => Sets filename
 content = "File number ${count.index}"
 # => File/resource content
 # => Creates: file_0.txt, file_1.txt, file_2.txt
}

# Resource with depends_on (explicit dependency)
resource "local_file" "first" {
# => Resource definition
 filename = "first.txt"
 # => Output file path
 # => Sets filename
 content = "Created first"
 # => File/resource content
 # => Sets content
}

resource "local_file" "second" {
# => Resource definition
 filename = "second.txt"
 # => Output file path
 # => Sets filename
 content = "Created after first"
 # => File/resource content
 # => Sets content
 depends_on = [ # => Explicit dependency list

 local_file.first] # => Explicit dependency
 # => Terraform creates first.txt before second.txt
}

# Output resource attributes
output "resource_info" {
# => Resource definition
 value = {
 # => Output value
 simple_id = local_file.simple.id
 # => Sets simple_id
 simple_filename = local_file.simple.filename
 # => Sets simple_filename
 counted_files = [for f in local_file.counted : f.filename]
 # => Sets counted_files
 }
 # => Shows resource attributes after apply
}





```

**Key Takeaway**: Resources follow pattern `resource "type" "name" { arguments }`. Use `count` for multiple similar resources. Use `depends_on` for explicit dependencies when implicit dependencies (via references) aren't sufficient. Lifecycle meta-arguments control creation, destruction, and update behavior.

**Why It Matters**: Resource blocks are the foundation of infrastructure as code—each block declares desired state, and Terraform reconciles actual infrastructure to match. This declarative approach means you specify "what" (10 web servers) instead of "how" (loop that creates servers), making configurations self-documenting and idempotent. Unlike imperative scripts that break when run twice, Terraform resources can be applied repeatedly without creating duplicates, enabling safe automation and recovery from partial failures.

---

### Example 9: Resource Dependencies

Terraform automatically determines resource creation order based on references. Explicit dependencies use `depends_on`. Understanding dependency graph prevents race conditions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["local_file.base"] --> B["local_file.depends_implicit"]
 A --> C["local_file.depends_explicit"]
 B --> D["local_file.final"]
 C --> D

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
```

**Code**:

```hcl
# dependencies.tf
terraform {
# => Terraform configuration block for dependency demo
# => Shows implicit and explicit resource dependencies
 required_version = ">= 1.0" # => String value
# => Sets required_version to minimum 1.0
# => Ensures dependency features available
}

provider "local" {
# => Provider configuration
 version = "~> 2.0" # => String value
 # => Sets version
}

# Base resource (no dependencies)
resource "local_file" "base" {
# => Resource definition
 filename = "base.txt" # => String value
 # => Sets filename
 content = "Base file created first" # => String value
 # => No dependencies, can be created immediately
}

# Implicit dependency (via reference)
resource "local_file" "depends_implicit" {
# => Resource definition
 filename = "implicit.txt" # => String value
 # => Sets filename
 content = "Base file: ${local_file.base.filename}" # => References base
 # => Terraform detects dependency automatically
 # => Creates base.txt before implicit.txt
}

# Explicit dependency (via depends_on)
resource "local_file" "depends_explicit" {
# => Resource definition
 filename = "explicit.txt" # => String value
 # => Sets filename
 content = "Depends on base (explicit)" # => String value
 # => Sets content
 depends_on = [ # => Explicit dependency list

 local_file.base] # => Explicit dependency declaration
 # => Use depends_on when no direct reference exists
}

# Multiple dependencies
resource "local_file" "final" {
# => Resource definition
 filename = "final.txt"
 # => Output file path
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Implicit: ${local_file.depends_implicit.filename}
 # => Terraform configuration
 Explicit: ${local_file.depends_explicit.filename}
 # => Terraform configuration
 EOT
 # => Implicit dependencies on both depends_implicit and depends_explicit
 # => Terraform creates in correct order: base -> implicit/explicit -> final
}

# View dependency graph
# $ terraform graph | dot -Tpng > dependencies.png



```

**Key Takeaway**: Terraform builds dependency graph from resource references. Use implicit dependencies (references) when possible—they're clearer than `depends_on`. Use `depends_on` only for side-effect dependencies that can't be expressed through references. Run `terraform graph` to visualize dependencies.

**Why It Matters**: Automatic dependency resolution prevents the "database provisioned before VPC" race conditions that plague manual provisioning and unordered scripts. Terraform's dependency graph ensures infrastructure components are created in correct order—networks before servers, load balancers before DNS records—without fragile sleep statements or manual sequencing. This eliminates the "deployment sometimes fails with timeout errors" flakiness common in CI/CD pipelines using imperative infrastructure scripts, making deployments reliably reproducible.

---

### Example 10: Resource Lifecycle

Lifecycle meta-arguments control resource creation, update, and destruction behavior. Essential for zero-downtime deployments and protecting critical resources.

**Code**:

```hcl
# lifecycle.tf
terraform {
# => Terraform configuration block
# => Configures lifecycle behavior demonstration
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {
# => Provider configuration
 version = "~> 2.0" # => String value
 # => Sets version
}

# create_before_destroy: Create replacement before destroying old
resource "local_file" "zero_downtime" {
# => Resource definition
 filename = "zero_downtime.txt" # => String value
 # => Sets filename
 content = "Version 2" # => Change this to trigger replacement
 # => Modifying content forces resource recreation

 lifecycle {
 # => Lifecycle customization controls resource behavior
 create_before_destroy = true # => Create new, then destroy old
 # => Ensures resource always exists during replacement
 }
 # => Useful for resources that must always exist (e.g., DNS records)
 # => Prevents downtime during updates requiring replacement
 # => Order: Create new file → Verify creation → Delete old file
}

# prevent_destroy: Prevent accidental deletion
resource "local_file" "critical" {
# => Resource definition
 filename = "critical.txt" # => String value
 # => Sets filename
 content = "Critical production data" # => String value
 # => Content represents critical state (database, secrets, etc.)

 lifecycle {
 # => Lifecycle customization controls resource behavior
 prevent_destroy = true # => terraform destroy will fail
 # => Error: "Cannot destroy resource with prevent_destroy = true"
 }
 # => Use for databases, state stores, and other critical resources
 # => Must set to false before destroying
 # => Protects against accidental deletion in production
}

# ignore_changes: Ignore changes to specific attributes
resource "local_file" "ignore_demo" {
# => Resource definition
 filename = "ignore.txt"
 # => Sets filename
 content = "Original content" # => Can be changed externally
 # => External processes can modify this file

 lifecycle {
 # => Lifecycle customization controls resource behavior
 ignore_changes = [content] # => Ignore content changes
 # ignore_changes = all # => Ignore all attribute changes
 # => Terraform won't revert external modifications
 }
 # => Terraform won't detect content changes
 # => Useful when external systems modify resources
 # => State drift tolerated for specified attributes
}

# replace_triggered_by: Force replacement when related resource changes
resource "local_file" "trigger_source" {
# => Resource definition
 filename = "trigger.txt"
 # => Sets filename
 content = "Trigger version 1" # => Change this
 # => Sets content
}

resource "local_file" "triggered" {
# => Resource definition
 filename = "triggered.txt"
 # => Sets filename
 content = "Depends on trigger"
 # => Sets content

 lifecycle {
 replace_triggered_by = [
 # => Sets replace_triggered_by
 local_file.trigger_source.id # => Replace when trigger_source changes
 # => Sets local_file.trigger_source.id #
 ]
 }
 # => Forces replacement even if own attributes unchanged
}

# Combined lifecycle rules
resource "local_file" "combined" {
# => Resource definition
 filename = "combined.txt"
 # => Sets filename
 content = "Production configuration"
 # => Sets content

 lifecycle {
 # => Lifecycle customization controls resource behavior
 create_before_destroy = true # => Zero downtime
 # => Sets create_before_destroy
 prevent_destroy = false # => Allow destruction (set true in prod)
 # => Sets prevent_destroy
 ignore_changes = [file_permission] # => Ignore permission changes
 # => Sets ignore_changes
 }
}




```

**Key Takeaway**: Use `create_before_destroy` for zero-downtime updates. Use `prevent_destroy` to protect critical resources. Use `ignore_changes` when external systems modify resources. Lifecycle rules are powerful—use with caution in production.

**Why It Matters**: Lifecycle rules prevent catastrophic production mistakes like deleting a database because an AMI ID changed. `prevent_destroy` has saved countless teams from the "terraform destroy accidentally deleted our production data" disaster, forcing deliberate removal instead of accidental deletion. `create_before_destroy` enables zero-downtime deployments—new load balancer spins up before old one terminates—essential for services maintaining 99.99% uptime SLAs where even brief downtime costs thousands in revenue and customer trust.

---

## Group 4: Variables

### Example 11: Input Variables

Input variables make Terraform configurations reusable and environment-agnostic. Variables support types, defaults, descriptions, and validation rules.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Variable Input<br/>#40;CLI/File/Env#41;"] --> B["Type Check"]
 B --> C{"Type Valid?"}
 C -->|No| D["Error:<br/>Type mismatch"]
 C -->|Yes| E["Validation Rules"]
 E --> F{"Validation<br/>Passes?"}
 F -->|No| G["Error:<br/>Custom message"]
 F -->|Yes| H["Variable Available<br/>in Configuration"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#DE8F05,color:#fff
 style F fill:#029E73,color:#fff
 style G fill:#CC78BC,color:#fff
 style H fill:#CA9161,color:#fff
```

**Code**:

```hcl
# variables.tf
terraform {
# => Terraform configuration block
# => Demonstrates variable declaration patterns
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples
# => Enables local file resources for demonstration

# Simple string variable with default
variable "environment" {
# => Input variable declaration
# => variable block defines configurable parameter
 description = "Environment name" # => String value
 # => Description appears in terraform console and docs
 # => Helps users understand variable purpose
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 # => Type checking happens during terraform plan
 default = "development" # => Used if not provided
 # => Optional: Allows terraform apply without -var flag
 # => Default value makes variable optional
}

# Variable without default (required)
variable "project_name" {
# => Input variable
 description = "Project name for resource naming" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 # => Must be provided via CLI, file, or environment variable
 # => terraform apply fails if not provided
}

# Number variable
variable "instance_count" {
# => Input variable
 description = "Number of instances to create" # => String value
 # => Sets description
 type = number
 # => Variable type constraint
 # => Type constraint ensures numeric value
 default = 1 # => Numeric value
 # => Default prevents need for explicit value in most cases
}

# Boolean variable
variable "enable_monitoring" {
# => Input variable
 description = "Enable monitoring features"
 # => Human-readable description
 # => Sets description
 type = bool
 # => Variable type constraint
 # => Type constraint ensures boolean value
 default = false
 # => Default value if not specified
 # => Monitoring disabled by default (opt-in pattern)
}

# List variable
variable "allowed_cidrs" {
# => Input variable
 description = "List of allowed CIDR blocks"
 # => Human-readable description
 # => Sets description
 type = list(string)
 # => Variable type constraint
 # => Type constraint ensures list of strings
 # => Rejected: non-string list elements, single string values
 default = ["10.0.0.0/8"]
 # => Default value if not specified
 # => Single private network CIDR in default configuration
}

# Map variable
variable "tags" {
# => Input variable
 description = "Resource tags"
 # => Human-readable description
 # => Sets description
 type = map(string)
 # => Variable type constraint
 # => Type constraint ensures string-keyed map
 default = {
 # => Default value if not specified
 ManagedBy = "Terraform"
 # => All infrastructure tagged with IaC tool for auditing
 }
}

# Object variable (structured)
variable "server_config" {
# => Input variable
 description = "Server configuration"
 # => Human-readable description
 # => Sets description
 type = object({
 # => Variable type constraint
 instance_type = string
 # => Server size (t3.micro, t3.small, etc.)
 disk_size = number
 # => Disk size in GB
 enable_backup = bool
 # => Backup enabled/disabled flag
 })
 # => object type enforces exact schema - all fields required
 default = {
 # => Default value if not specified
 instance_type = "t3.micro"
 # => Free tier eligible instance type
 disk_size = 20
 # => Minimum disk for typical workloads
 enable_backup = false
 # => Backups disabled by default (cost optimization)
 }
}

# Variable with validation
variable "region" {
# => Input variable
 description = "AWS region"
 # => Human-readable description
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "us-east-1"
 # => Default value if not specified
 # => Sets default

 validation {
 # => Validation rule enforces constraints
 condition = can(regex("^us-", var.region)) # => Must start with "us-"
 # => can() prevents error if regex fails, returns false instead
 error_message = "Region must be a US region."
 # => Custom error shown when validation fails
 }
 # => Validation runs before plan/apply
 # => Prevents invalid region values (e.g., "eu-west-1")
}

# Sensitive variable (masked in output)
variable "api_key" {
# => Input variable
 description = "API key for external service"
 # => Human-readable description
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 sensitive = true # => Value hidden in plan/apply output
 # => Shows (sensitive value) instead of actual string
 default = ""
 # => Default value if not specified
 # => Empty default (should be overridden in production)
}

# Use variables in resources
resource "local_file" "config" {
# => Resource definition
 filename = "${var.environment}-config.txt"
 # => Output file path
 # => var.environment references variable value
 # => Produces: "development-config.txt" with default
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Project: ${var.project_name}
 # => Terraform configuration
 Environment: ${var.environment}
 # => Terraform configuration
 Instances: ${var.instance_count}
 # => Terraform configuration
 Monitoring: ${var.enable_monitoring}
 # => Terraform configuration
 Region: ${var.region}
 # => Terraform configuration
 Tags: ${jsonencode(var.tags)}
 # => jsonencode converts map to JSON string
 Server: ${var.server_config.instance_type}
 # => Access object fields with dot notation
 EOT
 # => Heredoc syntax for multi-line strings
}





```

**Usage**:

```bash
# Provide via command line
# $ terraform apply -var="project_name=myapp" -var="environment=production"

# Provide via environment variable
# $ export TF_VAR_project_name="myapp"
# $ terraform apply

# Provide via variable file
# $ echo 'project_name = "myapp"' > terraform.tfvars
# $ terraform apply

# Provide via auto-loaded file
# terraform.tfvars (automatically loaded)
# *.auto.tfvars (automatically loaded)


```

**Key Takeaway**: Declare variables in `variables.tf` with type, description, and optional default. Use `var.name` to reference variables. Variable files (`*.tfvars`) separate configuration from code. Mark sensitive variables with `sensitive = true` to prevent exposure in logs.

**Why It Matters**: Input variables enable reusable infrastructure modules deployed across environments—same code provisions development (1 server), staging (3 servers), and production (50 servers) by changing tfvars files. This eliminates environment-specific codebases that diverge and cause "works in staging, fails in prod" surprises. Type validation catches configuration errors during plan—"instance_count must be number" fails fast instead of hitting AWS API limits, preventing deployment failures that waste engineer time and cloud costs.

---

### Example 12: Output Values

Output values expose information about infrastructure after apply. Outputs can be queried via CLI, used by other Terraform configurations, or displayed to users.

**Code**:

```hcl
# outputs.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

variable "prefix" {
# => Input variable
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "demo" # => String value
 # => Sets default
}

resource "local_file" "output_demo" {
# => Resource definition
 filename = "${var.prefix}-output.txt" # => String interpolation
 # => Sets filename
 content = "Output demonstration" # => String value
 # => Sets content
}

# Simple output
output "file_id" {
# => Output value
 description = "Unique identifier for the file" # => String value
 # => Sets description
 value = local_file.output_demo.id # => Resource attribute
 # => terraform output file_id
}

# Output with multiple attributes
output "file_info" {
# => Output value
 description = "Complete file information" # => String value
 # => Sets description
 value = { # => Map/object definition
 id = local_file.output_demo.id
 # => Sets id
 filename = local_file.output_demo.filename
 # => Output file path
 # => Sets filename
 content = local_file.output_demo.content
 # => File/resource content
 # => Sets content
 permissions = local_file.output_demo.file_permission
 # => Sets permissions
 }
 # => terraform output file_info
 # => Returns map with all attributes
}

# Sensitive output (hidden by default)
output "sensitive_data" {
# => Output value
 description = "Sensitive information"
 # => Human-readable description
 # => Sets description
 value = "secret-api-key-12345"
 # => Output value
 # => Sets value
 sensitive = true # => Marked as sensitive
 # => terraform output sensitive_data (shows <sensitive>)
 # => terraform output -raw sensitive_data (shows actual value)
}

# Output with computed value
output "file_path" {
# => Output value
 description = "Absolute file path"
 # => Human-readable description
 # => Sets description
 value = abspath(local_file.output_demo.filename)
 # => Output value
 # => Processes value through function
}

# Conditional output
output "status_message" {
# => Output value
 description = "Status based on configuration"
 # => Human-readable description
 # => Sets description
 value = var.prefix == "prod" ? "Production mode" : "Development mode"
 # => Output value
 # => Sets value
}

# List output
locals {
# => Local values
 file_list = [
 # => Sets file_list
 local_file.output_demo.filename,
 # => Terraform configuration
 "${var.prefix}-backup.txt"
 # => Terraform configuration
 ]
}

output "all_files" {
# => Output value
 description = "List of all managed files"
 # => Human-readable description
 # => Sets description
 value = local.file_list
 # => Output value
 # => Sets value
}

# Output for module consumers
output "module_export" {
# => Output value
 description = "Values for parent module or root configuration"
 # => Human-readable description
 # => Sets description
 value = {
 # => Output value
 resource_id = local_file.output_demo.id
 # => Sets resource_id
 filename = local_file.output_demo.filename
 # => Output file path
 # => Sets filename
 }
 # => When this config is used as a module, parent can reference:
 # => module.child_module.module_export.resource_id
}





```

**Usage**:

```bash
# Display all outputs
# $ terraform output
# => Shows all outputs after apply

# Display specific output
# $ terraform output file_id
# => Shows single output value

# Display as JSON
# $ terraform output -json
# => {"file_id": {"value": "..", "type": "string"}}

# Display raw value (no quotes)
# $ terraform output -raw file_path
# => /full/path/to/file.txt

# Use outputs in scripts
# $ FILE_ID=$(terraform output -raw file_id)


```

**Key Takeaway**: Outputs expose computed values after apply. Use `sensitive = true` for secrets. Outputs from child modules are accessed via `module.name.output_name`. Use `-json` flag for machine-readable output in automation scripts.

**Why It Matters**: Outputs enable infrastructure composition where network team manages VPCs and application team consumes VPC IDs without tight coupling. This separation of concerns is how Machine-readable JSON outputs integrate Terraform with CI/CD pipelines, automatically updating application configuration with new load balancer DNS names without manual copy-paste that causes "forgot to update config" outages.

---

### Example 13: Local Values

Local values (locals) are named expressions computed once and reused throughout configuration. Locals reduce duplication and improve readability.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Variables<br/>project, environment"] --> B["Computed Local:<br/>prefix"]
 A --> C["Computed Local:<br/>is_production"]
 C --> D["Computed Local:<br/>backup_enabled"]
 B --> E["Computed Local:<br/>common_tags"]
 C --> F["Computed Local:<br/>config"]
 B --> G["Computed Local:<br/>resource_names"]
 F --> G
 G --> H["Resources<br/>#40;for_each#41;"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#DE8F05,color:#fff
 style D fill:#029E73,color:#fff
 style E fill:#029E73,color:#fff
 style F fill:#029E73,color:#fff
 style G fill:#CC78BC,color:#fff
 style H fill:#CA9161,color:#fff
```

**Code**:

```hcl
# locals.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

variable "environment" {
# => Input variable
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "development" # => String value
 # => Sets default
}

variable "project" {
# => Input variable
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "myapp" # => String value
 # => Sets default
}

# Locals block
locals {
# => locals block defines computed values for reuse
# => Reduces duplication compared to repeating expressions
 # Simple computed value
 prefix = "${var.project}-${var.environment}" # => "myapp-development"
 # => Combines project and environment variables into naming prefix
 # => Used across multiple resources for consistent naming

 # Conditional logic
 is_production = var.environment == "production" # => String value
 # => Boolean comparison returns true/false
 # => Evaluates to true only when environment is "production"
 backup_enabled = local.is_production ? true : false
 # => Ternary conditional: condition ? true_value : false_value
 # => Enables backups only in production environment

 # Common tags used across resources
 common_tags = { # => Map/object definition
 # => Map of tags applied to all resources
 Project = var.project
 # => Sets Project tag from variable
 Environment = var.environment
 # => Sets Environment tag from variable
 ManagedBy = "Terraform"
 # => Hardcoded tag identifies infrastructure provisioning tool
 Timestamp = timestamp()
 # => timestamp() function provides current UTC time
 # => WARNING: Changes on each apply (triggers resource updates)
 }

 # Complex computation
 config = {
 # => Configuration map based on environment
 instance_count = local.is_production ? 3 : 1
 # => Production: 3 instances (high availability)
 # => Non-production: 1 instance (cost optimization)
 instance_type = local.is_production ? "large" : "small"
 # => Production: large instances (performance)
 # => Non-production: small instances (cost optimization)
 monitoring = local.is_production ? "detailed" : "basic"
 # => Production: detailed monitoring (observability)
 # => Non-production: basic monitoring (cost reduction)
 }

 # List transformation
 availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
 # => Three availability zones in us-east-1 region
 # => Provides multi-AZ redundancy for high availability
 az_suffix = [for az in local.availability_zones : substr(az, -1, 1)] # => ["a", "b", "c"]
 # => for expression transforms list using substr function
 # => Extracts last character from each zone name

 # Map transformation
 region_map = {
 # => Terraform configuration
 us-east-1 = "virginia"
 # => Sets us-east-1
 us-west-2 = "oregon"
 # => Sets us-west-2
 }
 region_name = lookup(local.region_map, "us-east-1", "unknown") # => "virginia"
 # => Sets region_name

 # Function composition
 resource_names = [for i in range(local.config.instance_count) : "${local.prefix}-instance-${i}"]
 # => ["myapp-development-instance-0"] for development
 # => ["myapp-production-instance-0".., "-2"] for production
}

# Use locals in resources
resource "local_file" "config_file" {
# => Resource definition
 for_each = toset(local.resource_names) # => Create one file per name
 # => Creates multiple instances from collection

 filename = "${each.value}.txt"
 # => Output file path
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Resource: ${each.value}
 # => Terraform configuration
 Environment: ${var.environment}
 # => Terraform configuration
 Production: ${local.is_production}
 # => Terraform configuration
 Backup: ${local.backup_enabled}
 # => Terraform configuration
 Config: ${jsonencode(local.config)}
 # => Terraform configuration
 EOT
 # => Terraform configuration
}

resource "local_file" "tags_file" {
# => Resource definition
 filename = "${local.prefix}-tags.txt"
 # => Output file path
 # => Sets filename
 content = jsonencode( # => Converts value to JSON string

 local.common_tags)
 # => Sets content
}

output "computed_values" {
# => Output value
 value = {
 # => Output value
 prefix = local.prefix
 # => Sets prefix
 is_production = local.is_production
 # => Sets is_production
 resource_names = local.resource_names
 # => Sets resource_names
 config = local.config
 # => Sets config
 }
}





```

**Key Takeaway**: Use `locals` for computed values used multiple times—reduces duplication and improves maintainability. Locals are computed once per apply. Reference with `local.name` (singular, not `locals.name`). Locals can reference other locals and variables.

**Why It Matters**: Locals eliminate configuration duplication that causes "updated naming convention in 3 places, forgot the 4th" bugs. Instead of repeating "${var.project}-${var.environment}" across 50 resource names, compute it once as `local.prefix` and reference everywhere—one-line changes instead of error-prone find-replace. This DRY principle is critical for large infrastructures where a single naming convention change must propagate across hundreds of resources. Locals also enable computed configuration like environment-specific settings, making infrastructure code read like a declarative specification rather than a repetitive list of string concatenations.

## Group 5: Data Sources

### Example 14: Data Source Basics

Data sources query existing infrastructure or external data without creating resources. Essential for referencing resources created outside Terraform or reading cloud provider information.

**Code**:

```hcl
# data_sources.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

# Create a resource first
resource "local_file" "source" {
# => Resource definition
 filename = "source.txt" # => String value
 # => Sets filename
 content = "Original content" # => String value
 # => This resource must exist before data source can read it
}

# Data source reads existing resource
data "local_file" "existing" {
# => Data source
 filename = "source.txt" # => Read existing file
 # => Data source queries file at apply time
 depends_on = [ # => Explicit dependency list

 local_file.source] # => Ensure file exists first
 # => depends_on creates explicit ordering (source created before read)
 # => Data sources read-only, never create/modify/destroy
 # => Query happens during terraform plan and apply
}

# Use data source attributes
resource "local_file" "copy" {
# => Resource definition
 filename = "copy.txt" # => String value
 # => Sets filename
 content = data.local_file.existing.content # => Reference data source
 # => Content copied from source.txt (dynamic reference)
 # => If source.txt changes, copy.txt updates on next apply
}

output "data_source_info" {
# => Output value
 value = { # => Map/object definition
 id = data.local_file.existing.id
 # => Unique identifier for the file
 filename = data.local_file.existing.filename
 # => File path (source.txt)
 content = data.local_file.existing.content
 # => File content as string
 content_b64 = data.local_file.existing.content_base64
 # => Base64-encoded content
 }
 # => Shows all attributes from data source
 # => Data sources expose provider-specific attributes
}

# Multiple data sources
data "local_file" "file1" {
# => Data source
 filename = "source.txt"
 # => First data source (reads source.txt)
}

data "local_file" "file2" {
# => Data source
 filename = "copy.txt"
 # => Sets filename
 depends_on = [ # => Explicit dependency list

 local_file.copy]
 # => Explicit dependency enforces creation order
}

output "combined_content" {
# => Output value
 value = "${data.local_file.file1.content} + ${data.local_file.file2.content}"
 # => Combines content from multiple data sources
 # => String interpolation with data source attributes
}


```

**Real-world example (AWS)**:

```hcl
# Query existing VPC
data "aws_vpc" "existing" {
# => Data source
 filter {
 name = "tag:Name" # => String value
 # => Sets name
 values = ["production-vpc"] # => List definition
 # => Sets values
 }
}

# Use VPC ID in new resource
resource "aws_subnet" "new" {
# => Resource definition
 vpc_id = data.aws_vpc.existing.id # => Reference existing VPC
 # => Sets vpc_id
 cidr_block = "10.0.1.0/24" # => String value
 # => Sets cidr_block
 availability_zone = "us-east-1a" # => String value
 # => Sets availability_zone
}




```

**Key Takeaway**: Data sources query existing resources with `data "type" "name" { }` blocks. Reference attributes with `data.type.name.attribute`. Use data sources to integrate Terraform with existing infrastructure or external systems. Data sources are read-only—they never create or modify resources.

**Why It Matters**: Data sources enable gradual Terraform adoption without rip-and-replace migrations. Organizations can Terraform new infrastructure while querying existing manually-created VPCs, security groups, and databases through data sources. This "brownfield infrastructure" pattern is how enterprises migrate to infrastructure-as-code incrementally rather than requiring a full rewrite. Data sources also enable split responsibilities where platform teams manage networks and application teams query VPC IDs, preventing coordination bottlenecks.

---

### Example 15: External Data Source

The external data source executes external programs and captures their JSON output. Enables integration with custom scripts, APIs, or systems without native Terraform providers.

**Code**:

```hcl
# external_data.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version
 required_providers {
 # => Provider configuration
 external = { # => Map/object definition
 source = "hashicorp/external" # => String value
 # => Provider source location
 version = "~> 2.0" # => String value
 # => Sets version
 }
 local = { # => Map/object definition
 source = "hashicorp/local" # => String value
 # => Provider source location
 version = "~> 2.0" # => String value
 # => Sets version
 }
 }
}

provider "external" {}
# => Provider configuration
provider "local" {}
# => Local provider for file-based examples

# Create external script
resource "local_file" "script" {
# => Resource definition
 # => path.module is the current module directory path
 filename = "${path.module}/query.sh"
 # => Output file path
 # => Sets filename
 file_permission = "0755" # => String value
 # => Sets file_permission
 content = <<-EOT
 # => File/resource content
 #!/bin/bash
 # External data script must output JSON to stdout

 # Read input from stdin (optional)
 eval "$(jq -r '@sh "INPUT_VAR=\(.input_var)"')"
 # => Sets eval "$(jq -r '@sh "INPUT_VAR

 # Perform computation or API call
 TIMESTAMP=$(date +%s)
 # => Sets TIMESTAMP
 HOSTNAME=$(hostname)
 # => Sets HOSTNAME

 # Output JSON
 jq -n \
 # => Terraform configuration
 --arg timestamp "$TIMESTAMP" \
 # => Terraform configuration
 --arg hostname "$HOSTNAME" \
 # => Terraform configuration
 --arg input "$INPUT_VAR" \
 # => Terraform configuration
 '{"timestamp": $timestamp, "hostname": $hostname, "input": $input}'
 # => Terraform configuration
 EOT
 # => Terraform configuration
}

# External data source
data "external" "example" {
# => Data source
 # => path.module is the current module directory path
 program = ["bash", "${path.module}/query.sh"] # => Command to execute
 # => Sets program

 query = {
 # => Terraform configuration
 input_var = "test-value" # => Passed to script as JSON on stdin
 # => Sets input_var
 }
 # => Script must output JSON: {"key": "value"}

 depends_on = [ # => Explicit dependency list


 local_file.script]
 # => Explicit dependency enforces creation order
}

# Use external data
resource "local_file" "result" {
# => Resource definition
 filename = "external_result.txt"
 # => Output file path
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Timestamp: ${data.external.example.result.timestamp}
 # => Data source
 Hostname: ${data.external.example.result.hostname}
 # => Data source
 Input: ${data.external.example.result.input}
 # => Data source
 EOT
 # => data.external.name.result contains all JSON output keys
}

output "external_output" {
# => Output value
 value = data.external.example.result # => Complete JSON output as map
 # => Sets value
}





```

**Python example**:

```hcl
# Python script (query.py)
resource "local_file" "python_script" {
# => Resource definition
 # => path.module is the current module directory path
 filename = "${path.module}/query.py"
 # => Output file path
 # => Sets filename
 file_permission = "0755" # => String value
 # => Sets file_permission
 content = <<-EOT
 # => File/resource content
 #!/usr/bin/env python3
 import json
 # => Terraform configuration
 import sys
 # => Terraform configuration

 # Read input from stdin
 input_data = json.load(sys.stdin)
 # => Sets input_data

 # Process data
 result = { # => Map/object definition
 "api_key": input_data.get("key_name", "default"),
 # => Terraform configuration
 "computed": "value-from-api-call"
 # => Terraform configuration
 }

 # Output JSON to stdout
 json.dump(result, sys.stdout)
 # => Terraform configuration
 EOT
 # => Terraform configuration
}

data "external" "python_data" {
# => Data source
 # => path.module is the current module directory path
 program = ["python3", "${path.module}/query.py"]
 # => Sets program
 query = { key_name = "production" } # => Map/object definition
 # => Sets query
 depends_on = [ # => Explicit dependency list

 local_file.python_script]
 # => Explicit dependency enforces creation order
}





```

**Key Takeaway**: External data source enables integration with any system that outputs JSON. Script must read JSON from stdin and write JSON to stdout. Use sparingly—prefer native Terraform providers when available. External programs run during `terraform plan`, making plans slower.

**Why It Matters**: External data sources bridge Terraform with proprietary systems lacking native providers—querying internal CMDB APIs, fetching credentials from custom vaults, or integrating legacy infrastructure databases. This extensibility prevented infrastructure teams from being blocked by missing providers while waiting for community or vendor support. However, external scripts bypass Terraform's dependency tracking and plan safety, so use only when native providers are unavailable, and migrate to proper providers when they become available to maintain infrastructure reliability.

---

## Group 6: State Management Basics

### Example 16: Understanding State

Terraform state tracks real infrastructure and maps resources to configuration. State is critical for Terraform operation—it determines what resources exist and what changes are needed.

**Code**:

```hcl
# state_demo.tf
# => Demonstrates state file management and backend configuration
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets minimum Terraform version

 # Backend configuration (where state is stored)
 backend "local" {
 # => Backend type for state storage
 # => Local backend stores state in filesystem
 path = "terraform.tfstate" # => Local state file (default)
 # => State file path relative to working directory
 }
 # => Backend determines state storage location
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "state_example" {
# => Resource tracked in terraform.tfstate
 filename = "state_example.txt" # => String value
 # => Terraform tracks this file in state
 content = "State management demo" # => String value
 # => After apply, state records filename, content, id
}


```

**State commands** (run via CLI):

```bash
# List all resources in state
$ terraform state list
# => local_file.state_example (lists all resources in state)
# => Shows resource addresses managed by Terraform

# Show complete resource details
$ terraform state show local_file.state_example
# => Shows complete resource state and all attributes
# => Displays: filename, content, id, provider

# Export state as JSON
$ terraform state pull
# => Outputs state as JSON to stdout
# => Useful for inspection and backup

# Upload state to backend (dangerous!)
$ terraform state push terraform.tfstate.backup
# => Overwrites remote state—use with caution


```

**State file structure**:

```json
{
  "version": 4,
  # => Terraform configuration
  "terraform_version": "1.9.0",
  # => Terraform configuration
  "serial": 1,
  # => Terraform configuration
  "lineage": "unique-uuid",
  # => Terraform configuration
  "outputs": {},
  // => Output configuration
  "resources": [
  # => Terraform configuration
    {
      "mode": "managed",
      # => Terraform configuration
      "type": "local_file",
      # => Terraform configuration
      "name": "state_example",
      # => Terraform configuration
      "provider": "provider[\"registry.terraform.io/hashicorp/local\"]",
      # => Terraform configuration
      "instances": [
      # => Terraform configuration
        {
          "schema_version": 0,
          # => Terraform configuration
          "attributes": {
          # => Terraform configuration
            "filename": "state_example.txt",
            # => Terraform configuration
            "content": "State management demo",
            # => Terraform configuration
            "id": "hash-of-content"
            # => Terraform configuration
          }
        }
      ]
    }
  ]
}


```

**Key Takeaway**: State file (`terraform.tfstate`) maps configuration to real infrastructure. Never edit state files manually—use `terraform state` commands. State contains sensitive data—always store securely. Local state works for solo work; use remote state for teams (covered in intermediate).

**Why It Matters**: State files are Terraform's memory—without state, Terraform can't determine what infrastructure exists or what changes are needed. This mapping is why Terraform is idempotent (safe to run repeatedly) unlike imperative scripts that create duplicates. State contains resource IDs, IP addresses, passwords, and other secrets—lost or leaked state causes either infrastructure orphaning (can't destroy old resources) or security breaches (credentials exposed). Local backend is dangerous for teams: concurrent operations corrupt state because there is no locking mechanism, and the state file is not shared between team members.

### Example 17: State Commands

Terraform CLI provides commands to inspect and modify state. Essential for debugging, refactoring, and recovering from state issues.

**Code**:

```hcl
# state_operations.tf
# => Demonstrates terraform state commands using three local files
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => Terraform 1.0+ required
}

provider "local" {} # => Local provider for file operations

# => First resource: demonstrates state list output
resource "local_file" "file1" { # => First demonstration file
 filename = "file1.txt" # => Output: file1.txt created
 content = "File 1 content" # => String value
}

# => Second resource: demonstrates state mv (rename) workflow
resource "local_file" "file2" { # => Second demonstration file
 filename = "file2.txt" # => Output: file2.txt created
 content = "File 2 content" # => String value
}

# => Third resource: demonstrates state rm (unmanage) workflow
resource "local_file" "file3" { # => Third demonstration file
 filename = "file3.txt" # => Output: file3.txt created
 content = "File 3 content" # => String value
}


```

**State operations**:

```bash
# List all resources in state
# $ terraform state list
# => local_file.file1
# => local_file.file2
# => local_file.file3

# Show specific resource details
# $ terraform state show local_file.file1
# => Displays all attributes for file1

# Move resource within state (rename)
# $ terraform state mv local_file.file1 local_file.renamed
# => Updates state to reflect new resource name
# => Update configuration to match: resource "local_file" "renamed" { }

# Remove resource from state (without destroying)
# $ terraform state rm local_file.file2
# => Removes from state but doesn't delete actual file
# => Terraform no longer manages this resource

# Import existing resource into state
# $ terraform import local_file.file2 file2.txt
# => Adds existing file2.txt to state management
# => Must have matching resource block in configuration

# Replace resource (force recreation)
# $ terraform apply -replace=local_file.file3
# => Forces destroy and recreate even if no changes
# => Useful for resources with external changes

# Refresh state from actual infrastructure
# $ terraform refresh
# => Updates state to match real infrastructure
# => Deprecated: use terraform apply -refresh-only

# Unlock state (if locked by crashed operation)
# $ terraform force-unlock <lock-id>
# => Removes state lock forcefully
# => Use with caution—only if lock is stale


```

**Refactoring example**:

```hcl
# Before refactoring
resource "local_file" "old_name" {
# => Resource definition
 filename = "file.txt" # => String value
 # => Sets filename
 content = "content" # => String value
 # => Sets content
}

# After refactoring (must update state)
resource "local_file" "new_name" {
# => Resource definition
 filename = "file.txt" # => String value
 # => Sets filename
 content = "content" # => String value
 # => Sets content
}

# Update state to match
# $ terraform state mv local_file.old_name local_file.new_name



```

**Key Takeaway**: Use `terraform state list` to view resources, `state show` for details, `state mv` for renaming, `state rm` for removing from management. Always backup state before manual operations (`cp terraform.tfstate terraform.tfstate.backup`). State commands enable refactoring without destroying infrastructure.

**Why It Matters**: State commands enable safe infrastructure refactoring that preserves resources during code reorganization. Teams can rename resources (`state mv`), split monolithic configurations into modules, or change resource identifiers without destroying and recreating production databases. This refactoring capability is critical for evolving infrastructure codebases— Manual state operations are risky, but with proper backups, they prevent the "refactoring destroyed production" disasters common with tools lacking state management.

---

### Example 18: State Locking

State locking prevents concurrent modifications when multiple team members run Terraform simultaneously. Local backend doesn't support locking; remote backends do.

**Code**:

```hcl
# state_locking.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available

 # Local backend (no locking support)
 backend "local" {
 # => Backend type for state storage
 # => Backend configuration for state storage
 path = "terraform.tfstate" # => String value
 # => No locking—unsafe for team usage
 }
 # => Replace with remote backend for production team use
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "locking_demo" {
# => Resource local_file.locking_demo
 filename = "locking.txt" # => String value
 content = "State locking demonstration" # => String value
}


```

**S3 backend with locking** (recommended for teams):

```hcl
# backend "s3" block replaces backend "local" above
backend "s3" {
# => Backend type for state storage
 bucket         = "terraform-state-bucket" # => S3 bucket for state storage
 key            = "project/terraform.tfstate" # => Path within bucket
 region         = "us-east-1" # => AWS region
 dynamodb_table = "terraform-state-lock" # => DynamoDB table for locking
 # => DynamoDB prevents concurrent applies
 encrypt        = true # => State file encrypted at rest
}


```

**Lock states**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["State: Unlocked"] --> B["User 1: terraform apply"]
 B --> C["State: Locked by User 1"]
 C --> D["User 2: terraform apply"]
 D --> E["User 2: Waits.."]
 C --> F["User 1: Apply Complete"]
 F --> G["State: Unlocked"]
 G --> H["User 2: Acquires Lock"]

 style A fill:#029E73,color:#fff
 style C fill:#DE8F05,color:#fff
 style E fill:#CC78BC,color:#fff
 style G fill:#029E73,color:#fff
```

**Key Takeaway**: State locking prevents race conditions in team environments. Local backend doesn't support locking—use remote backends (S3+DynamoDB, Terraform Cloud, Azure Blob) for teams. Locks are acquired automatically during state-modifying operations (apply, destroy).

**Why It Matters**: State locking prevents the catastrophic race condition where two engineers run `terraform apply` simultaneously and corrupt state, losing track of infrastructure. Without locking, concurrent applies cause "state file conflicts" requiring manual merge—impossible when state contains binary data. This happened at scale before remote backends: split-brain state corrupted production tracking, orphaning resources that accumulated cloud costs unnoticed. Remote backends with locking (S3+DynamoDB, Terraform Cloud) make concurrent operations safe, essential for teams where CI/CD and engineers share infrastructure, preventing the coordination overhead of manual scheduling.

---

**🎯 Beginner level (Examples 1-18) complete!** Continue to Examples 19-28 below for variables deep-dive and state management patterns.

## Group 7: Variables Deep Dive

### Example 19: Variable Validation

Variable validation ensures inputs meet requirements before infrastructure changes. Prevents invalid configurations from reaching cloud providers.

**Code**:

```hcl
# validation.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

# String pattern validation
variable "environment" {
# => Input variable
 description = "Environment name" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value

 validation {
 # => Validation rule enforces constraints
 condition = can(regex("^(dev|staging|prod)$", var.environment))
 # => can() returns true if expression succeeds without error
 # => Sets condition
 error_message = "Environment must be dev, staging, or prod." # => String value
 # => Sets error_message
 }
 # => Validates environment matches allowed values
}

# Numeric range validation
variable "instance_count" {
# => Input variable
 description = "Number of instances (1-10)" # => String value
 # => Sets description
 type = number
 # => Variable type constraint
 # => Type constraint ensures numeric value
 default = 1 # => Numeric value
 # => Sets default

 validation {
 # => Validation rule enforces constraints
 condition = var.instance_count >= 1 && var.instance_count <= 10 # => Numeric value
 # => && operator: both conditions must be true
 # => Sets condition
 error_message = "Instance count must be between 1 and 10." # => String value
 # => Sets error_message
 }
}

# String length validation
variable "project_name" {
# => Input variable
 description = "Project name (3-20 characters)"
 # => Human-readable description
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value

 validation {
 # => Validation rule enforces constraints
 condition = length(var.project_name) >= 3 && length(var.project_name) <= 20
 # => length() returns number of characters in string
 # => Sets condition
 error_message = "Project name must be 3-20 characters long."
 # => Sets error_message
 }
}

# CIDR validation
variable "vpc_cidr" {
# => Input variable
 description = "VPC CIDR block"
 # => Human-readable description
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "10.0.0.0/16"
 # => Default value if not specified
 # => Sets default

 validation {
 # => Validation rule enforces constraints
 condition = can(cidrhost(var.vpc_cidr, 0)) # => cidrhost validates CIDR format
 # => Returns error if CIDR notation invalid
 # => Sets condition
 error_message = "VPC CIDR must be valid IPv4 CIDR notation."
 # => Sets error_message
 }
}

# Complex object validation
variable "server_config" {
# => Input variable
 description = "Server configuration"
 # => Human-readable description
 # => Sets description
 type = object({
 # => Variable type constraint
 cpu = number
 # => Sets cpu
 memory = number
 # => Sets memory
 })
 # => Terraform configuration

 validation {
 # => Validation rule enforces constraints
 condition = var.server_config.cpu >= 1 && var.server_config.cpu <= 64
 # => Validates CPU within allowed range
 # => Sets condition
 error_message = "CPU count must be 1-64."
 # => Sets error_message
 }

 validation {
 # => Validation rule enforces constraints
 condition = var.server_config.memory >= 1 && var.server_config.memory <= 256
 # => Sets condition
 error_message = "Memory must be 1-256 GB."
 # => Sets error_message
 }
 # => Multiple validation blocks allowed
}

# List content validation
variable "availability_zones" {
# => Input variable
 description = "List of availability zones"
 # => Human-readable description
 # => Sets description
 type = list(string)
 # => Variable type constraint
 # => Type constraint ensures list of strings

 validation {
 # => Validation rule enforces constraints
 condition = length(var.availability_zones) >= 2
 # => Sets condition
 error_message = "At least 2 availability zones required for HA."
 # => Sets error_message
 }

 validation {
 # => Validation rule enforces constraints
 condition = alltrue([for az in var.availability_zones : can(regex("^[a-z]{2}-[a-z]+-[0-9][a-z]$", az))])
 # => Sets condition
 error_message = "Availability zones must match pattern: us-east-1a."
 # => Sets error_message
 }
}

resource "local_file" "validated_config" {
# => Resource definition
 filename = "validated.txt"
 # => Output file path
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Environment: ${var.environment}
 # => Terraform configuration
 Instances: ${var.instance_count}
 # => Terraform configuration
 Project: ${var.project_name}
 # => Terraform configuration
 VPC CIDR: ${var.vpc_cidr}
 # => Terraform configuration
 EOT
 # => Terraform configuration
}





```

**Validation error example**:

```bash
# $ terraform plan -var="environment=production"
# => Error: Invalid value for variable
# => Environment must be dev, staging, or prod.


```

**Key Takeaway**: Use validation blocks to enforce constraints on variable values. Validation runs during `terraform plan`, catching errors before infrastructure changes. Use `can()` function for format validation (regex, CIDR). Multiple validation blocks allowed per variable.

**Why It Matters**: Variable validation catches configuration errors in CI/CD before reaching cloud providers, preventing expensive deployment failures. Instead of hitting AWS quota limits because instance_count=1000 (typo for 10), validation rejects invalid values immediately with clear error messages. This shifts error detection left—"environment must be prod/staging/dev" fails in 1 second during plan instead of discovering incorrect tags on 500 deployed resources 30 minutes later. Validation is especially critical for modules consumed by multiple teams, enforcing organizational standards like "CIDR blocks must not overlap" that prevent production networking conflicts.

---

### Example 20: Variable Precedence

Terraform loads variables from multiple sources with defined precedence. Understanding precedence prevents unexpected values in production.

**Code**:

```hcl
# precedence.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

variable "app_name" {
# => Input variable
 description = "Application name" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "default-app" # => Precedence: 1 (lowest)
 # => Sets default
}

variable "environment" {
# => Input variable
 description = "Environment" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 default = "development" # => String value
 # => Sets default
}

resource "local_file" "precedence_demo" {
# => Resource definition
 filename = "precedence.txt" # => String value
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 App: ${var.app_name}
 # => Terraform configuration
 Environment: ${var.environment}
 # => Terraform configuration
 EOT
 # => Terraform configuration
}





```

**Variable precedence (lowest to highest)**:

1. **Variable defaults in configuration**

```hcl
variable "app_name" {
# => Input variable
default = "default-app" # => Precedence: 1


```

# => Default value makes variable optional

}

````

2. **Environment variables (`TF_VAR_name`)**

```bash
# $ export TF_VAR_app_name="env-app" # => Precedence: 2
# $ terraform apply


```

3. **`terraform.tfvars` file**

 ```hcl
 # terraform.tfvars (automatically loaded)
 app_name = "tfvars-app" # => Precedence: 3


```

4. **`*.auto.tfvars` files (alphabetically)**

 ```hcl
 # dev.auto.tfvars (automatically loaded)
 app_name = "auto-tfvars-app" # => Precedence: 4


```

5. **`-var-file` CLI option**

 ```bash
 # $ terraform apply -var-file="custom.tfvars"
 # custom.tfvars: app_name = "var-file-app" # => Precedence: 5


```

6. **`-var` CLI option (highest)**

 ```bash
 # $ terraform apply -var="app_name=cli-app" # => Precedence: 6 (highest)


```

**Complete example**:

```bash
# Configuration has default: "default-app"
# terraform.tfvars has: "tfvars-app"
# CLI provides: -var="app_name=cli-app"
# $ terraform apply -var="app_name=cli-app"
# => Result: "cli-app" (CLI has highest precedence)


```

**Key Takeaway**: CLI `-var` has highest precedence, followed by `-var-file`, `*.auto.tfvars`, `terraform.tfvars`, `TF_VAR_*` environment variables, and variable defaults. Use `terraform.tfvars` for environment defaults, CLI `-var` for overrides. Never commit sensitive values to tfvars files.

**Why It Matters**: Understanding precedence prevents production incidents from unexpected variable values. Teams commit terraform.tfvars with safe defaults but override sensitive values via CI/CD environment variables (highest precedence) at deploy time, keeping secrets out of version control. This layered configuration enables flexible workflows: developers use local tfvars for testing, CI/CD injects production credentials via -var, and emergency overrides use CLI flags without file modifications. Precedence mistakes cause real damage—auto.tfvars accidentally deployed to production because precedence wasn't understood, requiring emergency rollback.

---

### Example 21: Sensitive Variables

Sensitive variables prevent accidental exposure in logs, plan output, and state files. Essential for secrets, API keys, and credentials.

**Code**:

```hcl
# sensitive.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

# Sensitive variable declaration
variable "api_key" {
# => Input variable
 description = "API key for external service" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 sensitive = true # => Marks variable as sensitive
 # => Value hidden in plan/apply output as <sensitive>
}

variable "database_password" {
# => Input variable
 description = "Database password" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 sensitive = true # => Boolean value
 # => Sets sensitive
}

# Sensitive locals
locals {
# => Local values
 connection_string = "postgres://user:${var.database_password}@host:5432/db" # => String value
 # => Local inherits sensitive marking from var.database_password
}

resource "local_file" "config" {
# => Resource definition
 filename = "config.txt" # => String value
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 API Key: ${var.api_key}
 # => Terraform configuration
 Connection: ${local.connection_string}
 # => Terraform configuration
 EOT
 # => File content contains secrets (handle carefully)
}

# Sensitive output
output "api_key_output" {
# => Output value
 description = "API key (sensitive)"
 # => Human-readable description
 # => Sets description
 value = var.api_key
 # => Output value
 # => Sets value
 sensitive = true # => Output marked sensitive
 # => terraform output shows: <sensitive>
 # => terraform output -raw api_key_output shows actual value
}

output "connection_string" {
# => Output value
 description = "Database connection string"
 # => Human-readable description
 # => Sets description
 value = local.connection_string
 # => Output value
 # => Sets value
 sensitive = true
 # => Mark as sensitive (hide from output)
 # => Sets sensitive
}

# Non-sensitive output (derived from sensitive)
output "api_key_length" {
# => Output value
 description = "Length of API key (non-sensitive)"
 # => Human-readable description
 # => Sets description
 value = length(var.api_key)
 # => Output value
 # => Shows: 32 (length is not sensitive, actual value is)
}






```

**Usage**:

```bash
# Provide sensitive variables
# $ terraform apply -var="api_key=secret123" -var="database_password=pass123"

# Or via environment variables (recommended)
# $ export TF_VAR_api_key="secret123"
# $ export TF_VAR_database_password="pass123"
# $ terraform apply

# Plan output (sensitive values hidden)
# => var.api_key: <sensitive>
# => var.database_password: <sensitive>

# Output sensitive value
# $ terraform output api_key_output
# => <sensitive>

# Force show sensitive value
# $ terraform output -raw api_key_output
# => secret123 (actual value shown)


```

**State file behavior**:

```json
{
 "resources": [
 # => Terraform configuration
 {
 "instances": [
 # => Terraform configuration
 {
 "attributes": {
 # => Terraform configuration
 "content": "API Key: secret123\n.."
 # => Terraform configuration
 }
 }
 ]
 }
 ]
}


```

**⚠️ Sensitive values appear in plaintext in state file!** Always encrypt state (S3 encryption, Terraform Cloud encryption).

**Key Takeaway**: Mark sensitive variables with `sensitive = true` to prevent exposure in logs. Sensitive variables propagate to locals and outputs that reference them. Sensitive marking is for display only—values still appear in state file. Always encrypt state storage for production.

**Why It Matters**: Sensitive variable marking prevents accidental credential leaks in CI/CD logs and plan output pasted in tickets or shared in chat. However, sensitive values still appear plaintext in state files—this is why Terraform Cloud encrypts state and teams use S3 server-side encryption for self-managed backends. The sensitive flag is a safety net, not security—it prevents casual exposure but cannot protect against state file exfiltration. Real security requires encrypted state storage, access controls, and secret managers (Vault, AWS Secrets Manager) instead of hardcoded values.

---

### Example 22: Variable Files Organization

Organizing variable files by environment and purpose improves maintainability. Standard patterns separate shared values from environment-specific overrides.

**Code**:

**Directory structure**:

```
project/
├── main.tf
├── variables.tf # => Variable declarations (no values)
├── outputs.tf
├── terraform.tfvars # => Shared defaults
├── environments/
│ ├── dev.tfvars # => Development overrides
│ ├── staging.tfvars # => Staging overrides
│ └── prod.tfvars # => Production overrides
└── secrets/
 └── dev.secrets.tfvars # => Sensitive values (gitignored)
```

**`variables.tf`** (declarations only):

```hcl
variable "project_name" {
# => Input variable
 description = "Project name" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
}

variable "environment" {
# => Input variable
 description = "Environment name" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
}

variable "instance_count" {
# => Input variable
 description = "Number of instances" # => String value
 # => Sets description
 type = number
 # => Variable type constraint
 # => Type constraint ensures numeric value
}

variable "enable_monitoring" {
# => Input variable
 description = "Enable monitoring" # => String value
 # => Sets description
 type = bool
 # => Variable type constraint
 # => Type constraint ensures boolean value
}

variable "api_key" {
# => Input variable
 description = "API key" # => String value
 # => Sets description
 type = string
 # => Variable type constraint
 # => Type constraint ensures string value
 sensitive = true # => Boolean value
 # => Sets sensitive
}






```

**`terraform.tfvars`** (shared defaults):

```hcl
# Shared across all environments
project_name = "myapp"
# => Sets project_name
enable_monitoring = true
# => Sets enable_monitoring




```

**`environments/dev.tfvars`** (development):

```hcl
environment = "development"
# => Sets environment
instance_count = 1
# => Sets instance_count




```

**`environments/prod.tfvars`** (production):

```hcl
environment = "production"
# => Sets environment
instance_count = 3
# => Sets instance_count




```

**`secrets/dev.secrets.tfvars`** (sensitive, gitignored):

```hcl
api_key = "dev-api-key-12345"
# => Sets api_key




```

**`.gitignore`**:

```
# Ignore sensitive variable files
secrets/
*.secrets.tfvars

# Ignore state files
*.tfstate
*.tfstate.*
.terraform/
```

**Usage**:

```bash
# Development environment
# $ terraform apply -var-file="environments/dev.tfvars" -var-file="secrets/dev.secrets.tfvars"

# Production environment
# $ terraform apply -var-file="environments/prod.tfvars" -var-file="secrets/prod.secrets.tfvars"

# CI/CD usage
# $ terraform apply \
# -var-file="environments/${ENV}.tfvars" \
# -var="api_key=${API_KEY_FROM_CI}"


```

**Main configuration** (`main.tf`):

```hcl
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "config" {
# => Resource definition
 filename = "${var.environment}-config.txt" # => String interpolation
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 Project: ${var.project_name}
 # => Terraform configuration
 Environment: ${var.environment}
 # => Terraform configuration
 Instances: ${var.instance_count}
 # => Terraform configuration
 Monitoring: ${var.enable_monitoring}
 # => Terraform configuration
 EOT
 # => Terraform configuration
}






```

**Key Takeaway**: Separate variable declarations (`variables.tf`), shared defaults (`terraform.tfvars`), and environment overrides (`env.tfvars`). Never commit sensitive values—use gitignored `*.secrets.tfvars` or CI/CD secrets. Use `-var-file` to combine multiple variable files.

**Why It Matters**: Organized variable files enable clean environment promotion in CI/CD pipelines—same code deploys to dev/staging/prod by swapping tfvars files. This pattern is standard at companies managing multiple deployment targets, preventing environment-specific configuration from being hardcoded into the main configuration. Gitignored secrets files prevent the security breach of committed API keys discovered by automated scanners, which flag public repositories immediately and trigger credential rotation across all consuming services.

---

## Group 8: Data Sources Advanced

### Example 23: Data Source Dependencies

Data sources can depend on resources and other data sources. Understanding dependency order prevents errors when querying infrastructure that doesn't exist yet.

**Code**:

```hcl
# data_dependencies.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

# Step 1: Create base resource
resource "local_file" "base" {
# => Resource definition
 filename = "base.txt" # => String value
 # => Sets filename
 content = "Base file for data source" # => String value
 # => Sets content
}

# Step 2: Data source depends on resource
data "local_file" "read_base" {
# => Data source
 filename = local_file.base.filename # => Implicit dependency via reference
 # => Terraform creates base.txt before reading it
 # => No explicit depends_on needed when using references
}

# Step 3: Create resource using data source
resource "local_file" "derived" {
# => Resource definition
 filename = "derived.txt" # => String value
 # => Sets filename
 content = "Content from base: ${data.local_file.read_base.content}" # => String value
 # => Implicit dependency chain: base -> read_base -> derived
}

# Explicit dependency (when no reference exists)
resource "local_file" "source_explicit" {
# => Resource definition
 filename = "explicit.txt" # => String value
 # => Sets filename
 content = "Explicit source" # => String value
 # => Sets content
}

data "local_file" "read_explicit" {
# => Data source
 filename = "explicit.txt" # => String value
 # => Sets filename
 depends_on = [ # => Explicit dependency list

 local_file.source_explicit] # => Explicit dependency
 # => Use when data source doesn't reference resource attributes
}

# Multiple dependencies
resource "local_file" "file1" {
# => Resource definition
 filename = "file1.txt"
 # => Output file path
 # => Sets filename
 content = "File 1"
 # => File/resource content
 # => Sets content
}

resource "local_file" "file2" {
# => Resource definition
 filename = "file2.txt"
 # => Output file path
 # => Sets filename
 content = "File 2"
 # => File/resource content
 # => Sets content
}

data "local_file" "read_file1" {
# => Data source
 filename = local_file.file1.filename
 # => Output file path
 # => Sets filename
}

data "local_file" "read_file2" {
# => Data source
 filename = local_file.file2.filename
 # => Output file path
 # => Sets filename
}

# Resource depends on multiple data sources
resource "local_file" "combined" {
# => Resource definition
 filename = "combined.txt"
 # => Output file path
 # => Sets filename
 content = "${data.local_file.read_file1.content} + ${data.local_file.read_file2.content}"
 # => File/resource content
 # => Implicit dependencies: file1 -> read_file1 -\
 # => file2 -> read_file2 --> combined
}

output "dependency_chain" {
# => Output value
 value = {
 # => Output value
 base_content = data.local_file.read_base.content
 # => Sets base_content
 derived_content = local_file.derived.content
 # => Sets derived_content
 combined = local_file.combined.content
 # => Sets combined
 }
}





```

**Dependency graph**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["local_file.base"] --> B["data.local_file.read_base"]
 B --> C["local_file.derived"]

 D["local_file.file1"] --> E["data.local_file.read_file1"]
 F["local_file.file2"] --> G["data.local_file.read_file2"]
 E --> H["local_file.combined"]
 G --> H

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#0173B2,color:#fff
 style E fill:#DE8F05,color:#fff
 style F fill:#0173B2,color:#fff
 style G fill:#DE8F05,color:#fff
 style H fill:#CC78BC,color:#fff
```

**Key Takeaway**: Data sources automatically depend on referenced resources. Use explicit `depends_on` only when no reference exists (e.g., querying by name/tag instead of ID). Terraform executes in dependency order: resources first, then data sources that read them.

**Why It Matters**: Understanding data source dependencies prevents "data source queried before resource exists" errors that cause CI/CD pipeline failures. Implicit dependencies through references ensure Terraform creates VPC before data source queries its subnets, eliminating race conditions. This automatic ordering is critical for complex infrastructures where Proper dependency handling enables eventually-consistent APIs (AWS) where resources need propagation time before being queryable, preventing intermittent failures that plagued early Infrastructure as Code tools.

---

### Example 24: Terraform Data Source

The `terraform_remote_state` data source reads outputs from other Terraform configurations. Enables infrastructure composition without tight coupling.

**Code**:

**Configuration 1 (network)** - `network/main.tf`:

```hcl
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version

 backend "local" {
 # => Backend type for state storage
 # => Backend configuration for state storage
 path = "network.tfstate" # => Separate state file
 # => Sets path
 }
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "network_config" {
# => Resource definition
 filename = "network.txt" # => String value
 # => Sets filename
 content = "VPC: 10.0.0.0/16" # => String value
 # => Sets content
}

# Export values for other configurations
output "vpc_cidr" {
# => Output value
 value = "10.0.0.0/16" # => String value
 # => Sets value
}

output "subnet_cidrs" {
# => Output value
 value = ["10.0.1.0/24", "10.0.2.0/24"] # => List definition
 # => Sets value
}

output "vpc_id" {
# => Output value
 value = "vpc-12345" # => String value
 # => Sets value
}





```

**Configuration 2 (application)** - `app/main.tf`:

```hcl
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version

 backend "local" {
 # => Backend type for state storage
 # => Backend configuration for state storage
 path = "app.tfstate" # => Different state file
 # => Sets path
 }
}

provider "local" {}
# => Local provider for file-based examples

# Read outputs from network configuration
data "terraform_remote_state" "network" {
# => Terraform configuration block
 backend = "local" # => String value
 # => Sets backend

 config = { # => Map/object definition
 path = "./network/network.tfstate" # => Path to network state
 # => Sets path
 }
 # => Reads outputs from network configuration
}

# Use network outputs
resource "local_file" "app_config" {
# => Resource definition
 filename = "app.txt" # => String value
 # => Sets filename
 content = <<-EOT
 # => File/resource content
 # => Sets content
 VPC ID: ${data.terraform_remote_state.network.outputs.vpc_id}
 # => Terraform configuration block
 VPC CIDR: ${data.terraform_remote_state.network.outputs.vpc_cidr}
 # => Terraform configuration block
 Subnets: ${jsonencode(data.terraform_remote_state.network.outputs.subnet_cidrs)}
 # => Terraform configuration block
 EOT
 # => References network outputs via data source
}

output "app_network_info" {
# => Output value
 value = { # => Map/object definition
 vpc_id = data.terraform_remote_state.network.outputs.vpc_id
 # => Sets vpc_id
 vpc_cidr = data.terraform_remote_state.network.outputs.vpc_cidr
 # => Sets vpc_cidr
 subnet_count = length(data.terraform_remote_state.network.outputs.subnet_cidrs)
 # => Sets subnet_count
 }
}





```

**S3 backend example** (production pattern):

```hcl
# Network configuration with S3 backend
terraform {
# => Terraform configuration block
 backend "s3" {
 # => Backend type for state storage
 bucket = "terraform-state-bucket" # => String value
 # => Sets bucket
 key = "network/terraform.tfstate" # => String value
 # => Sets key
 region = "us-east-1" # => String value
 # => Sets region
 }
}

# Application reads from S3
data "terraform_remote_state" "network" {
# => Terraform configuration block
 backend = "s3" # => String value
 # => Sets backend

 config = { # => Map/object definition
 bucket = "terraform-state-bucket" # => String value
 # => Sets bucket
 key = "network/terraform.tfstate" # => String value
 # => Sets key
 region = "us-east-1" # => String value
 # => Sets region
 }
}





```

**Usage workflow**:

```bash
# Apply network configuration first
# $ cd network
# $ terraform init
# $ terraform apply

# Then apply application configuration
# $ cd ./app
# $ terraform init
# $ terraform apply
# => Reads network outputs from remote state


```

**Key Takeaway**: Use `terraform_remote_state` data source to share outputs between configurations. This enables infrastructure composition—network team manages VPC, application team reads VPC outputs. Only outputs are accessible (not full state). Always define outputs explicitly for values other configurations need.

**Why It Matters**: Remote state data sources enable organizational scaling where platform teams provision shared infrastructure (networks, clusters) and product teams consume outputs to deploy applications, eliminating coordination bottlenecks. This separation of concerns is how Only exposing outputs (not full state) provides abstraction boundaries and security: application teams can't access database passwords stored in network team's state, following principle of least privilege for infrastructure access.

---

## Group 9: State Management Patterns

### Example 25: State Backup and Recovery

Terraform automatically creates backup files before state modifications. Understanding backup strategy prevents catastrophic data loss.

**Code**:

```hcl
# state_backup.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Sets required_version

 backend "local" {
 # => Backend type for state storage
 # => Backend configuration for state storage
 path = "terraform.tfstate" # => String value
 # => Sets path
 }
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "backup_demo" {
# => Resource definition
 filename = "backup_demo.txt" # => String value
 # => Sets filename
 content = "State backup demonstration" # => String value
 # => Sets content
}





```

**Backup behavior**:

```bash
# Initial apply creates state
# $ terraform apply
# => Creates: terraform.tfstate

# Modify configuration and apply
# content = "Updated content"
# $ terraform apply
# => Creates backup: terraform.tfstate.backup (previous state)
# => Updates: terraform.tfstate (new state)

# Backup file structure
# $ ls -la
# => terraform.tfstate (current state)
# => terraform.tfstate.backup (previous state)

# Manual backup before risky operations
# $ cp terraform.tfstate terraform.tfstate.$(date +%Y%m%d-%H%M%S)
# => terraform.tfstate.20240115-143022 (timestamped backup)


```

**State recovery scenarios**:

**Scenario 1: Restore from automatic backup**

```bash
# Current state corrupted or wrong
# $ mv terraform.tfstate terraform.tfstate.broken
# $ mv terraform.tfstate.backup terraform.tfstate
# $ terraform plan
# => Uses restored state


```

**Scenario 2: Restore from manual backup**

```bash
# $ cp terraform.tfstate.20240115-143022 terraform.tfstate
# $ terraform plan
# => Restored to specific point in time


```

**Scenario 3: State lost but infrastructure exists**

```bash
# State file deleted but resources exist
# $ terraform import local_file.backup_demo backup_demo.txt
# => Re-imports existing resource into state


```

**Remote state backup** (S3 example):

```hcl
terraform {
# => Terraform configuration block
 backend "s3" {
 # => Backend type for state storage
 bucket = "terraform-state-bucket" # => String value
 # => Sets bucket
 key = "project/terraform.tfstate" # => String value
 # => Sets key
 region = "us-east-1" # => String value
 # => Sets region

 # S3 versioning provides automatic backup
 # Enable versioning on S3 bucket
 }
}

# S3 bucket versioning configuration (separate Terraform config)
resource "aws_s3_bucket_versioning" "state_bucket" {
# => Resource definition
 bucket = "terraform-state-bucket" # => String value
 # => Sets bucket

 versioning_configuration {
 # => Terraform configuration
 status = "Enabled" # => S3 keeps all state versions
 # => Sets status
 }
}





```

**Backup best practices**:

```hcl
# Script for production state backup
#!/bin/bash
# backup_state.sh

STATE_FILE="terraform.tfstate"
# => Sets STATE_FILE
BACKUP_DIR="state_backups"
# => Sets BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
# => Sets TIMESTAMP

mkdir -p "$BACKUP_DIR"
# => Terraform configuration
cp "$STATE_FILE" "$BACKUP_DIR/terraform.tfstate.$TIMESTAMP"
# => Terraform configuration

# Keep only last 10 backups
cd "$BACKUP_DIR"
# => Terraform configuration
ls -t terraform.tfstate.* | tail -n +11 | xargs rm -f
# => Terraform configuration



```

**Key Takeaway**: Terraform creates `.backup` files automatically before state changes. Always backup state before manual operations. Use S3 versioning or Git for remote state backups. Test state recovery procedures regularly. Never commit state files to public repositories—they contain sensitive data.

**Why It Matters**: State file loss causes infrastructure orphaning—resources still running and accumulating costs but Terraform cannot manage or destroy them. This happened to numerous teams before proper backup strategies: S3 bucket deleted, state lost, thousands of dollars in zombie resources until manual cleanup. Automatic backups and S3 versioning prevent these incidents, enabling point-in-time recovery when state corruption occurs. Testing recovery procedures is critical—a backup that has never been restored is an untested backup. Teams should practice state recovery quarterly to verify that backup procedures actually work and that engineers know the recovery steps before a real incident occurs.

---

### Example 26: State Refresh

State refresh updates Terraform state to match real infrastructure without modifying resources. Essential when infrastructure changes outside Terraform.

**Code**:

```hcl
# state_refresh.tf
terraform {
 # => terraform block configures provider requirements
 required_version = ">= 1.0" # => Terraform 1.0+ required
}

provider "local" {} # => Local provider for file operations

resource "local_file" "refresh_demo" {
 # => File resource to demonstrate drift detection
 filename = "refresh_demo.txt" # => File Terraform creates and tracks
 content  = "Original content" # => Initial content (drift detected if changed externally)
}

output "file_content" {
 # => Exposes content so refresh changes are visible
 value = local_file.refresh_demo.content # => Shows current state value after refresh
}


```

**Refresh scenarios**:

**Scenario 1: Manual file modification**

```bash
# Apply initial configuration
# $ terraform apply
# => Creates refresh_demo.txt with "Original content"

# Manually modify file outside Terraform
# $ echo "Modified content" > refresh_demo.txt

# Refresh state to detect drift
# $ terraform apply -refresh-only
# => Detects: content changed from "Original content" to "Modified content"
# => Updates state without modifying infrastructure
# => Shows: # local_file.refresh_demo will be updated in-place

# Review detected changes
# $ terraform show
# => State now reflects "Modified content"

# Next apply will restore to configuration
# $ terraform apply
# => Changes: content from "Modified content" to "Original content"


```

**Scenario 2: Resource deleted outside Terraform**

```bash
# Delete file manually
# $ rm refresh_demo.txt

# Refresh detects missing resource
# $ terraform apply -refresh-only
# => Detects: local_file.refresh_demo has been deleted
# => Removes from state

# Plan shows resource will be created
# $ terraform plan
# => Plan: 1 to add, 0 to change, 0 to destroy


```

**Refresh modes**:

```bash
# Refresh-only (safe, no infrastructure changes)
# $ terraform apply -refresh-only
# => Updates state only, no resource modifications
# => Prompts for confirmation

# Auto-approve refresh
# $ terraform apply -refresh-only -auto-approve
# => Refreshes without confirmation (CI/CD usage)

# Refresh during plan (default behavior)
# $ terraform plan
# => Automatically refreshes state before planning
# => Detected changes shown in plan output

# Disable refresh during plan
# $ terraform plan -refresh=false
# => Uses existing state without refreshing
# => Faster but may miss drift


```

**Drift detection workflow**:

```hcl
# Check for configuration drift
# $ terraform plan -refresh-only

# If drift detected, choose action:
# 1. Apply to restore to configuration
# $ terraform apply

# 2. Update configuration to match reality
# Edit .tf files to match current state

# 3. Accept drift and update state
# $ terraform apply -refresh-only -auto-approve


```

**Key Takeaway**: Use `terraform apply -refresh-only` to update state without modifying infrastructure. Refresh detects drift (changes made outside Terraform). Refresh happens automatically during `plan` and `apply`. Use `-refresh=false` to skip refresh for faster plans when drift detection isn't needed.

**Why It Matters**: Drift detection identifies unauthorized manual changes that violate infrastructure-as-code principles and create security vulnerabilities. When a junior engineer fixes a production outage via the AWS console instead of Terraform, refresh-only detects the change, prompting either restoration to the defined configuration or an explicit code update. This prevents configuration drift where actual infrastructure diverges from code, causing the "infrastructure does not match documentation" problem that makes incident response dangerous. Organizations like Netflix and Amazon enforce drift detection policies that trigger alerts when infrastructure diverges from its declared state, treating unmanaged drift as a security incident.

---

### Example 27: Targeting Specific Resources

Resource targeting applies changes to specific resources instead of entire configuration. Useful for debugging, gradual rollouts, and working around dependency issues.

**Code**:

```hcl
# targeting.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

resource "local_file" "file1" {
# => Resource definition
 filename = "file1.txt" # => String value
 # => Sets filename
 content = "File 1 content" # => String value
 # => Sets content
}

resource "local_file" "file2" {
# => Resource definition
 filename = "file2.txt" # => String value
 # => Sets filename
 content = "File 2 content" # => String value
 # => Sets content
}

resource "local_file" "file3" {
# => Resource definition
 filename = "file3.txt" # => String value
 # => Sets filename
 content = "File 3 content" # => String value
 # => Sets content
}

resource "local_file" "file4" {
# => Resource definition
 filename = "file4.txt" # => String value
 # => Sets filename
 content = "File 4 depends on file3" # => String value
 # => Sets content
 depends_on = [ # => Explicit dependency list

 local_file.file3]
 # => Explicit dependency enforces creation order
}





```

**Targeting operations**:

**Target single resource**:

```bash
# Plan changes for specific resource only
# $ terraform plan -target=local_file.file1
# => Plans changes only for file1, ignores file2, file3, file4

# Apply to specific resource
# $ terraform apply -target=local_file.file1
# => Creates/updates only file1
# => Other resources unchanged


```

**Target multiple resources**:

```bash
# Plan multiple targets
# $ terraform plan -target=local_file.file1 -target=local_file.file2
# => Plans changes for file1 and file2

# Apply multiple targets
# $ terraform apply -target=local_file.file1 -target=local_file.file2


```

**Target with dependencies**:

```bash
# Target resource with dependencies
# $ terraform apply -target=local_file.file4
# => Terraform includes dependencies automatically
# => Applies: file3 (dependency) and file4 (target)


```

**Target modules** (covered in intermediate):

```bash
# Target entire module
# $ terraform apply -target=module.network

# Target resource in module
# $ terraform apply -target=module.network.aws_vpc.main


```

**Destroy specific resources**:

```bash
# Destroy only file2
# $ terraform destroy -target=local_file.file2
# => Removes only file2, leaves file1, file3, file4


```

**Use cases for targeting**:

1. **Debugging specific resources**:

 ```bash
 # $ terraform apply -target=aws_instance.problematic


```

2. **Gradual rollout**:

 ```bash
 # $ terraform apply -target=aws_instance.web[0]
 # $ terraform apply -target=aws_instance.web[1]


```

3. **Work around temporary issues**:

 ```bash
 # $ terraform apply -target=module.database
 # Wait for database ready, then:
 # $ terraform apply # Apply rest of configuration


```

**⚠️ Warning**: Targeting creates partial state updates and can lead to inconsistencies. Use sparingly, primarily for debugging. Always follow targeted apply with full apply to ensure consistency.

```bash
# After targeted operations, always run full apply
# $ terraform apply -target=resource.name # Targeted operation
# $ terraform apply # Full apply to fix consistency


```

**Key Takeaway**: Use `-target` to limit operations to specific resources and their dependencies. Essential for debugging but dangerous for regular use—it can create state inconsistencies. Always run full `terraform apply` after targeted operations to restore consistency.

**Why It Matters**: Targeting enables surgical infrastructure fixes during production incidents without touching unrelated resources, reducing blast radius. When database performance degrades, target database configuration changes without risking network or compute modifications. However, overuse creates partial state that causes "plan shows unexpected changes" confusion. This is why targeting should be treated as an emergency tool, not a routine workflow—teams that habitually use targeting end up with state inconsistencies that surface as mysterious drift. Targeting also enables gradual rollouts: deploy 1 instance, verify, target the next instance, preventing "deployed 100 broken instances simultaneously" failures.

---

### Example 28: Import Existing Resources

Terraform import brings existing infrastructure under Terraform management. Essential for migrating to Terraform or recovering from state loss.

**Code**:

```hcl
# import.tf
terraform {
# => Terraform configuration block
 required_version = ">= 1.0" # => String value
 # => Ensures version 1.0+ features available
}

provider "local" {}
# => Local provider for file-based examples

# Step 1: Create resource block (without apply)
resource "local_file" "imported" {
# => Resource definition
 filename = "existing.txt" # => String value
 # => Sets filename
 content = "This file already exists" # => String value
 # => Resource block must exist before import
 # => Configuration should match existing resource
}

resource "local_file" "imported2" {
# => Resource definition
 filename = "existing2.txt" # => String value
 # => Sets filename
 content = "Another existing file" # => String value
 # => Sets content
}



```

**Import workflow**:

**Step 1: Create existing resource manually** (simulating pre-existing infrastructure):

```bash
# $ echo "This file already exists" > existing.txt
# $ echo "Another existing file" > existing2.txt


```

**Step 2: Write resource block** (configuration must match existing resource):

```hcl
resource "local_file" "imported" {
# => Resource definition
 filename = "existing.txt" # => String value
 # => Sets filename
 content = "This file already exists" # => String value
 # => Sets content
}





```

**Step 3: Import resource**:

```bash
# Import syntax: terraform import RESOURCE_ADDRESS RESOURCE_ID
# $ terraform import local_file.imported existing.txt
# => Reads existing.txt and adds to state
# => Output: local_file.imported: Import successful!


```

**Step 4: Verify import**:

```bash
# Check state
# $ terraform state list
# => local_file.imported

# View imported resource
# $ terraform state show local_file.imported

# Verify configuration matches
# $ terraform plan
# => Should show: No changes. Infrastructure is up-to-date.
# => If changes shown, configuration doesn't match existing resource


```

**Import multiple resources**:

```bash
# Import each resource individually
# $ terraform import local_file.imported existing.txt
# $ terraform import local_file.imported2 existing2.txt


```

**Complex import example (AWS)**:

```hcl
# Resource configuration
resource "aws_instance" "imported_server" {
# => Resource aws_instance.imported_server
 ami = "ami-0c55b159cbfafe1f0" # => String value
 instance_type = "t2.micro" # => String value
 # .. other required attributes
}

# Import command
# $ terraform import aws_instance.imported_server i-1234567890abcdef0
# => Imports existing EC2 instance by instance ID


```

**Import challenges and solutions**:

**Challenge 1: Unknown attribute values**

```bash
# Import first, then extract attributes
# $ terraform import aws_instance.web i-12345
# $ terraform state show aws_instance.web
# => Copy attribute values to configuration


```

**Challenge 2: Complex resources**

```hcl
# Use terraform state show output to guide configuration
# $ terraform state show resource.name > resource.json
# => Review all attributes and add to configuration


```

**Challenge 3: Import blocks (Terraform 1.5+)**

```hcl
# Import block (declarative import)
import {
# => Terraform configuration
 to = local_file.imported
 # => Sets to
 id = "existing.txt" # => String value
 # => Sets id
}

resource "local_file" "imported" {
# => Resource definition
 filename = "existing.txt" # => String value
 # => Sets filename
 content = "This file already exists" # => String value
 # => Sets content
}

# Run plan to see import
# $ terraform plan
# => Shows: local_file.imported will be imported

# Apply to execute import
# $ terraform apply
# => Imports resource into state



```

**Import workflow diagram**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Existing Resource<br/>in Cloud"] --> B["Write Resource<br/>Configuration"]
 B --> C["terraform import<br/>ADDR ID"]
 C --> D["Verify:<br/>terraform plan"]
 D --> E{Changes?}
 E -->|Yes| F["Adjust Config<br/>to Match"]
 E -->|No| G["Import Complete"]
 F --> D

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CA9161,color:#fff
 style F fill:#DE8F05,color:#fff
 style G fill:#029E73,color:#fff
```

**Key Takeaway**: Import brings existing resources under Terraform management. Must write resource configuration before importing. Import adds resource to state but doesn't generate configuration automatically. Use `terraform state show` to view imported attributes and adjust configuration. Import is one-way—it doesn't modify existing resources.

**Why It Matters**: Import enables gradual Terraform adoption without destroying and recreating existing infrastructure—critical for production systems that cannot tolerate downtime. Organizations like Stripe and Airbnb used import to bring thousands of manually provisioned resources under Terraform management without service interruptions. Import also recovers from state loss: if a state file is deleted but resources still exist, import reconstructs state and restores Terraform management. The import workflow (write config, import, verify plan) ensures configuration matches reality before any modifications, preventing the "import caused unexpected changes" surprises that plagued early import implementations.

---

**🎯 Beginner level complete!** You've covered HCL fundamentals, providers, resources, variables, data sources, and state management. These foundations enable basic infrastructure provisioning and management. Proceed to [Intermediate](/en/learn/software-engineering/infrastructure/tools/terraform/by-example/intermediate) for modules, remote state, workspaces, and production patterns.
````
