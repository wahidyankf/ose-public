---
title: "Intermediate"
date: 2025-12-29T22:43:50+07:00
draft: false
weight: 10000002
description: "Examples 28-54: Production patterns including roles, handlers, templates, vault, error handling, and task control (40-75% coverage)"
tags: ["ansible", "tutorial", "by-example", "intermediate", "roles", "handlers", "templates", "vault", "production"]
---

Learn Ansible production patterns through 27 annotated code examples. Each example demonstrates real-world automation techniques used in enterprise environments.

## Group 7: Roles & Galaxy

### Example 28: Basic Role Structure

Roles organize playbooks into reusable components with standardized directory structure. Each role encapsulates related tasks, variables, files, and templates for a specific function.

**Core Role Components:**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Role<br/>webserver"] --> B["tasks/main.yml<br/>Task definitions"]
 A --> C["handlers/main.yml<br/>Service handlers"]
 A --> D["templates/<br/>Jinja2 templates"]
 A --> E["files/<br/>Static files"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CA9161,color:#fff
```

**Variable Hierarchy:**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Role<br/>webserver"] --> F["vars/main.yml<br/>Role variables"]
 A --> G["defaults/main.yml<br/>Default variables"]

 style A fill:#0173B2,color:#fff
 style F fill:#029E73,color:#fff
 style G fill:#DE8F05,color:#fff
```

**Role Metadata:**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Role<br/>webserver"] --> H["meta/main.yml<br/>Dependencies"]

 style A fill:#0173B2,color:#fff
 style H fill:#CC78BC,color:#fff
```

**Code**:

Create role directory structure:

```bash
# ansible-galaxy init webserver
# Creates standard role structure
```

**`roles/webserver/defaults/main.yml`**:

```yaml
---
# Default variables (lowest precedence)
# => defaults/main.yml provides baseline values
# => Can be overridden by inventory, playbook, or extra-vars

http_port: 80 # => HTTP listening port
# => Default: 80 (standard HTTP)
# => Overridable for non-standard configurations

https_port: 443 # => HTTPS listening port
# => Default: 443 (standard HTTPS)

document_root: /var/www/html # => Web content directory
# => Path where HTML/static files served from
# => Must exist before nginx starts

server_name: localhost # => Virtual host server name
# => Matches HTTP Host header
# => Default: localhost (generic)
```

**`roles/webserver/vars/main.yml`**:

```yaml
---
# Role variables (higher precedence than defaults)
# => vars/main.yml contains role internals
# => Should NOT be overridden (use defaults for that)

nginx_package: nginx # => Package name for installation
# => Fixed: nginx (role-specific constant)
# => Used by ansible.builtin.package module

nginx_service: nginx # => systemd service name
# => Fixed: nginx
# => Used for service state management

config_file: /etc/nginx/sites-available/default # => Config file path
# => Debian/Ubuntu path convention
# => Template deployment destination
```

**`roles/webserver/tasks/main.yml`**:

```yaml
---
# Main task file for webserver role
# => tasks/main.yml is the role entry point
# => Executes sequentially when role applied
# => Auto-loaded when role referenced in playbook

- name: Install web server # => Step 1: Package installation
 # => Task name visible in playbook execution output
 ansible.builtin.package: # => OS-agnostic package module
 # => Abstracts apt/yum/dnf/pacman differences
 name: "{{ nginx_package }}" # => Uses var from vars/main.yml
 # => Resolves to "nginx"
 # => Variable interpolation with Jinja2 {{ }}
 state: present # => Ensure package installed
 # => Idempotent: safe to run multiple times
 # => changed: [host] if package newly installed
 # => ok: [host] if package already present

- name: Create document root # => Step 2: Directory setup
 # => Ensures web content directory exists
 ansible.builtin.file: # => File/directory management module
 # => Handles files, directories, symlinks
 path: "{{ document_root }}" # => Uses var from defaults/main.yml
 # => Resolves to "/var/www/html"
 # => Overridable via play or inventory vars
 state: directory # => Ensure path is a directory
 # => Creates if missing, verifies if exists
 mode: "0755" # => rwxr-xr-x permissions
 # => Owner read/write/execute, others read/execute
 # => Octal notation requires quotes in YAML
 # => changed: [host] if directory created
 # => ok: [host] if directory exists with correct mode

- name: Deploy configuration # => Step 3: Config file from template
 # => Renders Jinja2 template with role variables
 ansible.builtin.template: # => Jinja2 template rendering
 # => Processes {{ variables }}, {% logic %}
 src: nginx.conf.j2 # => Template from templates/ directory
 # => Relative path: roles/webserver/templates/nginx.conf.j2
 # => Ansible searches role's templates/ folder
 dest: "{{ config_file }}" # => Destination path
 # => Resolves to "/etc/nginx/sites-available/default"
 # => Target location for rendered config
 mode: "0644" # => rw-r--r-- permissions
 # => Owner read/write, others read-only
 notify: restart nginx # => Trigger handler if config changes
 # => Handler queued for execution at play end
 # => Only executes if this task reports "changed"
 # => changed: [host] if template content differs from destination
 # => ok: [host] if template content matches destination

- name: Ensure service is running # => Step 4: Service state management
 # => Guarantees nginx active and boot-enabled
 ansible.builtin.service: # => systemd/init service module
 # => Abstracts systemd/SysV/upstart/OpenRC
 name: "{{ nginx_service }}" # => Service name
 # => Resolves to "nginx"
 # => systemd unit name
 state: started # => Ensure service running
 # => Starts if stopped, no-op if already running
 enabled: true # => Enable on boot (systemctl enable)
 # => Creates systemd symlink for auto-start
 # => changed: [host] if service stopped or disabled
 # => ok: [host] if service already running and enabled
```

**`roles/webserver/handlers/main.yml`**:

```yaml
---
# Handlers for service management
# => handlers/main.yml contains event-driven tasks
# => Execute at play end only if notified

- name: restart nginx # => Handler name (must match notify value)
 ansible.builtin.service: # => Service control module
 name: "{{ nginx_service }}" # => Service to restart
 # => Resolves to "nginx"
 state: restarted # => Stop then start service
 # => Executes only if notified by task changes
 # => Runs once per play even if notified multiple times
 # => Output: changed: [host] (nginx.service restarted)
```

**`roles/webserver/templates/nginx.conf.j2`**:

```nginx
# Nginx virtual host configuration template
# => Jinja2 template with variable substitution
# => Rendered by ansible.builtin.template module

server { # => Virtual host block
 listen {{ http_port }}; # => Listen port from defaults/main.yml
 # => Renders to: listen 80;
 # => Binds to all interfaces on port 80

 server_name {{ server_name }}; # => Host header matching
 # => Renders to: server_name localhost;
 # => Matches requests with Host: localhost

 root {{ document_root }}; # => Document root from defaults
 # => Renders to: root /var/www/html;
 # => Base path for static file serving

 index index.html; # => Default index file
 # => Serve index.html when directory requested
}
```

**Playbook using role**:

```yaml
---
# webserver_playbook.yml
# => Playbook that applies webserver role to target hosts

- name: Deploy Web Server # => Play name
 hosts: webservers # => Target host group from inventory
 # => Executes on all hosts in webservers group
 become: true # => Escalate privileges (sudo/root)
 # => Required for package installation and service management

 roles: # => Roles to apply to hosts
 - webserver # => Apply webserver role
 # => Automatically includes:
 # => - roles/webserver/tasks/main.yml (tasks)
 # => - roles/webserver/handlers/main.yml (handlers)
 # => - roles/webserver/defaults/main.yml (default vars)
 # => - roles/webserver/vars/main.yml (role vars)
 # => - roles/webserver/templates/* (templates)
 # => Execution order:
 # => 1. Load variables (defaults, vars)
 # => 2. Execute tasks sequentially
 # => 3. Run notified handlers at play end
```

**Run**: `ansible-playbook webserver_playbook.yml`

**Key Takeaway**: Roles enable code reuse and logical organization. Use `defaults/main.yml` for overridable defaults, `vars/main.yml` for fixed values. The `roles` keyword automatically includes tasks, handlers, variables, and files from role directories. Role structure is standardized—any Ansible user recognizes the layout.

**Why It Matters**: Roles are the foundation of reusable Ansible automation at scale. Production environments with hundreds of playbooks rely on role composition to avoid code duplication and enforce standards. The standardized directory structure enables teams to collaborate effectively—any engineer can navigate an unfamiliar role instantly. Galaxy's 25,000+ community roles demonstrate this pattern's universal adoption.

---

### Example 29: Role Variables and Precedence

Role variables come from multiple sources with specific precedence rules. Understanding precedence prevents unexpected values in complex playbooks.

**Code**:

**`roles/app/defaults/main.yml`**:

```yaml
---
# Defaults (precedence: 2 - lowest for roles)
# => defaults/main.yml provides baseline configuration
# => Designed to be overridden by higher precedence sources

app_port: 8080 # => Default application port
# => Precedence: 2 (easily overridden)
# => Can be changed by inventory, play vars, role params, extra-vars

app_env: development # => Default environment
# => Precedence: 2
# => Common override: staging, production via inventory

debug_enabled: false # => Default debug mode
# => Precedence: 2
# => Disabled by default for performance
```

**`roles/app/vars/main.yml`**:

```yaml
---
# Role vars (precedence: 18)
# => vars/main.yml contains role constants
# => High precedence - should NOT be overridden

app_name: MyApplication # => Fixed role variable
# => Precedence: 18 (only extra-vars can override)
# => Role-specific constant, not configurable

config_dir: /etc/myapp # => Application config directory
# => Precedence: 18
# => Fixed path for role's configuration files
```

**Playbook**:

```yaml
---
# role_precedence.yml
# => Demonstrates variable precedence hierarchy

- name: Role Variable Precedence # => Play name
 hosts: localhost # => Execute on localhost
 gather_facts: false # => Skip fact gathering for speed

 # Play vars (precedence: 15)
 # => Variables defined at play level
 vars:
 app_port: 9090 # => Override default 8080
 # => Precedence: 15 (higher than defaults: 2)
 # => Overrides roles/app/defaults/main.yml
 # => Does NOT override roles/app/vars/main.yml (precedence 18)
 app_env: staging # => Override default development
 # => Precedence: 15

 roles:
 - role: app # => Apply app role
 # Role parameters (precedence: 17)
 # => Variables passed directly to role
 vars:
 debug_enabled: true # => Override default false
 # => Precedence: 17 (higher than play vars: 15)
 # => Overrides roles/app/defaults/main.yml
 # => Does NOT override roles/app/vars/main.yml (precedence 18)

 # => Variable resolution order for this play:
 # => 1. app_name: MyApplication (vars/main.yml - precedence 18)
 # => 2. config_dir: /etc/myapp (vars/main.yml - precedence 18)
 # => 3. debug_enabled: true (role params - precedence 17)
 # => 4. app_port: 9090 (play vars - precedence 15)
 # => 5. app_env: staging (play vars - precedence 15)

 tasks:
 - name: Display final configuration # => Show merged values
 ansible.builtin.debug: # => Print message module
 msg: | # => Multi-line message
 App: {{ app_name }}
 Port: {{ app_port }}
 Environment: {{ app_env }}
 Debug: {{ debug_enabled }}
 Config Dir: {{ config_dir }}
 # => Output:
 # => App: MyApplication (from vars - precedence 18)
 # => Port: 9090 (from play vars - precedence 15)
 # => Environment: staging (from play vars - precedence 15)
 # => Debug: true (from role params - precedence 17)
 # => Config Dir: /etc/myapp (from vars - precedence 18)
```

**Run with extra-vars (precedence: 22 - highest)**:

```bash
# Run playbook with extra-vars
ansible-playbook role_precedence.yml -e "app_port=3000"
# => -e flag passes extra-vars (precedence: 22 - highest)
# => Overrides all other variable sources including vars/main.yml

# Multiple extra-vars
ansible-playbook role_precedence.yml -e "app_port=3000 app_env=production"
# => Override multiple variables simultaneously
# => Useful for CI/CD parameter injection
```

**Key Takeaway**: Variable precedence from lowest to highest: role defaults < inventory vars < play vars < role vars < extra-vars. Use `defaults/main.yml` for overridable configuration, `vars/main.yml` for fixed role internals. Pass role-specific overrides using role parameters (`vars:` under role declaration).

**Why It Matters**: Variable precedence conflicts cause 40% of Ansible bugs in production. Understanding the 22-level precedence hierarchy prevents unexpected overrides when combining roles, inventories, and playbooks. The `extra-vars` highest-precedence rule enables CI/CD systems to safely override any configuration without modifying playbook source code.

---

### Example 30: Role Dependencies

Roles can depend on other roles using `meta/main.yml`. Dependencies install automatically and execute before the dependent role.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Database Role<br/>Applied"] --> B["Check Dependencies<br/>meta/main.yml"]
 B --> C["Execute Common<br/>Role First"]
 B --> D["Execute Firewall<br/>Role Second"]
 C --> E["Database Tasks<br/>Execute Last"]
 D --> E

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#029E73,color:#fff
 style E fill:#CC78BC,color:#fff
```

**Code**:

**`roles/database/meta/main.yml`**:

```yaml
---
# Database role dependencies
# => meta/main.yml defines role dependencies
# => Dependencies execute BEFORE current role

dependencies: # => List of required roles
 # => Dependencies execute before current role's tasks
 # => Ensures prerequisites satisfied before main role
 - role: common # => First dependency
 # => Always executes before firewall and database
 # => Execution order: 1st
 # => Provides baseline system configuration
 vars: # => Pass variables to dependency
 # => Override dependency's default values
 ntp_server: time.example.com # => Override default NTP server
 # => Custom NTP server for time synchronization
 # => dependency-specific variable override
 # => Scoped to common role only

 - role: firewall # => Second dependency
 # => Executes after common, before database
 # => Execution order: 2nd
 # => Configures network access rules
 vars: # => Configure firewall for database
 # => Database-specific firewall configuration
 allowed_ports: # => Ports to open
 # => YAML list of ports to allow through firewall
 - 5432 # => PostgreSQL default port
 # => TCP port for database connections
 # => Firewall configured before database installation
 # => Ensures connectivity ready when service starts
 # => Prevents connection failures after database starts
```

**`roles/common/tasks/main.yml`**:

```yaml
---
# Common role tasks
# => Provides baseline system configuration
# => Executed as dependency by other roles
# => Shared foundation for all dependent roles

- name: Update package cache # => Refresh package metadata
 # => Ensures latest package versions available
 ansible.builtin.apt: # => Debian/Ubuntu package manager
 # => APT module provides cache management
 # => Debian-specific (yum/dnf for RHEL)
 update_cache: true # => Run apt-get update
 # => Refreshes package index from repositories
 # => Downloads latest package metadata
 cache_valid_time: 3600 # => Skip if updated within 1 hour
 # => Prevents redundant updates (performance optimization)
 # => 3600 seconds = 1 hour cache validity
 when: ansible_os_family == "Debian" # => Only on Debian-based systems
 # => Conditional ensures APT only runs on Debian/Ubuntu
 # => ansible_os_family fact populated by setup module
 # => changed: [host] if cache refreshed
 # => ok: [host] if cache fresh (within 3600 seconds)

- name: Install common packages # => Base utility installation
 # => Installs baseline tools for all systems
 ansible.builtin.package: # => OS-agnostic package module
 # => Cross-platform package installation
 # => Automatically selects apt/yum/dnf/pacman
 name: # => Package list (YAML array)
 # => Multiple packages installed in single transaction
 # => Efficient bulk installation
 - curl # => HTTP client utility
 # => Required for downloading files
 # => Used by many deployment scripts
 - vim # => Text editor
 # => Standard editor for configuration files
 # => Essential for server administration
 - git # => Version control system
 # => Essential for deployment workflows
 # => Clone repositories, manage configs
 state: present # => Ensure all packages installed
 # => Idempotent: installs only if missing
 # => changed: [host] if any package newly installed
 # => ok: [host] if all packages already present
```

**`roles/firewall/tasks/main.yml`**:

```yaml
---
# Firewall role tasks
# => Configures UFW (Uncomplicated Firewall)
# => Executed as dependency before application roles
# => Security layer for network access

- name: Install UFW # => Install firewall package
 ansible.builtin.package: # => Package module
 name: ufw # => Uncomplicated Firewall
 # => Frontend for iptables
 state: present # => Ensure installed
 when: ansible_os_family == "Debian" # => Debian/Ubuntu only
 # => UFW is Debian-specific tool
 # => changed: [host] if UFW newly installed
 # => ok: [host] if UFW already present

- name: Allow SSH # => Critical: Prevent lockout
 # => First rule to configure (safety measure)
 community.general.ufw: # => UFW management module
 # => From community.general collection
 rule: allow # => Allow connection
 # => Permits inbound traffic on specified port
 port: "22" # => SSH port
 # => String format required by UFW module
 # => Standard SSH port (default)
 proto: tcp # => TCP protocol
 # => SSH uses TCP (not UDP)
 # => MUST execute before enabling firewall
 # => Prevents SSH lockout on remote systems
 # => changed: [host] if rule added
 # => ok: [host] if rule exists

- name: Allow application ports # => Open ports from dependency vars
 community.general.ufw: # => UFW module
 rule: allow # => Allow incoming connections
 port: "{{ item }}" # => Port from loop iteration
 # => First iteration: 5432 (PostgreSQL)
 # => Variable substitution
 proto: tcp # => TCP protocol
 loop: "{{ allowed_ports }}" # => Variable from database role
 # => allowed_ports from database/meta/main.yml
 # => Iterates: [5432]
 # => changed: [host] if rule added
 # => ok: [host] if rule exists

- name: Enable UFW # => Activate firewall
 community.general.ufw: # => UFW module
 state: enabled # => Enable and start firewall
 # => Activates configured rules
 # => Activates all configured rules
 # => changed: [host] if UFW disabled
 # => ok: [host] if UFW already enabled
```

**`roles/database/tasks/main.yml`**:

```yaml
---
# Database role tasks (executes AFTER dependencies)
# => Runs 3rd: After common (1st) and firewall (2nd)
# => Dependencies guarantee system ready

- name: Install PostgreSQL # => Database package installation
 ansible.builtin.package: # => Package module
 name: postgresql # => PostgreSQL database
 # => Relational database system
 state: present # => Ensure installed
 # => Executes after common role installed base packages
 # => Executes after firewall role opened port 5432
 # => changed: [host] if PostgreSQL newly installed
 # => ok: [host] if PostgreSQL already present

- name: Ensure PostgreSQL is running # => Service management
 ansible.builtin.service: # => Service module
 name: postgresql # => PostgreSQL service name
 state: started # => Ensure service running
 # => Starts if stopped
 enabled: true # => Enable on boot
 # => Creates systemctl symlink
 # => Service starts with port 5432 open (firewall dependency)
 # => changed: [host] if service stopped or disabled
 # => ok: [host] if service already running and enabled
```

**Playbook**:

```yaml
---
# database_playbook.yml
# => Deploy database with automatic dependency resolution

- name: Deploy Database Server # => Play name
 hosts: dbservers # => Target database servers from inventory
 become: true # => Escalate privileges (required for package/service)

 roles:
 - database # => Apply database role
 # => Automatic dependency resolution from database/meta/main.yml
 # => Execution order (automatic):
 # => 1. common role (dependency #1)
 # => 2. firewall role (dependency #2)
 # => 3. database role (primary role)
 # => No need to explicitly list common and firewall roles
 # => Dependencies resolved and executed automatically
 # => Dependencies execute first automatically
```

**Run**: `ansible-playbook database_playbook.yml`

**Key Takeaway**: Role dependencies in `meta/main.yml` ensure prerequisite roles execute first. Dependencies run once even if multiple roles depend on the same role (unless `allow_duplicates: true`). Pass variables to dependencies using `vars:` parameter. This pattern enables composable, layered automation.

**Why It Matters**: Role dependencies automate prerequisite installation in layered architectures. Database roles depend on security hardening, monitoring, and backup roles—dependencies ensure the correct execution order without manual orchestration. The `allow_duplicates` setting prevents redundant execution when multiple roles share common dependencies, ---

### Example 31: Ansible Galaxy - Using Community Roles

Ansible Galaxy hosts thousands of community-maintained roles. Use `ansible-galaxy` command to install, list, and manage roles from Galaxy or private repositories.

**Code**:

**Install role from Galaxy**:

```bash
# Install specific role from Ansible Galaxy
ansible-galaxy install geerlingguy.nginx
# => Downloads latest version from galaxy.ansible.com
# => Installs to ~/.ansible/roles/geerlingguy.nginx

# Install with version constraint
ansible-galaxy install geerlingguy.nginx,2.8.0
# => Installs specific version 2.8.0 using comma-separated format
# => Ensures reproducible deployments

# Install multiple roles from requirements file
ansible-galaxy install -r requirements.yml
# => Batch install all roles with version pins from YAML file
# => Idempotent: Skips already-installed versions
```

**`requirements.yml`**:

```yaml
---
# Galaxy roles
# => Roles from galaxy.ansible.com
# => Public role repository maintained by community

- name: geerlingguy.nginx # => Galaxy role (namespace.name format)
 # => Author: geerlingguy, Role: nginx
 version: 2.8.0 # => Pin to version 2.8.0
 # => Optional: Omit for latest version
 # => Best practice: Always pin versions for reproducibility
 # => Prevents unexpected updates breaking playbooks

- name: geerlingguy.postgresql # => PostgreSQL database role
 # => Popular role for PostgreSQL installation
 version: 3.4.1 # => Pin to version 3.4.1
 # => Prevents breaking changes from auto-updates
 # => Specific version ensures consistency across teams

# Git repository roles
# => Roles from custom Git repositories
# => Use for internal/private roles not on Galaxy
- src: https://github.com/example/ansible-role-custom.git # => Git URL
 # => HTTPS URL for Git repository
 name: custom_role # => Local role name (how to reference in playbook)
 # => Name required for Git sources (no namespace inference)
 # => Used in playbook: roles: [custom_role]
 version: main # => Git branch or tag
 # => Default: main/master branch
 # => Can use tags: v1.0.0 or commit SHA
 # => Commit SHA provides immutable reference

# Local roles path override
# => Roles from local filesystem (development/testing)
- src: ./local-roles/internal-role # => Relative or absolute path
 name: internal_role # => Local role name
 # => Useful for internal/proprietary roles
 # => No version control (uses current filesystem state)
```

**Playbook using Galaxy role**:

```yaml
---
# galaxy_roles.yml
# => Playbook demonstrating Galaxy role integration
- name: Use Galaxy Roles # => Play name
 # => Describes playbook purpose
 hosts: webservers # => Target host group
 # => Executes on all hosts in webservers inventory group
 become: true # => Escalate privileges
 # => Required for package installation and service management
 # => Uses sudo/su based on target system

 roles: # => Roles to apply
 # => Executes role tasks in order
 - role: geerlingguy.nginx # => Galaxy role reference
 # => Format: namespace.rolename
 # => geerlingguy = Galaxy namespace (author)
 # => nginx = role name (web server)
 # => Must be installed via ansible-galaxy first
 vars: # => Pass configuration to role
 # => Override role default variables
 # => Role-specific configuration
 nginx_vhosts: # => Virtual hosts configuration
 # => Variable name expected by geerlingguy.nginx role
 # => Check role documentation for required/optional vars
 # => List of virtual host definitions
 - listen: "80" # => HTTP port
 # => Virtual host listens on port 80
 # => Standard HTTP port (unencrypted)
 server_name: "example.com" # => Domain name
 # => Matches HTTP Host header
 # => Used for name-based virtual hosting
 root: "/var/www/html" # => Document root
 # => Path to serve static files from
 # => Base directory for web content
 # => Role executes its tasks with these variables
 # => Configures nginx with virtual host
 # => Installs package, writes config, starts service

 tasks: # => Additional tasks after role execution
 # => Runs after all roles complete
 - name: Verify nginx is running # => Post-role validation
 # => Confirms role successfully configured service
 ansible.builtin.service: # => Service module
 # => Query/manage system services
 name: nginx # => Service name
 # => systemd unit name
 state: started # => Ensure running
 # => Verify service is active
 # => Validates role successfully started service
 # => ok: [host] if nginx running (expected)
 # => changed: [host] if nginx stopped (unexpected)
 # => Failure indicates role configuration error
```

**List installed roles**:

```bash
# List all installed roles
ansible-galaxy list
# => Shows all roles in ~/.ansible/roles/
# => Output: namespace.rolename, version
# => Example: geerlingguy.nginx, 2.8.0

# Show role information
ansible-galaxy info geerlingguy.nginx
# => Displays role metadata: description, platforms, versions, dependencies
# => Useful before installing to check compatibility

# Remove installed role
ansible-galaxy remove geerlingguy.nginx
# => Deletes role from ~/.ansible/roles/
# => Use when upgrading or cleaning up unused roles
```

**Key Takeaway**: Ansible Galaxy accelerates automation by providing pre-built, tested roles for common software stacks. Use `requirements.yml` for version-pinned, reproducible role installations. Always review Galaxy role documentation for required variables and dependencies. Popular roles like `geerlingguy.*` are production-ready and well-maintained.

**Why It Matters**: Galaxy accelerates development by providing battle-tested roles for common stacks—nginx, PostgreSQL, Docker, Kubernetes. The `geerlingguy.*` namespace alone saves enterprises thousands of engineering hours annually. Version pinning in `requirements.yml` ensures reproducible deployments across dev, staging, and production environments.

---

### Example 32: Creating Distributable Roles

Create reusable roles for sharing via Galaxy or private repositories. Follow role structure conventions and include comprehensive metadata.

**Code**:

**Initialize role with Galaxy template**:

```bash
# Create role skeleton with standard structure
ansible-galaxy init --init-path roles/ myapp
# => Creates standardized role structure in roles/myapp/
# => Includes: tasks, handlers, templates, files, vars, defaults, meta, tests
```

**`roles/myapp/meta/main.yml`**:

```yaml
---
# Role metadata for Ansible Galaxy
# => meta/main.yml describes role for Galaxy publication

galaxy_info: # => Galaxy-specific metadata
 author: Your Name # => Role author/maintainer
 # => Displayed on Galaxy role page

 description: Deploys and configures MyApp # => Short description
 # => Appears in Galaxy search results
 # => Keep concise (1-2 sentences)

 license: MIT # => Role license
 # => Common: MIT, Apache-2.0, GPL-3.0, BSD-3-Clause

 min_ansible_version: 2.14 # => Minimum Ansible version
 # => Prevents role execution on incompatible versions
 # => Galaxy validates this during import

 platforms: # => Supported OS platforms
 # => Tested and supported distributions
 - name: Ubuntu # => Distribution name
 versions: # => Supported versions
 - focal # => Ubuntu 20.04 LTS
 - jammy # => Ubuntu 22.04 LTS
 - name: Debian # => Distribution name
 versions: # => Supported versions
 - bullseye # => Debian 11
 - bookworm # => Debian 12

 galaxy_tags: # => Galaxy search/filter tags
 # => Help users discover role (max 20 tags)
 - web # => Tag for web-related roles
 - application # => General application deployment
 - deployment # => Deployment automation

dependencies: [] # => Role dependencies
# => Empty list: no dependencies
# => Non-empty: roles that must execute first
# => Format: [{role: namespace.rolename, version: "1.0.0"}]
```

**`roles/myapp/README.md`**:

````markdown
# Ansible Role: myapp

Deploys and configures MyApp web application.

## Requirements

- Ansible 2.14+
- Ubuntu 20.04+ or Debian 11+
- Python 3.8+

## Role Variables

Available variables with defaults (defaults/main.yml):

```yaml
myapp_version: "1.0.0" # Application version
myapp_port: 8080 # HTTP port
myapp_user: myapp # System user
myapp_install_dir: /opt/myapp # Installation directory
```
````

## Dependencies

None.

## Example Playbook

```yaml
- hosts: appservers
 roles:
 - role: myapp
 vars:
 myapp_version: "2.0.0"
 myapp_port: 9090
```

## License

MIT

## Author

Your Name

````

**`roles/myapp/defaults/main.yml`**:
```yaml
---
# Overridable defaults
# => defaults/main.yml: Lowest priority variables (easily overridden)
# => Override with: group_vars, host_vars, or playbook vars
myapp_version: "1.0.0" # => Default version (override: myapp_version: "2.0.0")
myapp_port: 8080 # => Default HTTP port (override per environment)
myapp_user: myapp # => System user for running application
myapp_group: myapp # => System group for file ownership
myapp_install_dir: /opt/myapp # => Installation directory root
myapp_config_file: /etc/myapp/config.yml # => Configuration file path
# => All vars have sane defaults so role works without any overrides
# => Users only specify vars they need to change from defaults
````

**`roles/myapp/tasks/main.yml`**:

```yaml
---
# Main tasks
# => tasks/main.yml: Primary task list, automatically loaded when role applied
- name: Include OS-specific variables
 ansible.builtin.include_vars: "{{ ansible_os_family }}.yml"
 # => ansible_os_family: Fact with OS family ("Debian", "RedHat", "Darwin")
 # => Loads: vars/Debian.yml (Ubuntu/Debian) or vars/RedHat.yml (RHEL/CentOS)
 # => Enables cross-platform role with OS-specific package names/paths

- name: Create application user
 ansible.builtin.user: # => User module: manage system users
 name: "{{ myapp_user }}" # => Username: myapp (from defaults)
 group: "{{ myapp_group }}" # => Primary group: myapp
 system: true # => system: true: Create as system account (UID < 1000)
 create_home: false # => No home directory needed (daemon user)
 # => changed: [localhost] - User created
 # => ok: [localhost] - User already exists (idempotent)

- name: Create installation directory
 ansible.builtin.file: # => File module: create directories
 path: "{{ myapp_install_dir }}" # => Path: /opt/myapp (from defaults)
 state: directory # => Create directory if missing
 owner: "{{ myapp_user }}" # => Owned by application user
 group: "{{ myapp_group }}" # => Group: myapp
 mode: "0755" # => Permissions: rwxr-xr-x (owner full, others read/exec)
 # => changed: [localhost] - Directory created with correct ownership

- name: Deploy application
 ansible.builtin.get_url: # => get_url module: download files via HTTP
 url: "https://releases.example.com/myapp-{{ myapp_version }}.tar.gz"
 # => URL: https://releases.example.com/myapp-1.0.0.tar.gz
 dest: "/tmp/myapp-{{ myapp_version }}.tar.gz"
 # => dest: /tmp/myapp-1.0.0.tar.gz (temp location before extraction)
 # => changed: [localhost] - File downloaded
 # => ok: [localhost] - File already exists with correct checksum (idempotent)

- name: Extract application
 ansible.builtin.unarchive: # => Unarchive module: extract archives
 src: "/tmp/myapp-{{ myapp_version }}.tar.gz"
 # => Source: /tmp/myapp-1.0.0.tar.gz (just downloaded)
 dest: "{{ myapp_install_dir }}" # => Extract to: /opt/myapp
 remote_src: true # => remote_src: Archive already on remote host (not controller)
 owner: "{{ myapp_user }}" # => Set extracted file ownership to myapp
 group: "{{ myapp_group }}" # => Set group ownership
 # => changed: [localhost] - Application files extracted to /opt/myapp

- name: Deploy configuration
 ansible.builtin.template: # => Template module: render Jinja2 config
 src: config.yml.j2 # => Template in templates/ directory
 dest: "{{ myapp_config_file }}" # => dest: /etc/myapp/config.yml
 owner: "{{ myapp_user }}" # => Config owned by app user
 group: "{{ myapp_group }}" # => Group ownership
 mode: "0640" # => Permissions: rw-r----- (owner read/write, group read, no other)
 notify: restart myapp # => Trigger handler if config changes
 # => changed: [localhost] - Config updated, 'restart myapp' handler queued
 # => ok: [localhost] - Config unchanged, handler NOT triggered
```

**Test role locally**:

```yaml
---
# tests/test.yml
- hosts: localhost # => Test against local machine
 become: true # => Escalate privileges (role requires root for user/dir creation)
 roles:
 - myapp # => Apply role with all defaults from defaults/main.yml
 # => Tests full role execution: user creation, download, extract, config
 # => Verify: check /opt/myapp exists, myapp user created, service running
```

**Run test**: `ansible-playbook tests/test.yml`

**Key Takeaway**: Distributable roles require comprehensive metadata in `meta/main.yml` and clear documentation in `README.md`. Use `defaults/main.yml` for all configurable parameters with sensible defaults. Include OS-specific variable files for cross-platform compatibility. Test roles thoroughly before publishing to Galaxy.

**Why It Matters**: Distributable roles enable internal reuse across multiple projects and teams. Platform teams publish standardized roles to private Galaxy servers, enforcing security policies and operational best practices organization-wide. Comprehensive `meta/main.yml` metadata and platform compatibility matrices prevent runtime failures when roles are deployed to heterogeneous infrastructures.

---

### Example 33: Role Include and Import

Dynamic role inclusion enables conditional role application and runtime role selection. `include_role` loads at runtime, `import_role` loads at parse time.

**Code**:

```yaml
---
# dynamic_roles.yml
# => Demonstrates dynamic vs static role inclusion

- name: Dynamic Role Inclusion # => Play name
 hosts: localhost # => Execute on localhost
 gather_facts: true # => Gather facts (needed for group_names)

 vars: # => Variables for dynamic role selection
 server_type: webserver # => Dynamic role selector
 # => Value determines which role to include
 # => Could be: webserver, appserver, database
 enable_monitoring: true # => Conditional flag
 # => Controls whether monitoring role included

 tasks:
 # Static import (parse-time)
 # => import_role processes at playbook parse time

 - name: Import role statically # => Static role import
 ansible.builtin.import_role: # => Parse-time inclusion
 name: common # => Role name (fixed, not variable)
 # => Always imported during playbook parsing
 # => Tasks added to play even if skipped by conditionals
 # => Supports --tags and --skip-tags
 # => Best for: Roles that should always be parsed

 # Dynamic include (runtime)
 # => include_role processes during playbook execution
 - name: Include role dynamically # => Runtime role inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: "{{ server_type }}" # => Role name from variable
 # => Resolves to "webserver" at runtime
 # => Variable interpolation possible
 # => Role loaded only when task executes
 # => Allows conditional role selection
 # => Does NOT support --tags on role tasks

 # Conditional role inclusion
 # => Include role only if condition met
 - name: Include monitoring role if enabled # => Conditional inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: monitoring # => Monitoring role
 when: enable_monitoring # => Condition: only if true
 # => Evaluates: enable_monitoring is true
 # => Role included: monitoring tasks execute
 # => If false: entire role skipped
 # => Efficient: Role not loaded if skipped

 # Include specific tasks from role
 # => Load subset of role tasks
 - name: Include specific role tasks # => Partial role inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: webserver # => Role name
 tasks_from: install # => Specific task file
 # => tasks_from: Load tasks/install.yml instead of tasks/main.yml
 # => Executes: roles/webserver/tasks/install.yml only
 # => Useful for: Large roles with logical task separation
 # => Example: Install vs configure vs upgrade tasks

 # Apply role to subset of hosts
 # => Host-specific role application
 - name: Include role for specific hosts # => Host-filtered inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: database # => Database role
 when: "'dbservers' in group_names" # => Condition: host in group
 # => group_names: List of groups this host belongs to
 # => Evaluates true only on hosts in dbservers group
 # => Role applies selectively based on host membership
 # => Efficient: No role processing on non-db hosts

 # Include role with custom variables
 # => Override role defaults per inclusion
 - name: Include role with vars # => Parameterized role inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: application # => Application role
 vars: # => Variables scoped to this inclusion
 app_version: "2.0.0" # => Override default version
 # => Overrides defaults/main.yml value
 app_port: 9090 # => Override default port
 # => Variables scoped to this role execution only
 # => Different inclusions can have different values
 # => Useful for: Multi-instance deployments

 # Loop over roles
 # => Apply multiple roles iteratively
 - name: Include multiple roles dynamically # => Loop-based inclusion
 ansible.builtin.include_role: # => Runtime inclusion
 name: "{{ item }}" # => Role name from loop iteration
 # => First iteration: logging
 # => Second iteration: metrics
 # => Third iteration: tracing
 loop: # => List of role names
 - logging # => Observability role 1
 - metrics # => Observability role 2
 - tracing # => Observability role 3
 # => Executes each role sequentially
 # => Equivalent to three separate include_role tasks
 # => Useful for: Applying related role suites
```

**Run**: `ansible-playbook dynamic_roles.yml`

**Key Takeaway**: Use `include_role` for conditional or dynamic role application at runtime. Use `import_role` for static inclusion with tag support. The `tasks_from` parameter allows partial role inclusion—useful for breaking large roles into logical task files. Dynamic role selection enables playbooks that adapt to host groups or runtime conditions.

**Why It Matters**: Dynamic role inclusion enables playbooks that adapt to runtime conditions—different roles for production vs development, or OS-specific roles selected by `ansible_os_family`. The `tasks_from` parameter allows partial role execution, essential for large roles where only specific functionality is needed (e.g., certificate renewal without full web server reconfiguration).

---

## Group 8: Handlers & Notifications

### Example 34: Handler Basics

Handlers execute once at the end of a play, triggered by task changes. Prevent redundant service restarts and enable efficient orchestration.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Task 1<br/>Change Config"] -->|notify| B["Handler Queue"]
 C["Task 2<br/>Change Template"] -->|notify| B
 D["Task 3<br/>No Change"] -.->|skip| B
 B --> E["Play End"]
 E --> F["Execute Handler Once"]

 style A fill:#0173B2,color:#fff
 style C fill:#0173B2,color:#fff
 style D fill:#CA9161,color:#fff
 style B fill:#DE8F05,color:#fff
 style E fill:#029E73,color:#fff
 style F fill:#CC78BC,color:#fff
```

**Code**:

```yaml
---
# handlers_basic.yml
# => Demonstrates handler event-driven execution

- name: Handler Basics # => Play name
 hosts: localhost # => Execute on localhost
 become: true # => Escalate privileges (required for nginx)
 gather_facts: false # => Skip fact gathering for speed

 handlers: # => Handler definitions section
 # Handlers execute at play end, only if notified

 - name: restart nginx # => Handler name (must match notify value)
 # => Event-driven task triggered by notify
 ansible.builtin.service: # => Service management module
 name: nginx # => Service to restart
 state: restarted # => Stop then start service
 # => Executes ONLY if notified by task change
 # => Executes ONLY ONCE per play (deduplicated)
 # => Runs after ALL tasks complete

 tasks: # => Task definitions section
 # Task 1: Notify handler on change

 - name: Update nginx configuration # => Config file update
 ansible.builtin.copy: # => File copy module
 dest: /etc/nginx/nginx.conf # => Destination path
 content: | # => File content (multi-line)
 events {}
 http {
 server {
 listen 8080;
 }
 }
 # => Content: Minimal nginx config
 notify: restart nginx # => Notify handler if content changes
 # => Triggers "restart nginx" handler
 # => changed: [localhost] → handler queued
 # => ok: [localhost] → handler not queued

 # Task 2: Notify same handler (deduplication test)
 - name: Update site configuration # => Site-specific config
 ansible.builtin.copy: # => File copy module
 dest: /etc/nginx/sites-available/default # => Site config file
 content: | # => File content
 server {
 listen 80;
 root /var/www/html;
 }
 # => Content: Virtual host configuration
 notify: restart nginx # => Notify same handler
 # => Even if BOTH tasks change, handler runs ONCE
 # => Prevents redundant restarts (efficiency)

 # Task 3: No notification (baseline task)
 - name: Create web root # => Directory creation
 ansible.builtin.file: # => File module
 path: /var/www/html # => Directory path
 state: directory # => Ensure directory exists
 mode: "0755" # => rwxr-xr-x permissions
 # => No notify: handler not affected by this task
 # => changed: [localhost] if directory created
 # => ok: [localhost] if directory exists

 # Execution Order:
 # => 1. All tasks execute sequentially
 # => 2. Handler notifications queued during task execution
 # => 3. After last task: handlers execute (deduplicated)
 # => 4. "restart nginx" runs once if notified by any task
```

**Run**: `ansible-playbook handlers_basic.yml --ask-become-pass`

**Key Takeaway**: Handlers execute once at play end even if notified multiple times. This prevents redundant service restarts when multiple configuration changes occur. Handlers only execute if notifying tasks report "changed" status—idempotent tasks won't trigger handlers unnecessarily.

**Why It Matters**: Handlers prevent cascading service restarts that cause production outages. Without handlers, 10 config changes trigger 10 nginx restarts—handlers consolidate to one restart at play end. This pattern is critical in zero-downtime deployments where service disruptions must be minimized and controlled.

---

### Example 35: Handler Notification Patterns

Multiple handlers can be triggered by a single task. Handlers execute in definition order, not notification order.

**Code**:

```yaml
---
# handler_patterns.yml
# => Demonstrates multiple handler notification patterns

- name: Handler Notification Patterns # => Play name
 hosts: localhost # => Execute on localhost
 become: true # => Escalate privileges (for service management)
 gather_facts: false # => Skip fact gathering

 handlers: # => Handler definitions
 # Handlers execute in THIS order (definition order)
 # NOT in notification order

 - name: restart nginx # => Handler 1 (definition order)
 ansible.builtin.service: # => Service module
 name: nginx # => Service name
 state: restarted # => Full restart (stop + start)
 # => Execution order: 1st (if queued)
 # => Downtime: ~1-2 seconds during restart

 - name: reload nginx # => Handler 2 (definition order)
 ansible.builtin.service: # => Service module
 name: nginx # => Service name
 state: reloaded # => Graceful reload (no downtime)
 # => Execution order: 2nd (if queued)
 # => Reloads config without dropping connections

 - name: restart php-fpm # => Handler 3 (definition order)
 ansible.builtin.service: # => Service module
 name: php-fpm # => PHP FastCGI Process Manager
 state: restarted # => Full restart
 # => Execution order: 3rd (if queued)
 # => Required when PHP config changes

 - name: clear cache # => Handler 4 (definition order)
 ansible.builtin.file: # => File module
 path: /var/cache/app # => Cache directory
 state: absent # => Remove directory
 # => Execution order: 4th (if queued)
 # => Clears application cache

 tasks:
 # Single notification pattern
 # => Task notifies one handler

 - name: Update nginx config # => Config file update
 ansible.builtin.copy: # => File copy module
 dest: /etc/nginx/nginx.conf # => Destination path
 content: "events {}\nhttp {}\n" # => Minimal config
 notify: restart nginx # => Single handler notification
 # => Syntax: notify: handler_name
 # => Queues "restart nginx" if task reports changed
 # => No queue if task reports ok (unchanged)

 # Multiple notifications pattern
 # => Task notifies multiple handlers
 - name: Update PHP config # => PHP configuration change
 ansible.builtin.copy: # => File copy module
 dest: /etc/php/php.ini # => PHP config file
 content: | # => Multi-line content
 [PHP]
 memory_limit = 256M
 notify: # => List of handlers to notify
 - restart php-fpm # => Handler 1 notification
 # => Queues restart php-fpm
 - clear cache # => Handler 2 notification
 # => Queues clear cache
 # => Both handlers queued if task changes
 # => Execution: restart php-fpm (3rd), then clear cache (4th)
 # => Order determined by handler definition, not notify order

 # Notification with list syntax (alternative)
 # => Another example of multi-handler notification
 - name: Update application code # => Application file update
 ansible.builtin.copy: # => File copy module
 dest: /var/www/app/index.php # => PHP application file
 content: "<?php phpinfo(); ?>" # => PHP code
 notify: # => Handler list
 - reload nginx # => Graceful reload (no downtime)
 # => Reload instead of restart (better for production)
 - clear cache # => Clear cache after code update
 # => Queues reload nginx and clear cache
 # => Execution: reload nginx (2nd), then clear cache (4th)

 # Handler execution order (after all tasks complete):
 # => Handlers execute in DEFINITION order, NOT notification order
 # => Order:
 # => 1. restart nginx (if queued by task 1)
 # => 2. reload nginx (if queued by task 3)
 # => 3. restart php-fpm (if queued by task 2)
 # => 4. clear cache (if queued by task 2 or 3)
```

**Run**: `ansible-playbook handler_patterns.yml --ask-become-pass`

**Key Takeaway**: Tasks can notify multiple handlers using list syntax under `notify:`. Handlers execute in the order they're defined in the `handlers:` section, not in notification order. Use `reload` handlers for configuration changes that don't require full restarts, reducing downtime.

**Why It Matters**: Multi-handler notifications enable complex orchestration like "reload nginx, then clear cache, then warm cache"—executed in defined order only when changes occur. The `listen` keyword decouples task notifications from handler names, allowing multiple handlers to respond to abstract events like "web server config changed" without tasks knowing handler implementation details.

---

### Example 36: Flush Handlers and Listen

Force handler execution mid-play with `meta: flush_handlers`. Use `listen` to group handlers under common topic.

**Code**:

```yaml
---
# flush_handlers.yml
# => Demonstrates flush_handlers and listen patterns

- name: Flush Handlers and Listen # => Play name
 hosts: localhost # => Execute on localhost
 become: true # => Escalate privileges
 gather_facts: false # => Skip fact gathering

 handlers: # => Handler definitions with listen topics
 # listen keyword enables topic-based handler grouping
 # Multiple handlers can listen to same topic

 - name: restart nginx service # => Handler 1
 ansible.builtin.service: # => Service module
 name: nginx # => Nginx service
 state: restarted # => Full restart
 listen: restart web services # => Topic this handler listens to
 # => Triggered when notify: restart web services
 # => Multiple handlers can share same topic
 # => Decouples tasks from handler implementation

 - name: restart apache service # => Handler 2
 ansible.builtin.service: # => Service module
 name: apache2 # => Apache service
 state: restarted # => Full restart
 listen: restart web services # => Same topic as handler 1
 # => BOTH nginx and apache restart when topic notified
 # => Topic pattern: One notification triggers multiple handlers
 # => Execution: Both handlers run (definition order)

 - name: reload configuration # => Handler 3
 ansible.builtin.command: # => Command module
 cmd: /usr/local/bin/reload-config.sh # => Custom reload script
 listen: restart web services # => Same topic again
 # => Three handlers listening to one topic
 # => All three execute when "restart web services" notified
 # => Useful for: Cascading service operations

 tasks:
 # Task 1: Notify topic (not specific handler)
 # => Demonstrates topic-based notification

 - name: Update shared configuration # => Config update
 ansible.builtin.copy: # => File copy module
 dest: /etc/shared/config.conf # => Shared config file
 content: "setting=value\n" # => Config content
 notify: restart web services # => Notify TOPIC, not handler name
 # => Queues ALL handlers listening to this topic
 # => Queued: restart nginx, restart apache, reload configuration
 # => Handlers won't execute yet (wait for play end)

 # Task 2: Force immediate handler execution
 # => Demonstrates meta: flush_handlers
 - name: Flush handlers immediately # => Force handler execution
 ansible.builtin.meta: flush_handlers # => Meta module
 # => Executes ALL queued handlers IMMEDIATELY
 # => Execution order (from handlers section):
 # => 1. restart nginx service
 # => 2. restart apache service
 # => 3. reload configuration
 # => Handlers run NOW, not at play end
 # => Clears handler queue

 # Task 3: Run after handlers
 # => Demonstrates dependency on flushed handlers
 - name: Verify services are running # => Post-handler verification
 ansible.builtin.service: # => Service module
 name: nginx # => Check nginx status
 state: started # => Ensure running
 # => Runs AFTER handlers flushed
 # => nginx already restarted by handler 1
 # => Verification task depends on handler completion
 # => Without flush: would run BEFORE handlers

 # Task 4: Notify again after flush
 # => Demonstrates handlers can execute multiple times
 - name: Update another config # => Second config update
 ansible.builtin.copy: # => File copy module
 dest: /etc/shared/other.conf # => Different config file
 content: "other=value\n" # => Different content
 notify: restart web services # => Notify same topic again
 # => Queues handlers AGAIN (after first flush)
 # => Handlers can execute multiple times per play
 # => Second queue: restart nginx, restart apache, reload config

 # Execution timeline:
 # => 1. Task 1: Update config → queue handlers
 # => 2. Task 2: flush_handlers → execute handlers (1st time)
 # => 3. Task 3: Verify services → nginx already restarted
 # => 4. Task 4: Update another config → queue handlers again
 # => 5. Play end → execute handlers (2nd time)

 # Final handlers execute here at play end
 # => restart web services handlers run SECOND time
 # => Only if task 4 changed (notified after flush)
```

**Run**: `ansible-playbook flush_handlers.yml --ask-become-pass`

**Key Takeaway**: Use `listen` to group related handlers under topic names—one notification triggers multiple handlers. Use `meta: flush_handlers` to force immediate handler execution mid-play—critical when subsequent tasks depend on handler changes. Handlers can execute multiple times per play if flushed and notified again.

**Why It Matters**: Forced handler execution with `meta: flush_handlers` prevents circular dependencies in multi-tier deployments. When database schema changes must complete before application deployment, flush_handlers ensures database restarts finish mid-play instead of waiting until play end. This pattern is essential for ordered rollouts across dependent services.

---

### Example 37: Handler Conditionals and Error Handling

Handlers support conditionals and error handling like regular tasks. Control handler execution based on facts or variables.

**Code**:

```yaml
---
# handler_conditionals.yml
# => Demonstrates handler conditionals and error handling

- name: Handler Conditionals and Error Handling # => Play name
 hosts: localhost # => Execute on localhost
 become: true # => Escalate privileges
 gather_facts: true # => Gather facts (needed for OS detection)

 vars: # => Play-level variables
 production_mode: true # => Environment flag
 # => Controls production-specific handlers
 enable_service_restart: true # => Service restart toggle
 # => Allows disabling restarts in maintenance mode

 handlers: # => Handler definitions with conditionals
 # Pattern 1: Simple conditional handler
 # => Handler executes only if condition true

 - name: restart nginx # => Conditional service restart
 ansible.builtin.service: # => Service module
 name: nginx # => Service name
 state: restarted # => Restart action
 when: enable_service_restart # => Condition: variable must be true
 # => Handler runs only if enable_service_restart is true
 # => If false: handler queued but skipped
 # => Useful for: Maintenance windows (disable restarts)

 # Pattern 2: OS-specific conditional handler
 # => Handler adapts to operating system
 - name: restart web server # => OS-adaptive restart
 ansible.builtin.service: # => Service module
 name: "{{ 'apache2' if ansible_os_family == 'Debian' else 'httpd' }}" # => Dynamic service name
 # => Debian/Ubuntu: apache2
 # => RedHat/CentOS: httpd
 state: restarted # => Restart action
 when: ansible_os_family in ['Debian', 'RedHat'] # => OS family filter
 # => Executes only on Debian or RedHat systems
 # => Skipped on: FreeBSD, Windows, etc.
 # => Pattern: Cross-platform playbooks

 # Pattern 3: Error-tolerant handler
 # => Handler that never fails playbook
 - name: reload application # => Graceful application reload
 ansible.builtin.command: # => Command module
 cmd: /usr/local/bin/app reload # => Custom reload command
 register: reload_result # => Capture result for inspection
 # => Stores: rc (return code), stdout, stderr
 failed_when: false # => Never mark as failed
 # => Always reports: ok (even if command returns non-zero)
 # => Prevents handler failure from stopping playbook
 # => Useful for: Optional operations

 # Pattern 4: Chained conditional handler
 # => Handler depends on previous handler result
 - name: report reload failure # => Conditional failure reporting
 ansible.builtin.debug: # => Debug message module
 msg: "WARNING: Application reload failed" # => Warning message
 when: reload_result is defined and reload_result.rc != 0 # => Multi-condition
 # => Condition 1: reload_result exists (previous handler ran)
 # => Condition 2: Return code != 0 (command failed)
 # => Executes only if previous handler registered failure
 # => Pattern: Error reporting without failing playbook

 # Pattern 5: Environment-specific handler
 # => Handler runs only in specific environments
 - name: send notification # => Production notification
 ansible.builtin.uri: # => HTTP request module
 url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL # => Slack webhook
 method: POST # => HTTP POST
 body_format: json # => JSON payload
 body: # => Request body
 text: "Configuration updated on {{ inventory_hostname }}" # => Message
 # => inventory_hostname: Current host name
 when: production_mode # => Condition: production only
 # => Executes only if production_mode is true
 # => Skipped in: development, staging environments
 # => Prevents notification spam in non-prod

 tasks:
 # Task 1: Notify all handlers
 # => Demonstrates multiple handler notifications

 - name: Update configuration # => Config file update
 ansible.builtin.copy: # => File copy module
 dest: /etc/app/config.yml # => Application config
 content: | # => YAML content
 port: 8080
 debug: false
 notify: # => Notify multiple handlers
 - restart nginx # => Handler 1: Conditional restart
 - reload application # => Handler 2: Error-tolerant reload
 - report reload failure # => Handler 3: Chained conditional
 - send notification # => Handler 4: Production-only
 # => All handlers queued if task changes
 # => Handler conditions evaluated at execution time
 # => Execution order: Definition order (handlers section)

 # Task 2: Demonstrate conditional skip
 # => Task-level variable overrides play variable
 - name: Update non-critical config # => Non-critical update
 ansible.builtin.copy: # => File copy module
 dest: /tmp/test.conf # => Temporary file
 content: "test=value\n" # => Test content
 notify: restart nginx # => Notify restart handler
 vars: # => Task-level variables
 enable_service_restart: false # => Override play variable
 # => Task-level: false (overrides play-level: true)
 # => Handler queued but skipped when executed
 # => when: enable_service_restart evaluates to false
 # => Pattern: Selective handler disabling per task
```

**Run**: `ansible-playbook handler_conditionals.yml --ask-become-pass`

**Key Takeaway**: Handlers support `when` conditionals for environment-aware execution. Use `failed_when: false` in handlers to prevent failures from stopping playbook. Chain handlers with `register` and conditionals for error recovery. Handler conditionals enable safe rollouts where restarts are conditional on environment or success state.

**Why It Matters**: Conditional handlers prevent failures in heterogeneous environments where services exist on some hosts but not others. Error handling in handlers ensures that failed service restarts don't silently succeed—notifications are re-queued for retry. This reliability pattern is critical for production playbooks managing mixed infrastructure.

---

## Group 9: Templates (Jinja2)

### Example 38: Jinja2 Template Basics

Jinja2 templates combine static text with dynamic variables. The `template` module renders templates on control node and copies to managed hosts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Template<br/>app_config.yml.j2"] --> B["Jinja2 Variables<br/>app_name, version"]
 B --> C["Jinja2 Engine<br/>Render"]
 C --> D["Rendered File<br/>app_config.yml"]
 D --> E["Copy to Target<br/>/etc/app/config.yml"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CA9161,color:#fff
```

**Code**:

**`templates/app_config.yml.j2`**:

```jinja2
# Application Configuration
# => Jinja2 template file (*.j2 extension)
# => Rendered by ansible.builtin.template module

# Generated by Ansible on {{ ansible_date_time.iso8601 }}
# => ansible_date_time: Automatic variable from gather_facts
# => .iso8601: ISO 8601 timestamp format
# => Renders to: 2024-01-15T10:30:00Z

application:
 name: {{ app_name }} # => Variable substitution
 # => {{ variable }}: Jinja2 expression delimiter
 # => Renders to: MyApplication
 version: {{ app_version }}
 # => Renders to: 2.1.0
 environment: {{ app_environment }}
 # => Renders to: production

server:
 host: {{ server_host }}
 # => Renders to: 0.0.0.0 (bind all interfaces)
 port: {{ server_port }}
 # => Renders to: 8080
 workers: {{ worker_count }}
 # => Renders to: 4

database:
 host: {{ db_host }}
 # => Renders to: db.example.com
 port: {{ db_port }}
 # => Renders to: 5432 (PostgreSQL default)
 name: {{ db_name }}
 # => Renders to: appdb
 user: {{ db_user }}
 # => Renders to: appuser
 # Password managed by Ansible Vault
 # => Sensitive data not in template (separate vault file)

logging:
 level: {{ log_level | upper }} # => Filter: convert to uppercase
 # => | upper: Jinja2 filter (string transformation)
 # => log_level is "info"
 # => Renders to: INFO (uppercase)
 file: {{ log_file | default('/var/log/app.log') }} # => Default value filter
 # => | default('value'): Provides fallback if variable undefined
 # => log_file not defined in playbook
 # => Renders to: /var/log/app.log (default value)
```

**Playbook**:

```yaml
---
# template_basics.yml
# => Demonstrates basic Jinja2 template usage

- name: Jinja2 Template Basics # => Play name
 hosts: localhost # => Execute on localhost
 gather_facts: true # => Required for ansible_date_time variable

 vars: # => Variables for template substitution
 app_name: MyApplication # => Application name
 # => Used in template: {{ app_name }}
 app_version: "2.1.0" # => Version string
 # => Quoted to preserve as string (not float)
 app_environment: production # => Environment identifier
 server_host: 0.0.0.0 # => Listen on all interfaces
 server_port: 8080 # => HTTP port
 worker_count: 4 # => Worker processes
 db_host: db.example.com # => Database hostname
 db_port: 5432 # => PostgreSQL default port
 db_name: appdb # => Database name
 db_user: appuser # => Database username
 log_level: info # => Logging level (lowercase)
 # => Template will uppercase: INFO
 # log_file not defined
 # => Template will use default: /var/log/app.log

 tasks:
 - name: Render application configuration # => Template rendering
 ansible.builtin.template: # => Template module
 src: app_config.yml.j2 # => Template source file
 # => Path relative to playbook or templates/ directory
 # => Searches: playbook dir, playbook/templates/
 dest: /tmp/app_config.yml # => Destination on managed host
 # => Fully rendered file copied here
 mode: "0644" # => rw-r--r-- permissions
 # => Owner read/write, group/others read
 # => Process:
 # => 1. Load template from control node
 # => 2. Render with Jinja2 engine (variable substitution)
 # => 3. Copy rendered content to managed host
 # => changed: [localhost] if destination content differs
 # => ok: [localhost] if destination content identical

 - name: Display rendered configuration # => Read rendered file
 ansible.builtin.command: # => Command module
 cmd: cat /tmp/app_config.yml # => Display file contents
 register: config_content # => Store output
 # => config_content.stdout: File contents
 # => config_content.rc: Return code (0 = success)

 - name: Show configuration # => Display captured output
 ansible.builtin.debug: # => Debug module
 msg: "{{ config_content.stdout }}" # => Message from registered var
 # => Shows fully rendered configuration file
 # => Output: Multi-line YAML configuration
```

**Run**: `ansible-playbook template_basics.yml`

**Rendered output**:

```yaml
# Application Configuration
# Generated by Ansible on 2024-01-15T10:30:00Z

application:
  name: MyApplication
  version: 2.1.0
  environment: production

server:
  host: 0.0.0.0
  port: 8080
  workers: 4

database:
  host: db.example.com
  port: 5432
  name: appdb
  user: appuser

logging:
  level: INFO
  file: /var/log/app.log
```

**Key Takeaway**: Jinja2 templates use `{{ variable }}` for substitution, `{{ var | filter }}` for transformations. The `default()` filter provides fallback values for undefined variables. Templates render on control node, so targets don't need Jinja2 installed. Use templates for configuration files that vary by environment or host.

**Why It Matters**: Jinja2 templates eliminate configuration drift by rendering environment-specific configs from single source templates. Production deployments generate nginx configs for 100+ virtual hosts from one template with loop-driven generation. Variable substitution enables the same template to produce development, staging, and production configs with zero code duplication.

---

### Example 39: Jinja2 Conditionals and Loops

Jinja2 supports control structures: conditionals (`{% if %}`), loops (`{% for %}`), and blocks. Generate dynamic configuration based on variables and facts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Template Logic"] --> B["Conditionals<br/>{% if %}"]
 A --> C["Loops<br/>{% for %}"]
 B --> D["Include/Exclude<br/>Sections"]
 C --> E["Repeat Sections<br/>Multiple Times"]
 D --> F["Final Config"]
 E --> F

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CC78BC,color:#fff
 style F fill:#CA9161,color:#fff
```

**Code**:

**`templates/nginx_site.conf.j2`**:

```jinja2
# Nginx Site Configuration for {{ site_name }}
# => Jinja2 template with conditionals and loops

server {
 listen {{ http_port }};
 # => Variable substitution: http_port is 80
 # => Renders to: listen 80;
 server_name {{ server_name }};
 # => Variable substitution: server_name is www.example.com
 # => Renders to: server_name www.example.com;

 {% if enable_ssl %}
 # => Conditional block: {% if condition %}
 # => Evaluates: enable_ssl is true
 # => Block INCLUDED in output
 # SSL Configuration
 listen {{ https_port }} ssl;
 # => Renders to: listen 443 ssl;
 ssl_certificate {{ ssl_cert_path }};
 # => Renders to: ssl_certificate /etc/ssl/certs/example.com.crt;
 ssl_certificate_key {{ ssl_key_path }};
 # => Renders to: ssl_certificate_key /etc/ssl/private/example.com.key;
 ssl_protocols TLSv1.2 TLSv1.3;
 {% endif %}
 # => End conditional block
 # => If enable_ssl was false, entire block omitted

 root {{ document_root }};
 # => Renders to: root /var/www/example.com;
 index index.html index.php;

 # Custom locations
 {% for location in custom_locations %}
 # => Loop: {% for item in list %}
 # => Iterates over custom_locations list (3 items)
 # => Loop iteration 1: path=/api, type=proxy, backend=http://localhost:3000
 # => Loop iteration 2: path=/admin, type=proxy, backend=http://localhost:4000
 # => Loop iteration 3: path=/static, type=static, root=/var/www/static
 location {{ location.path }} {
 # => Iteration 1: location /api {
 # => Iteration 2: location /admin {
 # => Iteration 3: location /static {
 {% if location.type == 'proxy' %}
 # => Nested conditional within loop
 # => Iteration 1: type is 'proxy' → condition true
 # => Iteration 2: type is 'proxy' → condition true
 # => Iteration 3: type is 'static' → condition false (skip to elif)
 proxy_pass {{ location.backend }};
 # => Iteration 1: proxy_pass http://localhost:3000;
 # => Iteration 2: proxy_pass http://localhost:4000;
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;
 {% elif location.type == 'static' %}
 # => Alternative condition: elif
 # => Iteration 3: type is 'static' → condition true
 alias {{ location.root }};
 # => Iteration 3: alias /var/www/static;
 {% endif %}
 }
 {% endfor %}
 # => End loop
 # => Result: 3 location blocks generated

 # Default location
 location / {
 try_files $uri $uri/ =404;
 }

 # PHP processing (conditional)
 {% if enable_php %}
 # => Conditional: enable_php is true
 # => Block INCLUDED
 location ~ \.php$ {
 fastcgi_pass unix:/var/run/php/php{{ php_version }}-fpm.sock;
 # => Variable in path: php_version is "8.1"
 # => Renders to: /var/run/php/php8.1-fpm.sock
 fastcgi_index index.php;
 include fastcgi_params;
 fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
 }
 {% endif %}
 # => If enable_php was false, PHP block omitted

 # Access log
 access_log /var/log/nginx/{{ site_name }}_access.log;
 # => Renders to: /var/log/nginx/example.com_access.log
 error_log /var/log/nginx/{{ site_name }}_error.log;
 # => Renders to: /var/log/nginx/example.com_error.log
}
```

**Playbook**:

```yaml
---
# template_conditionals.yml
- name: Jinja2 Conditionals and Loops
 hosts: localhost # => Execute locally
 gather_facts: false # => Facts not needed (using explicit vars)

 vars:
 site_name: example.com # => Used in access/error log paths in template
 server_name: www.example.com # => Passed to server_name directive
 http_port: 80 # => HTTP port: used in {% if enable_ssl %} conditional
 https_port: 443 # => HTTPS port: rendered only when enable_ssl is true
 enable_ssl: true # => Controls SSL section: {% if enable_ssl %} → true → block INCLUDED
 ssl_cert_path: /etc/ssl/certs/example.com.crt # => Rendered in ssl_certificate directive
 ssl_key_path: /etc/ssl/private/example.com.key # => Rendered in ssl_certificate_key directive
 document_root: /var/www/example.com # => Site document root
 enable_php: true # => Controls PHP section: {% if enable_php %} → true → fastcgi block INCLUDED
 php_version: "8.1" # => Used in PHP socket path (php8.1-fpm.sock)

 custom_locations: # => List iterated by {% for location in custom_locations %}
 - path: /api # => Loop iteration 1: location.path = /api
 type: proxy # => location.type = 'proxy' → proxy_pass block rendered
 backend: http://localhost:3000 # => location.backend = http://localhost:3000
 - path: /admin # => Loop iteration 2: /admin location block
 type: proxy # => Also proxy type → proxy_pass block rendered
 backend: http://localhost:4000
 - path: /static # => Loop iteration 3: /static location block
 type: static # => type = 'static' → alias block rendered (not proxy_pass)
 root: /var/www/static # => location.root used in alias directive

 tasks:
 - name: Render nginx site configuration
 ansible.builtin.template: # => Template module: process Jinja2 file
 src: nginx_site.conf.j2 # => Input: template with conditionals and loops
 dest: /tmp/example.com.conf # => Output: rendered nginx config file
 mode: "0644" # => World-readable (nginx config)
 # => Jinja2 evaluates: enable_ssl conditional, enable_php conditional
 # => Jinja2 expands: custom_locations loop (3 iterations)
 # => changed: [localhost] - Rendered config written to /tmp/example.com.conf

 - name: Display configuration
 ansible.builtin.command:
 cmd: cat /tmp/example.com.conf # => Read rendered file
 register: nginx_config # => nginx_config.stdout: Full rendered config text
 changed_when: false # => Reading is not a change

 - name: Show nginx config
 ansible.builtin.debug:
 msg: "{{ nginx_config.stdout }}" # => Print complete rendered nginx config
 # => Output includes: SSL section (enable_ssl=true), PHP section (enable_php=true)
 # => Output includes: 3 location blocks from custom_locations loop
```

**Run**: `ansible-playbook template_conditionals.yml`

**Key Takeaway**: Use `{% if condition %}` for conditional blocks, `{% for item in list %}` for loops. Jinja2 control structures use `{% %}` delimiters. Support nested conditionals and loops for complex configuration generation. Template logic enables single template file to generate configurations for multiple environments.

**Why It Matters**: Template logic enables adaptive configurations that respond to inventory facts—SSL enabled only for production, debug logging only for development, firewall rules generated from service definitions. Loop-based generation creates complex multi-section configs (20+ vhosts, 50+ upstream servers) without manual repetition, reducing configuration errors by 80%.

---

### Example 40: Jinja2 Filters and Tests

Jinja2 filters transform data (string manipulation, list operations, math). Tests check conditions (variable type, existence, truthiness).

**Code**:

**`templates/advanced_config.yml.j2`**:

```jinja2
# Advanced Configuration with Filters and Tests
# => Demonstrates Jinja2 data transformation and condition testing

# String filters
# => Filters transform data: {{ variable | filter }}

app_name_upper: {{ app_name | upper }} # => Convert to uppercase
# => app_name is "My Application"
# => | upper: UPPERCASE filter
# => Renders to: MY APPLICATION

app_name_lower: {{ app_name | lower }} # => Convert to lowercase
# => | lower: lowercase filter
# => Renders to: my application

app_slug: {{ app_name | lower | replace(' ', '-') }} # => Chain filters
# => Filter chain: lower THEN replace
# => Step 1: lower → "my application"
# => Step 2: replace(' ', '-') → "my-application"
# => Renders to: my-application

# Default values
# => default() filter provides fallback for undefined variables

optional_value: {{ optional_var | default('fallback') }} # => Use default if undefined
# => optional_var is undefined
# => | default('fallback'): Returns 'fallback' when undefined
# => Renders to: fallback

database_port: {{ db_port | default(5432) }} # => Default for number
# => db_port is undefined
# => Renders to: 5432 (PostgreSQL default)

# List filters
# => Filters for list operations

total_hosts: {{ groups['webservers'] | length }} # => Count list items
# => groups['webservers']: Host group list
# => | length: Count filter
# => Returns number of hosts in webservers group

first_host: {{ groups['webservers'] | first }} # => First item
# => | first: Extract first element
# => Returns first host in webservers group

last_host: {{ groups['webservers'] | last }} # => Last item
# => | last: Extract last element

sorted_hosts: {{ groups['webservers'] | sort }} # => Sort list
# => | sort: Alphabetical sort filter
# => Returns sorted host list

# Dictionary filters
# => Format conversion filters

all_vars: {{ hostvars[inventory_hostname] | to_nice_json }} # => Pretty JSON
# => hostvars[inventory_hostname]: All variables for current host
# => | to_nice_json: Format as indented JSON
# => Renders to: { "var1": "value1".. } (formatted)

compact_vars: {{ hostvars[inventory_hostname] | to_json }} # => Compact JSON
# => | to_json: Format as compact JSON (no indentation)
# => Renders to: {"var1":"value1"..} (compressed)

yaml_vars: {{ hostvars[inventory_hostname] | to_nice_yaml }} # => YAML format
# => | to_nice_yaml: Format as YAML
# => Renders to: var1: value1\nvar2: value2

# Math filters
# => Arithmetic operations in templates

double_port: {{ server_port | int * 2 }} # => Integer math
# => server_port is 8080
# => | int: Convert to integer (type safety)
# => * 2: Multiply by 2
# => Renders to: 16160

memory_gb: {{ (total_memory_mb | int / 1024) | round(2) }} # => Division and rounding
# => total_memory_mb is 8192
# => | int: Convert to integer
# => / 1024: Convert MB to GB (8.0)
# => | round(2): Round to 2 decimals
# => Renders to: 8.00

# Type conversion
# => Explicit type conversion filters

port_string: "{{ server_port | string }}" # => Convert to string
# => server_port is 8080 (integer)
# => | string: Convert to string type
# => Renders to: "8080" (string)

bool_value: {{ "yes" | bool }} # => String to boolean
# => "yes" string
# => | bool: Convert to boolean (true)
# => Renders to: true

# Tests (conditional checks)
# => Tests check conditions: {% if variable is test %}

{% if optional_var is defined %}
# => is defined: Test if variable exists
# => optional_var is undefined
# => Condition false: block skipped
optional_is_defined: true
{% endif %}

{% if optional_var is undefined %}
# => is undefined: Test if variable does NOT exist
# => optional_var is undefined
# => Condition true: block included
optional_is_undefined: true
{% endif %}

{% if server_port is number %}
# => is number: Test if variable is numeric type
# => server_port is 8080 (number)
# => Condition true: block included
port_is_number: true
{% endif %}

{% if app_name is string %}
# => is string: Test if variable is string type
# => app_name is "My Application" (string)
# => Condition true: block included
name_is_string: true
{% endif %}

{% if worker_list is iterable %}
# => is iterable: Test if variable is list/iterable
# => worker_list is [1, 2, 3, 4] (list)
# => Condition true: block included
workers_is_list: true
{% endif %}

# Version comparison (test)
{% if app_version is version('2.0', '>=') %}
# => is version('2.0', '>='): Version comparison test
# => app_version is "2.5.0"
# => Compares: 2.5.0 >= 2.0
# => Condition true: block included
version_meets_requirement: true
{% endif %}

# List operations
# => Advanced list filters

unique_list: {{ duplicate_list | unique }} # => Remove duplicates
# => duplicate_list is [1, 2, 2, 3, 3, 3]
# => | unique: Remove duplicate values
# => Renders to: [1, 2, 3]

joined_string: {{ string_list | join(', ') }} # => Join with separator
# => string_list is ["apple", "banana", "cherry"]
# => | join(', '): Join with comma-space separator
# => Renders to: apple, banana, cherry
```

**Playbook**:

```yaml
---
# template_filters.yml
- name: Jinja2 Filters and Tests
 hosts: localhost
 gather_facts: false

 vars:
 app_name: "My Application"
 app_version: "2.5.0"
 server_port: 8080
 total_memory_mb: 8192
 worker_list: [1, 2, 3, 4]
 duplicate_list: [1, 2, 2, 3, 3, 3]
 string_list: ["apple", "banana", "cherry"]
 # optional_var intentionally not defined

 tasks:
 - name: Render configuration with filters
 ansible.builtin.template:
 src: advanced_config.yml.j2
 dest: /tmp/advanced_config.yml
 mode: "0644"

 - name: Display rendered configuration
 ansible.builtin.command:
 cmd: cat /tmp/advanced_config.yml
 register: config

 - name: Show configuration
 ansible.builtin.debug:
 msg: "{{ config.stdout }}"
```

**Run**: `ansible-playbook template_filters.yml`

**Common filters**:

- String: `upper`, `lower`, `capitalize`, `title`, `replace`
- List: `first`, `last`, `length`, `sort`, `unique`, `join`
- Dict: `to_json`, `to_nice_json`, `to_yaml`, `to_nice_yaml`
- Math: `int`, `float`, `round`, `abs`
- Default: `default(value)`, `default(value, true)` (default even if empty)

**Common tests**:

- Existence: `is defined`, `is undefined`
- Type: `is string`, `is number`, `is iterable`, `is mapping`
- Value: `is true`, `is false`, `is none`
- Comparison: `is version('1.0', '>=')`, `is equalto(value)`

**Key Takeaway**: Filters transform data inline (`{{ var | filter }}`), tests check conditions (`{% if var is test %}`). Chain filters with `|` for complex transformations. Use `default()` filter extensively to handle undefined variables gracefully. Filters and tests enable sophisticated template logic without external preprocessing.

**Why It Matters**: Jinja2 filters perform data transformations inside templates, avoiding complex playbook preprocessing. The `default` filter prevents template failures when optional variables are undefined. The `regex_replace` filter sanitizes user input in generated configs, preventing injection attacks. Production templates use 10-15 filters per file to ensure robust, secure configuration generation.

---

### Example 41: Template Whitespace Control

Jinja2 whitespace control prevents unwanted blank lines and indentation in generated files. Use `-` trimming operators for clean output.

**Code**:

**`templates/whitespace_example.j2`**:

```jinja2
# Template Whitespace Control Examples
# => Demonstrates - operator for trimming newlines

# Without whitespace control (creates blank lines)
{% for item in items %}
# => {% .. %}: Standard block delimiter
# => Newline AFTER {% for %} preserved
{{ item }}
# => Variable output
# => Newline AFTER {{ item }} preserved
{% endfor %}
# => Newline AFTER {% endfor %} preserved
# => Output:
# => [newline]
# => item1
# => [newline]
# => item2
# => [newline]
# => item3
# => [newline]
# => Problem: Excessive blank lines

# With whitespace control (removes blank lines)
{% for item in items -%}
# => -%}: Trim newline AFTER this tag
# => Removes newline after {% for %}
{{ item }}
# => Variable output with newline preserved
{% endfor -%}
# => -%}: Trim newline AFTER endfor
# => Output:
# => item1
# => item2
# => item3
# => Clean: No blank lines between items

# Trim left whitespace
{%- if condition %}
# => {%-: Trim newline BEFORE this tag
# => Removes newline/spaces before {% if %}
content here
{% endif %}
# => Result: No blank line before if block

# Trim right whitespace
{% if condition -%}
# => -%}: Trim newline AFTER this tag
# => Removes newline after {% if %}
content here
{% endif %}
# => Result: No blank line after if block

# Trim both sides
{%- if condition -%}
# => {%-: Trim before tag
# => -%}: Trim after tag
content here
{%- endif -%}
# => {%-: Trim before endif
# => -%}: Trim after endif
# => Result: Compact block with no surrounding newlines

# Practical example: clean list generation
servers:
{%- for server in server_list %}
# => {%-: Trim newline before for loop
# => Prevents blank line between "servers:" and first item
 - name: {{ server.name }}
 # => server.name renders inline
 ip: {{ server.ip }}
 # => server.ip renders inline
{%- endfor %}
# => {%-: Trim newline before endfor
# => Prevents blank line after last item
# => Output:
# => servers:
# => - name: web1
# => ip: 192.168.1.10
# => - name: web2
# => ip: 192.168.1.11
# => No blank lines in list

# Example: conditional with clean formatting
database:
 host: {{ db_host }}
 # => Renders: host: localhost
 port: {{ db_port }}
 # => Renders: port: 5432
{%- if db_ssl_enabled %}
# => {%-: Trim blank line if ssl enabled
 ssl: true
 # => Conditional SSL setting
{%- endif %}
# => {%-: Trim blank line after endif
# => If db_ssl_enabled false: No blank line in output
# => If db_ssl_enabled true: Clean ssl: true line added
```

**Playbook**:

```yaml
---
# template_whitespace.yml
- name: Template Whitespace Control
 hosts: localhost
 gather_facts: false

 vars:
 items: [item1, item2, item3]
 condition: true
 server_list:
 - name: web1
 ip: 192.168.1.10
 - name: web2
 ip: 192.168.1.11
 db_host: localhost
 db_port: 5432
 db_ssl_enabled: true

 tasks:
 - name: Render template with whitespace control
 ansible.builtin.template:
 src: whitespace_example.j2
 dest: /tmp/whitespace_demo.txt
 mode: "0644"
 # => Renders clean output without extra blank lines

 - name: Display rendered file
 ansible.builtin.command:
 cmd: cat /tmp/whitespace_demo.txt
 register: output

 - name: Show output
 ansible.builtin.debug:
 msg: "{{ output.stdout }}"
```

**Whitespace control syntax**:

- `{%- .. %}` → Trim whitespace before block
- `{% .. -%}` → Trim whitespace after block
- `{%- .. -%}` → Trim whitespace on both sides
- `{{- .. }}` → Trim before variable
- `{{ .. -}}` → Trim after variable

**Run**: `ansible-playbook template_whitespace.yml`

**Key Takeaway**: Use `-` operator to control whitespace in template output. Place `-` inside delimiters adjacent to where trimming should occur. Critical for generating clean configuration files like YAML or JSON where whitespace affects parsing. Without whitespace control, templates produce files with excessive blank lines.

**Why It Matters**: Whitespace control generates clean, readable configs that pass syntax validators and linters. Generated nginx configs must match exact indentation and spacing for automated compliance checking. The `-` trim operators prevent bloated 1MB config files from templates with extensive loops, reducing file size by 40% and improving parsing speed.

---

### Example 42: Template Macros and Inheritance

Jinja2 macros define reusable template fragments. Template inheritance enables base templates extended by child templates.

**Code**:

**`templates/macros.j2`**:

```jinja2
{# Define reusable macros #}
{# => Macros: reusable template functions with parameters #}
{# => Call with: macros.macro_name(arg1, arg2) in child templates #}

{# Macro: Generate server block #}
{# => Defines server_block(name, host, port) function #}
{% macro server_block(name, host, port) -%}
{# => -%} trims trailing whitespace for clean output #}
server {
 listen {{ port }};
 {# => Renders to: listen 3000; (when called with port=3000) #}
 server_name {{ name }};
 {# => Renders to: server_name api.example.com; #}
 location / {
 proxy_pass http://{{ host }}:{{ port }};
 {# => Renders to: proxy_pass http://localhost:3000; #}
 }
}
{%- endmacro %}
{# => Calling server_block('api.example.com', 'localhost', 3000) renders:
 server {
   listen 3000;
   server_name api.example.com;
   location / { proxy_pass http://localhost:3000; }
 } #}

{# Macro: Generate database connection string #}
{# => Defines db_connection(type, host, port, name, user) function #}
{% macro db_connection(type, host, port, name, user) -%}
{{ type }}://{{ user }}@{{ host }}:{{ port }}/{{ name }}
{# => Renders to: postgresql://appuser@db.example.com:5432/appdb #}
{# => Format: <type>://<user>@<host>:<port>/<name> #}
{%- endmacro %}

{# Macro: Generate logging configuration #}
{# => Defines logging_config(level, file) function #}
{% macro logging_config(level, file) -%}
logging:
 level: {{ level | upper }}
 {# => | upper: Applies uppercase filter #}
 {# => Renders to: level: INFO (when called with level='info') #}
 handlers:
 file:
 filename: {{ file }}
 {# => Renders to: filename: /var/log/app.log #}
 maxBytes: 10485760
 {# => 10485760 bytes = 10 MB log rotation size #}
 backupCount: 5
 {# => Keep 5 rotated log files before deletion #}
{%- endmacro %}
{# => Calling logging_config('info', '/var/log/app.log') renders:
 logging:
   level: INFO
   handlers:
     file: { filename: /var/log/app.log, maxBytes: 10485760, backupCount: 5 } #}
```

**`templates/base.conf.j2`** (base template):

```jinja2
# Base Configuration Template
# Environment: {{ environment }}
{# => {{ environment }} renders to: production #}
{# => Base template defines structure; child templates fill in content #}

{% block header %}
{# => {% block name %} defines overridable section #}
{# => Child template can override by redefining same block name #}
# Default Header
# Generated: {{ ansible_date_time.iso8601 }}
{# => ansible_date_time.iso8601: Built-in Ansible fact → "2025-01-15T10:30:00" #}
{% endblock %}
{# => {% endblock %} closes the block definition #}

{% block application %}
{# => application block: overridden by child template's application block #}
# Application section must be defined in child template
{% endblock %}

{% block database %}
{# => database block: overridden by child template's database block #}
# Database section must be defined in child template
{% endblock %}

{% block footer %}
{# => footer block: child template provides specific footer or uses default #}
# Default Footer
{% endblock %}
{# => Without child template extending: renders all default block content #}
{# => With child template extending: child overrides selected blocks only #}
```

**`templates/app.conf.j2`** (child template):

```jinja2
{% extends "base.conf.j2" %} {# Inherit from base #}
{# => {% extends %}: This template inherits from base.conf.j2 #}
{# => Only defined blocks are overridden; undefined blocks use base defaults #}

{% import "macros.j2" as macros %} {# Import macros #}
{# => {% import "file.j2" as namespace %}: Load macros from file #}
{# => Access macros via namespace: macros.macro_name(args) #}

{% block header %}
{# => Overrides base.conf.j2 header block with app-specific header #}
# Application Configuration
# Name: {{ app_name }}
{# => Renders to: # Name: MyApp #}
# Version: {{ app_version }}
{# => Renders to: # Version: 3.0.0 #}
{% endblock %}

{% block application %}
{# => Overrides base application block with actual app configuration #}
application:
 name: {{ app_name }}
 {# => Renders to: name: MyApp #}
 port: {{ app_port }}
 {# => Renders to: port: 8080 #}

 # Use macro for server blocks
 {% for server in app_servers %}
 {# => Loop over app_servers list (2 items: api.example.com, web.example.com) #}
 {{ macros.server_block(server.name, server.host, server.port) }}
 {# => Iteration 1: server_block('api.example.com', 'localhost', 3000) #}
 {# => Iteration 2: server_block('web.example.com', 'localhost', 4000) #}
 {# => Each call renders a complete server {} block #}
 {% endfor %}
{# => Result: 2 server blocks generated from app_servers list #}
{% endblock %}

{% block database %}
{# => Overrides base database block with connection details #}
database:
 # Use macro for connection string
 url: {{ macros.db_connection('postgresql', db_host, db_port, db_name, db_user) }}
 {# => Calls db_connection('postgresql', 'db.example.com', 5432, 'appdb', 'appuser') #}
 {# => Renders to: url: postgresql://appuser@db.example.com:5432/appdb #}

 # Use macro for logging
 {{ macros.logging_config('info', '/var/log/app.log') }}
 {# => Calls logging_config('info', '/var/log/app.log') #}
 {# => Renders to: logging: { level: INFO, handlers: { file: { filename: /var/log/app.log, ... } } } #}
{% endblock %}

{% block footer %}
{# => Overrides base footer with app-specific footer #}
# End of {{ app_name }} Configuration
{# => Renders to: # End of MyApp Configuration #}
{% endblock %}
{# => Final rendered output combines all overridden blocks from this child template #}
```

**Playbook**:

```yaml
---
# template_macros.yml
- name: Template Macros and Inheritance
 hosts: localhost # => Execute on local machine
 gather_facts: true # => Required: ansible_date_time used in base template

 vars:
 environment: production # => Passed to {{ environment }} in base.conf.j2
 app_name: MyApp # => Used by {{ app_name }} throughout templates
 app_version: "3.0.0" # => Used by {{ app_version }} in header block
 app_port: 8080 # => Used by {{ app_port }} in application block
 app_servers: # => List iterated by {% for server in app_servers %}
 - name: api.example.com # => server.name → server_block() arg 1
 host: localhost # => server.host → server_block() arg 2
 port: 3000 # => server.port → server_block() arg 3
 - name: web.example.com # => Second iteration of loop
 host: localhost
 port: 4000
 db_host: db.example.com # => Passed to db_connection() macro
 db_port: 5432 # => PostgreSQL default port
 db_name: appdb # => Database name argument
 db_user: appuser # => Database user argument

 tasks:
 - name: Render configuration with macros and inheritance
 ansible.builtin.template:
 src: app.conf.j2 # => Child template (extends base.conf.j2, imports macros.j2)
 dest: /tmp/app.conf # => Output: rendered configuration file
 mode: "0644" # => World-readable config (not secret)
 # => Jinja2 processes: extends, imports macros, loops, variable substitution
 # => changed: [localhost] - file created/updated with rendered content

 - name: Display rendered configuration
 ansible.builtin.command:
 cmd: cat /tmp/app.conf # => Read rendered output for verification
 register: config # => config.stdout: complete rendered config text
 changed_when: false # => Reading file is not a change

 - name: Show configuration
 ansible.builtin.debug:
 msg: "{{ config.stdout }}" # => Print rendered template to console
 # => Output: Full merged config from base + child template + macros
```

**Run**: `ansible-playbook template_macros.yml`

**Key Takeaway**: Macros (`{% macro name(args) %}`) define reusable template functions—reduce duplication and improve maintainability. Template inheritance (`{% extends %}` and `{% block %}`) enables base templates with overridable sections. Import macros with `{% import "file.j2" as namespace %}`. This pattern scales to complex multi-environment configurations.

**Why It Matters**: Template macros DRY complex config blocks that repeat across multiple files—SSL configuration, logging setup, security headers. Template inheritance creates config families where base templates define structure and child templates override specific sections. This pattern manages 50+ related configs (dev, staging, prod × services) from shared base templates, reducing maintenance burden by 70%.

---

## Group 10: Ansible Vault

### Example 43: Vault Basics

Ansible Vault encrypts sensitive data (passwords, API keys, certificates) in version control. Encrypted files remain YAML-readable but content is protected.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Plaintext secrets.yml"] --> B["ansible-vault encrypt"]
 B --> C["Encrypted secrets.yml<br/>AES256"]
 C --> D["Commit to Git<br/>#40;Safe#41;"]
 C --> E["Playbook Execution"]
 E --> F["vault-password-file"]
 F --> G["Decrypt Secrets<br/>Runtime Only"]
 G --> H["Use in Tasks"]

 style A fill:#DE8F05,color:#fff
 style B fill:#0173B2,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#029E73,color:#fff
 style E fill:#CC78BC,color:#fff
 style F fill:#CA9161,color:#fff
 style G fill:#DE8F05,color:#fff
 style H fill:#029E73,color:#fff
```

**Code**:

**Create encrypted file**:

```bash
# Create new encrypted file with password prompt
ansible-vault create secrets.yml
# => ansible-vault: Vault command-line tool
# => create: Create new encrypted file
# => secrets.yml: Filename for encrypted content
# => Process:
# => 1. Prompts for vault password (entered twice)
# => 2. Opens editor (EDITOR env var, default: vi)
# => 3. Encrypts content with AES256
# => 4. Saves encrypted file
# => Output: New vault password, Confirm new vault password

# Enter vault password, then edit content in editor:
# => Add sensitive variables in YAML format
```

**`secrets.yml` (encrypted)**:

```yaml
---
# Secrets file content (shown decrypted for illustration)
# => In reality, file stored encrypted on disk (AES256)
# => Encryption algorithm: AES256-CBC
# => Only readable with vault password

db_password: SuperSecretPassword123 # => Database password
# => Used in database connection strings
api_key: sk-1234567890abcdef # => External API key
# => Used for API authentication
ssl_cert_password: CertPassword456 # => SSL certificate password
# => Used for encrypted private keys
admin_password: AdminPass789 # => Admin user password
# => Used for application admin access

# Encrypted file format on disk:
# => $ANSIBLE_VAULT;1.1;AES256
# => [encrypted blob - binary data in base64]
# => Safe to commit to version control
```

**View encrypted file**:

```bash
# View encrypted file content (read-only)
ansible-vault view secrets.yml
# => ansible-vault view: Display decrypted content
# => Prompts for vault password
# => Displays decrypted YAML to stdout
# => File remains encrypted on disk
# => No temp files created (secure)

# Edit encrypted file (modify content)
ansible-vault edit secrets.yml
# => ansible-vault edit: Modify encrypted file
# => Process:
# => 1. Prompts for vault password
# => 2. Decrypts file to temp location
# => 3. Opens editor with decrypted content
# => 4. Saves changes
# => 5. Re-encrypts file with same password
# => 6. Deletes temp file
# => Maintains encryption throughout edit cycle
```

**Playbook using vault**:

```yaml
---
# vault_basic.yml
- name: Use Ansible Vault
 hosts: localhost
 gather_facts: false

 vars_files:
 - secrets.yml # => Load encrypted variables file
 # => Variables decrypted automatically during playbook execution

 vars:
 db_host: localhost # => Non-sensitive variables in playbook
 db_port: 5432
 db_name: appdb
 db_user: appuser
 # db_password loaded from secrets.yml (encrypted)

 tasks:
 - name: Display database connection info (password masked)
 ansible.builtin.debug:
 msg: |
 Host: {{ db_host }}:{{ db_port }}
 Database: {{ db_name }}
 User: {{ db_user }}
 # => Shows non-sensitive info only

 - name: Use password in connection (example)
 ansible.builtin.debug:
 msg: "Connecting with password {{ db_password }}"
 no_log: true # => Prevent password from appearing in logs
 # => Task executes but output suppressed
```

**Run with vault password**:

```bash
# Prompt for vault password
ansible-playbook vault_basic.yml --ask-vault-pass

# Use password file (avoid interactive prompt)
ansible-playbook vault_basic.yml --vault-password-file ~/.vault_pass

# Use environment variable
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass
ansible-playbook vault_basic.yml
```

**Vault operations**:

```bash
# Encrypt existing file
ansible-vault encrypt existing_file.yml

# Decrypt file (remove encryption)
ansible-vault decrypt secrets.yml

# Change vault password
ansible-vault rekey secrets.yml

# Show encrypted file content
cat secrets.yml # => Shows encrypted blob (safe to commit)
```

**Key Takeaway**: Ansible Vault encrypts sensitive variables in YAML files—safe to commit to version control. Use `--ask-vault-pass` or password files for decryption. Always use `no_log: true` on tasks displaying sensitive data to prevent password leaks in logs. Vault files remain YAML-parseable but content is AES256-encrypted.

**Why It Matters**: Ansible Vault encrypts secrets at rest in version control, enabling secure secret management without external tools. Production playbooks store database passwords, API keys, and SSL private keys encrypted in Git, with automatic decryption at runtime. This eliminates insecure practices like plaintext secrets in repos or manual secret injection during deployment.

---

### Example 44: Vault IDs for Multiple Passwords

Vault IDs enable multiple vault passwords in one playbook—separate credentials for different environments or security domains.

**Code**:

**Create files with different vault IDs**:

```bash
# Production secrets with 'prod' vault ID
ansible-vault create --vault-id prod@prompt prod_secrets.yml
# => ansible-vault create: Create new encrypted file
# => --vault-id prod@prompt: Vault ID label and password source
# => prod: Vault ID label (tags this file as 'prod')
# => @prompt: Password source (interactive prompt)
# => prod_secrets.yml: Filename for production secrets
# => Process: Prompt for 'prod' password → create encrypted file
# => File header includes vault ID: $ANSIBLE_VAULT;1.2;AES256;prod

# Staging secrets with 'staging' vault ID
ansible-vault create --vault-id staging@prompt staging_secrets.yml
# => --vault-id staging@prompt: Different vault ID
# => staging: Separate password from 'prod'
# => Allows different teams to manage different environments
# => Password isolation: Staging team can't decrypt prod secrets

# Database secrets with 'database' vault ID
ansible-vault create --vault-id database@prompt db_secrets.yml
# => --vault-id database@prompt: Database-specific vault
# => database: Security domain separation
# => Enables DBA team to manage DB secrets independently
# => Application team has no access to DB credentials
```

**`prod_secrets.yml`** (encrypted with prod ID):

```yaml
---
# => This file is encrypted with --vault-id prod@prompt
# => Before encryption: Ansible sees these plaintext values
environment: production # => Environment identifier
api_endpoint: https://api.prod.example.com # => Production API URL
api_key: prod-key-abc123 # => Production API credential (SENSITIVE)
# => After: ansible-vault encrypt --vault-id prod@prompt prod_secrets.yml
# => File becomes hex-encoded ciphertext, unreadable without prod password
```

**`staging_secrets.yml`** (encrypted with staging ID):

```yaml
---
# => Encrypted with --vault-id staging@prompt (different password from prod)
environment: staging # => Staging environment identifier
api_endpoint: https://api.staging.example.com # => Staging API URL
api_key: staging-key-xyz789 # => Staging API credential
# => Staging team has staging vault password; cannot decrypt prod_secrets.yml
```

**`db_secrets.yml`** (encrypted with database ID):

```yaml
---
# => Encrypted with --vault-id database@prompt (separate DBA password)
db_master_password: MasterDBPass123 # => PostgreSQL master password
db_replication_key: ReplKey456 # => Replication slot credential
# => DBA team manages this; app team cannot decrypt (no database vault password)
```

**Playbook**:

```yaml
---
# vault_ids.yml
- name: Multiple Vault IDs
 hosts: localhost
 gather_facts: false

 vars_files:
 - prod_secrets.yml # => Requires 'prod' vault password
 - staging_secrets.yml # => Requires 'staging' vault password
 - db_secrets.yml # => Requires 'database' vault password

 tasks:
 - name: Display environment configuration
 ansible.builtin.debug:
 msg: |
 Prod API: {{ api_endpoint }} (from prod_secrets.yml)
 DB Password: {{ db_master_password }} (from db_secrets.yml)
 no_log: true
```

**Create password files**:

```bash
# ~/.vault_pass_prod
echo "prod-password" > ~/.vault_pass_prod
chmod 600 ~/.vault_pass_prod

# ~/.vault_pass_staging
echo "staging-password" > ~/.vault_pass_staging
chmod 600 ~/.vault_pass_staging

# ~/.vault_pass_database
echo "database-password" > ~/.vault_pass_database
chmod 600 ~/.vault_pass_database
```

**Run with multiple vault IDs**:

```bash
# Prompt for each vault password interactively
ansible-playbook vault_ids.yml \
 --vault-id prod@prompt \
 # => Prompts for 'prod' vault password
 # => Used to decrypt prod_secrets.yml
 --vault-id staging@prompt \
 # => Prompts for 'staging' vault password
 # => Used to decrypt staging_secrets.yml
 --vault-id database@prompt
 # => Prompts for 'database' vault password
 # => Used to decrypt db_secrets.yml
# => Playbook execution waits for all passwords before proceeding
# => Each vault file decrypted with its corresponding password

# Use password files (automated/CI environments)
ansible-playbook vault_ids.yml \
 --vault-id prod@~/.vault_pass_prod \
 # => Reads prod password from file ~/.vault_pass_prod
 # => No interactive prompt (headless execution)
 --vault-id staging@~/.vault_pass_staging \
 # => Reads staging password from file
 --vault-id database@~/.vault_pass_database
 # => Reads database password from file
# => Fully automated execution (CI/CD pipelines)
# => All password files must exist with 600 permissions

# Mix prompt and file (hybrid approach)
ansible-playbook vault_ids.yml \
 --vault-id prod@prompt \
 # => Interactive prompt for production (security sensitive)
 # => Requires human operator for prod deployments
 --vault-id staging@~/.vault_pass_staging
 # => Automated for staging (less sensitive)
# => Pattern: Interactive prod, automated staging
# => Ensures prod deployments have human oversight
```

**View file with specific vault ID**:

```bash
ansible-vault view --vault-id prod@prompt prod_secrets.yml
ansible-vault edit --vault-id database@~/.vault_pass_database db_secrets.yml
```

**Key Takeaway**: Vault IDs enable multiple passwords in one playbook—useful for separating prod/staging credentials or security domains. Use `--vault-id <label>@<source>` format where source is `prompt` or path to password file. Each encrypted file tagged with vault ID during creation. This pattern enables role-based access control where different teams have different vault passwords.

**Why It Matters**: Vault IDs enable role-based secret access where junior engineers decrypt dev secrets but not production secrets. Multi-password vaults separate concerns—developers access app configs, ops access infrastructure credentials. This implements least-privilege principles and audit trails showing who decrypted which secret categories.

---

### Example 45: Inline Encrypted Variables

Encrypt individual variables inline instead of entire files. Useful for mixed sensitive/non-sensitive variable files.

**Code**:

**Encrypt single string**:

```bash
# Encrypt string value
ansible-vault encrypt_string 'SuperSecretPassword123' --name 'db_password'
# => Outputs encrypted string in YAML format

# Output:
# db_password: !vault |
# $ANSIBLE_VAULT;1.1;AES256
# 66386439653264336462626566653063336164663966303231363934653561363964363833313662
# ..encrypted content..
```

**`vars.yml`** (mixed encrypted and plaintext):

```yaml
---
# Non-sensitive variables (plaintext)
# => These are safe to commit to version control (no secrets)
db_host: localhost # => Database host (public configuration)
db_port: 5432 # => Database port (PostgreSQL default)
db_name: appdb # => Database name
db_user: appuser # => Database user (non-secret username)

# Sensitive variable (encrypted inline)
# => !vault |: YAML tag indicating Vault-encrypted value
# => Value is encrypted AES256, only decryptable with vault password
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  # => $ANSIBLE_VAULT: Magic header identifying vault-encrypted content
  # => 1.1: Vault format version
  # => AES256: Encryption algorithm used
  66386439653264336462626566653063336164663966303231363934653561363964363833313662
  # => Hex-encoded encrypted ciphertext (spans multiple lines)
  3431626338623034303037646233396431346564663936310a613034343933343462373465373738
  62376662626533643732333461303639626533633131373635373832336531373162366534363464
  3561373633613763360a313331613031656561623332353332613235376565353966383334646364
  3566
  # => At runtime: Ansible decrypts to plaintext "SuperSecretPassword123"
  # => During git diff: Only encrypted hex visible (safe to commit)

# Another encrypted variable
api_key: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  39653561363964363833313662626566653063336164663966303231363934653561363964363833
  ..encrypted content..
  # => Same encryption pattern: plaintext API key fully concealed
  # => Both db_password and api_key encrypted with same vault password
```

**Playbook**:

```yaml
---
# inline_vault.yml
- name: Inline Encrypted Variables
 hosts: localhost # => Execute locally
 gather_facts: false # => Facts not needed

 vars_files:
 - vars.yml # => Load variables: plaintext vars + !vault encrypted vars
 # => Ansible automatically decrypts !vault values during load

 tasks:
 - name: Display configuration
 ansible.builtin.debug: # => Debug module: print information
 msg: |
 Host: {{ db_host }}:{{ db_port }}
 Database: {{ db_name }}
 User: {{ db_user }}
 # => {{ db_host }}: "localhost" (plaintext, no decryption needed)
 # => {{ db_port }}: "5432" (plaintext)
 # => {{ db_name }}: "appdb" (plaintext)
 # => {{ db_user }}: "appuser" (plaintext)
 # => Shows plaintext variables safely (none are sensitive)

 - name: Use encrypted password
 ansible.builtin.debug: # => Debug module
 msg: "Password is {{ db_password | length }} characters"
 # => db_password: Decrypted at runtime from !vault | value in vars.yml
 # => | length: Jinja2 filter returns string length (not the actual password)
 # => Output: "Password is 22 characters" (length only, not the value)
 no_log: true # => Don't log task output (prevents password appearing in logs)
 # => no_log: true: Masks task output even if accidentally logged
 # => Uses decrypted password in task without exposing it
```

**Create inline encrypted variable**:

```bash
# Encrypt string and copy to clipboard
ansible-vault encrypt_string 'MySecret123' --name 'secret_var' \
 --vault-id prod@~/.vault_pass_prod
# => encrypt_string: Encrypts string and outputs YAML-formatted !vault | block
# => 'MySecret123': The plaintext value to encrypt
# => --name 'secret_var': Variable name for the output YAML key
# => --vault-id prod@~/.vault_pass_prod: Use 'prod' vault ID and password file
# => Output: secret_var: !vault | $ANSIBLE_VAULT;1.2;AES256;prod \n <hex data>

# Encrypt from stdin (for long values)
echo -n 'LongSecretValue' | \
 ansible-vault encrypt_string --stdin-name 'long_secret'
# => echo -n: Print without newline (prevents newline in encrypted value)
# => | stdin: Pipe to encrypt_string for long/multiline secrets
# => --stdin-name 'long_secret': Variable name for output
# => Useful for: certificates, SSH keys, JSON credentials
```

**Run**: `ansible-playbook inline_vault.yml --ask-vault-pass`

**Key Takeaway**: Inline encrypted variables (`!vault |`) enable mixing sensitive and non-sensitive data in one file—improves readability compared to fully encrypted files. Use `encrypt_string` to generate encrypted values. Inline encryption works with any vault ID. This pattern is ideal for variable files where only a few values are sensitive.

**Why It Matters**: Inline encryption scopes secrets to specific variables in otherwise-public files, avoiding the all-or-nothing encryption of full vault files. Ansible configuration files contain mix of public settings (ports, paths) and secrets (passwords, tokens)—inline encryption keeps public parts easily reviewable while securing sensitive values. This improves code review efficiency and reduces accidental secret exposure.

---

### Example 46: Vault Best Practices

Production-ready vault usage patterns: password management, file organization, access control, and security.

**Code**:

**Directory structure**:

```
inventory/
 production/
 group_vars/
 all/
 vars.yml # => Non-sensitive variables
 vault.yml # => Encrypted sensitive variables
 webservers/
 vars.yml
 vault.yml
 databases/
 vars.yml
 vault.yml

.vault_pass_prod # => Production vault password file
.vault_pass_staging # => Staging vault password file
.gitignore # => Exclude password files from git
```

**`.gitignore`**:

```
# Vault password files
# => Exclude vault password files from version control
.vault_pass* # => Matches: .vault_pass_prod, .vault_pass_staging, etc.
vault_password.txt # => Common alternative password filename
*.vault_pass # => Matches: production.vault_pass, etc.

# Backup files from vault edit
# => ansible-vault edit creates backup files; exclude them
*.yml.backup # => Backup created by ansible-vault edit (auto-generated)
*~ # => Editor backup files (vim, emacs tilde backups)
# => None of these should appear in git history
```

**`group_vars/all/vars.yml`** (non-sensitive):

```yaml
---
# Non-sensitive configuration
# => vars.yml: Contains only public/non-secret variables
# => Safe to view in version control diffs; no encryption needed
ntp_server: time.example.com # => NTP time server (not secret)
log_level: info # => Application log verbosity (not secret)
backup_enabled: true # => Enable automated backups (not secret)
monitoring_enabled: true # => Enable monitoring agent (not secret)
# => Convention: Keep public vars in vars.yml, secrets in vault.yml
```

**`group_vars/all/vault.yml`** (encrypted):

```yaml
---
# Encrypted sensitive variables (prefix with vault_)
# => vault.yml: Entire file encrypted with ansible-vault encrypt
# => File header after encryption: $ANSIBLE_VAULT;1.1;AES256
# => prefix convention: vault_ signals "this came from vault"
vault_db_password: SuperSecret123 # => Prefixed vault_ for clarity
# => Mapped to: db_password in all.yml (clean name for playbooks)
vault_api_key: sk-1234567890 # => API credentials (never commit plaintext)
# => Mapped to: api_key in all.yml
vault_ssl_key: | # => Multi-line secret (SSL private key)
  # => | block scalar: preserves newlines (required for PEM format)
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..
  -----END PRIVATE KEY-----

# => Entire file encrypted: vault.yml becomes unreadable hex after encryption
```

**`group_vars/all/all.yml`** (variable mapping):

```yaml
---
# Map vault variables to usable names
# => all.yml: Alias pattern maps vault_ prefixed vars to clean names
# => Benefit: Playbooks use db_password (clean), not vault_db_password
db_password: "{{ vault_db_password }}" # => Indirect reference (alias)
# => db_password is now usable in tasks: {{ db_password }}
# => Source is vault.yml (encrypted) → transparent at usage time
api_key: "{{ vault_api_key }}" # => Clean alias for API key secret
ssl_private_key: "{{ vault_ssl_key }}" # => Clean alias for SSL key
# => Separation: vault.yml has vault_ prefix, all.yml exposes clean names
# => Code review: Reviewer sees all.yml diffs without seeing secrets
```

**Password file setup**:

```bash
# Create password file with restricted permissions
echo "production-vault-password" > .vault_pass_prod
# => Creates file with vault password (single line, no newline needed)
# => .vault_pass_prod: Convention name (in .gitignore)
chmod 600 .vault_pass_prod
# => 600 permissions: Owner read/write only (no group/other access)
# => Prevents other users from reading vault password file
# => Security requirement: Ansible warns if password file is world-readable

# Configure Ansible to use password file by default
cat >> ansible.cfg <<EOF
[defaults]
vault_password_file = .vault_pass_prod
EOF
# => Appends to ansible.cfg: Sets default vault password file
# => All ansible-vault commands use this file automatically
# => No need for --vault-password-file flag in daily use
```

**`ansible.cfg`**:

```ini
[defaults]
# Default vault password file (override with --vault-password-file)
vault_password_file = .vault_pass_prod
# => Sets default password file for all ansible-vault operations
# => Override per-run: --vault-password-file ~/.other_pass

# Require vault password for encrypted files
vault_encrypt_identity_list = default
# => Specifies which vault IDs to use when encrypting new files

# Log encryption
no_log = True # => Global no_log for sensitive tasks
# => Sets no_log=true globally for all tasks
# => Prevents any sensitive data from appearing in Ansible logs
# => Override per-task: no_log: false (if specific task is safe to log)
```

**Playbook with vault best practices**:

```yaml
---
# vault_best_practices.yml
- name: Vault Best Practices
 hosts: localhost
 gather_facts: false

 # Load variables (vars.yml + vault.yml automatically loaded from group_vars)

 tasks:
 - name: Use sensitive variable
 ansible.builtin.debug:
 msg: "Connecting to database"
 no_log: true # => Always use no_log with sensitive data
 # => Task uses db_password from vault.yml indirectly

 - name: Deploy configuration with secrets
 ansible.builtin.template:
 src: app_config.j2
 dest: /tmp/app_config.yml
 mode: "0600" # => Restrictive permissions for config with secrets
 no_log: true # => Don't log file content
```

**Vault rotation procedure**:

```bash
# 1. Create new vault password file
echo "new-production-password" > .vault_pass_prod_new
# => Create temp file with new password before rekeying
# => Do NOT overwrite existing .vault_pass_prod yet (still needed for rekey)

# 2. Rekey all vault files
find inventory/ -name 'vault.yml' -exec \
 ansible-vault rekey --vault-password-file .vault_pass_prod \
 # => --vault-password-file: Current (old) password to decrypt existing files
 --new-vault-password-file .vault_pass_prod_new {} \;
 # => --new-vault-password-file: New password to re-encrypt with
 # => {}: Placeholder for each vault.yml found by find
 # => Result: All vault.yml files re-encrypted with new password

# 3. Replace old password file
mv .vault_pass_prod_new .vault_pass_prod
# => Atomically replace old password file with new one
chmod 600 .vault_pass_prod
# => Restore restrictive permissions after move

# 4. Test decryption
ansible-vault view inventory/production/group_vars/all/vault.yml
# => Verify new password works: Should display decrypted content
# => If fails: Rekey may have partially completed (some files old, some new)
```

**Key Takeaway**: Separate sensitive (`vault.yml`) from non-sensitive (`vars.yml`) variables for clarity. Prefix vault variables with `vault_` and map to clean names in `all.yml`. Store vault password files outside repository with 600 permissions. Use `no_log: true` on all tasks handling sensitive data. Implement vault password rotation procedure. Use group_vars hierarchy for environment-specific secrets. This structure scales to hundreds of hosts and multiple environments.

**Why It Matters**: Vault best practices prevent common security failures: password rotation via script files, vault-id enforcement in CI/CD, and rekey procedures for compromised credentials. Production environments with 100+ vaulted files require automated password management—script-based passwords enable integration with enterprise secret management systems and automated rotation policies.

---

## Group 11: Error Handling & Blocks

### Example 47: Failed When and Changed When

Control task success/failure criteria and changed status reporting with `failed_when` and `changed_when` directives.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Task Execution"] --> B{failed_when<br/>Condition?}
 B -->|True| C["Report: Failed"]
 B -->|False| D{changed_when<br/>Condition?}
 D -->|True| E["Report: Changed"]
 D -->|False| F["Report: OK"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#CA9161,color:#fff
 style D fill:#DE8F05,color:#fff
 style E fill:#CC78BC,color:#fff
 style F fill:#029E73,color:#fff
```

**Code**:

```yaml
---
# failed_changed_when.yml
- name: Failed When and Changed When
 hosts: localhost
 gather_facts: false

 tasks:
 # Pattern 1: Default command behavior
 # => Commands always report changed (even if idempotent)

 - name: Run command (always changed) # => Default behavior demo
 ansible.builtin.command: # => Command module
 cmd: echo "test" # => Simple echo command
 # => Actually idempotent (no system changes)
 register: result # => Capture result for inspection
 # => result.changed: True (command module default)
 # => changed: [localhost] (even though no actual change)
 # => Problem: Misleading change reporting

 - name: Check default status # => Verify default behavior
 ansible.builtin.debug: # => Debug module
 msg: "Task changed: {{ result.changed }}" # => Display changed status
 # => Output: Task changed: True
 # => Shows command module always reports changed

 # Pattern 2: Override changed status
 # => Force task to never report changed
 - name: Command with changed_when never # => Suppress changed status
 ansible.builtin.command: # => Command module
 cmd: uptime # => System uptime command
 # => Read-only operation (no system changes)
 changed_when: false # => Force changed status to false
 # => changed_when: false: Always report ok (never changed)
 # => Useful for: Read-only commands, checks, queries
 # => ok: [localhost] (forced to not changed)
 # => Accurate reporting: uptime is truly read-only

 # Pattern 3: Conditional changed and failure status
 # => Control both changed and failed based on output
 - name: Command with conditional changed # => Conditional status reporting
 ansible.builtin.command: # => Command module
 cmd: grep "pattern" /tmp/file.txt # => Search for pattern in file
 # => Return codes:
 # => rc=0: Pattern found
 # => rc=1: Pattern not found (NOT an error)
 # => rc=2+: Error (file missing, permission denied, etc.)
 register: grep_result # => Capture result
 changed_when: grep_result.rc == 0 # => Changed only if pattern found
 # => Logic: Finding pattern is a "change" in state knowledge
 # => grep_result.rc == 0: Pattern found → changed
 # => grep_result.rc != 0: Pattern not found → ok
 failed_when: grep_result.rc not in [0, 1] # => Fail on actual errors
 # => rc in [0, 1]: Normal grep behavior (success)
 # => rc not in [0, 1]: Error condition (file missing, etc.)
 # => Prevents failure on legitimate "not found" result
 # => ok: [localhost] if pattern not found (rc=1)
 # => changed: [localhost] if pattern found (rc=0)
 # => failed: [localhost] if error (rc=2+)
 # => failed: [localhost] if error (rc=2)

 # Complex failed_when condition
 - name: Check application status
 ansible.builtin.shell:
 cmd: |
 curl -s http://localhost:8080/health || echo "DOWN"
 register: health_check
 changed_when: false # => Health check never changes system
 failed_when: >
 health_check.rc != 0 or
 'DOWN' in health_check.stdout or
 'error' in health_check.stdout | lower
 # => Fail if curl fails OR output contains "DOWN" or "error"

 # Never fail (always succeed)
 - name: Task that always succeeds
 ansible.builtin.command:
 cmd: /usr/local/bin/optional-script.sh
 register: optional_result
 failed_when: false # => Never fail regardless of return code
 changed_when: optional_result.rc == 0 # => Changed only if successful
 # => ok: [localhost] even if script returns non-zero

 # Validate output content
 - name: Validate configuration file
 ansible.builtin.command:
 cmd: cat /etc/app/config.yml
 register: config_content
 changed_when: false
 failed_when: "'debug: true' in config_content.stdout"
 # => Fail if debug mode enabled in config (safety check)

 # Multiple failure conditions
 - name: Check disk space
 ansible.builtin.shell:
 cmd: df -h / | awk 'NR==2 {print $5}' | sed 's/%//'
 register: disk_usage
 changed_when: false
 failed_when:
 - disk_usage.stdout | int > 90 # => Fail if > 90% used
 - disk_usage.rc != 0 # => Also fail if command errors
 # => Combines multiple failure conditions with implicit AND
```

**Run**: `ansible-playbook failed_changed_when.yml`

**Key Takeaway**: Use `changed_when: false` for read-only tasks (checks, queries) to prevent misleading change reports. Use `failed_when` to define success criteria based on output content or return codes—enables validation and safety checks. Combine both directives for precise task status control. This pattern enables idempotent playbooks where task status accurately reflects system state changes.

**Why It Matters**: Custom failure and change detection enables intelligent task interpretation. Commands that exit non-zero successfully (grep no match, test file absent) need `failed_when` override to prevent false failures. Tasks that always report changed (legacy scripts, custom binaries) need `changed_when` to prevent unnecessary handler triggers. This pattern fixes 60% of flapping playbook runs.

---

### Example 48: Ignore Errors and Error Recovery

Handle task failures gracefully with `ignore_errors`, conditional error handling, and recovery patterns.

**Code**:

```yaml
---
# error_handling.yml
- name: Ignore Errors and Error Recovery
 hosts: localhost
 gather_facts: false

 tasks:
 # Pattern 1: Ignore errors (continue playbook)
 # => Allow task failure without stopping playbook

 - name: Optional task that might fail # => Non-critical operation
 ansible.builtin.command: # => Command module
 cmd: /usr/local/bin/optional-tool --check # => Optional tool check
 # => Tool might not be installed (acceptable failure)
 ignore_errors: true # => Continue playbook even if task fails
 # => ignore_errors: true: Suppress failure
 # => Task marked failed but playbook continues
 # => Useful for: Optional operations, best-effort tasks
 register: optional_result # => Capture result for inspection
 # => optional_result.failed: True if task failed
 # => optional_result.rc: Return code
 # => failed: [localhost] (task fails but playbook continues)

 - name: Check if optional task succeeded # => Inspect optional task result
 ansible.builtin.debug: # => Debug module
 msg: "Optional tool {{ 'succeeded' if optional_result.rc == 0 else 'failed' }}" # => Conditional message
 # => Ternary expression: success (rc=0) or failure (rc!=0)
 # => Shows task result without stopping playbook
 # => Pattern: Error tolerance with post-check

 # Conditional error ignore
 - name: Task with conditional error handling
 ansible.builtin.command:
 cmd: test -f /tmp/important_file.txt
 register: file_check
 failed_when: false # => Never fail (alternative to ignore_errors)
 # => ok: [localhost] regardless of file existence

 - name: Create file if missing
 ansible.builtin.file:
 path: /tmp/important_file.txt
 state: touch
 when: file_check.rc != 0 # => Create only if previous check failed
 # => Recovery action based on check result

 # Error recovery pattern
 - name: Try primary service
 ansible.builtin.uri:
 url: https://primary.example.com/api
 method: GET
 register: primary_result
 ignore_errors: true
 # => Try primary endpoint, don't fail if unreachable

 - name: Fallback to secondary service
 ansible.builtin.uri: # => URI module: make HTTP request to fallback
 url: https://secondary.example.com/api # => Secondary/backup service
 method: GET # => HTTP GET request
 when: primary_result is failed # => Execute only if primary failed
 # => is failed: Test if registered result has failed status
 register: secondary_result # => secondary_result.status: HTTP status code
 # => ok: [localhost] - Secondary service responded
 # => Fallback to backup service when primary unreachable

 - name: Fallback to tertiary service
 ansible.builtin.uri: # => Last resort fallback service
 url: https://tertiary.example.com/api # => Third fallback endpoint
 method: GET
 when:
 - primary_result is failed # => Primary failed
 - secondary_result is failed # => Secondary also failed
 # => Both conditions must be true (AND logic)
 # => Only runs when both previous fallbacks failed
 # => skipped: [localhost] if secondary succeeded
 # => Last resort fallback

 # Fail playbook after recovery attempts
 - name: Fail if all services unavailable
 ansible.builtin.fail: # => Fail module: explicitly fail playbook with message
 msg: "All API endpoints are unavailable" # => Error message shown to operator
 when:
 - primary_result is failed # => Primary unreachable
 - secondary_result is failed # => Secondary unreachable
 - tertiary_result is failed # => Tertiary also unreachable
 # => failed: [localhost] if ALL three conditions true
 # => Explicit failure after exhausting recovery options
 # => Prevents silent failure (playbook would otherwise succeed)

 # Retry pattern with ignore_errors
 - name: Attempt flaky operation
 ansible.builtin.command: # => Command module
 cmd: /usr/local/bin/flaky-script.sh # => Script that occasionally fails
 register: flaky_result # => flaky_result.rc: Return code (0=success)
 ignore_errors: true # => Continue playbook on failure (allow retry)
 # => failed: [localhost] (task fails but playbook continues for retry)
 # => First attempt (might fail due to transient errors)

 - name: Retry flaky operation
 ansible.builtin.command: # => Same command, second attempt
 cmd: /usr/local/bin/flaky-script.sh
 when: flaky_result is failed # => Retry if first attempt failed
 # => skipped: [localhost] if first attempt succeeded
 register: retry_result # => retry_result.rc: Return code of second attempt
 # => ok/changed: [localhost] - Second attempt succeeded
 # => Second attempt

 - name: Final status
 ansible.builtin.debug: # => Debug module: report final outcome
 msg: "Operation {{ 'succeeded' if (flaky_result is success or retry_result is success) else 'failed after retry' }}"
 # => flaky_result is success: First attempt succeeded
 # => retry_result is success: Second attempt succeeded (first failed)
 # => Output: "Operation succeeded" or "Operation failed after retry"
```

**Run**: `ansible-playbook error_handling.yml`

**Key Takeaway**: Use `ignore_errors: true` to continue playbook execution after failures—essential for optional tasks or multi-path workflows. Combine with `register` and `is failed` test for error recovery patterns. Use `failed_when: false` as alternative to `ignore_errors` for more explicit control. Implement fallback chains for resilient automation. Always explicitly fail with `ansible.builtin.fail` after exhausting recovery options to prevent silent failures.

**Why It Matters**: Error tolerance enables graceful degradation in distributed systems where partial failures are acceptable. Multi-datacenter deployments continue when one region is unreachable. The `ignore_errors` pattern combined with `failed` result checking implements try-catch semantics, allowing playbooks to attempt operations, detect failures, and execute fallback strategies.

---

### Example 49: Block, Rescue, and Always

Blocks group tasks with unified error handling. `rescue` executes on failure, `always` executes regardless of outcome—similar to try/catch/finally.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Block Section"] --> B{Success?}
 B -->|Success| C["Always Section"]
 B -->|Failure| D["Rescue Section"]
 D --> E{Rescue Success?}
 E -->|Success| C
 E -->|Failure| F["Playbook Fails"]
 C --> G["Continue Playbook"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style D fill:#CC78BC,color:#fff
 style C fill:#029E73,color:#fff
 style E fill:#DE8F05,color:#fff
 style F fill:#CA9161,color:#fff
 style G fill:#029E73,color:#fff
```

**Code**:

```yaml
---
# block_rescue_always.yml
- name: Block, Rescue, and Always
 hosts: localhost
 gather_facts: false

 tasks:
 # Pattern: Block with rescue and always sections
 # => Try-catch-finally pattern for task groups

 - name: Block example with error handling # => Grouped error handling
 block: # => Try section (main execution path)
 # Tasks in block execute sequentially
 # First failure stops block, triggers rescue

 - name: Task that might fail # => Intentional failure for demo
 ansible.builtin.command: # => Command module
 cmd: /usr/bin/false # => Always fails (exit code 1)
 # => failed: [localhost] (triggers rescue section)
 # => Stops block execution immediately
 # => Does NOT fail playbook (rescue handles it)

 - name: This task won't execute # => Unreachable task
 ansible.builtin.debug: # => Debug module
 msg: "Skipped due to previous failure"
 # => Skipped: Previous task failed, block execution stopped
 # => Never executed when block fails

 rescue: # => Catch section (error handling)
 # Executes only if ANY task in block fails
 # Rescue tasks execute sequentially

 - name: Handle failure # => Error handler
 ansible.builtin.debug: # => Debug module
 msg: "Block failed, executing rescue tasks"
 # => Executes when any block task fails
 # => Recovery logic starts here

 - name: Recovery action # => Remediation step
 ansible.builtin.file: # => File module
 path: /tmp/error_recovery.log # => Error log file
 state: touch # => Create file
 # => Create error log for audit trail
 # => Recovery completed successfully

 always: # => Finally section (cleanup)
 # Executes ALWAYS: success or failure
 # Runs after block OR rescue completes

 - name: Cleanup (always executes) # => Guaranteed cleanup
 ansible.builtin.debug: # => Debug module
 msg: "Cleanup executing regardless of success/failure"
 # => Always executes, even if rescue fails
 # => Guaranteed execution for cleanup operations
 # => Similar to finally in try-catch-finally

 # Practical example: Database backup with rollback
 - name: Database operation with rollback
 block: # => Try section: attempt risky database operations
 - name: Create backup snapshot
 ansible.builtin.command: # => Command module: run pg_dump
 cmd: pg_dump appdb > /tmp/backup.sql
 # => pg_dump: PostgreSQL backup utility
 # => Creates SQL dump in /tmp/backup.sql before migration
 # => Backup before risky operation (idempotent if run twice)

 - name: Run database migration
 ansible.builtin.command: # => Run migration script
 cmd: /usr/local/bin/migrate-database.sh
 register: migration_result # => migration_result.rc: 0=success, 1+=failure
 # => Risky operation: schema changes, data transformations
 # => Failure here triggers rescue → rollback

 - name: Verify migration
 ansible.builtin.command: # => Validate migration succeeded
 cmd: /usr/local/bin/verify-migration.sh
 # => Validation step: confirms data integrity post-migration
 # => Failure here also triggers rescue → rollback

 rescue: # => Catch section: restore when any block task fails
 - name: Restore from backup
 ansible.builtin.command: # => psql: PostgreSQL CLI for restore
 cmd: psql appdb < /tmp/backup.sql
 # => Restore database from backup created in block
 # => Rollback on failure: database returned to pre-migration state

 - name: Notify failure
 ansible.builtin.debug: # => Debug module: report rollback completion
 msg: "Migration failed, database restored from backup"
 # => Output: Migration failed, database restored from backup

 always: # => Finally section: cleanup regardless of outcome
 - name: Remove backup file
 ansible.builtin.file: # => File module: delete temp file
 path: /tmp/backup.sql
 state: absent # => Delete backup SQL dump
 # => changed: [localhost] - Backup file deleted
 # => Cleanup backup regardless of outcome (success or rollback)

 # Nested blocks
 - name: Nested block example
 block: # => Outer try section
 - name: Outer block task
 ansible.builtin.debug: # => Debug module
 msg: "Outer block executing"
 # => ok: [localhost] - Outer block task runs

 - name: Nested block with own error handling
 block: # => Inner try section (independent error handling)
 - name: Inner task
 ansible.builtin.command: # => Command module
 cmd: /usr/bin/false # => /usr/bin/false: Always exits with code 1
 # => failed: [localhost] - Triggers INNER rescue (not outer)

 rescue: # => Inner catch: handles inner block failure
 - name: Inner rescue
 ansible.builtin.debug: # => Debug module
 msg: "Inner rescue executing"
 # => Executes because inner task failed
 # => Handles inner block failure - outer rescue NOT triggered

 # Note: Inner block failure does NOT trigger outer rescue
 # because inner rescue handled it successfully

 rescue: # => Outer catch: only triggers if OUTER block fails (not inner)
 - name: Outer rescue (won't execute)
 ansible.builtin.debug: # => Debug module
 msg: "Outer rescue (not reached)"
 # => skipped: Inner rescue handled the failure
 # => Outer rescue only triggers if outer block task fails without inner rescue

 always: # => Outer finally: always executes
 - name: Outer always
 ansible.builtin.debug: # => Debug module
 msg: "Outer always executing"
 # => ok: [localhost] - Always executes regardless of nested block outcome

 # Block with variables and conditions
 - name: Conditional block execution
 block: # => Try section with block-level when condition
 - name: Production-only task 1
 ansible.builtin.debug: # => Debug module
 msg: "Production task executing"
 # => skipped: [localhost] (environment != "production")

 - name: Production-only task 2
 ansible.builtin.debug: # => Debug module
 msg: "Another production task"
 # => skipped: [localhost] (condition false for both tasks)

 when: environment == "production" # => Entire block conditional
 # => when at block level applies to ALL tasks in block
 # => environment = "staging" → condition false → all tasks skipped
 # => All block tasks skip if condition false

 vars:
 environment: staging # => Block-scoped variable
 # => environment = "staging": condition false, entire block skipped
```

**Run**: `ansible-playbook block_rescue_always.yml`

**Key Takeaway**: Use `block`/`rescue`/`always` for structured error handling similar to try/catch/finally. Rescue section executes only on block failure, always section executes regardless of outcome. Blocks enable atomic operations with rollback—critical for database migrations, configuration updates, and deployments. Apply `when` conditions to entire blocks for efficiency. Nested blocks have independent error handling contexts.

**Why It Matters**: Blocks provide transaction-like semantics for grouped tasks—either all succeed or rescue executes recovery. Database schema migrations use block/rescue to rollback on failure. The `always` block ensures cleanup (temp file deletion, lock release) executes regardless of success or failure, preventing resource leaks in long-running automation.

---

### Example 50: Assertions and Validations

Use assertions to validate prerequisites, enforce invariants, and implement safety checks before dangerous operations.

**Code**:

```yaml
---
# assertions.yml
- name: Assertions and Validations
 hosts: localhost
 gather_facts: true

 vars:
 required_memory_mb: 2048
 required_disk_gb: 20
 allowed_environments: [development, staging, production]
 current_environment: production

 tasks:
 # Pattern 1: Simple assertion (single condition)
 # => Validate prerequisite before proceeding

 - name: Assert Ansible version # => Version requirement check
 ansible.builtin.assert: # => Assertion module
 that: # => Condition list (all must be true)
 - ansible_version.full is version('2.14', '>=') # => Version test
 # => ansible_version.full: Current Ansible version fact
 # => is version('2.14', '>='): Test if >= 2.14
 # => Condition: Current version must be 2.14 or higher
 fail_msg: "Ansible 2.14+ required, found {{ ansible_version.full }}" # => Failure message
 # => Displayed if assertion fails
 # => Includes current version for debugging
 success_msg: "Ansible version check passed" # => Success message
 # => Displayed if assertion passes
 # => If condition false: Playbook fails with fail_msg
 # => If condition true: Playbook continues with success_msg
 # => Use case: Enforce minimum tool versions

 # Pattern 2: Multiple conditions (all must be true)
 # => Comprehensive system validation
 - name: Assert system requirements # => Hardware prerequisite check
 ansible.builtin.assert: # => Assertion module
 that: # => Multiple conditions (AND logic)
 - ansible_memtotal_mb >= required_memory_mb # => Memory check
 # => ansible_memtotal_mb: Total system memory fact
 # => required_memory_mb: 2048 (defined in vars)
 # => Condition: System has 2GB+ RAM
 - ansible_mounts | selectattr('mount', 'equalto', '/') | map(attribute='size_available') | first | int > required_disk_gb * 1024 * 1024 * 1024 # => Disk check
 # => ansible_mounts: List of mounted filesystems
 # => selectattr('mount', 'equalto', '/'): Filter for root mount
 # => map(attribute='size_available'): Extract available space
 # => | first: Get first result
 # => | int: Convert to integer
 # => > required_disk_gb * 1024^3: Compare with 20GB in bytes
 - ansible_processor_vcpus >= 2 # => CPU check
 # => ansible_processor_vcpus: vCPU count fact
 # => Condition: System has 2+ CPUs
 fail_msg: | # => Multi-line failure message
 System requirements not met:
 - Memory: {{ ansible_memtotal_mb }}MB (required: {{ required_memory_mb }}MB)
 - CPUs: {{ ansible_processor_vcpus }} (required: 2+)
 # => Shows actual vs required values for troubleshooting
 success_msg: "System requirements validated" # => Success message
 # => All conditions must pass for success
 # => Any failure: Playbook stops with diagnostic info
 # => Validates hardware before expensive deployment

 # Pattern 3: Whitelist validation
 # => Ensure value is in allowed set
 - name: Assert valid environment # => Environment validation
 ansible.builtin.assert: # => Assertion module
 that: # => Condition list
 - current_environment in allowed_environments # => Whitelist check
 # => current_environment: production (from vars)
 # => allowed_environments: [development, staging, production]
 # => in operator: Membership test
 # => Condition: Value must be in whitelist
 fail_msg: "Invalid environment: {{ current_environment }}" # => Rejection message
 # => Displays invalid environment value
 # => Prevents typos: "prod" vs "production"
 # => Prevents deployment to unknown environments
 # => Security: Rejects unauthorized deployment targets

 # Validate file exists before operation
 - name: Check if configuration exists
 ansible.builtin.stat: # => Stat module: get file metadata without modifying
 path: /etc/app/config.yml # => Check this specific config file
 register: config_file # => config_file.stat.exists: boolean (true/false)
 # => config_file.stat.size: File size in bytes (0 if missing)
 changed_when: false # => Stat is read-only, never reports changed

 - name: Assert configuration file exists
 ansible.builtin.assert: # => Assertion module
 that:
 - config_file.stat.exists # => config_file.stat.exists: true if file present
 # => Condition: File must exist (stat returned data)
 - config_file.stat.size > 0 # => File must have content (not empty)
 # => Catches case where file exists but was accidentally emptied
 fail_msg: "Configuration file missing or empty"
 # => Fails early if config missing (before app deployment)
 # => ok: [localhost] - Config exists and has content

 # Validate service state
 - name: Check current service status
 ansible.builtin.systemd: # => Systemd module: get service information
 name: nginx # => Service to check
 register: nginx_status # => nginx_status.status: Dict of service properties
 # => nginx_status.status.LoadState: "loaded" or "not-found"
 # => nginx_status.status.SubState: "running", "dead", "failed"
 check_mode: true # => check_mode: Read-only (don't start/stop service)

 - name: Assert service requirements
 ansible.builtin.assert: # => Assertion module
 that:
 - nginx_status.status.LoadState == "loaded" # => Service unit file found
 # => "not-found": Service not installed
 - nginx_status.status.SubState == "running" # => Service actively running
 # => "dead": Service stopped; "failed": Service crashed
 fail_msg: "Nginx not running properly"
 # => Validates service state before dependent operations
 # => ok: [localhost] - Nginx loaded and running

 # Validate database connection
 - name: Test database connectivity
 ansible.builtin.command: # => Command module: test PostgreSQL connection
 cmd: pg_isready -h localhost -p 5432
 # => pg_isready: PostgreSQL connectivity checker utility
 # => Exits 0 if server is accepting connections
 register: db_check # => db_check.rc: 0=accepting connections, 1+=not ready
 failed_when: false # => Never fail this task (we check rc manually)
 changed_when: false # => Connectivity check never changes system state

 - name: Assert database accessible
 ansible.builtin.assert: # => Assertion module
 that:
 - db_check.rc == 0 # => pg_isready returned 0: Database accepting connections
 # => rc=1: Server rejecting connections, rc=2: No response
 fail_msg: "Database not accessible on localhost:5432"
 # => Validates connectivity before schema migrations
 # => ok: [localhost] - Database is accessible

 # Validate variable types and format
 - name: Assert variable types
 ansible.builtin.assert: # => Assertion module: validate variable schema
 that:
 - app_port is defined # => Variable must exist (not undefined)
 # => Prevents "undefined variable" errors in subsequent tasks
 - app_port is number # => Must be numeric type (not string "8080")
 # => is number: Jinja2 test for numeric types
 - app_port >= 1024 # => Port must be in non-privileged range (≥1024)
 # => Privileged ports (< 1024) require root; app runs as user
 - app_port <= 65535 # => Must be valid TCP port number (max 65535)
 - app_name is string # => Must be string type
 - app_name | length > 0 # => Must not be empty string
 # => | length: Returns string length; > 0 ensures non-empty
 fail_msg: "Invalid variable types or values"
 vars:
 app_port: 8080 # => Valid: number, 1024 <= 8080 <= 65535
 app_name: "MyApp" # => Valid: string, length > 0
 # => Validates variable schemas before usage

 # Conditional assertions (only in production)
 - name: Production-specific checks
 ansible.builtin.assert: # => Assertion module
 that:
 - ssl_enabled == true # => Production requires SSL
 # => Condition: SSL must be enabled in production
 - debug_mode == false # => Debug mode forbidden in production
 # => Prevents accidental verbose logging in production
 - monitoring_enabled == true # => Monitoring required in production
 # => Ensures observability before traffic receives production load
 fail_msg: "Production safety checks failed"
 when: current_environment == "production" # => Only run in production
 # => Skipped in development/staging (debug mode allowed there)
 vars:
 ssl_enabled: true # => Meets production requirement
 debug_mode: false # => Meets production requirement
 monitoring_enabled: true # => Meets production requirement
 # => Enforces production safety requirements
 # => ok: [localhost] - All production safety checks passed

 # Assert with quiet mode
 - name: Silent validation
 ansible.builtin.assert: # => Assertion module
 that:
 - ansible_distribution in ['Ubuntu', 'Debian', 'RedHat', 'CentOS']
 # => ansible_distribution: OS distribution fact (e.g., "Ubuntu")
 # => in [list]: Membership test against supported OS list
 # => Prevents running on unsupported OS distributions
 quiet: true # => Only show output on failure (suppress success messages)
 # => Reduces output noise for successful validations
 # => ok: [localhost] - OS is in supported list (silent success)
```

**Run**: `ansible-playbook assertions.yml`

**Key Takeaway**: Use `ansible.builtin.assert` to validate prerequisites before dangerous operations—prevents partial failures and corrupted state. Assertions fail fast, stopping playbook execution immediately when conditions aren't met. Use `that:` list for multiple conditions (implicit AND). Provide clear `fail_msg` for troubleshooting. Assertions document assumptions and make playbooks self-validating—critical for production automation.

**Why It Matters**: Assertions fail fast when preconditions aren't met, preventing cascading failures and corruption. Production playbooks validate disk space before database installations, RAM before JVM tuning, and network connectivity before cluster formation. Early validation with clear error messages reduces mean-time-to-recovery by 50% compared to cryptic failures deep in task execution.

---

## Group 12: Tags & Task Control

### Example 51: Task Tagging Basics

Tags enable selective task execution without modifying playbooks. Run subsets of tasks using `--tags` and `--skip-tags`.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
 A["Playbook with Tags"] --> B["Task 1: install"]
 A --> C["Task 2: configure"]
 A --> D["Task 3: always"]
 A --> E["Task 4: never"]

 F["--tags install"] --> G["Execute Task 1 Only"]
 H["--tags configure"] --> I["Execute Task 2 Only"]
 J["No Tags"] --> K["Execute All Except never"]
 L["--tags never"] --> M["Execute Task 4 Only"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#CC78BC,color:#fff
 style E fill:#CA9161,color:#fff
 style G fill:#DE8F05,color:#fff
 style I fill:#029E73,color:#fff
 style K fill:#CC78BC,color:#fff
 style M fill:#CA9161,color:#fff
```

**Code**:

```yaml
---
# task_tags.yml
- name: Task Tagging Basics
 hosts: localhost
 gather_facts: false

 tasks:
 # Pattern 1: Single tag assignment
 # => Basic task tagging

 - name: Install packages # => Installation task
 ansible.builtin.package: # => Package module
 name: nginx # => Package to install
 state: present # => Ensure installed
 tags: install # => Single tag assignment
 # => tags: tagname (string format for single tag)
 # => Run with: ansible-playbook playbook.yml --tags install
 # => Only this task (and always-tagged tasks) execute
 # => Skipped without --tags install

 # Pattern 2: Multiple tags on single task
 # => Task belongs to multiple logical groups
 - name: Configure nginx # => Configuration task
 ansible.builtin.template: # => Template module
 src: nginx.conf.j2 # => Template source
 dest: /etc/nginx/nginx.conf # => Destination
 tags: # => Multiple tags (list format)
 - configure # => Configuration tag
 - nginx # => Service-specific tag
 # => Task has TWO tags: configure AND nginx
 # => Run with: ansible-playbook playbook.yml --tags configure
 # => Also runs with: ansible-playbook playbook.yml --tags nginx
 # => Either tag triggers execution

 # Pattern 3: Tagged task with handler notification
 # => Tags affect task execution, handlers execute if notified
 - name: Deploy application # => Deployment task
 ansible.builtin.copy: # => Copy module
 src: app.tar.gz # => Source archive
 dest: /opt/app/ # => Deployment destination
 tags: deploy # => Deployment tag
 notify: restart app # => Handler notification
 # => Task runs only with --tags deploy
 # => If task changes, handler queued (even in tagged run)
 # => Handler executes at play end

 # Pattern 4: Special tag "always"
 # => Task ALWAYS executes (except with --skip-tags always)
 - name: Verify system requirements # => Pre-flight check
 ansible.builtin.assert: # => Assertion module
 that: # => Condition list
 - ansible_memtotal_mb >= 1024 # => Memory requirement
 tags: always # => Special tag: always
 # => always tag: Task runs in ALL tag scenarios
 # => Runs with: No tags, --tags install, --tags configure, etc.
 # => Skipped ONLY with: --skip-tags always
 # => Use for: Pre-checks, validations, safety checks

 # Pattern 5: Special tag "never"
 # => Task NEVER executes (except with explicit --tags never)
 - name: Dangerous operation # => High-risk task
 ansible.builtin.command: # => Command module
 cmd: rm -rf /tmp/cache/* # => Destructive operation
 tags: never # => Special tag: never
 # => never tag: Task skipped by default
 # => Skipped with: No tags, --tags install, etc.
 # => Runs ONLY with: --tags never (explicit)
 # => Use for: Destructive ops, manual-only tasks

 # Pattern 6: Untagged task
 # => Task runs in default (no-tags) execution
 - name: Create log directory # => Utility task
 ansible.builtin.file: # => File module
 path: /var/log/app # => Log directory path
 state: directory # => Ensure directory exists
 # => No tags assigned (untagged)
 # => Runs when: No --tags specified
 # => Skipped when: --tags specified (unless always-tagged)
 # => Default behavior: Execute untagged + always-tagged

 # Multiple roles of same tag
 - name: Update configuration
 ansible.builtin.template:
 src: app.conf.j2
 dest: /etc/app/config.conf
 tags:
 - configure
 - update
 # => Runs with either --tags configure OR --tags update

 handlers:
 - name: restart app
 ansible.builtin.service:
 name: app
 state: restarted
 tags: always # => Handler inherits tags from notifying task
 # => Executes if notifying task runs and changes
```

**Run with tags**:

```bash
# Run only install tasks
ansible-playbook task_tags.yml --tags install

# Run multiple tags
ansible-playbook task_tags.yml --tags "install,configure"

# Run all except specific tags
ansible-playbook task_tags.yml --skip-tags deploy

# Run only never tasks
ansible-playbook task_tags.yml --tags never

# List available tags
ansible-playbook task_tags.yml --list-tags

# List tasks with specific tag
ansible-playbook task_tags.yml --tags deploy --list-tasks

# Combine tags and skip-tags
ansible-playbook task_tags.yml --tags configure --skip-tags never
```

**Key Takeaway**: Tags enable surgical playbook execution without code changes. Use `always` tag for tasks that must run every time (validations, checks). Use `never` tag for dangerous operations requiring explicit opt-in. Tasks can have multiple tags for flexible grouping. Handlers inherit tags from notifying tasks. Tags are a runtime feature—playbook code remains unchanged.

**Why It Matters**: Tags enable selective playbook execution for faster iteration and targeted operations. Deploy only database changes with `--tags database`, skip slow integration tests with `--skip-tags tests`. Production hotfixes run tagged tasks to patch vulnerabilities in minutes without full infrastructure reconfiguration. This pattern reduces deployment time for focused changes.

---

### Example 52: Role and Play Tagging

Apply tags to entire plays or roles for coarse-grained control. Tags cascade to all tasks within tagged play/role.

**Code**:

**Role with tags** (`roles/webserver/tasks/main.yml`):

```yaml
---
# Webserver role tasks
- name: Install web server
 ansible.builtin.package:
 name: nginx
 state: present
 tags: install # => Task-level tag

- name: Configure web server
 ansible.builtin.template: # => Template module: render nginx config
 src: nginx.conf.j2 # => Jinja2 template source
 dest: /etc/nginx/nginx.conf # => Rendered config destination
 # => changed: [localhost] - Config deployed
 tags: configure # => Task tag: configure (plus inherited play/role tags)

- name: Start web server
 ansible.builtin.service: # => Service module: manage nginx service
 name: nginx # => Service name
 state: started # => Ensure nginx is running
 # => changed: [localhost] - Service started
 # => ok: [localhost] - Service already running (idempotent)
 tags: service # => Task tag: service (plus inherited play/role tags)
```

**Playbook with role and play tags**:

```yaml
---
# role_play_tags.yml
# => Demonstrates play-level and role-level tagging

# Play 1: Tagged play
# => All tasks in play inherit play tags

- name: Setup Phase # => Play name
 hosts: localhost # => Target hosts
 gather_facts: true # => Gather facts
 tags: setup # => Play-level tag
 # => tags: setup (at play level)
 # => Applies to ALL tasks/roles in this play
 # => Inheritance: Every task gets 'setup' tag automatically

 tasks:
 - name: Update package cache # => APT cache refresh
 ansible.builtin.apt: # => APT module (Debian/Ubuntu)
 update_cache: true # => Run apt-get update
 when: ansible_os_family == "Debian" # => Conditional execution
 # => Tags for this task: ['setup'] (inherited from play)
 # => Run with: --tags setup
 # => No additional task-level tags

 - name: Install common packages # => Package installation
 ansible.builtin.package: # => Package module
 name: # => Package list
 - curl # => HTTP client
 - vim # => Text editor
 state: present # => Ensure installed
 # => Tags for this task: ['setup'] (inherited from play)
 # => Also runs with: --tags setup
 # => All tasks in 'Setup Phase' play share 'setup' tag

# Play 2: Role with tags
# => Demonstrates role-level tagging
- name: Deploy Web Server # => Play name
 hosts: localhost # => Target hosts
 become: true # => Escalate privileges
 tags: webserver # => Play-level tag
 # => tags: webserver (at play level)
 # => All tasks/roles in this play inherit 'webserver'

 roles:
 - role: webserver # => Apply webserver role
 tags: web # => Role-level tag (in addition to play tag)
 # => Role-level tags add to play-level tags
 # => Tasks in webserver role have TWO tag sources:
 # => 1. 'webserver' (inherited from play)
 # => 2. 'web' (applied at role level)
 # => Effective tags for role tasks:
 # => - Task with tags: install → ['webserver', 'web', 'install']
 # => - Task with tags: configure → ['webserver', 'web', 'configure']
 # => - Task with tags: service → ['webserver', 'web', 'service']
 # => Run entire role: --tags webserver OR --tags web
 # => Run specific task: --tags install (gets all 3 tags)
 # => Can run with --tags webserver OR --tags web

# Play 3: Multiple roles with different tags
- name: Deploy Application Stack
 hosts: localhost # => Target hosts for full stack deployment
 become: true # => Root required for service management

 roles:
 - role: database # => Apply database role (PostgreSQL setup)
 tags: database # => All database role tasks inherit 'database' tag
 # => Run with: --tags database (only database role)

 - role: cache # => Apply cache role (Redis setup)
 tags: cache # => All cache role tasks inherit 'cache' tag
 # => Run with: --tags cache (only cache role)

 - role: application # => Apply application deployment role
 tags:
 - app # => Multiple role tags: app AND deploy
 # => Run with: --tags app OR --tags deploy (either runs this role)
 - deploy

# Play 4: Mixed tagged and untagged tasks
- name: Configuration Phase
 hosts: localhost
 tags: config

 tasks:
 - name: Tagged task within tagged play
 ansible.builtin.debug:
 msg: "Has both 'config' (play) and 'important' (task) tags"
 tags: important
 # => Has tags: config, important

 - name: Untagged task in tagged play
 ansible.builtin.debug:
 msg: "Only has 'config' tag from play"
 # => Has tags: config

# Play 5: Tag inheritance demonstration
- name: Tag Inheritance
 hosts: localhost
 tags:
 - phase1
 - initialization

 tasks:
 - name: Task with additional tags
 ansible.builtin.debug:
 msg: "Multiple inherited and task tags"
 tags:
 - step1
 - critical
 # => Has tags: phase1, initialization, step1, critical
```

**Run with various tag combinations**:

```bash
# Run entire setup phase
ansible-playbook role_play_tags.yml --tags setup

# Run webserver role (via play tag OR role tag)
ansible-playbook role_play_tags.yml --tags webserver
ansible-playbook role_play_tags.yml --tags web

# Run only database deployment
ansible-playbook role_play_tags.yml --tags database

# Run multiple roles
ansible-playbook role_play_tags.yml --tags "database,cache,app"

# Skip entire phase
ansible-playbook role_play_tags.yml --skip-tags config

# Run specific task tag across all plays
ansible-playbook role_play_tags.yml --tags install
```

**Tag inheritance hierarchy**:

1. Play tags → Apply to all tasks in play
2. Role tags → Apply to all tasks in role
3. Task tags → Apply to specific task
4. **Combined**: Task has all three levels

**Key Takeaway**: Tag plays for phase-level control (setup, deploy, cleanup), tag roles for component-level control (webserver, database), tag tasks for operation-level control (install, configure). Tags are additive—tasks inherit play and role tags plus their own task tags. This multi-level tagging enables flexible execution patterns from coarse-grained (entire plays) to fine-grained (specific tasks).

**Why It Matters**: Play-level and role-level tags organize complex playbooks by operational phase (prepare, deploy, verify) or concern (security, monitoring, backup). CI/CD pipelines run different tag combinations for different deployment stages—validation tags in pull requests, full deployment tags in production. This structured approach reduces cognitive load when managing 20+ role playbooks.

---

### Example 53: Tag-Based Workflows

Design playbooks with tag-based workflows for common operational scenarios: deployment, rollback, health checks, maintenance.

**Code**:

```yaml
---
# tag_workflows.yml
- name: Application Deployment Workflow
 hosts: localhost # => Execute on local machine (demo; use real hosts in production)
 become: true # => Escalate to root (required for service management, /opt/app)
 gather_facts: true # => Required: ansible_date_time.date used in backup path

 vars:
 app_version: "2.1.0" # => Target deployment version
 app_user: appuser # => Application system user (for file ownership)

 tasks:
 # Pre-deployment checks (always run)
 - name: Verify system requirements
 ansible.builtin.assert: # => Assertion module: fails playbook if conditions false
 that:
 - ansible_memtotal_mb >= 2048 # => Require at least 2GB RAM before deploy
 # => ansible_memtotal_mb: Fact for total system memory
 - ansible_mounts | selectattr('mount', 'equalto', '/') | map(attribute='size_available') | first | int > 10000000000
 # => Require at least ~10GB free disk space on root filesystem
 tags: always
 # => tags: always: This task runs with ANY tag combination
 # => Ensures pre-checks execute before any phase (deploy, rollback, etc.)
 # => ok: [localhost] - System meets minimum requirements

 # Backup phase
 - name: Create backup directory
 ansible.builtin.file: # => File module: create/delete/modify file system objects
 path: /backup/{{ ansible_date_time.date }} # => Date-stamped backup dir e.g. /backup/2025-01-15
 state: directory # => Create directory if it doesn't exist
 # => changed: [localhost] - Directory created
 tags:
 - backup # => Run with: --tags backup
 - rollback # => Also needed for rollback
 # => Multiple tags: task runs when EITHER tag is specified

 - name: Backup application
 ansible.builtin.command: # => Command module: run arbitrary commands
 cmd: tar czf /backup/{{ ansible_date_time.date }}/app-backup.tar.gz /opt/app
 # => tar czf: Create compressed archive of /opt/app
 # => Destination: /backup/2025-01-15/app-backup.tar.gz
 # => changed: [localhost] - Backup archive created
 tags:
 - backup # => ansible-playbook playbook.yml --tags backup
 - rollback # => Backup needed before rollback restore
 # => Run backup only: --tags backup
 # => Run backup as part of rollback prep: --tags rollback

 # Deployment phase
 - name: Stop application
 ansible.builtin.service: # => Service module: manage systemd services
 name: app # => Service name: 'app' (must match systemd unit)
 state: stopped # => Stop the service before deploying new version
 # => changed: [localhost] - Service stopped (was running)
 # => ok: [localhost] - Service already stopped (idempotent)
 tags: deploy
 # => ansible-playbook playbook.yml --tags deploy

 - name: Deploy new version
 ansible.builtin.unarchive: # => Unarchive module: extract tar/zip archives
 src: /tmp/app-{{ app_version }}.tar.gz # => Source archive: /tmp/app-2.1.0.tar.gz
 dest: /opt/app # => Extract to application directory
 owner: "{{ app_user }}" # => Set file ownership to appuser
 # => changed: [localhost] - New version extracted, files updated
 tags: deploy # => Runs as part of deploy workflow

 - name: Update configuration
 ansible.builtin.template: # => Template module: render Jinja2 template
 src: app.conf.j2 # => Template source file
 dest: /etc/app/config.conf # => Rendered config destination
 # => changed: [localhost] - Config file updated with new content
 # => ok: [localhost] - Config unchanged (idempotent)
 tags:
 - deploy # => Runs during full deployment
 - config # => Can update config independently: --tags config
 # => --tags config: Update config without stopping/starting app

 - name: Run database migrations
 ansible.builtin.command: # => Command module: run migration script
 cmd: /opt/app/bin/migrate # => Application migration script
 # => changed: [localhost] - Migrations applied
 tags:
 - deploy # => Migrations run as part of full deployment
 - migration # => ansible-playbook playbook.yml --tags migration (run migrations only)
 # => --tags migration: Run only database migrations (no service restart)

 - name: Start application
 ansible.builtin.service: # => Service module: start service after deployment
 name: app # => Service to start
 state: started # => Ensure service is running
 # => changed: [localhost] - Service started
 tags:
 - deploy # => Final step of deployment workflow
 - restart # => Quick restart without full deploy: --tags restart
 # => ansible-playbook playbook.yml --tags restart

 # Health check phase
 - name: Wait for application startup
 ansible.builtin.wait_for: # => Wait for port to become available
 host: localhost # => Check on local machine
 port: 8080 # => Application HTTP port
 delay: 5 # => Wait 5 seconds before first check
 timeout: 60 # => Fail if port not open within 60 seconds
 # => ok: [localhost] - Port 8080 now accepting connections
 # => failed: [localhost] - Timeout: app failed to start
 tags:
 - deploy # => Part of post-deployment verification
 - health_check # => ansible-playbook playbook.yml --tags health_check
 - verify # => Grouped under verify for broader health checks

 - name: Verify application health
 ansible.builtin.uri: # => URI module: make HTTP requests
 url: http://localhost:8080/health # => Application health endpoint
 return_content: true # => Capture response body for assertion
 register: health_response # => health_response.status: HTTP status code
 # => health_response.content: Response body text
 # => ok: [localhost] - HTTP 200 received
 tags:
 - deploy
 - health_check
 - verify

 - name: Assert healthy status
 ansible.builtin.assert: # => Validate health check response
 that:
 - health_response.status == 200 # => HTTP 200 OK required
 # => health_response.status: Integer HTTP status code
 - "'healthy' in health_response.content" # => Body must contain 'healthy'
 # => Ensures app reports itself as operational, not just reachable
 # => ok: [localhost] - Application is healthy and accepting traffic
 # => failed: [localhost] - App unhealthy, deployment blocked
 tags:
 - deploy
 - health_check
 - verify

 # Rollback phase (never runs unless explicitly tagged)
 - name: Stop application (rollback)
 ansible.builtin.service:
 name: app
 state: stopped # => Stop running app before restoring backup
 # => changed: [localhost] - Service stopped for rollback
 tags:
 - rollback # => Part of rollback workflow
 - never # => never tag: NEVER runs unless --tags rollback explicitly given
 # => Prevents accidental rollback in normal --tags deploy execution

 - name: Restore from backup
 ansible.builtin.unarchive:
 src: /backup/{{ ansible_date_time.date }}/app-backup.tar.gz
 # => Restore today's backup archive
 dest: / # => Extract to root (restores full /opt/app directory tree)
 remote_src: true # => Archive already on target machine (not controller)
 # => changed: [localhost] - Previous version restored from backup
 tags:
 - rollback
 - never # => Only runs with: ansible-playbook playbook.yml --tags rollback

 - name: Start application (rollback)
 ansible.builtin.service:
 name: app
 state: started # => Restart app with restored version
 # => changed: [localhost] - Application restarted with previous version
 tags:
 - rollback
 - never

 # Maintenance mode
 - name: Enable maintenance page
 ansible.builtin.copy: # => Copy module: copy file to target
 src: maintenance.html # => Static maintenance page (in files/ directory)
 dest: /var/www/html/index.html # => Replace live index with maintenance page
 # => changed: [localhost] - Maintenance page deployed, users see maintenance message
 tags:
 - maintenance # => ansible-playbook playbook.yml --tags maintenance
 - never # => Requires explicit --tags maintenance to prevent accidental activation

 - name: Disable maintenance page
 ansible.builtin.file: # => File module: manage files
 path: /var/www/html/index.html
 state: absent # => Remove maintenance page (restores normal operation)
 # => changed: [localhost] - Maintenance page removed
 tags:
 - unmaintenance # => ansible-playbook playbook.yml --tags unmaintenance
 - never # => Requires explicit opt-in (symmetric with maintenance)

 # Cleanup phase
 - name: Remove old backups
 ansible.builtin.find: # => Find module: locate files matching criteria
 paths: /backup # => Search in backup directory
 age: 7d # => Find directories older than 7 days
 file_type: directory # => Match directories only (date-stamped backup dirs)
 register: old_backups # => old_backups.files: List of matching directories
 # => old_backups.files[0].path: Full path to each old backup dir
 tags:
 - cleanup # => ansible-playbook playbook.yml --tags cleanup
 - never # => Requires explicit --tags cleanup (destructive operation)

 - name: Delete old backups
 ansible.builtin.file: # => File module: delete files/directories
 path: "{{ item.path }}" # => Each old backup directory path
 state: absent # => Remove directory and all contents
 # => changed: [localhost] - Old backup directory deleted
 loop: "{{ old_backups.files }}" # => Iterate over found directories
 # => Runs once per backup directory older than 7 days
 tags:
 - cleanup
 - never
```

**Workflow execution scenarios**:

```bash
# Full deployment (backup + deploy + verify)
ansible-playbook tag_workflows.yml --tags "backup,deploy"
# => Runs: Verify system (always) + Create backup dir + Backup app + Stop + Deploy + Config + Migrate + Start + Health checks
# => Tasks tagged 'backup' AND tasks tagged 'deploy' both execute

# Quick config update without full deploy
ansible-playbook tag_workflows.yml --tags config
# => Runs: Verify system (always) + Update configuration only
# => Skips: backup, stop/start application, database migrations
# => Use case: Push config changes without service downtime

# Restart application only
ansible-playbook tag_workflows.yml --tags restart
# => Runs: Verify system (always) + Start application task
# => start service task has both 'deploy' and 'restart' tags
# => Use case: Quick restart after manual config edit

# Run health checks only
ansible-playbook tag_workflows.yml --tags health_check
# => Runs: Verify system (always) + Wait for port + Health URI check + Assert healthy
# => Use case: Verify deployment succeeded without re-deploying

# Emergency rollback
ansible-playbook tag_workflows.yml --tags rollback
# => Runs: Verify system (always) + Create backup dir + Backup + Stop + Restore + Start
# => 'never' tagged tasks execute because 'rollback' tag explicitly requested
# => Use case: Revert to previous version after failed deployment

# Enable maintenance mode
ansible-playbook tag_workflows.yml --tags maintenance
# => Runs: Verify system (always) + Enable maintenance page
# => 'never' tagged task executes because 'maintenance' explicitly requested
# => Use case: Take site offline for major maintenance window

# Database migration only
ansible-playbook tag_workflows.yml --tags migration
# => Runs: Verify system (always) + Run database migrations
# => Skips: stop/start application, backup, config update
# => Use case: Apply schema changes to already-running application

# Cleanup old backups
ansible-playbook tag_workflows.yml --tags cleanup
# => Runs: Verify system (always) + Find old backups + Delete old backups
# => Deletes backup directories older than 7 days

# Deployment skipping health checks
ansible-playbook tag_workflows.yml --tags deploy --skip-tags health_check
# => Runs all 'deploy' tasks EXCEPT health_check-tagged tasks
# => Use case: Emergency deployment when health endpoint is temporarily unavailable
```

**Key Takeaway**: Design playbooks with overlapping tags for different workflows. Use `never` tag for destructive operations (rollback, maintenance, cleanup). Combine `always` for prerequisites and validation. Tag grouping enables: full deployments (`backup,deploy`), quick operations (`restart`, `config`), maintenance tasks (`cleanup`, `maintenance`), and emergency procedures (`rollback`). This pattern creates playbooks that serve multiple operational needs without duplication.

**Why It Matters**: Tag-driven workflows implement operational procedures as tag combinations—disaster recovery as `--tags restore,verify`, compliance as `--tags audit,report`. This codifies operational knowledge into executable procedures, enabling junior engineers to perform complex operations safely. Tag dependencies (`always` and `never`) prevent dangerous operations like `--tags deploy` without `--tags validate`.

---

### Example 54: Task Delegation and Run Once

Delegate tasks to different hosts or execute once across group. Control task execution context beyond inventory targeting.

**Code**:

```yaml
---
# delegation.yml
- name: Task Delegation and Run Once
 hosts: webservers # => Target host group
 gather_facts: true

 tasks:
 # Pattern 1: Regular task (default behavior)
 # => Task executes on target hosts (webservers)

 - name: Install nginx on webservers # => Standard task execution
 ansible.builtin.package: # => Package module
 name: nginx # => Package name
 state: present # => Ensure installed
 # => Execution: Runs on ALL hosts in webservers group
 # => If webservers = [web1, web2, web3]:
 # => - Executes on web1
 # => - Executes on web2
 # => - Executes on web3
 # => Default behavior: Task runs on play's target hosts

 # Pattern 2: Delegate to specific host
 # => Task executes on different host than play target
 - name: Update load balancer configuration # => Cross-host operation
 ansible.builtin.template: # => Template module
 src: backend.conf.j2 # => Template source
 dest: /etc/haproxy/backends.conf # => Destination path
 delegate_to: loadbalancer.example.com # => Execution delegation
 # => delegate_to: Execute on this host instead of play target
 # => Task runs on: loadbalancer.example.com
 # => Context: Still has webserver's variables/facts
 # => Loop behavior: Executes on loadbalancer ONCE PER webserver
 # => - web1 triggers update on loadbalancer
 # => - web2 triggers update on loadbalancer (overwrites)
 # => - web3 triggers update on loadbalancer (overwrites)
 # => Use with run_once to prevent overwrites

 # Pattern 3: Delegate to localhost (control node)
 # => Task executes on Ansible control machine
 - name: Generate report on control node # => Local file creation
 ansible.builtin.copy: # => Copy module
 dest: /tmp/webserver_report.txt # => Destination on control node
 content: | # => Multi-line content
 Webserver: {{ inventory_hostname }}
 IP: {{ ansible_default_ipv4.address }}
 Memory: {{ ansible_memtotal_mb }}MB
 delegate_to: localhost # => Execute on control machine
 # => Task runs on: Control node (Ansible machine)
 # => Has access to: Current webserver's facts/variables
 # => Loop behavior: Creates file ONCE PER webserver
 # => - web1 creates /tmp/webserver_report.txt (overwrites)
 # => - web2 creates /tmp/webserver_report.txt (overwrites)
 # => - web3 creates /tmp/webserver_report.txt (overwrites)
 # => Final file contains only web3 data (last iteration)

 # Pattern 4: Run once across all hosts
 # => Task executes on first host only, skips rest
 - name: Database migration (run once) # => Singleton operation
 ansible.builtin.command: # => Command module
 cmd: /usr/local/bin/migrate-database.sh # => Migration script
 run_once: true # => Execute on first host only
 # => run_once: true: Prevents duplicate execution
 # => Execution: Runs on web1 (first host in group)
 # => Skipped: web2, web3.. (all other hosts)
 # => Use case: Database migrations, one-time setup tasks
 # => Rationale: Migration should run exactly once, not per server

 # Pattern 5: Run once with delegation (combined)
 # => Task executes once on delegated host
 - name: Notify external service (run once) # => External API call
 ansible.builtin.uri: # => HTTP module
 url: https://api.example.com/deployment # => API endpoint
 method: POST # => HTTP method
 body_format: json # => JSON payload
 body: # => Request body
 event: deployment_started # => Event type
 timestamp: "{{ ansible_date_time.iso8601 }}" # => Timestamp
 run_once: true # => Execute once (not per host)
 delegate_to: localhost # => Execute on control node
 # => Combination:
 # => run_once: Execute once only (not 3 times for 3 webservers)
 # => delegate_to: Execute on control node
 # => Result: Single API call from control machine
 # => No duplicate notifications regardless of webserver count
 # => Use case: Slack notifications, monitoring alerts

 # Pattern 6: Local action (shorthand for delegate_to: localhost)
 # => Syntactic sugar for common delegation pattern
 - name: Create local backup directory # => Local directory creation
 ansible.builtin.file: # => File module
 path: /tmp/backups/{{ inventory_hostname }} # => Directory path
 state: directory
 delegate_to: localhost
 # => Creates directory on control node for each webserver

 # Delegate facts gathering
 - name: Gather facts from database server
 ansible.builtin.setup:
 delegate_to: db.example.com
 delegate_facts: true # => Store facts under db.example.com, not webserver
 # => Collects db.example.com facts accessible via hostvars['db.example.com']

 # Use delegated facts
 - name: Configure database connection
 ansible.builtin.template:
 src: db_config.j2
 dest: /etc/app/database.conf
 content: |
 host={{ hostvars['db.example.com'].ansible_default_ipv4.address }}
 port=5432
 # => Uses database server IP from delegated facts

 # Delegate with connection override
 - name: Execute on remote via specific connection
 ansible.builtin.command:
 cmd: kubectl get pods
 delegate_to: k8s-master.example.com
 vars:
 ansible_connection: ssh
 ansible_user: k8s-admin
 # => Overrides connection parameters for delegation

 # Run once with conditional
 - name: Conditional run-once task
 ansible.builtin.debug:
 msg: "First production webserver: {{ inventory_hostname }}"
 run_once: true
 when: "'production' in group_names"
 # => Runs once on first host matching condition

 # Delegate to inventory group member
 - name: Update monitoring server
 ansible.builtin.uri:
 url: http://{{ item }}/api/register
 method: POST
 body_format: json
 body:
 hostname: "{{ inventory_hostname }}"
 ip: "{{ ansible_default_ipv4.address }}"
 delegate_to: "{{ item }}"
 loop: "{{ groups['monitoring'] }}" # => Delegate to each monitoring server
 # => Registers this webserver with all monitoring servers
```

**Practical scenarios**:

```yaml
---
# Rolling deployment with load balancer
- hosts: webservers
 serial: 1 # => One host at a time

 tasks:
 # Remove from load balancer
 - name: Disable server in load balancer
 ansible.builtin.command:
 cmd: /usr/local/bin/lb-disable {{ inventory_hostname }}
 delegate_to: loadbalancer.example.com
 # => Runs on LB for current webserver

 # Update application
 - name: Deploy new version
 ansible.builtin.copy:
 src: /tmp/app.tar.gz
 dest: /opt/app/

 # Add back to load balancer
 - name: Enable server in load balancer
 ansible.builtin.command:
 cmd: /usr/local/bin/lb-enable {{ inventory_hostname }}
 delegate_to: loadbalancer.example.com
```

**Run**: `ansible-playbook -i inventory delegation.yml`

**Key Takeaway**: Use `delegate_to` to execute tasks on different hosts while maintaining access to target host variables—critical for load balancer updates, external API calls, and centralized operations. Use `run_once` to avoid redundant operations like database migrations or API notifications. Combine `run_once` with `delegate_to: localhost` for single-execution control node tasks. Use `delegate_facts: true` when gathering facts from delegated hosts. Delegation is the mechanism for cross-host orchestration and external system integration.

**Why It Matters**: Delegation executes tasks on different hosts than the target inventory—database backups run on backup servers, load balancer updates run on control planes. The `run_once` directive prevents redundant operations like schema migrations running on every app server. These patterns enable centralized orchestration of distributed systems from single playbooks.

---

**🎯 Intermediate level complete!** You've covered roles, handlers, templates, vault, error handling, and task control. These patterns enable production-ready automation with reusability, security, and resilience. Proceed to [Advanced](/en/learn/software-engineering/infrastructure/tools/ansible/by-example/advanced) for custom modules, collections, testing, and CI/CD integration.
