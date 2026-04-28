---
title: "Advanced"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 58-85: Proxmox HA, IaC automation, GPU passthrough, upgrades, storage replication, and performance tuning (75-95% coverage)"
tags:
  ["proxmox", "tutorial", "by-example", "advanced", "ha", "terraform", "ansible", "packer", "gpu", "ceph", "upgrade"]
---

Master advanced Proxmox VE operations through 28 annotated examples covering high availability, infrastructure-as-code automation, hardware passthrough, major version upgrades, and performance tuning.

## Group 15: High Availability

### Example 58: Enable and Configure the HA Manager for VM Failover

The Proxmox HA Manager monitors VMs and containers and automatically restarts them on surviving nodes when a host fails. Requires 3+ nodes and a fencing mechanism.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["HA Manager<br/>Monitors heartbeat"] --> B{"pve01 fails?"}
    B -->|Node down| C["Fencing<br/>IPMI power off pve01"]
    C --> D["Migrate VM 100<br/>to pve02 or pve03"]
    D --> E["VM 100 Running<br/>on surviving node"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#fff,stroke:#000
    style C fill:#CC78BC,color:#fff,stroke:#000
    style D fill:#029E73,color:#fff,stroke:#000
    style E fill:#CA9161,color:#fff,stroke:#000
```

**Code**:

```bash
# Enable HA for VM 100 (place under HA management)
ha-manager add vm:100 \
  --state started \
  --max_restart 3 \
  --max_relocate 3 \
  --comment "Production web server - HA enabled"
# => VM 100 added to HA management
# => state=started: HA manager keeps this VM running at all times
# => max_restart=3: try restarting on same node 3 times before relocating
# => max_relocate=3: try relocating to 3 different nodes before marking failed

# Enable HA for LXC container 200
ha-manager add ct:200 \
  --state started \
  --max_restart 2 \
  --max_relocate 2
# => Container 200 added to HA management

# Verify HA resource status
ha-manager status
# => quorum OK
# => master: pve01
# =>
# => vm:100
# =>   State:   started     (desired state)
# =>   CRM State: started   (current CRM decision)
# =>   LRM State: started   (current LRM execution)
# =>   node: pve01
# =>
# => ct:200
# =>   State:   started
# =>   CRM State: started
# =>   node: pve02

# Check HA manager service status
systemctl status pve-ha-crm
# => ● pve-ha-crm.service - Proxmox VE HA Cluster Resource Manager
# =>    Active: active (running) since ...
# =>    (CRM = Cluster Resource Manager: decides where resources should run)

systemctl status pve-ha-lrm
# => ● pve-ha-lrm.service - Proxmox VE HA Local Resource Manager
# =>    Active: active (running) since ...
# =>    (LRM = Local Resource Manager: executes CRM decisions on each node)

# Set HA priority for a resource (higher priority = starts first after recovery)
pvesh set /cluster/ha/resources/vm:100 --priority 100
# => VM 100 has highest priority; recovers before lower-priority resources
```

**Key Takeaway**: HA Manager requires separate fencing (Example 59) to be production-safe—without fencing, a split-brain scenario can run the same VM on two nodes simultaneously, causing filesystem corruption.

**Why It Matters**: HA without fencing is not HA—it is wishful thinking. Without a way to confirm a failed node is truly powered off (not just network-partitioned), the HA manager risks starting a second instance of a running VM on a surviving node while the original may still be writing data. This "split brain" scenario corrupts VM disks. Organizations with SLA commitments (99.9%, 99.99% uptime) must implement HA with proper fencing as a cluster infrastructure requirement, not an optional feature.

---

### Example 59: Configure HA Fencing

Fencing confirms a failed node is completely powered off before starting VMs on surviving nodes. Hardware watchdog and IPMI/iDRAC are the two primary fencing mechanisms.

**Code**:

```bash
# Option 1: Hardware watchdog fencing (simplest, uses built-in watchdog)
# Check for available watchdog devices
ls /dev/watchdog*
# => /dev/watchdog   /dev/watchdog0   (hardware watchdog available)

# Load watchdog module and configure it
modprobe softdog  # software watchdog (testing only; not for production)
# => Module loaded; /dev/watchdog device activated
# => For production: use hardware watchdog (Intel TCO, iDRAC, iLO)

# Configure Proxmox to use the watchdog
cat /etc/default/pve-ha-manager
# => WD_DEV=/dev/watchdog
# => (PVE automatically configures watchdog on HA enable if hardware present)

# Option 2: IPMI/iDRAC fencing (recommended for production)
# Install fencing agents
apt install fence-agents
# => Fence agents installed (supports IPMI, iDRAC, iLO, APC, etc.)

# Test IPMI fencing for pve02 from pve01
fence_ipmilan \
  -a 192.168.1.102 \
  -l admin \
  -p 'IPMIPassword123!' \
  -o status
# => Success: pve02 status = ON   (IPMI reachable; can control power)

# Configure IPMI fencing in Proxmox (web UI: Datacenter -> HA -> Fencing Devices)
pvesh create /cluster/ha/fencing \
  --type ipmi \
  --name pve02-ipmi \
  --params 'addr=192.168.1.102,login=admin,passwd=IPMIPassword123!'
# => IPMI fencing device configured for pve02

# Test HA fencing mechanism (without triggering actual failover)
pvesh create /cluster/ha/fencing/pve02-ipmi/test
# => Fence test: connecting to IPMI at 192.168.1.102...
# => Power status query: ON
# => Fence test PASSED: can power-off pve02 if needed

# Verify HA configuration is complete and production-ready
ha-manager status | grep quorum
# => quorum OK   (3-node cluster; HA active and capable of fencing)
```

**Key Takeaway**: IPMI fencing is mandatory for production HA—it provides out-of-band power control that works even when the node's OS and networking are completely unresponsive.

**Why It Matters**: Real-world node failures are often caused by kernel panics, network driver bugs, or CPU hangs—scenarios where the operating system cannot communicate but the node's power is still on. IPMI fencing bypasses the OS entirely, communicating with the Baseboard Management Controller (BMC) at the firmware level. A cluster without proper fencing can be more dangerous than no HA at all: during a split-brain, HA managers on both network partitions may simultaneously start the same VM, each believing the other partition is dead, resulting in concurrent writes to the same VM disk image.

---

### Example 60: Test HA Failover Using the HA Simulator

Proxmox includes a built-in HA simulator that validates cluster configuration without impacting production workloads.

**Code**:

```bash
# Run the HA simulator to model a node failure scenario
# The simulator uses the actual cluster configuration and CRM logic
pvecm ha simulate \
  --node pve01 \
  --action poweroff \
  --maxtime 120
# => Starting HA simulation (using real cluster configuration)...
# => Simulating: pve01 powers off
# => Time 0: pve01 removed from cluster membership
# => Time 5: CRM detects quorum change (3->2 nodes, still quorate with pve02+pve03)
# => Time 10: Fencing initiated for pve01 (IPMI fence check)
# => Time 15: pve01 confirmed fenced (IPMI power-off succeeded)
# => Time 20: CRM begins recovery: vm:100 scheduled on pve02
# => Time 22: LRM on pve02 starts vm:100
# => Time 24: vm:100 started on pve02 (total failover time: 24 seconds)
# => Time 26: LRM on pve03 starts ct:200
# => Time 28: ct:200 started on pve03 (total failover time: 28 seconds)
# => Simulation complete: all HA resources recovered in 28 seconds

# Check HA timing configuration (affects failover speed)
pvesh get /cluster/ha/options
# => {
# =>   "shutdown_policy": "freeze",
# =>   "crm_interval": 10,     (CRM checks cluster state every 10 seconds)
# =>   "lrm_interval": 5       (LRM executes decisions every 5 seconds)
# => }

# Adjust shutdown policy for planned maintenance
pvesh set /cluster/ha/options --shutdown_policy conditional
# => conditional: if cluster quorate, stop HA resources on node shutdown
# =>   (prevents unnecessary failover during planned reboots)
# => freeze: HA resources stay frozen in place during node shutdown (default)
# => failover: always trigger failover (aggressive, for testing only)
# => migrate: live migrate VMs during planned shutdown (graceful)
```

**Key Takeaway**: Running the HA simulator before a production cluster deployment validates the entire HA stack—fencing, quorum, CRM, LRM—and quantifies actual failover times without risking production workloads.

**Why It Matters**: "We have HA configured" is a meaningless statement without a validated failover time and a tested recovery procedure. SLA commitments require knowing the actual MTTR (Mean Time To Recovery): if the HA simulator shows 45-second failover for a specific VM type, the SLA must account for this. Quarterly HA failover drills in production—planned, with stakeholder awareness—are the only way to ensure HA remains functional as the cluster configuration evolves. Systems that "have HA" but have not tested it often discover configuration drift during actual failures.

---

### Example 61: Configure HA Affinity Rules (New in PVE 9.0)

HA affinity rules control VM placement during normal operation and HA recovery. Colocation groups VMs together; anti-affinity spreads them across nodes.

**Code**:

```bash
# Create an anti-affinity rule (web servers should be on different nodes)
pvesh create /cluster/ha/groups \
  --group web-anti-affinity \
  --comment "Keep web VMs on separate nodes for HA" \
  --nodes "pve01:1,pve02:1,pve03:1" \
  --restricted 1 \
  --nofailback 0
# => HA group 'web-anti-affinity' created
# => nodes: allowed nodes with priority (equal priority = balanced placement)
# => restricted=1: VMs can ONLY run on listed nodes (not on any cluster node)
# => nofailback=0: VM migrates back to preferred node when it recovers

# Assign VMs to the anti-affinity group
pvesh set /cluster/ha/resources/vm:100 --group web-anti-affinity
pvesh set /cluster/ha/resources/vm:101 --group web-anti-affinity
# => VMs 100 and 101 now managed by web-anti-affinity group
# => CRM places them on different nodes when possible

# Create a colocation group (database master and replica together for latency)
pvesh create /cluster/ha/groups \
  --group db-colocation \
  --comment "Keep DB primary and replica together for low replication latency" \
  --nodes "pve02:2,pve01:1,pve03:1"
# => HA group 'db-colocation' created
# => pve02 has priority 2 (preferred); pve01/pve03 are fallback with priority 1

pvesh set /cluster/ha/resources/vm:200 --group db-colocation
pvesh set /cluster/ha/resources/vm:201 --group db-colocation
# => DB VMs 200 and 201 prefer pve02; fail together to pve01 or pve03

# List all HA groups and their member resources
ha-manager status
# => Group web-anti-affinity:
# =>   vm:100 - started on pve01
# =>   vm:101 - started on pve02   (on different nodes: anti-affinity satisfied)
# => Group db-colocation:
# =>   vm:200 - started on pve02
# =>   vm:201 - started on pve02   (same node: colocation satisfied)
```

**Key Takeaway**: HA affinity rules prevent all instances of a service from landing on the same node during recovery—without them, HA can "fix" a node failure by running all VMs on one surviving node, creating a new single point of failure.

**Why It Matters**: HA without placement rules can produce configurations that defeat their own purpose. Three web server VMs managed by HA without anti-affinity may all end up on pve02 after pve01 and pve03 fail and recover—meaning all web traffic is on one node. Anti-affinity rules enforce the architectural intent (spread replicas across failure domains) automatically, ensuring HA recovery produces a resilient placement rather than an accidentally concentrated one.

---

### Example 62: Set Up Cross-Cluster VM Migration

Cross-cluster migration moves VMs between independent Proxmox clusters—required for datacenter migrations and disaster recovery drills.

**Code**:

```bash
# Cross-cluster migration requires external shared storage or disk copy
# Verify connectivity between source cluster (pve01) and destination cluster (pve-dr-01)
ssh root@pve-dr-01.dr.company.com pveversion
# => pve-manager/9.1-1/... (destination cluster is PVE 9.1 compatible)

# Method 1: Cold migration with disk copy (VM must be stopped)
qm stop 100
# => VM 100 stopped

# Export VM configuration
cat /etc/pve/qemu-server/100.conf > /tmp/vm100-config.conf
# => VM configuration saved to temporary file

# Copy VM disk to destination node
scp $(pvesh get /nodes/pve01/storage/local-lvm/content --content images | \
  python3 -c "import sys,json; [print(x['path']) for x in json.load(sys.stdin)['data'] if '100' in x.get('volid','')]") \
  root@pve-dr-01.dr.company.com:/var/lib/vz/images/100/
# => Copying vm-100-disk-0.qcow2 to destination (time: proportional to disk size)

# Import configuration and disk on destination cluster
ssh root@pve-dr-01.dr.company.com "
  mkdir -p /var/lib/vz/images/100/
  # Import disk into local storage on destination
  qm importdisk 100 /var/lib/vz/images/100/vm-100-disk-0.qcow2 local
  # Restore config (adjust storage references as needed)
  cat > /etc/pve/qemu-server/100.conf << 'CONF'
  name: ubuntu-24-server
  memory: 2048
  cores: 2
  net0: virtio,bridge=vmbr0
  scsi0: local:100/vm-100-disk-0.qcow2
CONF
  qm start 100
"
# => VM 100 imported and running on destination cluster

# Method 2: Replicate via Ceph cross-cluster RBD mirroring (see Example 80)
```

**Key Takeaway**: Cross-cluster migration has no built-in wizard—it requires explicit disk copy and configuration transfer, making scripted automation essential for reliable disaster recovery.

**Why It Matters**: Disaster recovery scenarios require moving workloads to a geographically separate facility. Without a tested, scripted cross-cluster migration procedure, disaster recovery is a collection of manual steps performed by stressed engineers under time pressure—a recipe for errors. Teams with genuine DR requirements should script cross-cluster migration, test it quarterly, and measure actual RTO (including the time to stand up DNS, load balancer configurations, and application dependencies), not just the time to start VMs.

---

## Group 16: Infrastructure as Code

### Example 63: Use the Terraform Provider to Provision VMs with Cloud-Init

The `bpg/terraform-provider-proxmox` v0.104.0 provides a complete Terraform interface to Proxmox VE for VM and container lifecycle management.

**Code**:

```hcl
# main.tf - Terraform configuration for Proxmox VM with cloud-init
# Provider: bpg/proxmox v0.104.0
# Requirements: Terraform 1.5+ or OpenTofu 1.6+

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"          # Official provider identifier
      version = "~> 0.104"             # Compatible with 0.104.x versions
    }
  }
}

