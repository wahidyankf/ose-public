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
# Enable HA for VM 100 (state=started: HA keeps it running; max_restart/relocate = retries)
ha-manager add vm:100 \
  --state started \
  # => state=started: HA manager continuously ensures this VM is running
  --max_restart 3 \
  # => 3 local restart attempts before escalating to relocate
  --max_relocate 3 \
  # => 3 cross-node relocate attempts before marking resource FAILED
  --comment "Production web server - HA enabled"
# => VM 100 under HA management; 3 restart retries then 3 relocate retries before FAIL

# Enable HA for LXC container 200
ha-manager add ct:200 \
  --state started \
  # => same state=started policy applies to containers
  --max_restart 2 \
  --max_relocate 2
# => CT 200 under HA management

# Verify HA resource status (all three states matching = healthy)
ha-manager status
# => vm:100 State:started CRM:started LRM:started  node:pve01
# => ct:200 State:started CRM:started LRM:started  node:pve02
# => CRM = Cluster Resource Manager (plans placement); LRM = Local Resource Manager (executes)

# CRM decides WHERE resources run; LRM executes on each local node
systemctl status pve-ha-crm
# => pve-ha-crm.service: active (running)
systemctl status pve-ha-lrm
# => pve-ha-lrm.service: active (running)

# Set HA priority (higher = recovers first after cluster-wide failure)
pvesh set /cluster/ha/resources/vm:100 --priority 100
# => VM 100 recovers before lower-priority resources during HA restart sequence
# => default priority=0; range 0-100; useful for sequencing dependent services
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
  -a 192.0.2.102 \
  -l admin \
  -p 'IPMIPassword123!' \
  -o status
# => Success: pve02 status = ON   (IPMI reachable; can control power)

# Configure IPMI fencing in Proxmox (web UI: Datacenter -> HA -> Fencing Devices)
pvesh create /cluster/ha/fencing \
  --type ipmi \
  --name pve02-ipmi \
  --params 'addr=192.0.2.102,login=admin,passwd=IPMIPassword123!'
# => IPMI fencing device configured for pve02

# Test HA fencing mechanism (without triggering actual failover)
pvesh create /cluster/ha/fencing/pve02-ipmi/test
# => Fence test: connecting to IPMI at 192.0.2.102...
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

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["t=0: pve01 powers off<br/>(simulated failure)"] --> B["t=10: CRM detects<br/>quorum loss on pve01"]
    B --> C["t=15: IPMI Fencing<br/>pve01 confirmed off"]
    C --> D["t=20: CRM schedules<br/>VM 100 on pve02"]
    D --> E["t=24: LRM starts<br/>VM 100 on pve02"]
    E --> F["Recovery complete<br/>28 seconds total"]

    style A fill:#CC78BC,color:#000,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#CA9161,color:#000,stroke:#000
    style D fill:#0173B2,color:#fff,stroke:#000
    style E fill:#029E73,color:#fff,stroke:#000
    style F fill:#029E73,color:#fff,stroke:#000
```

**Code**:

```bash
# Simulate pve01 poweroff using real cluster config and CRM logic (non-destructive)
pvecm ha simulate \
  --node pve01 \
  --action poweroff \
  --maxtime 120
# => t=5: CRM detects quorum change | t=15: fenced via IPMI | t=24: vm:100 on pve02 | t=28: all recovered

# Check HA timing config (crm_interval and lrm_interval affect failover speed)
pvesh get /cluster/ha/options
# => crm_interval:10 lrm_interval:5 shutdown_policy:freeze

# Set shutdown policy for maintenance: conditional stops HA resources gracefully
pvesh set /cluster/ha/options --shutdown_policy conditional
# => conditional: stops HA resources during planned shutdown (vs freeze=keep-in-place; migrate=live-migrate)
```

**Key Takeaway**: Running the HA simulator before a production cluster deployment validates the entire HA stack—fencing, quorum, CRM, LRM—and quantifies actual failover times without risking production workloads.

**Why It Matters**: "We have HA configured" is a meaningless statement without a validated failover time and a tested recovery procedure. SLA commitments require knowing the actual MTTR (Mean Time To Recovery): if the HA simulator shows 45-second failover for a specific VM type, the SLA must account for this. Quarterly HA failover drills in production—planned, with stakeholder awareness—are the only way to ensure HA remains functional as the cluster configuration evolves. Systems that "have HA" but have not tested it often discover configuration drift during actual failures.

---

### Example 61: Configure HA Affinity Rules (New in PVE 9.0)

HA affinity rules control VM placement during normal operation and HA recovery. Colocation groups VMs together; anti-affinity spreads them across nodes.

**Code**:

```bash
# Anti-affinity group: equal priority nodes = balanced placement; restricted=1 = only listed nodes
pvesh create /cluster/ha/groups \
  --group web-anti-affinity \
  # => group name referenced by ha-manager when assigning resources
  --comment "Keep web VMs on separate nodes for HA" \
  --nodes "pve01:1,pve02:1,pve03:1" \
  # => all three nodes at priority 1: CRM chooses freely for load balancing
  --restricted 1 \
  # => restricted=1: VMs ONLY run on listed nodes (blocked from unlisted nodes)
  --nofailback 0
  # => nofailback=0: VMs migrate back to preferred node when it recovers
# => CRM places vm:100 and vm:101 on different nodes (CRM enforces anti-affinity automatically)

pvesh set /cluster/ha/resources/vm:100 --group web-anti-affinity
# => vm:100 membership in web-anti-affinity group; CRM reads this on next scheduling decision
pvesh set /cluster/ha/resources/vm:101 --group web-anti-affinity
# => vm:101 also in web-anti-affinity; CRM will place 100 and 101 on separate nodes

# Colocation group: pve02 priority 2 = preferred; pve01/pve03 priority 1 = fallback
pvesh create /cluster/ha/groups \
  --group db-colocation \
  # => separate group for DB VMs that must stay together
  --comment "Keep DB primary and replica together for low replication latency" \
  --nodes "pve02:2,pve01:1,pve03:1"
  # => pve02 priority 2 = first choice; pve01/pve03 priority 1 = fallback (same priority = tied)
# => DB VMs prefer pve02; fail together to same fallback node

pvesh set /cluster/ha/resources/vm:200 --group db-colocation
# => db primary (vm:200) joins colocation group
pvesh set /cluster/ha/resources/vm:201 --group db-colocation
# => db replica (vm:201) joins same group; CRM keeps 200 and 201 on the same node
# => VMs 200+201 colocated on pve02; failover keeps them together

# Verify placement satisfies rules
ha-manager status
# => vm:100 on pve01 | vm:101 on pve02  (anti-affinity: different nodes satisfied)
# => vm:200 on pve02 | vm:201 on pve02  (colocation: same node satisfied)
```

**Key Takeaway**: HA affinity rules prevent all instances of a service from landing on the same node during recovery—without them, HA can "fix" a node failure by running all VMs on one surviving node, creating a new single point of failure.

**Why It Matters**: HA without placement rules can produce configurations that defeat their own purpose. Three web server VMs managed by HA without anti-affinity may all end up on pve02 after pve01 and pve03 fail and recover—meaning all web traffic is on one node. Anti-affinity rules enforce the architectural intent (spread replicas across failure domains) automatically, ensuring HA recovery produces a resilient placement rather than an accidentally concentrated one.

---

### Example 62: Set Up Cross-Cluster VM Migration

Cross-cluster migration moves VMs between independent Proxmox clusters—required for datacenter migrations and disaster recovery drills.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Source Cluster<br/>pve01 (DC1)"] -->|"1. Export config<br/>/etc/pve/qemu-server/100.conf"| B["Transfer"]
    A -->|"2. Copy disk<br/>(scp qcow2)"| B
    B -->|"3. Import disk<br/>qm importdisk"| C["Destination Cluster<br/>pve-dr-01 (DC2)"]
    C -->|"4. Create config<br/>qm start 100"| D["VM 100 Running<br/>on DR cluster"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#029E73,color:#fff,stroke:#000
    style D fill:#CA9161,color:#000,stroke:#000
```

**Code**:

```bash
# Verify PVE version compatibility between source and destination cluster
ssh root@pve-dr-01.dr.company.com pveversion
# => pve-manager/9.2-1/... (destination cluster is PVE 9.2 compatible)

# Method 1: Cold migration (VM must be stopped; no live migration between clusters)
qm stop 100
# => VM 100 stopped; cluster-to-cluster migration has no online equivalent

# Export VM configuration (stores hardware definition in simple text format)
cat /etc/pve/qemu-server/100.conf > /tmp/vm100-config.conf
# => VM configuration saved; will be recreated on destination cluster

# Copy VM disk to destination via scp (Python one-liner resolves disk path from API)
scp $(pvesh get /nodes/pve01/storage/local-lvm/content --content images | \
  python3 -c "import sys,json; [print(x['path']) for x in json.load(sys.stdin)['data'] if '100' in x.get('volid','')]") \
  root@pve-dr-01.dr.company.com:/var/lib/vz/images/100/
# => vm-100-disk-0.qcow2 copied to DR node (time scales with disk size)
# => large disks (500+ GB): use rsync --sparse for efficiency on sparse files

# Import configuration and disk on destination cluster via SSH
ssh root@pve-dr-01.dr.company.com "
  mkdir -p /var/lib/vz/images/100/
  # => ensure destination directory exists before import
  qm importdisk 100 /var/lib/vz/images/100/vm-100-disk-0.qcow2 local
  # => registers copied disk with Proxmox; adds scsi0 entry to VM config
  cat > /etc/pve/qemu-server/100.conf << 'CONF'
  name: ubuntu-24-server
  memory: 2048
  cores: 2
  net0: virtio,bridge=vmbr0
  scsi0: local:100/vm-100-disk-0.qcow2
  # => minimal config matching source VM hardware
CONF
  # => config written to /etc/pve/qemu-server/100.conf on destination cluster
  qm start 100
  # => VM 100 starts on DR cluster; verify app health before declaring DR complete
"
# => VM 100 imported and running on destination cluster

# Method 2: Ceph cross-cluster RBD mirroring (preferred for near-realtime; see Example 80)
# => cold copy for one-time DR drills; RBD mirroring for ongoing async replication
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
# Provider: bpg/proxmox v0.104.0 | Requirements: Terraform 1.5+ or OpenTofu 1.6+

terraform {
  # => root terraform block: declares version constraints and required providers
  required_version = ">= 1.5.0"
  # => Terraform 1.5+ required; OpenTofu 1.6+ also supported
  required_providers {
    # => declares all external providers this configuration depends on
    proxmox = {
      # => provider alias "proxmox" used in provider {} and resource blocks
      source  = "bpg/proxmox"
      # => Installs bpg/proxmox provider from Terraform Registry
      version = "~> 0.104"
      # => ~> 0.104 accepts 0.104.x patches; blocks breaking 0.105+ changes
    } # => end proxmox provider spec
  }   # => end required_providers block
}     # => end terraform block
# => terraform init: downloads provider binary and creates .terraform.lock.hcl

# Configure provider authentication using API token
provider "proxmox" {
  # => provider block configures the bpg/proxmox provider globally
  endpoint  = "https://192.0.2.100:8006/"
  # => Proxmox REST API base URL (node IP + port 8006)
  api_token = var.proxmox_api_token
  # => format: "user@realm!tokenid=UUID-secret" (from Example 18)
  insecure  = false
  # => false: verify TLS cert; true: skip verify (dev only; never in production)
  ssh {
    # => ssh block: credentials for file uploads via SCP (not for API calls)
    agent    = true
    # => SSH agent forwarding for file provisioning (used by Packer post-provisioners)
    username = "root"
    # => SSH user for connecting to Proxmox nodes
  }
}
# => provider block authenticates all proxmox_* resource CRUD operations

# Create a VM from a cloud-init-enabled template
resource "proxmox_virtual_environment_vm" "web_server" {
  # => resource type proxmox_virtual_environment_vm; local name "web_server"
  name      = "web-server-tf-01"
  # => VM display name in Proxmox web UI (not the hostname; set via cloud-init)
  node_name = "pve01"
  # => target Proxmox node; cluster load balancing must be done via node selection
  vm_id     = 300
  # => explicit VMID; omit for auto-assign from next available ID

  clone {
    # => clone block: create this VM by cloning an existing VM or template
    vm_id = 100
    # => source template VMID 100 (created in Example 27 via qm template)
    # => template must have cloud-init drive attached (scsi1 or ide2 type=cloudinit)
    full  = true
    # => full clone: independent disk; linked clone shares base disk (faster but dependent)
    # => linked clone requires thin-provisioned storage and is not supported on LVM-thin by default
  }
  # => Terraform: POST /nodes/pve01/qemu/100/clone → creates VM 300

  cpu {
    # => cpu block: defines virtual CPU topology exposed to the guest
    cores   = 2
    # => 2 vCPUs visible to guest OS
    sockets = 1
    # => 1 CPU socket; most OS licensing is per-socket
    type    = "host"
    # => "host": exposes AVX, AES-NI; "kvm64": generic (safer for cross-host migration)
  }

  memory {
    # => memory block: sets RAM allocation for the VM
    dedicated = 2048
    # => 2 GB RAM hard limit; balloon driver reclaims unused pages when host is pressured
  }

  disk {
    # => disk block: defines one virtual disk attached to the VM
    datastore_id = "local-lvm"
    # => thin-provisioned LVM; actual disk usage grows with writes
    # => local-lvm corresponds to the default PVE thin pool on local storage
    interface    = "scsi0"
    # => primary disk on VirtIO SCSI controller (fastest for Linux VMs)
    # => scsi0 = first SCSI disk; additional disks use scsi1, scsi2, etc.
    size         = 32
    # => 32 GB; must be ≥ template disk size or clone fails with size error
    # => disk can be grown later: qm resize 300 scsi0 +10G
  }

  network_device {
    # => network_device block: one virtual NIC per block
    bridge = "vmbr0"
    # => Linux bridge; connects VM to physical network
    # => add more network_device blocks to attach VM to multiple bridges/VLANs
    model  = "virtio"
    # => paravirtualized NIC; best throughput, no driver install needed on Linux
    # => model="e1000" for legacy OS compatibility; virtio preferred for Linux/BSD
  }

  initialization {
    # => cloud-init ISO attached to VM; applied on first boot
    ip_config {
      # => ip_config: cloud-init network configuration for the first NIC
      ipv4 {
        # => ipv4 block: static or DHCP address for the VM guest
        address = "192.0.2.200/24"
        # => static IP written to cloud-init drive; applied by cloud-init on first boot
        gateway = "192.0.2.1"
        # => default gateway; cloud-init writes to /etc/netplan or /etc/network/interfaces
      }
    }
    user_account {
      # => user_account: cloud-init creates this user in the guest OS
      username = "ubuntu"
      # => creates this Linux user in the guest OS
      keys = [file("~/.ssh/id_ed25519.pub")]
      # => SSH public key added to authorized_keys; enables passwordless SSH
    }
    dns {
      # => dns block: resolver configuration written to /etc/resolv.conf in VM
      servers = ["8.8.8.8", "8.8.4.4"]
      # => DNS servers written to /etc/resolv.conf in the VM
      domain  = "lab.internal.example"
      # => search domain for short hostname resolution
    }   # => end dns block
  }     # => end initialization block; cloud-init settings complete
  # => after first boot: VM has 192.0.2.200/24, ubuntu user, SSH key accessible

  lifecycle {
    # => lifecycle block: instructs Terraform how to handle resource drift
    ignore_changes = [disk[0].size]
    # => prevent Terraform from shrinking disk if it was manually grown after deployment
    # => without this, terraform plan shows "update in-place" every time disk was resized
  } # => end lifecycle block
} # => end resource block; VM 300 fully defined
# => terraform plan: "Plan: 1 to add, 0 to change, 0 to destroy"
# => terraform apply: VM 300 created in ~45 seconds
# => terraform destroy: removes VM 300 and its disk from Proxmox

output "vm_ip" {
  # => output block: exposes VM IP for use by other Terraform modules or display
  value = proxmox_virtual_environment_vm.web_server.ipv4_addresses
  # => queries guest agent for assigned IPs after first boot
  # => requires qemu-guest-agent running in VM; otherwise output returns empty list
  # => example output: [["192.0.2.200"]]
} # => end output block
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
  # => data source: resolves to a volid usable by resource blocks
  node_name    = "pve01"
  # => node that downloads the template (any node in the cluster works)
  content_type = "vztmpl"
  # => content_type "vztmpl": tells Proxmox this is a container template archive
  datastore_id = "local"
  # => storage where the downloaded template is cached on the node
  url          = "http://download.proxmox.com/images/system/ubuntu-24.04-standard_24.04-2_amd64.tar.zst"
  # => Downloads LXC template to Proxmox local storage: /var/lib/vz/template/cache/
  # => Idempotent: skips download if file already present (checks by filename)
  # => Result: data source resolves to volid "local:vztmpl/ubuntu-24.04-standard_...tar.zst"
}

# Create an LXC container
resource "proxmox_virtual_environment_container" "nginx_proxy" {
  # => resource type proxmox_virtual_environment_container; local name "nginx_proxy"
  description = "Nginx reverse proxy - managed by Terraform"
  # => description visible in Proxmox web UI Notes field
  node_name   = "pve01"
  # => Container created on pve01; migrates to other nodes via pct migrate
  vm_id       = 500
  # => CTID 500; Proxmox uses same ID namespace for VMs and containers

  initialization {
    # => initialization block sets cloud-init-like first-boot configuration
    hostname = "nginx-proxy-01"
    # => Hostname visible inside container and in Proxmox web UI
    dns {
      # => dns block configures /etc/resolv.conf inside the container
      servers = ["8.8.8.8"]
      # => DNS resolver; written to container /etc/resolv.conf on create
      domain  = "lab.internal.example"
      # => DNS suffix for FQDN: nginx-proxy-01.lab.internal.example
    }
    ip_config {
      # => ip_config: network configuration for eth0 inside the container
      ipv4 {
        # => ipv4 block: static address or "dhcp"
        address = "192.0.2.150/24"
        # => Static IP written to container /etc/network/interfaces on create
        gateway = "192.0.2.1"
        # => default IPv4 gateway for the container
      }
    }
    user_account {
      # => user_account: SSH key is added to /root/.ssh/authorized_keys
      keys = [file("~/.ssh/id_ed25519.pub")]
      # => SSH key written to /root/.ssh/authorized_keys in container
    }
  }
  # => initialization block = pct create --hostname --net0 ip= --password options

  operating_system {
    # => operating_system block selects the container template and OS type
    template_file_id = data.proxmox_virtual_environment_download_file.ubuntu_lxc.id
    # => resolves to "local:vztmpl/ubuntu-24.04-standard_...tar.zst"
    type             = "ubuntu"
    # => OS type enables Ubuntu-specific cgroup v2 and kernel settings
  }
  # => operating_system block maps to --ostype in pct create

  cpu {
    # => cpu block: controls vCPU count and scheduling priority
    cores = 1
    # => 1 vCPU; cgroup enforces this via cpu.max
    units = 512
    # => scheduling weight 512 (default 1024); lower = lower priority under contention
  }

  memory {
    # => memory block: sets RAM hard limit and swap allowance via cgroup
    dedicated = 512
    # => 512 MB RAM hard limit (cgroup memory.max = 536870912 bytes)
    swap      = 256
    # => 256 MB swap allowed; container can page out under pressure
  }

  disk {
    # => disk block: defines the container rootfs size and storage pool
    datastore_id = "local-lvm"
    # => thin-provisioned LVM rootfs; actual usage grows from ~500 MB base
    # => local-lvm uses LVM thin pool; pct df 500 shows actual consumed space
    size         = 8
    # => 8 GB rootfs limit
    # => rootfs cannot be shrunk; only grown: pct resize 500 rootfs +4G
  }

  network_interface {
    # => network_interface block: one virtual NIC inside the container
    name   = "eth0"
    # => interface name inside container; maps to tap500i0 tap device on host
    # => host-side tap name format: tap{CTID}i{NIC_INDEX} (e.g., tap500i0)
    bridge = "vmbr0"
    # => attaches to physical bridge; container gets internet access
    # => add vlan_id to isolate container traffic on tagged VLAN segment
  }

  features {
    # => features block: optional Linux kernel capabilities for the container
    nesting = true
    # => allows Docker or nested LXC inside container (required for Docker-in-LXC)
    # => nesting=true sets lxc.apparmor.profile=lxc-container-default-with-nesting
    keyctl  = true
    # => enables keyring syscall; required for some apps using kernel secret storage
    fuse    = false
    # => FUSE not needed for nginx proxy; disable to minimize attack surface
    # => fuse=true is needed for SSHFS or overlayfs-based container filesystems
  }

  unprivileged = true
  # => uid 0 inside container maps to unprivileged host uid (container escape cannot gain root)
  # => privileged=false is the secure default; privileged containers share host uid namespace
  started = true
  # => container starts immediately after terraform apply
}
# => terraform apply: pct create 500 local:vztmpl/ubuntu-24.04-standard_...
# => CT 500 'nginx-proxy-01' running on pve01 in ~3 seconds

# Create multiple containers with for_each (one resource block → N container instances)
locals {
  # => locals block: defines named values reusable within this configuration
  # => locals are evaluated once and shared; use for DRY config (avoid repeating values)
  app_containers = {
    # => map value: each key is the container hostname, value is per-instance config
    "app-01" = { ip = "192.0.2.161", ctid = 501 }
    "app-02" = { ip = "192.0.2.162", ctid = 502 }
    "app-03" = { ip = "192.0.2.163", ctid = 503 }
    # => map key = container name (used as hostname); value = per-instance config
    # => add more entries here to scale the fleet; no other config changes required
  }
}
# => for_each iterates this map: creates resources "app_fleet[\"app-01\"]", etc.
# => terraform state list shows: proxmox_virtual_environment_container.app_fleet["app-01"] etc.

resource "proxmox_virtual_environment_container" "app_fleet" {
  # => for_each on a map: one resource instance per map entry
  for_each    = local.app_containers
  # => one resource instance per map entry; Terraform tracks each independently
  vm_id       = each.value.ctid
  # => CTID: 501, 502, 503 for the three entries
  node_name   = "pve01"
  # => all containers land on pve01; use conditional logic to spread across nodes
  description = "App container ${each.key}"
  # => interpolated: "App container app-01", "App container app-02", etc.

  initialization {
    # => initialization applies per-instance hostname and IP from the map
    hostname = each.key
    # => hostname = map key: "app-01", "app-02", "app-03"
    ip_config {
      ipv4 { address = "${each.value.ip}/24", gateway = "192.0.2.1" }
      # => IPs: 192.0.2.161/24, .162/24, .163/24 for each instance
    }
    user_account { keys = [file("~/.ssh/id_ed25519.pub")] }
    # => SSH key injected into each container's /root/.ssh/authorized_keys
  }

  operating_system {
    # => shared template used by all fleet containers (same OS base image)
    template_file_id = data.proxmox_virtual_environment_download_file.ubuntu_lxc.id
    # => same Ubuntu template as nginx_proxy above (shared data source)
    type             = "ubuntu"
    # => ubuntu OS type applies Ubuntu cgroup and AppArmor profiles
  }

  cpu { cores = 1 }
  # => 1 vCPU each; total for 3 containers: 3 vCPU slots
  # => increase units (scheduler weight) per container if one fleet member needs priority
  memory { dedicated = 256 }
  # => 256 MB RAM each; 3 containers = 768 MB total RAM reserved
  # => dedicated is a hard limit; container OOM-kills processes if exceeded
  disk { datastore_id = "local-lvm", size = 4 }
  # => 4 GB rootfs each; thin-provisioned (actual near 0 initially)
  network_interface { name = "eth0", bridge = "vmbr0" }
  # => each container gets its own tap device on vmbr0
  unprivileged = true
  # => unprivileged=true: safer isolation; uid mapping prevents host root escalation
  started      = true
  # => started=true: all fleet containers boot immediately after terraform apply
}
# => terraform plan: "Plan: 4 to add" (nginx_proxy + 3 app_fleet instances)
# => add "app-04" to app_containers → terraform apply creates only the new CT
# => remove "app-01" → terraform apply destroys only app-01 (others unchanged)
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
  # => play name: shown in Ansible output to identify which play is running
  hosts: localhost
  # => localhost: Ansible connects to Proxmox API, not to the VMs via SSH
  gather_facts: false
  # => false: skips SSH to localhost; saves ~2 seconds; no facts needed here

  vars:
    # => vars block: play-level variables referenced with {{ var_name }} syntax
    proxmox_host: "192.0.2.100"
    # => IP or FQDN of any cluster node; API request routed cluster-wide
    proxmox_user: "root@pam"
    # => user@realm: root authenticated via Linux PAM (/etc/passwd)
    proxmox_password: "{{ vault_proxmox_password }}"
    # => loaded from Ansible Vault; never store plaintext credentials in playbooks
    proxmox_node: "pve01"
    # => target node for VM creation; cluster API routes calls to correct node

  tasks:
    # => tasks list: each item is one module call executed in order
    - name: Create a VM from template
      # => POST /nodes/pve01/qemu/{templateid}/clone via Proxmox REST API
      community.proxmox.proxmox_kvm:
        # => use community.proxmox.proxmox_kvm (NOT community.general.proxmox — deprecated)
        api_host: "{{ proxmox_host }}"
        # => Proxmox API endpoint; module handles authentication internally
        api_user: "{{ proxmox_user }}"
        # => user@realm format; must match Proxmox datacenter auth realm
        api_password: "{{ proxmox_password }}"
        # => password for api_user; referenced from Vault variable
        node: "{{ proxmox_node }}"
        # => node must have the template accessible (shared storage or local)
        clone: ubuntu-24-server
        # => source template name (must already exist as a template on the node)
        name: ansible-web-01
        # => new VM display name in Proxmox web UI
        vmid: 400
        # => explicit VMID; omit to auto-assign from next available ID
        full: yes
        # => full clone: independent disk (linked clone would share base disk)
        storage: local-lvm
        # => destination storage for the cloned disk
        state: present
        # => present: create if missing; idempotent — no error if already exists
      register: clone_result
      # => clone_result.vmid = 400 on success; use in subsequent tasks

    - name: Configure cloned VM hardware
      # => PUT /nodes/pve01/qemu/400/config to update hardware settings
      community.proxmox.proxmox_kvm:
        api_host: "{{ proxmox_host }}"
        # => same cluster node; any node accepts API calls for any VM in the cluster
        api_user: "{{ proxmox_user }}"
        # => same credentials; module needs VM.Config.HWType privilege
        api_password: "{{ proxmox_password }}"
        # => password resolved from Vault variable at runtime
        node: "{{ proxmox_node }}"
        # => VM 400 must exist on this node (or use migrate first)
        vmid: 400
        # => target the just-cloned VM
        memory: 4096
        # => override template's 2 GB with 4 GB for this VM
        cores: 4
        # => override template's 2 vCPUs with 4
        net:
          net0: "virtio,bridge=vmbr0"
          # => replace template NIC config; VirtIO for best performance
        ipconfig:
          ipconfig0: "ip=192.0.2.210/24,gw=192.0.2.1"
          # => write cloud-init static IP to cloud-init drive; applied on first boot
        state: present
        # => present: update existing VM config; no error if unchanged

    - name: Start the VM
      # => POST /nodes/pve01/qemu/400/status/start
      community.proxmox.proxmox_kvm:
        api_host: "{{ proxmox_host }}"
        # => same Proxmox node for API call
        api_user: "{{ proxmox_user }}"
        # => needs VM.PowerMgmt privilege to start the VM
        api_password: "{{ proxmox_password }}"
        # => referenced from Vault; never stored plaintext
        node: "{{ proxmox_node }}"
        # => node where VM 400 is currently stopped
        vmid: 400
        # => VM 400 must be stopped before this task starts it
        state: started
        # => started: starts VM if stopped; no-op if already running (idempotent)
      # => cloud-init runs on first boot; VM gets 192.0.2.210/24 and SSH key

    - name: Snapshot before deployment
      # => POST /nodes/pve01/qemu/400/snapshot
      community.proxmox.proxmox_snap:
        # => proxmox_snap: dedicated snapshot module (separate from proxmox_kvm)
        api_host: "{{ proxmox_host }}"
        # => same Proxmox node for snapshot API call
        api_user: "{{ proxmox_user }}"
        # => needs VM.Snapshot privilege to create snapshots
        api_password: "{{ proxmox_password }}"
        # => Vault-referenced password for api_user
        vmid: 400
        # => snapshot targets this VMID (node resolved automatically)
        snapname: pre-deploy-{{ ansible_date_time.date }}
        # => snapshot name includes date to avoid collisions on repeat runs
        description: "Before application deployment"
        # => description stored in snapshot metadata; visible in qm listsnapshot
        state: present
        # => present: create snapshot if it doesn't exist; idempotent
      # => snapshot visible via: qm listsnapshot 400
```