# Configure provider authentication using API token
provider "proxmox" {
  endpoint = "https://192.168.1.100:8006/"  # Proxmox API endpoint
  api_token = var.proxmox_api_token          # Format: user@realm!tokenid=UUID
  insecure  = false                          # Set true only for self-signed cert labs
  # ssh block enables file provisioning and post-install tasks
  ssh {
    agent    = true                          # Use SSH agent forwarding
    username = "root"
  }
}

# Create a VM from a cloud-init-enabled template
resource "proxmox_virtual_environment_vm" "web_server" {
  name        = "web-server-tf-01"           # VM display name in Proxmox
  description = "Managed by Terraform"       # VM description
  node_name   = "pve01"                      # Target Proxmox node
  vm_id       = 300                          # Explicit VMID (omit for auto-assign)

  clone {
    vm_id = 100                              # Source template VMID (from Example 27)
    full  = true                             # Full clone (independent copy)
  }

  cpu {
    cores   = 2                              # vCPU count
    sockets = 1                              # CPU sockets
    type    = "host"                         # Pass through host CPU flags (best performance)
  }

  memory {
    dedicated = 2048                         # MB RAM (hard limit)
  }

  disk {
    datastore_id = "local-lvm"              # Storage backend for VM disk
    interface    = "scsi0"                  # Disk controller interface
    size         = 32                       # GB (must be >= template disk size)
  }

  network_device {
    bridge  = "vmbr0"                       # Network bridge
    model   = "virtio"                      # VirtIO NIC (best performance)
  }

  initialization {                          # Cloud-init configuration block
    ip_config {
      ipv4 {
        address = "192.168.1.200/24"        # Static IP for this VM
        gateway = "192.168.1.1"
      }
    }
    user_account {
      username = "ubuntu"
      keys     = [file("~/.ssh/id_ed25519.pub")]  # SSH public key for access
    }
    dns {
      servers = ["8.8.8.8", "8.8.4.4"]
      domain  = "lab.internal"
    }
  }

  lifecycle {
    ignore_changes = [disk[0].size]        # Ignore disk resizes done outside Terraform
  }
}

output "vm_ip" {
  value = proxmox_virtual_environment_vm.web_server.ipv4_addresses
  # => Returns IP assigned by cloud-init after first boot
}
```

**Key Takeaway**: The `bpg/proxmox` provider maps Terraform resource lifecycle (create/update/destroy) to Proxmox API calls, enabling VM fleets to be managed as declarative code with plan/apply workflows.

**Why It Matters**: Terraform VM management eliminates the "who created this VM and why?" problem that plagues manually managed infrastructure. Every VM's existence is justified by Terraform code, version-controlled in git, reviewed via pull request, and automatically destroyed when removed from configuration. `terraform plan` shows exactly what will change before `terraform apply` executes, making infrastructure changes as reviewable as application code changes.

---

### Example 64: Use Terraform to Manage LXC Containers as Code

The `proxmox_virtual_environment_container` resource manages LXC container lifecycle with the same declarative model as VMs.

**Code**:

```hcl
# containers.tf - LXC container management via Terraform

# Data source: look up available container templates
data "proxmox_virtual_environment_download_file" "ubuntu_lxc" {
  node_name    = "pve01"
  content_type = "vztmpl"
  datastore_id = "local"
  url          = "http://download.proxmox.com/images/system/ubuntu-24.04-standard_24.04-2_amd64.tar.zst"
  # => Downloads LXC template to Proxmox local storage
  # => Idempotent: skips download if file already present
}

# Create an LXC container
resource "proxmox_virtual_environment_container" "nginx_proxy" {
  description  = "Nginx reverse proxy - managed by Terraform"
  node_name    = "pve01"
  vm_id        = 500                         # Explicit CTID

  initialization {
    hostname    = "nginx-proxy-01"           # Container hostname
    dns {
      servers = ["8.8.8.8"]
      domain  = "lab.internal"
    }
    ip_config {
      ipv4 {
        address = "192.168.1.150/24"
        gateway = "192.168.1.1"
      }
    }
    user_account {
      keys = [file("~/.ssh/id_ed25519.pub")] # SSH authorized key for root
    }
  }

  operating_system {
    template_file_id = data.proxmox_virtual_environment_download_file.ubuntu_lxc.id
    # => References the downloaded template by its storage volid
    type             = "ubuntu"              # OS type hint for optimizations
  }

  cpu {
    cores   = 1
    units   = 512                            # cgroup CPU weight (lower = lower priority)
  }

  memory {
    dedicated = 512                          # MB RAM
    swap      = 256                          # MB swap
  }

  disk {
    datastore_id = "local-lvm"
    size         = 8                         # GB rootfs
  }

  network_interface {
    name   = "eth0"
    bridge = "vmbr0"
  }

  features {
    nesting    = true                        # Enable nested containers (Docker-in-LXC)
    keyctl     = true                        # Enable kernel keyring (some apps need this)
    fuse       = false
  }

  unprivileged = true                        # Unprivileged container (mandatory for security)
  started      = true                        # Start container after creation
}

# Create multiple containers with for_each
locals {
  app_containers = {
    "app-01" = { ip = "192.168.1.161", ctid = 501 }
    "app-02" = { ip = "192.168.1.162", ctid = 502 }
    "app-03" = { ip = "192.168.1.163", ctid = 503 }
  }
}

resource "proxmox_virtual_environment_container" "app_fleet" {
  for_each    = local.app_containers         # Creates one container per map entry
  vm_id       = each.value.ctid
  node_name   = "pve01"
  description = "App container ${each.key}"

  initialization {
    hostname = each.key                      # e.g., "app-01", "app-02", "app-03"
    ip_config {
      ipv4 { address = "${each.value.ip}/24", gateway = "192.168.1.1" }
    }
    user_account { keys = [file("~/.ssh/id_ed25519.pub")] }
  }

  operating_system {
    template_file_id = data.proxmox_virtual_environment_download_file.ubuntu_lxc.id
    type             = "ubuntu"
  }

  cpu { cores = 1 }
  memory { dedicated = 256 }
  disk { datastore_id = "local-lvm", size = 4 }
  network_interface { name = "eth0", bridge = "vmbr0" }
  unprivileged = true
  started      = true
}
```

**Key Takeaway**: `for_each` with a local map scales a single container resource definition to manage fleets of identical containers with per-instance customization—replacing manual clone-and-configure workflows.

**Why It Matters**: Managing a fleet of 20 application containers through Terraform `for_each` means adding or removing a container is a one-line change in the `app_containers` local map, followed by `terraform plan` to verify the change, and `terraform apply` to execute. This replaces a multi-step manual process (clone, configure, start) with an atomic, reviewable, version-controlled operation that can be reversed with `terraform destroy`.

---

### Example 65: Automate VM Lifecycle with community.proxmox Ansible Collection

The `community.proxmox` collection provides Ansible modules for complete Proxmox lifecycle management. Note: `community.general.proxmox*` modules are deprecated—use `community.proxmox.*`.

**Code**:

```bash
# Install the community.proxmox collection (not community.general.proxmox*)
ansible-galaxy collection install community.proxmox
# => Process install dependency map
# => Starting collection install process
# => Installing 'community.proxmox:1.0.0' to '~/.ansible/collections/...'

# Verify proxmoxer Python library is installed (required by modules)
pip install proxmoxer>=2.0
# => Successfully installed proxmoxer-2.0.0 requests-2.31.0
```

```yaml
# proxmox_vm.yml - Ansible playbook for VM management
---
- name: Manage Proxmox VMs
  hosts: localhost # Run against Proxmox API, not VM itself
  gather_facts: false

  vars:
    proxmox_host: "192.168.1.100" # Proxmox node IP
    proxmox_user: "root@pam"
    proxmox_password: "{{ vault_proxmox_password }}" # From Ansible Vault
    proxmox_node: "pve01"

  tasks:
    - name: Create a VM from template
      community.proxmox.proxmox_kvm: # NOT community.general.proxmox (deprecated)
        api_host: "{{ proxmox_host }}"
        api_user: "{{ proxmox_user }}"
        api_password: "{{ proxmox_password }}"
        node: "{{ proxmox_node }}"
        clone: ubuntu-24-server # Source template name
        name: ansible-web-01 # New VM name
        vmid: 400 # New VM ID
        full: yes # Full clone
        storage: local-lvm
        state: present # => Creates VM if not exists (idempotent)
      register: clone_result # => Store result for next task

    - name: Configure cloned VM hardware
      community.proxmox.proxmox_kvm:
        api_host: "{{ proxmox_host }}"
        api_user: "{{ proxmox_user }}"
        api_password: "{{ proxmox_password }}"
        node: "{{ proxmox_node }}"
        vmid: 400
        memory: 4096 # 4 GB RAM
        cores: 4 # 4 vCPUs
        net:
          net0: "virtio,bridge=vmbr0"
        ipconfig:
          ipconfig0: "ip=192.168.1.210/24,gw=192.168.1.1"
        state: present

    - name: Start the VM
      community.proxmox.proxmox_kvm:
        api_host: "{{ proxmox_host }}"
        api_user: "{{ proxmox_user }}"
        api_password: "{{ proxmox_password }}"
        node: "{{ proxmox_node }}"
        vmid: 400
        state: started # => Starts VM if not running

    - name: Snapshot before deployment
      community.proxmox.proxmox_snap: # Snapshot module
        api_host: "{{ proxmox_host }}"
        api_user: "{{ proxmox_user }}"
        api_password: "{{ proxmox_password }}"
        vmid: 400
        snapname: pre-deploy-{{ ansible_date_time.date }}
        description: "Before application deployment"
        state: present
```

**Key Takeaway**: `community.proxmox.proxmox_kvm` is idempotent—running the same playbook twice creates the VM on first run and verifies existing configuration on second run, making it safe for repeated execution.

**Why It Matters**: Ansible-managed VM lifecycle integrates Proxmox provisioning into existing configuration management workflows. Teams using Ansible for application configuration can add VM provisioning playbooks to the same repository, creating end-to-end automation from "create VM" through "configure OS" through "deploy application" in a single `ansible-playbook` command. The deprecation of `community.general.proxmox*` in favor of `community.proxmox.*` is a significant API improvement—the dedicated collection has better test coverage and faster feature delivery than the general collection.

---

### Example 66: Use Ansible to Clone, Configure, and Destroy VMs at Scale

Building on the `community.proxmox` collection, this example demonstrates fleet-scale VM operations using Ansible loops and dynamic inventory.

**Code**:

```yaml
# fleet_management.yml - Scale VM operations with Ansible loops
---
- name: Fleet VM Management
  hosts: localhost
  gather_facts: false

  vars:
    api_host: "192.168.1.100"
    api_user: "root@pam"
    api_pass: "{{ vault_pve_password }}"
    node: "pve01"
    template_vmid: 100
    vm_fleet: # Define fleet as list of dicts
      - { name: "ci-runner-01", vmid: 410, ip: "192.168.1.210" }
      - { name: "ci-runner-02", vmid: 411, ip: "192.168.1.211" }
      - { name: "ci-runner-03", vmid: 412, ip: "192.168.1.212" }
      - { name: "ci-runner-04", vmid: 413, ip: "192.168.1.213" }
      - { name: "ci-runner-05", vmid: 414, ip: "192.168.1.214" }

  tasks:
    - name: Clone template for each fleet VM
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        api_user: "{{ api_user }}"
        api_password: "{{ api_pass }}"
        node: "{{ node }}"
        clone: "{{ template_vmid }}"
        vmid: "{{ item.vmid }}"
        name: "{{ item.name }}"
        storage: local-lvm
        full: yes
        state: present
      loop: "{{ vm_fleet }}" # => Creates all 5 VMs in parallel
      loop_control:
        label: "{{ item.name }}" # => Cleaner loop output

    - name: Configure cloud-init for each VM
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        api_user: "{{ api_user }}"
        api_password: "{{ api_pass }}"
        node: "{{ node }}"
        vmid: "{{ item.vmid }}"
        ipconfig:
          ipconfig0: "ip={{ item.ip }}/24,gw=192.168.1.1"
        ciuser: ubuntu
        sshkeys: "{{ lookup('file', '~/.ssh/id_ed25519.pub') }}"
        state: present
      loop: "{{ vm_fleet }}"

    - name: Start all fleet VMs
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        api_user: "{{ api_user }}"
        api_password: "{{ api_pass }}"
        node: "{{ node }}"
        vmid: "{{ item.vmid }}"
        state: started
      loop: "{{ vm_fleet }}"

    - name: Destroy fleet when done (cleanup)
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        api_user: "{{ api_user }}"
        api_password: "{{ api_pass }}"
        node: "{{ node }}"
        vmid: "{{ item.vmid }}"
        state: absent # => Stops and deletes VM
        force: yes # => Stop running VM before deletion
      loop: "{{ vm_fleet }}"
      when: cleanup_fleet | default(false) # => Only when --extra-vars "cleanup_fleet=true"
```

**Key Takeaway**: Ansible loops over VM fleet definitions scale operations linearly—provisioning 5 or 50 VMs requires only changing the fleet list, not writing 50 individual task blocks.

**Why It Matters**: CI/CD runner fleets, test environment pools, and seasonal capacity additions are the ideal use case for Ansible-based fleet management. GitHub Actions self-hosted runner pools, for example, scale dynamically with load—Ansible provisioning hooks can create additional runners when the queue depth exceeds a threshold and destroy them when idle. This ephemeral fleet pattern keeps hardware utilization high without permanent VM sprawl.

---

### Example 67: Build a Golden VM Template with Packer

Packer automates golden image creation—it provisions a VM, runs provisioners, validates the result, and converts the VM to a Proxmox template.

**Code**:

```hcl
# ubuntu-packer.pkr.hcl - Packer template for Proxmox VM golden image
packer {
  required_plugins {
    proxmox = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/proxmox"
    }
  }
}

# Variables for authentication
variable "proxmox_api_url"      { default = "https://192.168.1.100:8006/api2/json" }
variable "proxmox_api_token_id" { default = "root@pam!packer" }
variable "proxmox_api_token_secret" { sensitive = true }

source "proxmox-iso" "ubuntu-server" {
  # Connection
  proxmox_url              = var.proxmox_api_url
  username                 = var.proxmox_api_token_id
  token                    = var.proxmox_api_token_secret
  insecure_skip_tls_verify = false

  # VM Hardware
  node                     = "pve01"
  vm_name                  = "ubuntu-24-packer-template"
  vm_id                    = 9000                # High ID for templates (avoids conflicts)
  memory                   = 2048
  cores                    = 2

  # Boot ISO
  iso_url      = "https://releases.ubuntu.com/24.04/ubuntu-24.04.2-live-server-amd64.iso"
  iso_checksum = "sha256:xxxx..."                # SHA256 from Ubuntu download page
  iso_storage_pool = "local"
  http_directory   = "http"                      # Directory with autoinstall cloud-init files

  # Disk
  scsi_controller = "virtio-scsi-pci"
  disks {
    disk_size         = "32G"
    storage_pool      = "local-lvm"
    type              = "scsi"
  }

  # Network
  network_adapters {
    model  = "virtio"
    bridge = "vmbr0"
  }

  # Cloud-init for automated OS installation
  boot_wait = "5s"
  boot_command = [
    "<esc><wait>",
    "e<wait>",
    "<down><down><down><end>",
    " autoinstall ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/",
    "<f10>"
  ]

  # After OS install: enable SSH for Packer provisioners
  ssh_username         = "ubuntu"
  ssh_private_key_file = "~/.ssh/id_ed25519"
  ssh_timeout          = "20m"

  # Convert to template after build
  template_name        = "ubuntu-24-04-server"
  template_description = "Ubuntu 24.04 Server - Built by Packer on {{isotime}}"

  # Cloud-init support (for Terraform cloud-init later)
  cloud_init              = true
  cloud_init_storage_pool = "local-lvm"
}

build {
  sources = ["source.proxmox-iso.ubuntu-server"]

  # Provisioner 1: System updates
  provisioner "shell" {
    inline = [
      "sudo apt update",
      "sudo apt upgrade -y",
      "sudo apt install -y qemu-guest-agent cloud-init",
      "sudo systemctl enable qemu-guest-agent",
    ]
  }

  # Provisioner 2: Harden and clean
  provisioner "shell" {
    inline = [
      "sudo rm -f /etc/ssh/ssh_host_*",
      "sudo truncate -s 0 /etc/machine-id",
      "sudo cloud-init clean",
      "sudo sync",
    ]
  }
}
```

**Key Takeaway**: Packer's `proxmox-iso` builder installs the OS, applies hardening, and automatically converts the VM to a template—producing a validated, reproducible golden image without manual steps.

**Why It Matters**: Manually creating golden images is error-prone and produces images that diverge over time as operators make ad-hoc modifications. Packer-built images are built from code, rebuilt regularly (weekly or on OS updates), tested automatically (post-provisioner validation steps), and identical across every build. Combined with a CI pipeline that triggers Packer builds when `ubuntu-packer.pkr.hcl` changes and validates the template with automated tests, this creates a continuously updated, security-patched base image without manual intervention.

---

### Example 68: Full IaC Pipeline: Packer → PVE Template → Terraform Clone

This example demonstrates the complete infrastructure-as-code pipeline that produces production-ready VMs from source code.

**Code**:

```bash
# Step 1: Build golden image with Packer
packer init ubuntu-packer.pkr.hcl
# => Initializing plugins...
# => Installed github.com/hashicorp/proxmox v1.2.0

packer build \
  -var "proxmox_api_token_secret=$PROXMOX_TOKEN_SECRET" \
  ubuntu-packer.pkr.hcl
# => proxmox-iso.ubuntu-server: output will be in this color.
# => ==> proxmox-iso.ubuntu-server: Creating VM...
# => ==> proxmox-iso.ubuntu-server: Starting VM...
# => ==> proxmox-iso.ubuntu-server: Waiting for SSH...  (OS installs: ~5 minutes)
# => ==> proxmox-iso.ubuntu-server: Running provisioner: shell
# => ==> proxmox-iso.ubuntu-server: Stopping VM...
# => ==> proxmox-iso.ubuntu-server: Converting VM to template...
# => Build 'proxmox-iso.ubuntu-server' finished after 8 minutes 23 seconds.
# => Template ID 9000 'ubuntu-24-04-server' created on pve01