**Key Takeaway**: `community.proxmox.proxmox_kvm` is idempotent—running the same playbook twice creates the VM on first run and verifies existing configuration on second run, making it safe for repeated execution.

**Why It Matters**: Ansible-managed VM lifecycle integrates Proxmox provisioning into existing configuration management workflows. Teams using Ansible for application configuration can add VM provisioning playbooks to the same repository, creating end-to-end automation from "create VM" through "configure OS" through "deploy application" in a single `ansible-playbook` command. The deprecation of `community.general.proxmox*` in favor of `community.proxmox.*` is a significant API improvement—the dedicated collection has better test coverage and faster feature delivery than the general collection.

---

### Example 66: Use Ansible to Clone, Configure, and Destroy VMs at Scale

Building on the `community.proxmox` collection, this example demonstrates fleet-scale VM operations using Ansible loops and dynamic inventory.

**Code**:

```yaml
# fleet_management.yml - Scale VM operations with Ansible loops
--- # => YAML document start marker (required for Ansible playbook files)
- name: Fleet VM Management
  # => play: executes against all hosts in the "hosts" list
  hosts: localhost
  # => localhost: Ansible calls Proxmox API directly, no SSH to VMs
  gather_facts: false
  # => false: no local facts needed; saves ~2 seconds per run

  vars: # => vars: play-level variables shared across all tasks
    api_host: "192.0.2.100"
    # => any Proxmox cluster node IP; cluster routes API to correct node
    api_user: "root@pam"
    # => user@realm format (PAM = Linux system authentication)
    api_pass: "{{ vault_pve_password }}"
    # => from Ansible Vault; run: ansible-vault encrypt_string 'password'
    node: "pve01"
    # => target node for all VM creation in this playbook
    template_vmid: 100
    # => VMID 100 must already be a template (run: qm template 100)
    vm_fleet: # => list of dicts; each dict is one CI runner to create
      # => fleet definition: add/remove entries to scale up/down
      - { name: "ci-runner-01", vmid: 410, ip: "192.0.2.210" }
      # => inline dict: each field accessed as item.name, item.vmid, item.ip
      - { name: "ci-runner-02", vmid: 411, ip: "192.0.2.211" } # => runner 2
      - { name: "ci-runner-03", vmid: 412, ip: "192.0.2.212" } # => runner 3
      - { name: "ci-runner-04", vmid: 413, ip: "192.0.2.213" } # => runner 4
      - { name: "ci-runner-05", vmid: 414, ip: "192.0.2.214" } # => runner 5
      # => each entry: name=hostname, vmid=VMID, ip=cloud-init IP

  tasks:
    # => tasks: ordered list; Ansible executes sequentially (no parallelism within play)
    # => use async/poll: 0 with wait_for tasks to parallelize API calls if needed
    - name: Clone template for each fleet VM
      # => POST /nodes/pve01/qemu/100/clone for each fleet item
      # => clone API call is synchronous; Ansible waits for each clone to complete
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        # => Proxmox node API endpoint; module calls REST API on this host
        api_user: "{{ api_user }}"
        # => authenticated user; needs VM.Clone privilege on source template
        api_password: "{{ api_pass }}"
        # => resolved from Ansible Vault at runtime (never plaintext)
        node: "{{ node }}"
        # => physical Proxmox node where the clone operation runs
        clone: "{{ template_vmid }}"
        # => clone from template VMID 100
        vmid: "{{ item.vmid }}"
        # => destination VMID: 410, 411, 412, 413, 414 per iteration
        name: "{{ item.name }}"
        # => VM display name: ci-runner-01 through ci-runner-05
        storage: local-lvm
        # => target storage for cloned disk
        # => full clone disk lands on local-lvm; template disk stays on its original storage
        full: yes
        # => full clone: independent disk (linked clone shares base — faster but dependent)
        # => full=yes ensures each runner has isolated storage (required for write operations)
        state: present
        # => idempotent: create if missing; no-op if VMID already exists
        # => re-running task after partial failure only creates missing VMs
      loop: "{{ vm_fleet }}"
      # => executes task once per fleet entry; 5 iterations for 5 runners
      loop_control: # => loop_control: customizes loop output and variable names
        label: "{{ item.name }}"
        # => show VM name in Ansible output (not the full item dict)
        # => without label, Ansible prints the full item dict per iteration (hard to read)
      # => result: VMs 410-414 created on pve01 (stopped state)

    - name: Configure cloud-init for each VM
      # => PUT /nodes/pve01/qemu/{vmid}/config to write cloud-init settings
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        # => same node for config update; VM must exist on this node
        api_user: "{{ api_user }}"
        # => same credentials; needs VM.Config.CloudInit privilege
        api_password: "{{ api_pass }}"
        # => Vault secret; identical to clone task (same authentication)
        node: "{{ node }}"
        # => node where cloned VMs reside (same node as clone task)
        vmid: "{{ item.vmid }}"
        # => target each cloned VM by VMID
        ipconfig: # => ipconfig: dict of cloud-init IP config entries per NIC
          ipconfig0: "ip={{ item.ip }}/24,gw=192.0.2.1"
          # => unique static IP per runner: .210, .211, .212, .213, .214
        ciuser: ubuntu
        # => cloud-init creates this Linux user with sudo access
        sshkeys: "{{ lookup('file', '~/.ssh/id_ed25519.pub') }}"
        # => SSH public key added to authorized_keys; enables passwordless SSH
        state: present
        # => idempotent: update config if VM exists
        # => cloud-init config written to VM even if VM is stopped (applied on next boot)
      loop: "{{ vm_fleet }}"
      # => configures cloud-init on all 5 VMs before first boot
      # => run this task before "Start all fleet VMs" to ensure IP/SSH applied on first boot

    - name: Start all fleet VMs
      # => POST /nodes/pve01/qemu/{vmid}/status/start for each runner
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        # => same cluster node for power management API calls
        api_user: "{{ api_user }}"
        # => needs VM.PowerMgmt privilege to start VMs
        api_password: "{{ api_pass }}"
        # => Vault-referenced secret for api_user
        node: "{{ node }}"
        # => Proxmox node where the fleet VMs are running (or starting)
        vmid: "{{ item.vmid }}"
        # => each loop iteration starts a different VM (410, 411, 412, 413, 414)
        state: started
        # => started: starts if stopped; no-op if already running (idempotent)
        # => Ansible does not wait for guest OS boot; use wait_for_connection for that
      loop: "{{ vm_fleet }}"
      # => all 5 runners booting; cloud-init applies IP+SSH key on first boot

    - name: Destroy fleet when done (cleanup)
      # => DELETE /nodes/pve01/qemu/{vmid}; force=yes stops VM first if running
      community.proxmox.proxmox_kvm:
        api_host: "{{ api_host }}"
        # => same Proxmox node API endpoint for deletion calls
        api_user: "{{ api_user }}"
        # => needs VM.Allocate privilege to delete VMs and their disks
        api_password: "{{ api_pass }}"
        # => Vault-referenced password; same as all other tasks in this play
        node: "{{ node }}"
        # => node where the fleet VMs exist; deletion must target correct node
        vmid: "{{ item.vmid }}"
        # => destroys each VM in the fleet list one by one
        state: absent
        # => absent: stop running VM, then delete VM config and disks
        force: yes
        # => force: no graceful shutdown wait; immediate stop before delete
        # => without force=yes, the task fails if any VM in fleet is still running
      loop: "{{ vm_fleet }}"
      # => destroys all 5 VMs when enabled
      when: cleanup_fleet | default(false)
      # => gate: run only with --extra-vars "cleanup_fleet=true"; default=false=skip
      # => safety gate prevents accidental fleet deletion on routine playbook runs
```