# Step 2: Verify template is registered in Proxmox
qm list | grep 9000
# => 9000  ubuntu-24-04-server  template  2048/2048  32.00  0

# Step 3: Update Terraform variable with new template ID
sed -i 's/vm_id = [0-9]*/vm_id = 9000/' terraform.tfvars
# => Terraform configuration points to latest Packer-built template

# Step 4: Apply Terraform to provision VMs from the new template
terraform init
# => Initializing provider plugins... bpg/proxmox ~> 0.104

terraform plan -var "proxmox_api_token=$PROXMOX_TOKEN"
# => Plan: 3 to add, 0 to change, 0 to destroy.
# =>   + proxmox_virtual_environment_vm.web_server[0]: Create VM 300
# =>   + proxmox_virtual_environment_vm.web_server[1]: Create VM 301
# =>   + proxmox_virtual_environment_vm.web_server[2]: Create VM 302

terraform apply -var "proxmox_api_token=$PROXMOX_TOKEN" -auto-approve
# => proxmox_virtual_environment_vm.web_server[0]: Creating...
# => proxmox_virtual_environment_vm.web_server[0]: Creation complete after 45s [id=pve01/qemu/300]
# => proxmox_virtual_environment_vm.web_server[1]: Creation complete after 47s
# => proxmox_virtual_environment_vm.web_server[2]: Creation complete after 48s
# => Apply complete! Resources: 3 added, 0 changed, 0 destroyed.

# Integrate into CI/CD pipeline (GitHub Actions example):
# 1. PR to packer-template repo -> Packer build on PVE
# 2. Template ID stored in SSM/Vault as artifact
# 3. Terraform reads template ID from data source
# 4. Terraform apply creates VMs from new template
# => Full pipeline: code commit -> tested VM template -> production VMs in <15 minutes
```

**Key Takeaway**: The Packer → Template → Terraform pipeline creates a fully auditable VM provisioning chain where every production VM traces back to a specific Packer build, which traces back to a specific commit in the packer template repository.

**Why It Matters**: This pipeline implements the immutable infrastructure principle—VMs are never patched in-place but replaced from freshly built templates. OS CVE remediation becomes "rebuild template, apply Terraform" rather than "run apt upgrade on 50 VMs and pray." The audit trail (Packer build ID → template ID → VM ID → application deployment) enables forensic reconstruction of any VM's configuration history, which is required for PCI-DSS and SOC 2 compliance.

---

### Example 69: Write Custom Scripts Using the PVE REST API with curl

Direct REST API calls enable integration with systems that do not have a dedicated Proxmox client library.

**Code**:

```bash
# Authenticate and get session ticket
API_BASE="https://192.168.1.100:8006/api2/json"

# Using API token (preferred over username/password tickets)
API_TOKEN="root@pam!automation=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Helper function for authenticated API calls
pve_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -s -k \
    -X "$method" \
    -H "Authorization: PVEAPIToken=$API_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE$path" \
    "$@"
}
# => pve_api: reusable function for all API calls

# GET: retrieve VM list
pve_api GET /nodes/pve01/qemu | python3 -m json.tool | grep -E '"name"|"vmid"|"status"'
# => "name": "ubuntu-24-server",
# => "vmid": 100,
# => "status": "running",

# POST: create a snapshot
pve_api POST /nodes/pve01/qemu/100/snapshot \
  -d '{"snapname": "api-snapshot-'"$(date +%Y%m%d-%H%M%S)"'", "description": "Created via REST API"}'
# => {"data": "UPID:pve01:000A1234:...:qmsnapshot:100:root@pam:"}

# PUT: modify VM configuration
pve_api PUT /nodes/pve01/qemu/100/config \
  -d '{"memory": 4096, "cores": 4}'
# => {"data": null}   (null means success for configuration updates)

# DELETE: remove a snapshot
pve_api DELETE /nodes/pve01/qemu/100/snapshot/old-snapshot
# => {"data": "UPID:pve01:...:delsnapshot:100:root@pam:"}

# Poll task status until completion
wait_for_task() {
  local upid="$1"
  local node="${upid%%:*}"
  node="${node#UPID:}"
  while true; do
    status=$(pve_api GET "/nodes/$node/tasks/$upid/status" | python3 -c "
import sys, json; d = json.load(sys.stdin)['data']; print(d['status'])
")
    [ "$status" = "stopped" ] && break
    sleep 2
    echo "Task $upid: $status (waiting...)"
  done
  echo "Task completed"
}
# => wait_for_task "UPID:pve01:...": polls until task finishes
```

**Key Takeaway**: The Proxmox REST API accepts standard HTTP verbs (GET/POST/PUT/DELETE) with JSON bodies—any language or tool with HTTP client support can manage Proxmox without a dedicated client library.

**Why It Matters**: Custom API integrations enable Proxmox to participate in broader operational workflows. A deployment pipeline that creates VMs, runs integration tests against them, and destroys them after—all via REST API calls in a CI/CD script—requires no additional dependencies beyond `curl`. Monitoring systems, chatbots (create VM from Slack command), and capacity management tools integrate with Proxmox through the REST API without requiring a Terraform or Ansible dependency in every context.

---

### Example 70: Use proxmoxer Python Library for API-Driven Automation

`proxmoxer` provides a pythonic interface to the Proxmox REST API with automatic authentication management.

**Code**:

```python
# proxmox_automation.py - Python automation using proxmoxer
# Install: pip install proxmoxer requests

from proxmoxer import ProxmoxAPI  # => Import Proxmox API client class
import json
import time

# Connect using API token (recommended over username/password)
proxmox = ProxmoxAPI(
    host='192.168.1.100',
    user='root@pam',
    token_name='automation',
    token_value='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    verify_ssl=False,              # => Set True in production with valid certificate
    timeout=30                     # => 30 second request timeout
)
# => ProxmoxAPI initialized; connection tested on first method call

# Get all nodes in cluster
nodes = proxmox.nodes.get()       # => GET /nodes
# => [{'node': 'pve01', 'status': 'online', 'cpu': 0.12, 'mem': 8589934592, ...}]
for node in nodes:
    print(f"Node: {node['node']}, CPU: {node['cpu']:.1%}, Status: {node['status']}")
# => Node: pve01, CPU: 12.3%, Status: online
# => Node: pve02, CPU: 8.7%, Status: online

# Get all VMs on a specific node
vms = proxmox.nodes('pve01').qemu.get()  # => GET /nodes/pve01/qemu
# => [{'vmid': 100, 'name': 'ubuntu-24-server', 'status': 'running', ...}]

# Start a VM programmatically
def start_vm(node, vmid):
    task = proxmox.nodes(node).qemu(vmid).status.start.post()
    # => POST /nodes/{node}/qemu/{vmid}/status/start
    # => Returns UPID task identifier
    return task                    # => 'UPID:pve01:...:qmstart:100:root@pam:'

# Wait for task completion with proxmoxer
def wait_for_task(node, upid, timeout=60):
    for _ in range(timeout):
        task_status = proxmox.nodes(node).tasks(upid).status.get()
        # => GET /nodes/{node}/tasks/{upid}/status
        if task_status['status'] == 'stopped':
            return task_status.get('exitstatus', 'unknown')
        time.sleep(1)
    raise TimeoutError(f"Task {upid} did not complete in {timeout}s")

# Create snapshot workflow
def backup_and_snapshot(node, vmid, snapshot_name):
    print(f"Creating snapshot {snapshot_name} on VM {vmid}...")
    task_id = proxmox.nodes(node).qemu(vmid).snapshot.post(
        snapname=snapshot_name,
        vmstate=0,                 # => No RAM state (disk-only snapshot)
        description=f"Automated snapshot: {snapshot_name}"
    )                              # => POST /nodes/{node}/qemu/{vmid}/snapshot
    result = wait_for_task(node, task_id)
    print(f"Snapshot created: {result}")  # => Snapshot created: OK
    return result

# Execute the workflow
backup_and_snapshot('pve01', 100, f'auto-{int(time.time())}')
# => Creating snapshot auto-1745888400 on VM 100...
# => Snapshot created: OK
```

**Key Takeaway**: `proxmoxer`'s method chaining maps directly to the REST API URL structure—`proxmox.nodes('pve01').qemu(100).snapshot.post()` maps to `POST /nodes/pve01/qemu/100/snapshot`—making the code self-documenting.

**Why It Matters**: Python scripts using `proxmoxer` are more maintainable than raw `curl` pipelines for complex workflows. Features like automatic authentication token refresh, connection pooling, and structured response objects reduce boilerplate. Teams that write monitoring scripts, capacity management tools, and deployment automation in Python benefit from `proxmoxer`'s clean abstraction over the REST API while retaining full access to every API endpoint.

---

## Group 17: Hardware Passthrough

### Example 71: Configure PCIe Passthrough (GPU, NIC, Storage)

PCIe passthrough gives a VM direct access to a physical PCI device, bypassing the hypervisor for near-native performance. Requires IOMMU enabled in BIOS and kernel.

**Code**:

```bash
# Step 1: Enable IOMMU in GRUB kernel parameters
# For Intel CPUs:
sed -i 's/GRUB_CMDLINE_LINUX_DEFAULT="\(.*\)"/GRUB_CMDLINE_LINUX_DEFAULT="\1 intel_iommu=on iommu=pt"/' /etc/default/grub
# => intel_iommu=on: enable IOMMU (required for PCIe passthrough)
# => iommu=pt: passthrough mode (reduces overhead for non-passthrough devices)

# For AMD CPUs:
# sed -i 's/GRUB_CMDLINE_LINUX_DEFAULT="\(.*\)"/GRUB_CMDLINE_LINUX_DEFAULT="\1 amd_iommu=on iommu=pt"/' /etc/default/grub

update-grub && reboot
# => GRUB updated; reboot required to apply IOMMU kernel parameters

# Step 2: Verify IOMMU is active after reboot
dmesg | grep -e DMAR -e IOMMU | head -5
# => [    0.000000] ACPI: DMAR 0x0000000...
# => [    0.184252] DMAR: IOMMU enabled

# Step 3: Load VFIO kernel modules for device binding
echo 'vfio
vfio_iommu_type1
vfio_pci' >> /etc/modules
# => VFIO modules loaded on boot (Virtual Function I/O framework)

# Step 4: Find the PCIe device to pass through (example: NVIDIA GPU)
lspci -nn | grep -i nvidia
# => 01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GeForce RTX 4080 [10de:2704] (rev a1)
# => 01:00.1 Audio device [0403]: NVIDIA Corporation GA104 High Definition Audio [10de:228b] (rev a1)
# => Device IDs: 10de:2704 (GPU) and 10de:228b (HDMI audio)

# Step 5: Bind device to VFIO driver (prevents host from claiming the device)
echo "options vfio-pci ids=10de:2704,10de:228b" >> /etc/modprobe.d/vfio.conf
# => Bind GPU and its audio device to vfio-pci driver

update-initramfs -u -k all
# => Initramfs updated; VFIO module will claim device on next boot
reboot
# => After reboot: GPU is held by vfio-pci, not the host NVIDIA driver

# Step 6: Verify VFIO has claimed the device
lspci -nnk | grep -A2 "01:00.0"
# => 01:00.0 VGA compatible controller [0300]: NVIDIA ...
# =>     Kernel driver in use: vfio-pci   (VFIO claimed it, not nvidia)
# =>     Kernel modules: vfio-pci, nvidia

# Step 7: Add GPU passthrough to VM
qm set 100 \
  --hostpci0 0000:01:00.0,pcie=1,x-vga=1 \
  --hostpci1 0000:01:00.1,pcie=1 \
  --machine q35 \
  --bios ovmf \
  --args '-cpu host,kvm=off'
# => --hostpci0: pass GPU (PCI address 0000:01:00.0) to VM
# => pcie=1: use PCIe rather than PCI bus in VM
# => x-vga=1: mark as primary display device
# => --machine q35: Q35 chipset required for PCIe passthrough
# => --bios ovmf: UEFI (required for GPU passthrough)
# => kvm=off: hide KVM from guest (required for NVIDIA consumer GPUs)
```

**Key Takeaway**: PCIe passthrough requires IOMMU enabled in BIOS, device bound to `vfio-pci` driver on the host, and Q35 machine type with UEFI in the VM—all four components must be correct simultaneously.

**Why It Matters**: GPU passthrough enables Proxmox VMs to run CUDA workloads, machine learning training, video encoding, and GPU-accelerated rendering at native hardware performance. Teams running AI/ML workflows on bare-metal Proxmox can dedicate specific GPU hardware to specific VMs without investing in expensive GPU-aware cloud infrastructure. The NVIDIA `kvm=off` workaround is necessary for consumer (GeForce) cards that detect virtualization and refuse to initialize; data center (Tesla/A100) cards have no such restriction.

---

### Example 72: Configure USB Device Passthrough

USB passthrough gives a VM direct access to a specific USB device—useful for hardware security keys, USB-attached test equipment, and license dongles.

**Code**:

```bash
# List USB devices connected to the Proxmox host
lsusb
# => Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
# => Bus 001 Device 003: ID 1050:0407 Yubico.com Yubikey 4 OTP+U2F+CCID
# => Bus 002 Device 002: ID 0403:6001 Future Technology Devices International, Ltd FT232 Serial
# => Device format: Bus XXX Device YYY: ID vendorid:productid DeviceName

# Pass through YubiKey by vendor:product ID (survives USB reconnect at same port)
qm set 100 --usb0 host=1050:0407
# => USB device 1050:0407 (YubiKey) passed through to VM 100
# => usb0: first USB passthrough device slot; up to usb4 available

# Pass through device by port (specific physical USB port)
qm set 100 --usb1 host=2-1.2
# => USB port 2-1.2 passed through (device in specific hub port)
# => Any device plugged into this port is passed through to the VM

# Pass through USB 3.0 device with USB 3.0 controller emulation
qm set 100 \
  --usb2 host=0403:6001 \
  --machine q35 \
  --usb xhci
# => XHCI controller (USB 3.0) added to VM
# => FT232 Serial device passed through with USB 3.0 support

# Verify USB configuration in VM config
qm config 100 | grep usb
# => usb0: host=1050:0407
# => usb1: host=2-1.2
# => usb2: host=0403:6001

# Check USB passthrough inside the running VM
qm agent 100 exec -- bash -c "lsusb"
# => Bus 001 Device 002: ID 1050:0407 Yubico.com Yubikey 4    (visible inside VM)
# => Bus 001 Device 003: ID 0403:6001 FTDI FT232 Serial
```

**Key Takeaway**: USB passthrough by vendor:product ID is more reliable than by port for devices that are removed and reinserted, since the same logical device is always passed through regardless of which physical port is used.

**Why It Matters**: USB hardware security keys (YubiKeys, FIDO2 tokens) for two-factor authentication cannot be virtualized—they require direct USB access. Passing them through to a VM enables secure authentication workflows within virtualized development or administrative environments. Hardware license dongles (CAD software, specialized measurement equipment) similarly require direct USB access, making USB passthrough a prerequisite for virtualizing workstations that use dongle-protected software.

---

### Example 73: Configure NVIDIA vGPU on PVE 9

NVIDIA vGPU (Virtual GPU) shares one physical GPU across multiple VMs using NVIDIA's proprietary partitioning. PVE 9 requires GRID driver version 18.3+ (v570.158.02+).

**Code**:

```bash
# vGPU requires: NVIDIA enterprise GPU (A-series, T-series), NVIDIA AI Enterprise license
# GRID driver >=18.3 (v570.158.02+) is REQUIRED for PVE 9 / kernel 6.14+
# Older GRID drivers (<18.3) are incompatible with PVE 9 kernel

# Download NVIDIA GRID driver from NVIDIA Licensing Portal
# (requires NVIDIA AI Enterprise subscription or trial license)
# wget https://... (URL from NVIDIA Licensing Portal)

# Install GRID driver on Proxmox host
bash NVIDIA-Linux-x86_64-570.158.02-vgpu-kvm.run --no-x-check
# => Verifying archive integrity...
# => Building kernel module...  (compiles for PVE 6.17.2 kernel)
# => Installing GRID driver v570.158.02...
# => Note: DKMS registers driver for automatic rebuild on kernel updates

# Verify NVIDIA vGPU driver is loaded
nvidia-smi
# => +-----------------------------------------------------------------------------+
# => | NVIDIA-SMI 570.158.02    Driver Version: 570.158.02    CUDA Version: 12.7  |
# => +-----------------------------------------------------------------------------+
# => | GPU  Name          Persistence-M  Bus-Id    Disp.A  Volatile Uncorr. ECC   |
# => | Fan  Temp  Perf    Pwr:Usage/Cap  Memory-Usage           GPU-Util  ...     |
# => |  0   NVIDIA A30    Off            00:06.0   Off         0 MiB / 24576 MiB   |

# List available vGPU types for the installed GPU
mdevctl types
# => 0000:00:06.0
# =>   nvidia-1: NVIDIA A30-4C    (4 GB vGPU profile)
# =>   nvidia-2: NVIDIA A30-8C    (8 GB vGPU profile)
# =>   nvidia-3: NVIDIA A30-24C   (24 GB vGPU profile, full GPU)

# Create a vGPU instance (4 GB profile) for VM 100
echo "nvidia-1" > /sys/bus/pci/devices/0000:00:06.0/mdev_supported_types/nvidia-1/create
# => vGPU instance created; UUID auto-assigned

# Get the vGPU UUID
VGPU_UUID=$(ls /sys/bus/mdev/devices/ | head -1)
echo $VGPU_UUID
# => xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Assign vGPU to VM (non-persistent; add to VM config for persistence)
qm set 100 --hostpci0 $VGPU_UUID,mdev=1
# => VM 100 assigned vGPU (4 GB NVIDIA A30 slice)
# => mdev=1: mediated device passthrough (vGPU, not full GPU)
```

**Key Takeaway**: NVIDIA vGPU requires GRID driver 18.3+ on PVE 9—older drivers will fail to load against the PVE 9 kernel (6.14+), causing CUDA and GPU compute to be completely unavailable.

**Why It Matters**: vGPU enables GPU time-sharing across multiple VMs without the cost of one GPU per VM. A single NVIDIA A30 (24 GB) can serve six 4 GB vGPU instances, providing GPU-accelerated AI inference or video transcoding to six VMs simultaneously at 1/6 the hardware cost. For organizations running mixed GPU workloads (some lightweight inference, some heavy training), vGPU profiles enable right-sizing GPU allocation to workload requirements rather than over-provisioning every VM with a full GPU.

---

### Example 74: Enable and Manage Nested Virtualization

Nested virtualization allows VMs to run their own hypervisors (VMware ESXi, Hyper-V, nested KVM). PVE 9.1 introduced per-vCPU nested virtualization control.

**Code**:

```bash
# Check if nested virtualization is supported on the host
cat /sys/module/kvm_intel/parameters/nested
# => Y   (Intel: nested virt is available)
# cat /sys/module/kvm_amd/parameters/nested  => 1  (AMD equivalent)

# Enable nested virtualization for a VM (expose VMX flag to guest)
qm set 100 --cpu host,flags=+vmx
# => VM 100 CPU configured to expose VMX (Intel Virtualization Technology) flag to guest
# => Guest OS sees CPU as virtualization-capable
# => AMD equivalent: --cpu host,flags=+svm (SVM = AMD-V)

# PVE 9.1: Per-vCPU nested virtualization control (new feature)
# Enable nested on specific vCPUs only (0-indexed)
qm set 100 --cpu host,flags=+vmx --vcpus 4,nested-vcpu=0-1
# => vCPUs 0 and 1 have nested virt enabled; vCPUs 2 and 3 do not
# => Useful for workloads that mix hypervisor and non-hypervisor vCPUs

# Verify nested virtualization is visible inside the VM
qm agent 100 exec -- bash -c "grep -m1 vmx /proc/cpuinfo | cut -d: -f2"
# => vmx   (VMX flag present in guest CPU: nested virt available)

# Inside the VM: install KVM and verify nested KVM works
qm agent 100 exec -- bash -c "
  apt install -y qemu-kvm libvirt-daemon-system
  # => KVM installed inside the VM

  # Check if nested KVM is functional
  kvm-ok
  # => INFO: /dev/kvm exists
  # => KVM acceleration can be used  (nested KVM confirmed working)

  # Run a quick nested VM test
  qemu-system-x86_64 -enable-kvm -m 512 -nographic \
    -kernel /boot/vmlinuz -append 'console=ttyS0' 2>&1 | head -5
  # => Booting nested VM using KVM acceleration (not software emulation)
"
```

**Key Takeaway**: Nested virtualization requires the host to expose the `vmx` (Intel) or `svm` (AMD) CPU flag to the guest—without this flag, a hypervisor running inside the VM falls back to slow software emulation.

**Why It Matters**: Nested virtualization enables testing hypervisor configurations (ESXi, Hyper-V, KVM cluster setups) without physical hardware. CI/CD pipelines that test Proxmox cluster configurations run the test inside nested VMs on a CI server—the full cluster (3 nodes, Ceph, HA) is created, tested, and destroyed in minutes using nested KVM. This "infrastructure-as-test-fixture" pattern dramatically reduces the hardware investment required to validate complex cluster configurations before production deployment.

---

### Example 75: Configure vTPM and Take VM Snapshots with Active vTPM

Virtual Trusted Platform Module (vTPM) provides hardware-grade security attestation for VMs. PVE 9.1 introduced vTPM in qcow2 format, enabling snapshots while vTPM is active.

**Code**:

```bash
# Requirements: VM must use qcow2 disk format (not raw/LVM) and UEFI (OVMF)
# First, convert VM to use local directory storage (supports qcow2)
qm importdisk 100 /dev/pve/vm-100-disk-0 local --format qcow2
# => Importing disk as qcow2 format to 'local' directory storage
# => local:100/vm-100-disk-0.qcow2 created

# Add vTPM 2.0 device to VM (stored as swtpm state in qcow2)
qm set 100 \
  --machine q35 \
  --bios ovmf \
  --efidisk0 local:1,efitype=4m \
  --tpmstate0 local:1,version=v2.0
# => Q35 machine: required for TPM support
# => OVMF: UEFI firmware (required for TPM and Secure Boot)
# => efidisk0: EFI variable store (persists UEFI settings)
# => tpmstate0: vTPM 2.0 state stored in qcow2 file on 'local' storage

# PVE 9.1: tpmstate in qcow2 enables snapshots (previously: raw format prevented snapshots)
qm snapshot 100 with-vtpm \
  --description "Snapshot with vTPM state (PVE 9.1 feature)" \
  --vmstate 0
# => Creating snapshot 'with-vtpm'...
# => Snapshotting disk: vm-100-disk-0.qcow2
# => Snapshotting TPM state: vm-100-disk-0.qcow2 (tpmstate0)
# => Snapshot 'with-vtpm' created successfully
# => PVE 9.1: vTPM state is part of the qcow2 snapshot (previously impossible with raw tpmstate)

# Start VM with vTPM and verify Windows Secure Boot and BitLocker
qm start 100
# => VM starting with vTPM 2.0 enabled

# Inside Windows VM: verify TPM is visible
qm agent 100 exec -- cmd.exe /c "tpm.msc"
# => TPM Management window shows:
# => Manufacturer: Microsoft
# => Manufacturer Version: 2.0    (vTPM 2.0 initialized)
# => Status: TPM is ready for use

# BitLocker can now be enabled (requires TPM 2.0)
# Windows Security -> Device Encryption -> Turn on BitLocker
# => BitLocker uses vTPM to seal the volume encryption key
# => Key is bound to this vTPM identity; migration requires TPM key migration
```

**Key Takeaway**: vTPM in qcow2 (new in PVE 9.1) resolves the long-standing limitation where VMs with vTPM could not be snapshotted—the TPM state and disk are now unified in the qcow2 snapshot format.

**Why It Matters**: vTPM is required for Windows 11 installation and for enabling Virtualization Based Security (VBS) features including Credential Guard, Device Guard, and BitLocker with TPM attestation. Enterprises migrating Windows workloads to Proxmox need vTPM to maintain compliance postures that require TPM-backed BitLocker (PCI-DSS, HIPAA, GDPR). The qcow2 snapshot support in PVE 9.1 eliminates the operational constraint that made vTPM impractical for stateful VM management.

---

## Group 18: Upgrades and Maintenance

### Example 76: Perform an In-Place Upgrade from PVE 8 to PVE 9

PVE 8 to PVE 9 upgrades the base OS from Debian 12 (Bookworm) to Debian 13 (Trixie). The `pve8to9` checker identifies blockers before the upgrade.

**Code**:

```bash
# Step 1: Run the pre-upgrade checker (identifies blocking issues)
pve8to9
# => Checking pve-manager... ok
# => Checking cluster status... ok
# => Checking ceph status... WARN: Ceph must be at Squid (19.2.x) before upgrade!
# =>   Current: ceph 18.2.x (Reef) - upgrade Ceph first (see Example 77)
# => Checking storage configuration... ok
# => Checking GlusterFS... WARN: GlusterFS is removed in PVE 9; migrate data first
# => Checking NVIDIA vGPU... INFO: Ensure GRID driver >=18.3 for PVE 9 kernel
# => 2 warnings found; resolve before proceeding

# Step 2: Resolve warnings (fix Ceph first - see Example 77)
# After resolving all warnings, re-run checker until clean:
pve8to9
# => All checks passed. Ready to upgrade to PVE 9.

# Step 3: Update APT sources to Trixie (Debian 13)
sed -i 's/bookworm/trixie/g' /etc/apt/sources.list
# => Base Debian repo switched from bookworm to trixie

# Update Proxmox repository to PVE 9
echo "deb http://download.proxmox.com/debian/pve trixie pve-no-subscription" \
  > /etc/apt/sources.list.d/pve-no-subscription.list
# => PVE repository updated to trixie

# Update Ceph repository to Squid
sed -i 's/reef/squid/g' /etc/apt/sources.list.d/ceph.list
# => Ceph Squid (19.2.x) repository enabled

# Step 4: Perform the dist-upgrade
apt update && apt dist-upgrade
# => Reading package lists... Done
# => Calculating upgrade... Done
# => The following packages will be upgraded: linux-image-6.17.2-pve, pve-manager/9.1, qemu-server/9.1...
# => Do you want to continue? [Y/n] Y
# => (Upgrade proceeds: ~10-30 minutes)
# => pve-manager 9.1 installed
# => QEMU 10.1.2 installed
# => LXC 6.0.5 installed

# Step 5: Reboot into the new PVE 9 kernel
reboot
# => System rebooting...
# => After reboot: kernel 6.17.2-1-pve loaded

pveversion
# => pve-manager/9.1-1/...
# => running kernel: 6.17.2-1-pve   (PVE 9 kernel confirmed)
```

**Key Takeaway**: Never skip the `pve8to9` checker—PVE 9 removes GlusterFS support entirely and requires Ceph to be at Squid version before upgrade; these are data-loss or cluster-failure risks if ignored.

**Why It Matters**: In-place OS upgrades on production hypervisors are high-risk operations that require careful pre-flight checks, tested rollback procedures, and maintenance windows with stakeholder communication. The `pve8to9` checker represents years of community knowledge about upgrade failure modes encoded as automated checks. Teams that skip the checker and proceed directly to `apt dist-upgrade` on PVE 8 with Reef Ceph have experienced cluster failures requiring full cluster rebuilds. Upgrade sequencing (Ceph first, then PVE) is not advisory—it is mandatory.

---

### Example 77: Upgrade Ceph from Quincy/Reef to Squid Before PVE 9

Ceph must be upgraded to Squid (19.2.x) before upgrading PVE to version 9. Failing to do so leaves the cluster in an unsupported configuration.

**Code**:

```bash
# Verify current Ceph version (must be at Quincy 17.2.x or Reef 18.2.x)
ceph version
# => ceph version 18.2.7 (reef) 18.2.7 (stable)
# => Reef is supported source for Squid upgrade

# Step 1: Update Ceph repository to Squid on ALL cluster nodes
# (Run on each node before starting the upgrade)
sed -i 's/reef/squid/g' /etc/apt/sources.list.d/ceph.list
apt update
# => Hit:1 http://download.proxmox.com/debian/ceph-squid trixie InRelease
# => Get:2 ...
# => Ceph Squid packages available in APT

# Step 2: Check cluster health is HEALTH_OK before starting upgrade
ceph status | grep health
# => health: HEALTH_OK    (must be OK; do not upgrade degraded cluster)

# Step 3: Set noout flag to prevent rebalancing during upgrade
ceph osd set noout
# => nooutflag set    (prevents OSDs from being marked out during rolling upgrade)

# Step 4: Upgrade Ceph on first node (rolling upgrade)
apt upgrade ceph-mon ceph-osd ceph-mgr -y
# => Upgrading: ceph-mon 18.2.7 -> 19.2.3, ceph-osd 18.2.7 -> 19.2.3 ...

systemctl restart ceph-mon.target ceph-osd.target ceph-mgr.target
# => Ceph services restarted on pve01 with Squid version

ceph version
# => ceph version 19.2.3 (squid) 19.2.3 (stable)

# Check cluster accepts mixed versions (rolling upgrade in progress)
ceph status | grep -A5 "services"
# => services:
# =>   mon: 3 daemons (1 squid, 2 reef)  (mixed versions during rolling upgrade)
# =>   mgr: pve01-squid(active), pve02-reef(standby)
# =>   osd: 3 osds: 3 up, 3 in           (all OSDs up despite mixed versions)

# Step 5: Repeat on pve02 and pve03 (same commands on each)
# After all nodes upgraded:
ceph status | grep -A5 "services"
# => services:
# =>   mon: 3 daemons (3 squid)           (all at Squid)
# =>   mgr: pve01-squid(active)

# Step 6: Unset noout flag after all nodes upgraded
ceph osd unset noout
# => noout flag removed    (cluster resumes normal OSD monitoring)

ceph health
# => HEALTH_OK    (Ceph Squid running, cluster healthy)
```

**Key Takeaway**: Ceph rolling upgrades maintain cluster availability throughout—VMs continue accessing storage while monitors and OSDs are upgraded one node at a time.

**Why It Matters**: Attempting to upgrade PVE to version 9 while Ceph is still at Reef results in package dependency conflicts that can leave the system in a partially upgraded state—requiring manual package management recovery. The rolling upgrade procedure (one node at a time, verify health between nodes) ensures that if an OSD package upgrade fails, the remaining nodes continue serving data while the issue is resolved. The `noout` flag prevents Ceph from declaring upgraded OSDs "missing" during the temporary restart, which would trigger unnecessary rebalancing.

---

## Group 19: Replication and Advanced Storage

### Example 78: Configure Storage Replication Between Cluster Nodes

Proxmox storage replication uses ZFS `zfs send | zfs recv` to keep VM disk replicas synchronized between nodes, enabling fast failover without shared storage.

**Code**:

```bash
# Replication requires: ZFS storage on both source and destination nodes
# Verify ZFS is configured on both pve01 and pve02
pvesh get /nodes/pve01/storage --type zfspool
# => [{ "storage": "tank-zfs", "pool": "tank", ... }]
pvesh get /nodes/pve02/storage --type zfspool
# => [{ "storage": "tank-zfs", "pool": "tank", ... }]   (same pool name on both nodes)

# Create a replication job for VM 100 to pve02
pvesh create /nodes/pve01/replication \
  --id 100-pve02 \
  --target pve02 \
  --schedule "*/15 * * * *" \
  --rate 100 \
  --comment "Replicate VM 100 to pve02 every 15 minutes"
# => Replication job created
# => --schedule: cron format (every 15 minutes)
# => --rate 100: bandwidth limit 100 MB/s (prevent saturating link)
# => First run: full ZFS snapshot transferred (slow: proportional to disk size)
# => Subsequent runs: only changed blocks transferred (fast: typically seconds-to-minutes)

# Check replication job status
pvesh get /nodes/pve01/replication
# => [
# =>   {
# =>     "id": "100-pve02",
# =>     "target": "pve02",
# =>     "last_sync": 1745888400,
# =>     "last_try": 1745888400,
# =>     "next_sync": 1745889300,
# =>     "fail_count": 0,
# =>     "duration": 12,          (12 seconds for last sync; only changed blocks)
# =>     "state": "ok"
# =>   }
# => ]

# Monitor replication in real-time
pvesr status
# => ID          ENABLED  STATE  NEXT SYNC           FAIL COUNT  LAST DURATION
# => 100-pve02   yes      ok     2026-04-29 07:15:00  0           12s

# Trigger immediate replication sync
pvesh create /nodes/pve01/replication/100-pve02/schedule_now
# => Replication job 100-pve02 queued for immediate execution
```

**Key Takeaway**: ZFS-based replication provides VM disk redundancy across nodes without shared storage—VM disks exist on two nodes simultaneously, enabling fast failover by simply starting the VM from the replica.

**Why It Matters**: Replication fills the gap between snapshots (local) and Ceph (expensive distributed). A two-node deployment with ZFS replication can achieve effective disaster recovery: if pve01 fails, the VM disk replica on pve02 is at most 15 minutes stale (configurable), and manual failover is starting the VM on pve02 from the replica. This provides meaningful DR capability at the cost of only one additional drive per VM, making it practical for small deployments that cannot justify a full Ceph cluster.

---

### Example 79: Monitor and Manage Storage Replication Jobs

Replication monitoring detects failed sync jobs before replica staleness becomes a problem during actual failover.

**Code**:

```bash
# List all replication jobs with their current status
pvesr status --verbose
# => Replication job 100-pve02:
# =>   Target: pve02
# =>   Schedule: */15 * * * *
# =>   Next sync: 2026-04-29 07:15:00
# =>   Last sync: 2026-04-29 07:00:01 (success, 12s ago)
# =>   Fail count: 0
# =>   Transferred: 245 MB (last sync)

# Check replication log for a specific job
pvesh get /nodes/pve01/replication/100-pve02/log
# => [
# =>   { "n": 1, "t": "2026-04-29 07:00:01: syncing /tank/vm-100-disk-0 ..." },
# =>   { "n": 2, "t": "2026-04-29 07:00:01: creating snapshot pve-repl-..." },
# =>   { "n": 3, "t": "2026-04-29 07:00:09: sending snapshot to pve02 ..." },
# =>   { "n": 4, "t": "2026-04-29 07:00:13: 245 MB sent in 12 seconds" },
# =>   { "n": 5, "t": "2026-04-29 07:00:13: replication finished successfully" }
# => ]

# Check for replication failures (non-zero fail count)
pvesh get /nodes/pve01/replication | python3 -c "
import sys, json
jobs = json.load(sys.stdin)['data']
for job in jobs:
    if job.get('fail_count', 0) > 0:
        print(f\"ALERT: Replication job {job['id']} has {job['fail_count']} failures\")
        print(f\"  Last error: {job.get('error', 'unknown')}\")
"
# => ALERT: Replication job 100-pve02 has 3 failures
# =>   Last error: unable to connect to target node pve02

# Delete and recreate a failed replication job
pvesh delete /nodes/pve01/replication/100-pve02
# => Replication job 100-pve02 deleted

pvesh create /nodes/pve01/replication \
  --id 100-pve02 \
  --target pve02 \
  --schedule "*/15 * * * *"
# => Replication job recreated; initial sync starts on next schedule
```

**Key Takeaway**: Replication failure monitoring is as important as backup monitoring—a failed replication job silently accumulates delta divergence between source and replica, making failover increasingly risky.

**Why It Matters**: Replication jobs fail for predictable reasons: network bandwidth exhaustion, target storage full, destination node offline. Without monitoring, a replication job that started failing 30 days ago produces a replica that is 30 days stale—failover in this state means 30 days of lost data, which may be worse than no replica at all if the user assumes the replica is current. Alerting on `fail_count > 0` within one replication interval ensures the replica is always within one sync cycle of the source.

---

### Example 80: Set Up Ceph RBD Mirroring for Cross-Cluster Disaster Recovery

Ceph RBD mirroring asynchronously replicates block device images between two Ceph clusters at geographically separate sites for cross-cluster DR.

**Code**:

```bash
# === On PRIMARY site (pve01-cluster) ===
# Enable RBD mirroring daemon
apt install rbd-mirror
# => rbd-mirror package installed (Ceph Squid 19.2.x required)
systemctl enable --now ceph-rbd-mirror.target
# => rbd-mirror service started

# Enable pool mirroring in image mode (per-image opt-in)
rbd mirror pool enable vm-images image
# => Pool 'vm-images' mirroring enabled (image mode)
# => image mode: only explicitly marked images are mirrored (vs pool mode: all images)

# Enable mirroring for a specific VM disk image
rbd mirror image enable vm-images/vm-100-disk-0
# => Image 'vm-100-disk-0' mirroring enabled
# => Journaling enabled on image (required for RBD mirroring)

# Get bootstrap token for DR cluster peering
rbd mirror pool peer bootstrap create \
  --site-name primary-site \
  vm-images > /tmp/bootstrap-token.txt
# => Bootstrap token written to /tmp/bootstrap-token.txt
# => Share this token with DR cluster to establish peering

cat /tmp/bootstrap-token.txt
# => eyJmc2lkIjoixxxxxxxx...  (base64-encoded bootstrap token)

# === On DR site (pve01-dr cluster) ===
# Import bootstrap token to establish peering
rbd mirror pool peer bootstrap import \
  --site-name dr-site \
  --direction rx-only \
  vm-images /tmp/bootstrap-token.txt
# => Peer established: primary-site -> dr-site (receive-only)
# => DR cluster receives: only copies data, does not write to primary

# Verify mirroring is active
rbd mirror pool status vm-images
# => health: OK
# => daemon health: OK
# => image health: OK
# => images: 1 total
# =>     1 replaying   (actively receiving writes from primary)

# Check individual image status
rbd mirror image status vm-images/vm-100-disk-0
# => vm-100-disk-0:
# =>   global_id:   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# =>   state:       up+replaying
# =>   description: replaying, master_position=...
# =>   last_update: 2026-04-29 07:00:01
```

**Key Takeaway**: Ceph RBD mirroring with `rx-only` on the DR site prevents accidental writes to the replica cluster while allowing DR failover testing by promoting specific images to read-write.

**Why It Matters**: Cross-cluster RBD mirroring provides geo-redundant block storage for production VMs without requiring synchronous replication that adds write latency. Asynchronous mirroring accepts a small RPO (Recovery Point Objective) in exchange for zero write-latency overhead on the primary. For regulated workloads requiring DR with cross-regional data protection, this architecture satisfies DR requirements at lower cost than synchronous metro-distance Ceph (which requires very low-latency fiber links).

---

## Group 20: ZFS and Performance Tuning

### Example 81: Tune ZFS ARC Size and Configure ZFS Datasets

ZFS Adaptive Replacement Cache (ARC) uses RAM to cache frequently accessed data. Tuning ARC prevents ZFS from consuming all available memory, starving VMs.

**Code**:

```bash
# Check current ZFS ARC configuration
cat /sys/module/zfs/parameters/zfs_arc_max
# => 0   (0 = no limit; ZFS uses up to 75% of RAM by default)

# Check current ARC usage
cat /proc/spl/kstat/zfs/arcstats | grep -E "^c_max |^size "
# => c_max                  4    32212254720   (current max ARC: ~30 GB of 32 GB RAM)
# => size                   4    18253611008   (current ARC used: ~17 GB)

# Limit ZFS ARC to 8 GB (leave rest for VMs and OS)
# Change takes effect immediately without reboot
echo $((8 * 1024 * 1024 * 1024)) > /sys/module/zfs/parameters/zfs_arc_max
# => zfs_arc_max set to 8589934592 (8 GB)

# Make ARC limit persistent across reboots
echo "options zfs zfs_arc_max=$((8 * 1024 * 1024 * 1024))" > /etc/modprobe.d/zfs.conf
update-initramfs -u -k all
# => ARC limit persisted to initramfs configuration

# Verify ARC is being limited
cat /proc/spl/kstat/zfs/arcstats | grep c_max
# => c_max    4    8589934592   (ARC now limited to 8 GB)

# Configure ZFS dataset properties for VM disk performance
# recordsize: 16K is optimal for VM random I/O (default 128K is for sequential)
zfs set recordsize=16K tank/vm-disks
# => VM disk dataset uses 16K records (matches typical filesystem block size)

# Enable LZ4 compression (fast, good ratio for most workloads)
zfs set compression=lz4 tank
# => LZ4 compression enabled on all datasets under tank

# Disable access time updates (major I/O reduction for busy pools)
zfs set atime=off tank
# => Access time tracking disabled (reduces write amplification)

# Set sync=disabled for temporary/scratch datasets (DANGEROUS: data loss on power failure)
zfs set sync=disabled tank/scratch
# => Sync disabled; writes are async (maximum performance, no durability guarantee)
# => NEVER use on production VM disks; only for genuinely expendable temp data
```

**Key Takeaway**: ZFS ARC without a size limit will consume all available RAM, leaving VMs memory-starved and causing excessive swapping—always set `zfs_arc_max` to 25-50% of total RAM on hypervisors.

**Why It Matters**: ZFS ARC memory contention is the most common performance issue in Proxmox+ZFS deployments. A 32 GB host with unlimited ZFS ARC may dedicate 24 GB to ZFS cache, leaving only 8 GB for VMs—causing constant memory pressure, swap usage, and VM performance degradation that looks like application slowness. The ARC sizing formula (RAM - VM RAM allocations - 2 GB OS overhead = ARC budget) provides a starting point; tune based on observed ARC hit rates and VM performance under load.

---

### Example 82: Configure S3-Compatible Backup Target in PBS 4.0

PBS 4.0 (required for PVE 9 compatibility) adds S3-compatible object storage as a backup target, enabling offsite backups to AWS S3, MinIO, or Wasabi without a separate PBS server at the offsite location.

**Code**:

```bash
# === On the PBS 4.0 server ===
# Add an S3-compatible remote (e.g., MinIO running at DR site)
proxmox-backup-manager remote add minio-dr \
  --url "https://minio.dr.company.com:9000" \
  --auth-id "backup@pbs" \
  --password "MinioBackupPass123!" \
  --fingerprint "XX:XX:XX:..." \
  --comment "MinIO S3 at DR datacenter"
# => Remote 'minio-dr' added

# Or add AWS S3 as a remote (use s3.amazonaws.com URL format)
proxmox-backup-manager remote add aws-s3 \
  --url "https://s3.amazonaws.com" \
  --auth-id "AKIAIOSFODNN7EXAMPLE" \
  --password "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  --s3-bucket "company-proxmox-backups" \
  --s3-region "us-east-1" \
  --comment "AWS S3 offsite backup bucket"
# => AWS S3 remote 'aws-s3' added

# Add S3 remote as a sync target (sync from local datastore to S3)
proxmox-backup-manager sync-job add s3-offsite \
  --store main \
  --remote aws-s3 \
  --remote-store company-proxmox-backups \
  --schedule "0 4 * * *" \
  --remove-vanished false \
  --comment "Daily offsite sync to AWS S3 at 04:00"
# => Sync job 's3-offsite' created
# => Syncs all backups from local 'main' datastore to AWS S3 daily
# => --remove-vanished false: do not delete S3 objects when local copies are pruned

# Run sync job immediately to test connectivity
proxmox-backup-manager sync-job run s3-offsite
# => Starting sync job 's3-offsite'...
# => Connecting to aws-s3 remote...
# => Syncing vm/100/2026-04-29T01:00:00Z -> s3://company-proxmox-backups/vm/100/...
# => Transferred: 5.2 GB in 3 minutes 22 seconds

# Check sync job status
proxmox-backup-manager sync-job list
# => JOB-ID     STORE   REMOTE   SCHEDULE    LAST-RUN             LAST-STATUS
# => s3-offsite main    aws-s3   0 4 * * *   2026-04-29 04:00:11  OK
```

**Key Takeaway**: PBS 4.0 S3 sync converts local-only backup into a 3-2-1 backup strategy (3 copies, 2 media types, 1 offsite) without requiring additional PBS infrastructure at the offsite location.

**Why It Matters**: Local backups protected against application errors and accidental deletion; offsite backups protect against site-level disasters (fire, flood, physical theft). S3 sync is the most cost-effective way to achieve offsite backup for small-to-medium deployments—AWS S3 Glacier storage costs approximately $0.004/GB/month, making offsite backup of 5 TB cost roughly $20/month. This is an order of magnitude cheaper than maintaining a physical DR site with its own PBS server.

---

### Example 83: Implement Full Backup Rotation Strategy with PBS

A comprehensive retention policy balances storage cost against recovery window. This example implements the Grandfather-Father-Son (GFS) rotation scheme.

**Code**:

```bash
# Define GFS retention policy for PBS datastore
# GFS: keep daily (son), weekly (father), monthly (grandfather) backups

# Configure pruning policy on PBS datastore
proxmox-backup-manager prune-job add gfs-policy \
  --store main \
  --schedule "0 3 * * *" \
  --keep-last 3 \
  --keep-hourly 0 \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 6 \
  --keep-yearly 2 \
  --comment "GFS retention: 3 recent, 14 daily, 8 weekly, 6 monthly, 2 yearly"
# => Prune job 'gfs-policy' created
# => Runs daily at 03:00, after backups complete at 01:00-02:00

# Dry-run to visualize what will be kept/pruned
proxmox-backup-client prune \
  --repository backup@pbs@192.168.1.80:main \
  --keep-last 3 \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 6 \
  --keep-yearly 2 \
  --dry-run
# => 2026-04-29T01:00:00Z  ->  keep (last 1)
# => 2026-04-28T01:00:00Z  ->  keep (last 2)
# => 2026-04-27T01:00:00Z  ->  keep (last 3)
# => 2026-04-26T01:00:00Z  ->  keep (daily 1)
# => ...
# => 2026-03-31T01:00:00Z  ->  keep (weekly 1)
# => 2026-03-24T01:00:00Z  ->  keep (weekly 2)
# => ...
# => 2025-10-01T01:00:00Z  ->  keep (monthly 1)
# => ...
# => 2025-01-01T01:00:00Z  ->  keep (yearly 1)
# => 2024-01-01T01:00:00Z  ->  keep (yearly 2)
# => 2026-04-25T01:00:00Z  ->  remove (outside all retention windows)

# Run garbage collection after pruning to reclaim disk space
proxmox-backup-client garbage-collect \
  --repository backup@pbs@192.168.1.80:main
# => Scanning used chunks...
# => Removing unused chunks...
# => Freed: 285.3 GB  (orphaned chunks from pruned backups)
# => Total datastore size: 4.2 TB -> 3.9 TB after GC
```

**Key Takeaway**: GFS rotation provides protection at multiple granularities—recent backups for quick operational recovery, monthly/yearly backups for long-term compliance and regulatory retention requirements.

**Why It Matters**: Retention policy must be driven by both technical recovery requirements and compliance mandates. GDPR may require deleting backups of personal data older than the data retention period; PCI-DSS may require retaining transaction logs for 12 months; internal policies may require evidence of system state for audit purposes. The PBS prune/GC implementation ensures that retention policy is mechanically enforced rather than administratively managed—the right backups are kept and the right ones are deleted automatically, reducing both storage cost and compliance risk.

---

### Example 84: Configure SDN with DHCP IP Management

SDN DHCP integration uses dnsmasq to provide automatic IP assignment to VMs connected to SDN VNets, eliminating manual IP management.

**Code**:

```bash
# Prerequisites: dnsmasq installed on Proxmox nodes
apt install dnsmasq
# => dnsmasq installed (DHCP/DNS server for SDN IP management)

# Configure SDN subnet with DHCP range
pvesh set /cluster/sdn/vnets/web-vnet/subnets/10.100.0.0-24 \
  --dhcp-range "start-address=10.100.0.100,end-address=10.100.0.200" \
  --gateway 10.100.0.1 \
  --dnszoneprefix web
# => DHCP range 10.100.0.100-200 configured for VNet 'web-vnet'
# => dnsmasq will serve DHCP leases from this range
# => dnszoneprefix: VMs get DNS names like web-server-01.web.internal

pvesh set /cluster/sdn
# => SDN configuration applied; dnsmasq reconfigured on all nodes

# Add a DHCP static mapping (reserve IP for specific VM MAC)
pvesh create /cluster/sdn/vnets/web-vnet/ips \
  --ip 10.100.0.101 \
  --mac AA:BB:CC:DD:EE:FF \
  --zone simple-zone \
  --vmid 100 \
  --comment "Reserved for VM 100 (web-server-01)"
# => Static DHCP lease: VM 100 always gets 10.100.0.101

pvesh set /cluster/sdn
# => Static DHCP mapping applied to dnsmasq configuration

# Verify DHCP configuration
cat /etc/dnsmasq.d/sdn-web-vnet.conf
# => interface=web-vnet                    (dnsmasq serves on VNet interface)
# => dhcp-range=10.100.0.100,10.100.0.200  (dynamic range)
# => dhcp-host=AA:BB:CC:DD:EE:FF,10.100.0.101,web-server-01  (static mapping)
# => dhcp-option=option:router,10.100.0.1  (default gateway)
# => dhcp-option=option:dns-server,10.100.0.1  (DNS server)

# List all current DHCP leases
cat /var/lib/misc/dnsmasq.leases
# => 1745892000 AA:BB:CC:DD:EE:FF 10.100.0.101 web-server-01 *
# => 1745892000 AA:BB:CC:DD:EE:00 10.100.0.102 nginx-proxy-01 *
```

**Key Takeaway**: SDN DHCP integration centralizes IP management in the Proxmox cluster—VM IP assignments are visible in the SDN configuration, not scattered across DHCP server leases on separate network infrastructure.

**Why It Matters**: Manual IP management in IPAM spreadsheets is a known failure mode in infrastructure management. SDN DHCP integration makes Proxmox the authoritative source for VM-to-IP mapping within its VNets—new VMs automatically receive IPs from the SDN DHCP range, static reservations are stored with the VM configuration rather than a separate system, and IP conflicts are prevented by design. Teams using Terraform for VM provisioning can assign static DHCP mappings via the `proxmox` Terraform provider, maintaining IP management as code.

---

### Example 85: Benchmark and Tune VM Disk I/O with VirtIO-BLK and Cache Modes

Disk I/O cache mode selection significantly impacts both VM performance and data durability. QEMU 10.1.x (PVE 9) introduces io_uring AIO support for reduced latency.

**Code**:

```bash
# View current disk cache mode for VM 100
qm config 100 | grep scsi0
# => scsi0: local-lvm:vm-100-disk-0,size=32G,cache=none,aio=io_uring
# => cache=none: no host-side caching (data goes directly to storage)
# => aio=io_uring: Linux io_uring async I/O (QEMU 10.x default, lower latency)

# Cache mode comparison and when to use each:
# none:        Best durability, good performance for SSDs, writeback forced to storage
#              => Use for: databases, stateful apps, most production VMs
# writeback:   Best raw performance; data may be lost on host crash before flush
#              => Use for: temporary/scratch VMs, dev environments (never production databases)
# writethrough: Every write acknowledged only after storage confirms; very safe but slow
#              => Use for: critical financial data VMs where durability > performance
# directsync:  Like writethrough but bypasses host cache; predictable latency
#              => Use for: real-time systems requiring consistent low latency

# Set cache=none with io_uring AIO for production databases (best durability)
qm set 100 --scsi0 local-lvm:vm-100-disk-0,cache=none,aio=io_uring
# => scsi0 updated: cache=none, aio=io_uring (Linux io_uring async I/O)

# Set cache=writeback for development VMs (best performance, less safe)
qm set 101 --scsi0 local-lvm:vm-101-disk-0,cache=writeback,aio=io_uring
# => scsi0 updated: writeback cache enabled for max throughput

# Benchmark VM disk I/O using fio (inside the VM)
qm agent 100 exec -- bash -c "
  apt install -y fio
  # Sequential read test (4K blocks, 60 seconds)
  fio --name=seqread --rw=read --bs=4k --size=1G --numjobs=4 \
      --runtime=60 --time_based --output-format=json \
      --filename=/dev/sda | python3 -c \"
import sys, json
r = json.load(sys.stdin)
job = r['jobs'][0]
bw = job['read']['bw_mean'] / 1024
iops = job['read']['iops_mean']
lat = job['read']['lat_ns']['mean'] / 1000 / 1000
print(f'Read: {bw:.0f} MB/s, {iops:.0f} IOPS, {lat:.2f}ms avg latency')
\"
  # => Read: 1240 MB/s, 320000 IOPS, 0.08ms avg latency  (NVMe with cache=none)

  # Random write test (4K blocks, simulates database workload)
  fio --name=randwrite --rw=randwrite --bs=4k --size=1G --numjobs=4 \
      --runtime=60 --time_based --ioengine=libaio --direct=1 \
      --filename=/dev/sda | python3 -c \"
import sys, json
r = json.load(sys.stdin)
job = r['jobs'][0]
bw = job['write']['bw_mean'] / 1024
iops = job['write']['iops_mean']
lat = job['write']['lat_ns']['mean'] / 1000 / 1000
print(f'Write: {bw:.0f} MB/s, {iops:.0f} IOPS, {lat:.2f}ms avg latency')
\"
  # => Write: 820 MB/s, 210000 IOPS, 0.15ms avg latency
"
```

**Key Takeaway**: `cache=none` with `aio=io_uring` provides the best production I/O profile—data durability through direct-to-storage writes combined with io_uring's low-overhead asynchronous I/O reduces database query latency.

**Why It Matters**: Cache mode selection is the most impactful single tuning parameter for VM disk performance that does not require hardware changes. A database VM on `cache=writeback` may appear to perform 2-3x faster in benchmarks but risks data loss on host crash—a silent durability trade-off that only surfaces during actual failures. io_uring (available in QEMU 10.x, included in PVE 9) reduces I/O submission overhead compared to the older libaio engine, providing measurable latency improvements for IOPS-sensitive workloads like PostgreSQL OLTP without changing storage hardware or cache mode.