**Key Takeaway**: Ansible loops over VM fleet definitions scale operations linearly—provisioning 5 or 50 VMs requires only changing the fleet list, not writing 50 individual task blocks.

**Why It Matters**: CI/CD runner fleets, test environment pools, and seasonal capacity additions are the ideal use case for Ansible-based fleet management. GitHub Actions self-hosted runner pools, for example, scale dynamically with load—Ansible provisioning hooks can create additional runners when the queue depth exceeds a threshold and destroy them when idle. This ephemeral fleet pattern keeps hardware utilization high without permanent VM sprawl.

---

### Example 67: Build a Golden VM Template with Packer

Packer automates golden image creation—it provisions a VM, runs provisioners, validates the result, and converts the VM to a Proxmox template.

**Code**:

```hcl
# ubuntu-packer.pkr.hcl - Packer template for Proxmox VM golden image
# => Packer workflow: init -> build -> provision -> convert to template
packer {
  required_plugins {
    proxmox = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/proxmox"
      # => Downloads proxmox plugin from GitHub; handles all Proxmox API calls
    }
  }
}
# => packer init: downloads and installs the proxmox plugin binary

# Variables for authentication
variable "proxmox_api_url"          { default = "https://192.0.2.100:8006/api2/json" }
# => override with: packer build -var "proxmox_api_url=https://..." or via PKR_VAR_proxmox_api_url env
variable "proxmox_api_token_id"     { default = "root@pam!packer" }
# => token_id format: user@realm!tokenid (API token, not password)
variable "proxmox_api_token_secret" { sensitive = true }
# => sensitive=true: value not printed in packer build output (security)

source "proxmox-iso" "ubuntu-server" {
  # Connection to Proxmox API (use API token, not username/password)
  proxmox_url              = var.proxmox_api_url
  # => Proxmox REST API URL including /api2/json suffix
  username                 = var.proxmox_api_token_id
  # => format: user@realm!tokenid (e.g., root@pam!packer)
  token                    = var.proxmox_api_token_secret
  # => UUID secret from Proxmox API token creation (shown once)
  insecure_skip_tls_verify = false
  # => false: verify TLS cert in production; true only for self-signed dev certs

  # VM Hardware (temporary build VM; Packer deletes it after converting to template)
  node    = "pve01"
  # => Proxmox node where the build VM is created
  vm_name = "ubuntu-24-packer-template"
  # => VM display name during build; becomes template name in web UI
  vm_id   = 9000
  # => high VMID avoids collision with production VMs in the 100-999 range
  memory  = 2048
  # => 2 GB RAM is enough for Ubuntu installer; build VM is temporary
  cores   = 2
  # => 2 cores accelerates package download and installation during provisioning

  # Boot ISO (downloaded by Packer to Proxmox local ISO storage)
  iso_url          = "https://releases.ubuntu.com/24.04/ubuntu-24.04.2-live-server-amd64.iso"
  # => Ubuntu 24.04 server ISO; Packer downloads if not cached
  iso_checksum     = "sha256:xxxx..."
  # => SHA256 hash from https://releases.ubuntu.com/24.04/SHA256SUMS; validates download integrity
  iso_storage_pool = "local"
  # => ISO cached at /var/lib/vz/template/iso/ on pve01
  http_directory   = "http"
  # => Packer serves ./http/ via embedded HTTP server for Ubuntu autoinstall user-data

  # Disk configuration (temporary; converted to template image after build)
  scsi_controller = "virtio-scsi-pci"
  # => VirtIO SCSI: best I/O performance; required for scsi disk type
  disks {
    # => disks block: defines one virtual disk on the build VM
    disk_size    = "32G"
    # => 32 GB build disk; will become the template's base image
    storage_pool = "local-lvm"
    # => thin-provisioned LVM; disk exists only during build then becomes template
    type         = "scsi"
    # => SCSI disk on VirtIO SCSI controller (fastest for Linux)
  }

  # Network for internet access during OS package installation
  network_adapters {
    # => network_adapters block: defines one virtual NIC for the build VM
    model  = "virtio"
    # => VirtIO paravirtualized NIC; Ubuntu 24.04 kernel includes driver
    bridge = "vmbr0"
    # => physical bridge for internet access during apt install steps
  }

  # Ubuntu autoinstall: Packer sends GRUB keystrokes to start unattended install
  boot_wait = "5s"
  # => wait for GRUB menu to appear before sending keystrokes
  boot_command = [
    "<esc><wait>",
    # => press ESC to get to GRUB boot prompt
    "e<wait>",
    # => press 'e' to edit the selected GRUB entry
    "<down><down><down><end>",
    # => navigate to end of kernel command line
    " autoinstall ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/",
    # => append autoinstall kernel parameter; Ubuntu reads user-data from Packer HTTP
    "<f10>"
    # => F10 to boot with the modified kernel command line
  ]
  # => Ubuntu autoinstall reads ./http/user-data; installs OS without interaction

  # SSH connection (Packer waits for SSH after OS installation completes)
  ssh_username         = "ubuntu"
  # => must match the user created in ./http/user-data autoinstall config
  ssh_private_key_file = "~/.ssh/id_ed25519"
  # => private key matching authorized_keys in ./http/user-data
  ssh_timeout          = "20m"
  # => Ubuntu install takes 5-15 min; allow 20 min before SSH timeout fails build

  # Template creation (Packer converts VM to template after provisioners complete)
  template_name        = "ubuntu-24-04-server"
  # => Proxmox template name; referenced by Terraform clone block
  template_description = "Ubuntu 24.04 Server - Built by Packer on {{isotime}}"
  # => {{isotime}} substituted with build timestamp; tracks template lineage

  # Cloud-init drive for Terraform integration
  cloud_init              = true
  # => attaches cloud-init drive to template; Terraform writes per-VM config here
  cloud_init_storage_pool = "local-lvm"
  # => cloud-init ISO stored on local-lvm thin pool
}
# => source block: WHAT to build | build block below: HOW to configure it

build {
  # => build block: defines provisioners that run after OS install; may reference multiple sources
  sources = ["source.proxmox-iso.ubuntu-server"]
  # => links to source block above; Packer manages the build VM lifecycle

  # Provisioner 1: update OS and install required Proxmox integration packages
  provisioner "shell" {
    # => shell provisioner: runs bash commands via SSH inside the build VM
    inline = [
      # => inline: list of shell commands executed in sequence
      "sudo apt update",
      # => refresh package index from Ubuntu repositories
      "sudo apt upgrade -y",
      # => apply all security and feature updates at build time
      "sudo apt install -y qemu-guest-agent cloud-init",
      # => qemu-guest-agent: Proxmox VM management (shutdown, exec, freeze)
      "sudo systemctl enable qemu-guest-agent",
      # => enable agent to start on clone boot; required for graceful shutdown
    ]
  }
  # => result: OS fully updated; agents installed; ready for sysprep

  # Provisioner 2: clear machine-specific state (equivalent to sysprep on Windows)
  provisioner "shell" {
    # => second shell provisioner: runs after provisioner 1 completes
    inline = [
      "sudo rm -f /etc/ssh/ssh_host_*",
      # => delete SSH host keys; each clone regenerates unique keys on first boot
      "sudo truncate -s 0 /etc/machine-id",
      # => empty machine-id; systemd-machine-id-setup regenerates on clone boot
      "sudo cloud-init clean",
      # => reset cloud-init run state; each clone runs cloud-init fresh on boot
      "sudo sync",
      # => flush all filesystem buffers before Packer shuts down the build VM
    ]
  }
  # => result: clean golden image; each clone is independent with fresh identifiers
  # => Packer: VM shut down → qm template 9000 → VMID 9000 is now read-only template
}
```

**Key Takeaway**: Packer's `proxmox-iso` builder installs the OS, applies hardening, and automatically converts the VM to a template—producing a validated, reproducible golden image without manual steps.

**Why It Matters**: Manually creating golden images is error-prone and produces images that diverge over time as operators make ad-hoc modifications. Packer-built images are built from code, rebuilt regularly (weekly or on OS updates), tested automatically (post-provisioner validation steps), and identical across every build. Combined with a CI pipeline that triggers Packer builds when `ubuntu-packer.pkr.hcl` changes and validates the template with automated tests, this creates a continuously updated, security-patched base image without manual intervention.

---

### Example 68: Full IaC Pipeline: Packer → PVE Template → Terraform Clone

This example demonstrates the complete infrastructure-as-code pipeline that produces production-ready VMs from source code.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Git Commit<br/>ubuntu-packer.pkr.hcl"] -->|"CI trigger"| B["Packer Build<br/>Install OS + Harden"]
    B -->|"qm template"| C["PVE Template<br/>VMID 9000<br/>ubuntu-24-04-server"]
    C -->|"terraform apply"| D["VM Fleet<br/>300, 301, 302<br/>cloud-init configured"]
    D --> E["Production VMs<br/>Running + Accessible"]

    style A fill:#CA9161,color:#000,stroke:#000
    style B fill:#0173B2,color:#fff,stroke:#000
    style C fill:#DE8F05,color:#000,stroke:#000
    style D fill:#029E73,color:#fff,stroke:#000
    style E fill:#CC78BC,color:#000,stroke:#000
```

**Code**:

```bash
# Step 1: Build golden image with Packer
packer init ubuntu-packer.pkr.hcl
# => downloads and installs proxmox plugin v1.2.0

packer build \
  -var "proxmox_api_token_secret=$PROXMOX_TOKEN_SECRET" \
  ubuntu-packer.pkr.hcl
# => creates VM 9000, installs Ubuntu, runs provisioners, converts to template
# => Build complete: template ID 9000 'ubuntu-24-04-server' on pve01 (~8 min)

# Step 2: Verify template is registered
qm list | grep 9000
# => 9000  ubuntu-24-04-server  template  2048/2048  32.00  0

# Step 3: Point Terraform at new template VMID
sed -i 's/vm_id = [0-9]*/vm_id = 9000/' terraform.tfvars
# => tfvars updated; terraform plan will show new template ID

# Step 4: Apply Terraform to provision VMs from new template
terraform init
# => provider bpg/proxmox ~> 0.104 downloaded

terraform plan -var "proxmox_api_token=$PROXMOX_TOKEN"
# => Plan: 3 to add, 0 to change, 0 to destroy (VMs 300, 301, 302)

terraform apply -var "proxmox_api_token=$PROXMOX_TOKEN" -auto-approve
# => VMs 300, 301, 302 created on pve01 in ~45-48 seconds each
# => Apply complete! Resources: 3 added, 0 changed, 0 destroyed.

# CI/CD integration: git commit → Packer build → template → Terraform apply
# 1. PR to packer-template repo triggers Packer build on PVE
# 2. Template ID stored in SSM/Vault; Terraform reads via data source
# 3. Full pipeline: code commit -> production VMs ready in <15 minutes
```

**Key Takeaway**: The Packer → Template → Terraform pipeline creates a fully auditable VM provisioning chain where every production VM traces back to a specific Packer build, which traces back to a specific commit in the packer template repository.

**Why It Matters**: This pipeline implements the immutable infrastructure principle—VMs are never patched in-place but replaced from freshly built templates. OS CVE remediation becomes "rebuild template, apply Terraform" rather than "run apt upgrade on 50 VMs and pray." The audit trail (Packer build ID → template ID → VM ID → application deployment) enables forensic reconstruction of any VM's configuration history, which is required for PCI-DSS and SOC 2 compliance.

---

### Example 69: Write Custom Scripts Using the PVE REST API with curl

Direct REST API calls enable integration with systems that do not have a dedicated Proxmox client library.

**Code**:

```bash
# Set API base URL (all endpoints are relative to this)
API_BASE="https://192.0.2.100:8006/api2/json"
# => all Proxmox API endpoints are under /api2/json

# API token (preferred; tokens can be scoped and revoked without affecting user)
API_TOKEN="root@pam!automation=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# => format: user@realm!tokenid=UUID-secret (from Example 18)

# Helper function for authenticated API calls (reusable wrapper)
pve_api() {
  local method="$1"
  # => HTTP method: GET (read), POST (create/action), PUT (update), DELETE (remove)
  local path="$2"
  # => API endpoint path (e.g., /nodes/pve01/qemu)
  shift 2
  # => remaining args ($@) are passed as request body flags (-d '{"key":"val"}')
  curl -s -k \
    # => -s: silent mode (no progress bar); -k: skip TLS verify (dev; remove in production)
    -X "$method" \
    # => HTTP verb sent to Proxmox REST API
    -H "Authorization: PVEAPIToken=$API_TOKEN" \
    # => PVEAPIToken: format "user@realm!tokenid=UUID-secret" (stateless auth)
    -H "Content-Type: application/json" \
    # => required for POST/PUT with JSON body; Proxmox rejects without this header
    "$API_BASE$path" \
    "$@"
    # => full URL constructed; $@ passes request body if provided
}
# => usage: pve_api GET /nodes/pve01/qemu | pve_api POST /nodes/pve01/qemu/100/snapshot -d '{...}'

# GET: retrieve VM list (python3 -m json.tool pretty-prints; grep filters fields)
pve_api GET /nodes/pve01/qemu | python3 -m json.tool | grep -E '"name"|"vmid"|"status"'
# => "name": "ubuntu-24-server" | "vmid": 100 | "status": "running"

# POST: create a snapshot (Proxmox returns async UPID; snapshot runs in background)
pve_api POST /nodes/pve01/qemu/100/snapshot \
  -d '{"snapname": "api-snapshot-'"$(date +%Y%m%d-%H%M%S)"'", "description": "Created via REST API"}'
# => {"data": "UPID:pve01:000A1234:...:qmsnapshot:100:root@pam:"}
# => UPID: task ID; poll with GET /nodes/pve01/tasks/UPID/status

# PUT: modify VM config (hotplug: memory+CPU change without reboot)
pve_api PUT /nodes/pve01/qemu/100/config \
  -d '{"memory": 4096, "cores": 4}'
# => {"data": null}  (null return = success; error returns {"data": "error message"})

# DELETE: remove a snapshot (also async; returns UPID)
pve_api DELETE /nodes/pve01/qemu/100/snapshot/old-snapshot
# => {"data": "UPID:pve01:...:delsnapshot:100:root@pam:"}

# Poll UPID task status until complete (all POST/DELETE operations are asynchronous)
wait_for_task() {
  local upid="$1"
  # => UPID format: UPID:node:pid:pstart:starttime:type:id:user:
  local node="${upid%%:*}"
  # => extract everything before first colon: "UPID" (but we want the node after that)
  node="${node#UPID:}"
  # => strip "UPID:" prefix: "UPID:pve01:..." becomes "pve01"
  while true; do
    status=$(pve_api GET "/nodes/$node/tasks/$upid/status" | python3 -c "
import sys, json; d = json.load(sys.stdin)['data']; print(d['status'])
# => d['status']: 'running' while in progress; 'stopped' when complete (success or fail)
")
    [ "$status" = "stopped" ] && break
    # => break when task is done; check exitstatus separately for success/failure
    sleep 2
    # => poll every 2 seconds to avoid hammering the API
    echo "Task $upid: $status (waiting...)"
    # => show progress while task runs
  done
  echo "Task completed"
  # => task status 'stopped'; check exitstatus='OK' for success
}
# => wait_for_task "UPID:pve01:...": blocks until async task finishes; use after POST/DELETE
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
import json                        # => json: used for pretty-printing responses in debug
import time                        # => time: used for sleep polling and timestamp generation

# Connect using API token (recommended over username/password)
proxmox = ProxmoxAPI(
    host='192.0.2.100',
    # => Proxmox node hostname or IP; any node in the cluster accepts API calls
    user='root@pam',
    # => user@realm: root authenticated via Linux PAM
    token_name='automation',
    # => token name created in Datacenter -> Permissions -> API Tokens
    token_value='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    # => token UUID secret (shown once at creation time)
    verify_ssl=False,              # => Set True in production with valid certificate
    timeout=30                     # => 30 second request timeout
)
# => ProxmoxAPI initialized; connection verified on first method call

# Get all nodes in cluster (maps to GET /nodes)
nodes = proxmox.nodes.get()       # => GET /nodes
# => [{'node': 'pve01', 'status': 'online', 'cpu': 0.12, 'mem': 8589934592, ...}]
for node in nodes:
    # => iterate over each node dict in the response list
    print(f"Node: {node['node']}, CPU: {node['cpu']:.1%}, Status: {node['status']}")
    # => cpu field is 0.0-1.0 fraction; :.1% formats as percentage
# => Node: pve01, CPU: 12.3%, Status: online
# => Node: pve02, CPU: 8.7%, Status: online

# Get all VMs on pve01 (method chain maps to GET /nodes/pve01/qemu)
vms = proxmox.nodes('pve01').qemu.get()  # => GET /nodes/pve01/qemu
# => [{'vmid': 100, 'name': 'ubuntu-24-server', 'status': 'running', ...}]

# Start a VM programmatically (returns async UPID; poll for completion)
def start_vm(node, vmid):
    # => function: wraps POST request; caller uses wait_for_task to wait for completion
    task = proxmox.nodes(node).qemu(vmid).status.start.post()
    # => POST /nodes/{node}/qemu/{vmid}/status/start
    # => Returns UPID task identifier (not blocking; task runs async)
    return task                    # => 'UPID:pve01:...:qmstart:100:root@pam:'

# Poll task status until 'stopped' (Proxmox tasks are asynchronous)
def wait_for_task(node, upid, timeout=60):
    # => polls every 1 second up to timeout seconds
    for _ in range(timeout):
        # => range(timeout): iterate up to timeout times (each loop = 1 second wait)
        task_status = proxmox.nodes(node).tasks(upid).status.get()
        # => GET /nodes/{node}/tasks/{upid}/status returns {status, exitstatus}
        if task_status['status'] == 'stopped':
            # => 'stopped' means task finished (success or failure)
            return task_status.get('exitstatus', 'unknown')
            # => exitstatus='OK' on success, error message on failure
        time.sleep(1)
        # => wait 1 second between polls to avoid hammering the API
    raise TimeoutError(f"Task {upid} did not complete in {timeout}s")
    # => raise if task hangs (network issue, hung QEMU process)

# Create snapshot and wait for completion
def backup_and_snapshot(node, vmid, snapshot_name):
    # => orchestrates: create snapshot → poll until done → return status
    print(f"Creating snapshot {snapshot_name} on VM {vmid}...")
    # => progress log; output visible in terminal or CI logs
    task_id = proxmox.nodes(node).qemu(vmid).snapshot.post(
        snapname=snapshot_name,
        # => snapshot name stored in VM config; visible via qm listsnapshot
        vmstate=0,                 # => vmstate=0: disk-only snapshot (no RAM saved)
        description=f"Automated snapshot: {snapshot_name}"
        # => description stored in snapshot metadata for identification
    )                              # => POST /nodes/{node}/qemu/{vmid}/snapshot
    result = wait_for_task(node, task_id)
    # => blocks until snapshot task completes
    print(f"Snapshot created: {result}")  # => Snapshot created: OK
    return result
    # => returns 'OK' on success; caller can assert result == 'OK' in CI

# Execute the workflow with timestamp-based snapshot name
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

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["BIOS: IOMMU enabled<br/>(Intel VT-d / AMD-Vi)"] --> B["Kernel: iommu=pt<br/>VFIO modules loaded"]
    B --> C["GPU bound to vfio-pci<br/>(not nvidia driver)"]
    C --> D["VM Config<br/>--hostpci0 01:00.0<br/>--machine q35<br/>--bios ovmf"]
    D --> E["Guest VM<br/>Sees real GPU<br/>CUDA available"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#CC78BC,color:#000,stroke:#000
    style D fill:#029E73,color:#fff,stroke:#000
    style E fill:#CA9161,color:#000,stroke:#000
```

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

# Step 4: Find the PCIe device to pass through (note both GPU and audio function)
lspci -nn | grep -i nvidia
# => 01:00.0 NVIDIA GeForce RTX 4080 [10de:2704] | 01:00.1 Audio [10de:228b]

# Step 5: Bind GPU and audio device to VFIO driver (must include all functions)
echo "options vfio-pci ids=10de:2704,10de:228b" >> /etc/modprobe.d/vfio.conf
# => both GPU (2704) and HDMI audio (228b) must be bound to avoid IOMMU group errors

update-initramfs -u -k all
# => initramfs updated; VFIO claims devices before NVIDIA driver on next boot
reboot
# => GPU now held by vfio-pci instead of host NVIDIA driver

# Step 6: Verify VFIO has claimed the GPU (not nvidia driver)
lspci -nnk | grep -A2 "01:00.0"
# => Kernel driver in use: vfio-pci  (VFIO claimed it, not nvidia)

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
# List USB devices connected to the Proxmox host (note vendorid:productid format)
lsusb
# => ID 1050:0407 Yubico.com Yubikey 4 | ID 0403:6001 FTDI FT232 Serial
# => format: Bus XXX Device YYY: ID vendorid:productid DeviceName

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
# vGPU requires: NVIDIA enterprise GPU (A/T-series), AI Enterprise license
# GRID driver >=18.3 (v570.158.02+) REQUIRED for PVE 9 kernel 6.14+

# Install GRID driver (DKMS auto-rebuilds on kernel updates)
bash NVIDIA-Linux-x86_64-570.158.02-vgpu-kvm.run --no-x-check
# => builds kernel module for PVE kernel; DKMS registered for auto-rebuild

# Verify NVIDIA vGPU driver is loaded
nvidia-smi
# => NVIDIA-SMI 570.158.02 | CUDA 12.7 | NVIDIA A30 | 0 MiB / 24576 MiB

# List available vGPU profiles for this GPU
mdevctl types
# => nvidia-1: A30-4C (4 GB) | nvidia-2: A30-8C (8 GB) | nvidia-3: A30-24C (24 GB)

# Create a 4 GB vGPU instance (UUID auto-assigned by kernel)
echo "nvidia-1" > /sys/bus/pci/devices/0000:00:06.0/mdev_supported_types/nvidia-1/create
# => vGPU instance created; UUID appears in /sys/bus/mdev/devices/

# Get the vGPU UUID for assignment
VGPU_UUID=$(ls /sys/bus/mdev/devices/ | head -1)
echo $VGPU_UUID
# => xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Assign vGPU to VM (mdev=1: mediated device, not full GPU passthrough)
qm set 100 --hostpci0 $VGPU_UUID,mdev=1
# => VM 100 gets 4 GB NVIDIA A30 vGPU slice; CUDA available in guest
```

**Key Takeaway**: NVIDIA vGPU requires GRID driver 18.3+ on PVE 9—older drivers will fail to load against the PVE 9 kernel (6.14+), causing CUDA and GPU compute to be completely unavailable.

**Why It Matters**: vGPU enables GPU time-sharing across multiple VMs without the cost of one GPU per VM. A single NVIDIA A30 (24 GB) can serve six 4 GB vGPU instances, providing GPU-accelerated AI inference or video transcoding to six VMs simultaneously at 1/6 the hardware cost. For organizations running mixed GPU workloads (some lightweight inference, some heavy training), vGPU profiles enable right-sizing GPU allocation to workload requirements rather than over-provisioning every VM with a full GPU.

---

### Example 74: Enable and Manage Nested Virtualization

Nested virtualization allows VMs to run their own hypervisors (VMware ESXi, Hyper-V, nested KVM). PVE 9.x introduced per-vCPU nested virtualization control.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["PVE Host<br/>KVM + nested=Y"] --> B["Outer VM<br/>cpu: host, nested=on"]
    B --> C["Inner Hypervisor<br/>(VMware ESXi / KVM)"]
    C --> D["Inner VMs<br/>(dev/test workloads)"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#029E73,color:#fff,stroke:#000
    style D fill:#CC78BC,color:#000,stroke:#000
```

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

# PVE 9.x: Per-vCPU nested virtualization control (new feature)
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

Virtual Trusted Platform Module (vTPM) provides hardware-grade security attestation for VMs. PVE 9.x introduced vTPM in qcow2 format, enabling snapshots while vTPM is active.

**Code**:

```bash
# Convert VM disk to qcow2 on 'local' directory storage (required for vTPM+snapshot)
qm importdisk 100 /dev/pve/vm-100-disk-0 local --format qcow2
# => local:100/vm-100-disk-0.qcow2 created
# => qcow2 format supports snapshots with embedded TPM state (raw disks cannot)

# Add vTPM 2.0 (q35+OVMF required; tpmstate stored in qcow2 enabling snapshots)
qm set 100 \
  --machine q35 \
  # => Q35 chipset: required for PCIe and UEFI (vTPM needs UEFI boot)
  --bios ovmf \
  # => OVMF: UEFI firmware; vTPM 2.0 requires UEFI (not SeaBIOS)
  --efidisk0 local:1,efitype=4m \
  # => EFI disk: stores UEFI boot variables; efitype=4m for secure boot support
  --tpmstate0 local:1,version=v2.0
  # => tpmstate0: vTPM state file on 'local' storage; v2.0 = TPM 2.0 specification
# => tpmstate0 in qcow2 (PVE 9.x): snapshot includes TPM state (impossible with raw)

# Snapshot VM with vTPM state included (PVE 9.x feature; --vmstate 0 = disk-only)
qm snapshot 100 with-vtpm \
  --description "Snapshot with vTPM state (PVE 9.x feature)" \
  # => description stored in snapshot metadata; shown in qm listsnapshot
  --vmstate 0
  # => vmstate=0: skip RAM snapshot (disk+TPM only); vmstate=1 includes RAM (live)
# => snapshot 'with-vtpm' created; includes disk + TPM state in qcow2

# Start VM and verify vTPM is initialized in Windows
qm start 100
# => VM starts with vTPM 2.0 enabled
# => Windows receives TPM 2.0 from vTPM; passes Windows 11 hardware check

# Verify TPM is visible inside Windows (Manufacturer Version: 2.0 = success)
qm agent 100 exec -- cmd.exe /c "tpm.msc"
# => TPM 2.0 ready; BitLocker can now be enabled (seals key to this vTPM identity)
```

**Key Takeaway**: vTPM in qcow2 (new in PVE 9.x) resolves the long-standing limitation where VMs with vTPM could not be snapshotted—the TPM state and disk are now unified in the qcow2 snapshot format.

**Why It Matters**: vTPM is required for Windows 11 installation and for enabling Virtualization Based Security (VBS) features including Credential Guard, Device Guard, and BitLocker with TPM attestation. Enterprises migrating Windows workloads to Proxmox need vTPM to maintain compliance postures that require TPM-backed BitLocker (PCI-DSS, HIPAA, GDPR). The qcow2 snapshot support in PVE 9.x eliminates the operational constraint that made vTPM impractical for stateful VM management.

---

## Group 18: Upgrades and Maintenance

### Example 76: Perform an In-Place Upgrade from PVE 8 to PVE 9

PVE 8 to PVE 9 upgrades the base OS from Debian 12 (Bookworm) to Debian 13 (Trixie). The `pve8to9` checker identifies blockers before the upgrade.

**Code**:

```bash
# Step 1: Run pre-upgrade checker (blocks on Ceph Reef, GlusterFS, old GRID driver)
pve8to9
# => Checking Ceph: WARN Reef → upgrade to Squid first (see Example 77)
# => Checking GlusterFS: WARN removed in PVE 9; migrate data first
# => 2 warnings found; resolve before proceeding

# Step 2: Resolve warnings then re-run until clean
pve8to9
# => All checks passed. Ready to upgrade to PVE 9.

# Step 3: Switch all APT sources from bookworm → trixie (Debian 13)
sed -i 's/bookworm/trixie/g' /etc/apt/sources.list
# => base Debian repo now points to trixie

echo "deb http://download.proxmox.com/debian/pve trixie pve-no-subscription" \
  > /etc/apt/sources.list.d/pve-no-subscription.list
# => PVE repository updated to trixie packages

sed -i 's/reef/squid/g' /etc/apt/sources.list.d/ceph.list
# => Ceph Squid (19.2.x) repository enabled

# Step 4: Perform dist-upgrade (~10-30 minutes; installs PVE 9.2 + kernel 7.0)
apt update && apt dist-upgrade
# => pve-manager 9.2, QEMU 11.0, LXC 7.0 installed

# Step 5: Reboot into PVE 9 kernel
reboot
# => kernel 7.0-1-pve loaded after reboot

pveversion
# => pve-manager/9.2-1/...
# => running kernel: 7.0-1-pve   (PVE 9 kernel confirmed)
```

**Key Takeaway**: Never skip the `pve8to9` checker—PVE 9 removes GlusterFS support entirely and requires Ceph to be at Squid version before upgrade; these are data-loss or cluster-failure risks if ignored.

**Why It Matters**: In-place OS upgrades on production hypervisors are high-risk operations that require careful pre-flight checks, tested rollback procedures, and maintenance windows with stakeholder communication. The `pve8to9` checker represents years of community knowledge about upgrade failure modes encoded as automated checks. Teams that skip the checker and proceed directly to `apt dist-upgrade` on PVE 8 with Reef Ceph have experienced cluster failures requiring full cluster rebuilds. Upgrade sequencing (Ceph first, then PVE) is not advisory—it is mandatory.

---

### Example 77: Upgrade Ceph from Quincy/Reef to Squid Before PVE 9

Ceph must be upgraded to Squid (19.2.x) before upgrading PVE to version 9. Failing to do so leaves the cluster in an unsupported configuration.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Current: Ceph Reef 18.2.x<br/>(or Quincy 17.2.x)"] --> B["Step 1: Enable Squid repo<br/>on all cluster nodes"]
    B --> C["Step 2: Upgrade MONs<br/>pve01 → pve02 → pve03"]
    C --> D["Step 3: Upgrade MGRs<br/>one at a time"]
    D --> E["Step 4: Upgrade OSDs<br/>rolling, one OSD at a time"]
    E --> F["Result: Ceph Squid 19.2.x<br/>HEALTH_OK"]

    style A fill:#CC78BC,color:#000,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#0173B2,color:#fff,stroke:#000
    style D fill:#0173B2,color:#fff,stroke:#000
    style E fill:#0173B2,color:#fff,stroke:#000
    style F fill:#029E73,color:#fff,stroke:#000
```

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

# Cluster accepts mixed versions during rolling upgrade (1 squid, 2 reef is normal)
ceph status | grep -A5 "services"
# => mon: 3 daemons (1 squid, 2 reef) | mgr: pve01-squid(active) pve02-reef(standby)
# => osd: 3 up, 3 in (all OSDs remain up during rolling MON/MGR/OSD upgrades)

# Step 5: Repeat on pve02 and pve03; verify all show squid after each node
ceph status | grep -A5 "services"
# => mon: 3 daemons (3 squid) | mgr: pve01-squid(active)  (all at Squid)

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

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["pve01 (source)<br/>VM 100 running<br/>ZFS tank/vm-100"] -->|"zfs send incremental<br/>every 15 minutes"| B["pve02 (replica)<br/>ZFS tank/vm-100<br/>(synchronized copy)"]
    A -->|"zfs send incremental"| C["pve03 (replica)<br/>ZFS tank/vm-100<br/>(synchronized copy)"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#029E73,color:#fff,stroke:#000
    style C fill:#029E73,color:#fff,stroke:#000
```

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

# Check replication job status (duration=12s: only changed blocks sent)
pvesh get /nodes/pve01/replication
# => [{"id":"100-pve02","target":"pve02","fail_count":0,"duration":12,"state":"ok"}]

# Monitor replication (fail_count>0 means staleness is accumulating)
pvesr status
# => 100-pve02  enabled  ok  2026-04-29 07:15:00  fail_count:0  last:12s

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

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Primary Ceph Cluster<br/>(DC1)<br/>rbd-mirror daemon"] -->|"Async RBD mirroring<br/>(journal-based)"| B["DR Ceph Cluster<br/>(DC2)<br/>rbd-mirror daemon"]
    A -->|"VM disk writes<br/>(synchronous to local OSDs)"| A
    B -->|"On failover:<br/>rbd mirror image promote"| C["DR VMs<br/>Start on DC2"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#029E73,color:#fff,stroke:#000
    style C fill:#CA9161,color:#000,stroke:#000
```

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

# Verify mirroring is active (1 replaying = actively receiving writes from primary)
rbd mirror pool status vm-images
# => health: OK | daemon health: OK | images: 1 total | 1 replaying

# Check individual image sync status
rbd mirror image status vm-images/vm-100-disk-0
# => vm-100-disk-0: state up+replaying | last_update: 2026-04-29 07:00:01
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

### Example 82: Configure S3-Compatible Backup Target in PBS 4.2

PBS 4.2 (required for PVE 9 compatibility) adds S3-compatible object storage as a backup target, enabling offsite backups to AWS S3, MinIO, or Wasabi without a separate PBS server at the offsite location.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["PBS Local Datastore<br/>(primary site)"] -->|"Sync job<br/>04:00 daily"| B["S3 Remote<br/>(AWS / MinIO / Wasabi)"]
    A --> C["PVE Node Backups<br/>incremental + dedup"]
    C --> A
    B -->|"On disaster:<br/>restore from S3"| D["Recovery<br/>New PBS server"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#029E73,color:#fff,stroke:#000
    style D fill:#CA9161,color:#000,stroke:#000
```

**Code**:

```bash
# Add MinIO S3-compatible remote at DR site (fingerprint from PBS web UI)
proxmox-backup-manager remote add minio-dr \
  --url "https://minio.dr.company.com:9000" \
  # => MinIO S3-compatible API URL; port 9000 is MinIO default
  --auth-id "backup@pbs" \
  # => PBS user (backup@pbs) with Datastore.Read privilege on 'main'
  --password "MinioBackupPass123!" \
  # => MinIO access key secret; use vault/env var in production scripts
  --fingerprint "XX:XX:XX:..." \
  # => TLS certificate fingerprint from PBS web UI (Remote -> TLS Fingerprint)
  --comment "MinIO S3 at DR datacenter"
  # => comment displayed in proxmox-backup-manager remote list output
# => remote 'minio-dr' added; use same approach for AWS S3 (url: s3.amazonaws.com)

# Add AWS S3 as an alternative remote
proxmox-backup-manager remote add aws-s3 \
  --url "https://s3.amazonaws.com" \
  # => AWS S3 global endpoint; regional endpoints (s3.us-east-1.amazonaws.com) also work
  --auth-id "AKIAIOSFODNN7EXAMPLE" \
  # => AWS access key ID (from IAM user or IAM role with S3:PutObject on the bucket)
  --password "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  # => AWS secret access key (treat as password; rotate periodically)
  --s3-bucket "company-proxmox-backups" \
  # => S3 bucket name; must already exist and have versioning disabled
  --s3-region "us-east-1" \
  # => AWS region where the bucket resides; used to construct S3 request signatures
  --comment "AWS S3 offsite backup bucket"
# => AWS S3 remote 'aws-s3' added

# Create sync job (--remove-vanished false: keep S3 copies even when local pruned)
proxmox-backup-manager sync-job add s3-offsite \
  --store main \
  # => source datastore on local PBS server to sync from
  --remote aws-s3 \
  # => destination remote (the aws-s3 remote configured above)
  --remote-store company-proxmox-backups \
  # => S3 bucket name at the remote (must match --s3-bucket in remote definition)
  --schedule "0 4 * * *" \
  # => cron: run at 04:00 daily (after nightly backups complete at 01:00-02:00)
  --remove-vanished false \
  # => false: keep S3 copies even if pruned locally (3-2-1 safety)
  --comment "Daily offsite sync to AWS S3 at 04:00"
# => sync job created; syncs 'main' datastore to S3 daily at 04:00

# Test immediately and verify status
proxmox-backup-manager sync-job run s3-offsite
# => 5.2 GB transferred in ~3 minutes
proxmox-backup-manager sync-job list
# => s3-offsite  main  aws-s3  0 4 * * *  2026-04-29 04:00:11  OK
```

**Key Takeaway**: PBS 4.2 S3 sync converts local-only backup into a 3-2-1 backup strategy (3 copies, 2 media types, 1 offsite) without requiring additional PBS infrastructure at the offsite location.

**Why It Matters**: Local backups protected against application errors and accidental deletion; offsite backups protect against site-level disasters (fire, flood, physical theft). S3 sync is the most cost-effective way to achieve offsite backup for small-to-medium deployments—AWS S3 Glacier storage costs approximately $0.004/GB/month, making offsite backup of 5 TB cost roughly $20/month. This is an order of magnitude cheaper than maintaining a physical DR site with its own PBS server.

---

### Example 83: Implement Full Backup Rotation Strategy with PBS

A comprehensive retention policy balances storage cost against recovery window. This example implements the Grandfather-Father-Son (GFS) rotation scheme.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Daily Backup<br/>(Son)"] -->|"keep-daily=7"| B["7 daily backups<br/>last 7 days"]
    C["Weekly Backup<br/>(Father)"] -->|"keep-weekly=4"| D["4 weekly backups<br/>last 4 weeks"]
    E["Monthly Backup<br/>(Grandfather)"] -->|"keep-monthly=12"| F["12 monthly backups<br/>last 12 months"]
    B --> G["Prune Job<br/>PBS removes expired"]
    D --> G
    F --> G

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#0173B2,color:#fff,stroke:#000
    style C fill:#DE8F05,color:#000,stroke:#000
    style D fill:#DE8F05,color:#000,stroke:#000
    style E fill:#029E73,color:#fff,stroke:#000
    style F fill:#029E73,color:#fff,stroke:#000
    style G fill:#CA9161,color:#000,stroke:#000
```

**Code**:

```bash
# Define GFS retention policy for PBS datastore
# GFS: keep daily (son), weekly (father), monthly (grandfather) backups

# Configure GFS pruning policy (runs at 03:00 after backups complete at 01:00-02:00)
proxmox-backup-manager prune-job add gfs-policy \
  --store main \
  # => 'main' is the PBS datastore name where backups are stored
  --schedule "0 3 * * *" \
  # => cron: run at 03:00 daily; backups finish by 02:00 in this setup
  --keep-last 3 \
  # => always keep the 3 most recent backups regardless of schedule (operational safety net)
  --keep-hourly 0 \
  # => 0: no hourly backups kept; set >0 only if hourly backup jobs exist
  --keep-daily 14 \
  # => retain one backup per day for 14 days (last 2 weeks of daily history)
  --keep-weekly 8 \
  # => retain one backup per week for 8 weeks (last 2 months of weekly history)
  --keep-monthly 6 \
  # => retain one backup per month for 6 months (last half-year monthly snapshots)
  --keep-yearly 2 \
  # => retain one backup per year for 2 years (annual compliance archive)
  --comment "GFS retention: 3 recent, 14 daily, 8 weekly, 6 monthly, 2 yearly"
# => gfs-policy created; runs at 03:00 daily

# Dry-run to preview retention decisions before committing
proxmox-backup-client prune \
  --repository backup@pbs@192.0.2.80:main \
  # => repository format: user@pbs@host:datastore (same credentials as backup job)
  --keep-last 3 --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --keep-yearly 2 \
  # => same retention parameters as the prune-job above (must match for accurate preview)
  --dry-run
  # => dry-run: prints which backups would be removed without deleting anything
# => 2026-04-29 keep(last) | 2026-04-26 keep(daily) | 2026-04-25 REMOVE

# Run GC to reclaim freed space after pruning
proxmox-backup-client garbage-collect \
  --repository backup@pbs@192.0.2.80:main
  # => garbage-collect: removes chunks no longer referenced by any backup snapshot
# => 285.3 GB freed (4.2 TB → 3.9 TB after orphaned chunk cleanup)
```

**Key Takeaway**: GFS rotation provides protection at multiple granularities—recent backups for quick operational recovery, monthly/yearly backups for long-term compliance and regulatory retention requirements.

**Why It Matters**: Retention policy must be driven by both technical recovery requirements and compliance mandates. GDPR may require deleting backups of personal data older than the data retention period; PCI-DSS may require retaining transaction logs for 12 months; internal policies may require evidence of system state for audit purposes. The PBS prune/GC implementation ensures that retention policy is mechanically enforced rather than administratively managed—the right backups are kept and the right ones are deleted automatically, reducing both storage cost and compliance risk.

---

### Example 84: Configure SDN with DHCP IP Management

SDN DHCP integration uses dnsmasq to provide automatic IP assignment to VMs connected to SDN VNets, eliminating manual IP management.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["VM boots<br/>(no IP configured)"] -->|"DHCP Discover"| B["dnsmasq on PVE node<br/>(SDN subnet DHCP)"]
    B -->|"DHCP Offer<br/>198.51.100.101/24"| A
    B --> C["DNS registration<br/>vm-name.web.internal.example"]
    B --> D["IP Tracking<br/>/cluster/sdn/vnets/ips"]

    style A fill:#0173B2,color:#fff,stroke:#000
    style B fill:#DE8F05,color:#000,stroke:#000
    style C fill:#029E73,color:#fff,stroke:#000
    style D fill:#CC78BC,color:#000,stroke:#000
```

**Code**:

```bash
# Install dnsmasq (DHCP/DNS server for SDN IP management)
apt install dnsmasq
# => dnsmasq installed; SDN uses it to serve DHCP on VNet interfaces
# => dnsmasq version from Debian Trixie (default on PVE 9); no manual config needed

# Configure DHCP range on SDN subnet (dnszoneprefix: VMs get web-server-01.web.internal.example)
pvesh set /cluster/sdn/vnets/web-vnet/subnets/198.51.100.0-24 \
  --dhcp-range "start-address=198.51.100.100,end-address=198.51.100.200" \
  # => 100 IP addresses available (.100 to .200); first available assigned to new VMs
  --gateway 198.51.100.1 \
  # => default gateway injected into VM DHCP offer (must match VNet gateway interface)
  --dnszoneprefix web
  # => DNS zone prefix: VMs registered as <vmname>.web.internal in dnsmasq
# => dnsmasq serves .100-.200 range; dnszoneprefix registers DNS names

pvesh set /cluster/sdn
# => dnsmasq reconfigured on all nodes; VMs on web-vnet get DHCP from .100-.200
# => Proxmox writes /etc/dnsmasq.d/sdn-*.conf files from SDN definition

# Add a static DHCP mapping to reserve 198.51.100.101 for VM 100's MAC
pvesh create /cluster/sdn/vnets/web-vnet/ips \
  --ip 198.51.100.101 \
  # => reserved IP: dnsmasq always assigns this IP to the matching MAC address
  --mac AA:BB:CC:DD:EE:FF \
  # => VM 100 MAC address (from VM config: qm config 100 | grep net0)
  --zone simple-zone \
  # => SDN zone name (must match the zone of web-vnet)
  --vmid 100 \
  # => links this reservation to VM 100 for inventory tracking in Proxmox
  --comment "Reserved for VM 100 (web-server-01)"
# => static lease: VM 100 always gets .101 regardless of boot order

pvesh set /cluster/sdn
# => dnsmasq updated with dhcp-host entry for VM 100 MAC

# Verify generated dnsmasq config (Proxmox writes this from SDN definitions)
cat /etc/dnsmasq.d/sdn-web-vnet.conf
# => dhcp-range=198.51.100.100,198.51.100.200 | dhcp-host=AA:BB...,198.51.100.101,web-server-01

# Show active DHCP leases
cat /var/lib/misc/dnsmasq.leases
# => AA:BB:CC:DD:EE:FF 198.51.100.101 web-server-01 | AA:BB:...:00 198.51.100.102 nginx-proxy-01
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
# => cache mode change takes effect immediately; no VM restart required

# Set cache=writeback for development VMs (best performance, less safe)
qm set 101 --scsi0 local-lvm:vm-101-disk-0,cache=writeback,aio=io_uring
# => scsi0 updated: writeback cache enabled for max throughput
# => writeback: host kernel buffers writes; syncs to storage on flush or timeout

# Benchmark VM disk I/O using fio (inside the VM)
# => qm agent exec runs commands inside the VM via qemu-guest-agent (no SSH needed)
qm agent 100 exec -- bash -c "
  apt install -y fio
  # => fio: flexible I/O tester; standard tool for storage benchmarking
  # Sequential read test (4K blocks, 60 seconds)
  fio --name=seqread --rw=read --bs=4k --size=1G --numjobs=4 \
      --runtime=60 --time_based --output-format=json \
      # => output-format=json: machine-readable output for python3 parsing below
      --filename=/dev/sda | python3 -c \"
import sys, json
r = json.load(sys.stdin)        # => parse fio JSON output from stdin
job = r['jobs'][0]              # => first job entry (single job name 'seqread')
bw = job['read']['bw_mean'] / 1024   # => convert KB/s to MB/s
iops = job['read']['iops_mean']       # => average IOPS over the 60s runtime
lat = job['read']['lat_ns']['mean'] / 1000 / 1000  # => ns to ms conversion
print(f'Read: {bw:.0f} MB/s, {iops:.0f} IOPS, {lat:.2f}ms avg latency')
\"
  # => Read: 1240 MB/s, 320000 IOPS, 0.08ms avg latency  (NVMe with cache=none)

  # Random write test (4K blocks, simulates database workload)
  fio --name=randwrite --rw=randwrite --bs=4k --size=1G --numjobs=4 \
      --runtime=60 --time_based --ioengine=libaio --direct=1 \
      # => ioengine=libaio: async I/O for comparison with io_uring baseline
      # => direct=1: bypass page cache; measures true storage throughput
      --filename=/dev/sda | python3 -c \"
import sys, json
r = json.load(sys.stdin)        # => parse fio JSON output from stdin
job = r['jobs'][0]              # => first job entry ('randwrite')
bw = job['write']['bw_mean'] / 1024   # => convert KB/s to MB/s
iops = job['write']['iops_mean']       # => average write IOPS over 60s runtime
lat = job['write']['lat_ns']['mean'] / 1000 / 1000  # => ns to ms conversion
print(f'Write: {bw:.0f} MB/s, {iops:.0f} IOPS, {lat:.2f}ms avg latency')
\"
  # => Write: 820 MB/s, 210000 IOPS, 0.15ms avg latency
"
```

**Key Takeaway**: `cache=none` with `aio=io_uring` provides the best production I/O profile—data durability through direct-to-storage writes combined with io_uring's low-overhead asynchronous I/O reduces database query latency.

**Why It Matters**: Cache mode selection is the most impactful single tuning parameter for VM disk performance that does not require hardware changes. A database VM on `cache=writeback` may appear to perform 2-3x faster in benchmarks but risks data loss on host crash—a silent durability trade-off that only surfaces during actual failures. io_uring (available in QEMU 10.x, included in PVE 9) reduces I/O submission overhead compared to the older libaio engine, providing measurable latency improvements for IOPS-sensitive workloads like PostgreSQL OLTP without changing storage hardware or cache mode.
