---
title: "Learning Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

> **Read before apply.** The examples model real operations, but their default commands only print an
> intended operation or validate bundled text. Substitute a real target only in a disposable lab you own,
> after confirming backups, disks, hostnames, network paths, and a rollback plan.

## Start with the local skeleton

The capstone artifacts contain placeholders only. This check is safe to run anywhere: it reads local files,
rejects placeholder-looking secrets, and does not contact Proxmox, a package registry, or a network target.

```sh
# => Validates only the bundled teaching skeleton and exits nonzero on an unsafe committed token pattern.
sh code/validate-skeleton.sh
```

## Concepts

The course covers the hypervisor and platform boundary (`co-01`–`co-10`), ZFS/Ceph storage and failure
models (`co-11`–`co-21`), cloud-init and immutable guest delivery (`co-22`–`co-25`), API-driven IaC and
configuration (`co-26`–`co-31`), unattended host provisioning and recovery (`co-32`–`co-33`), and explicit
failure-domain reasoning (`co-34`). The examples use declarative HCL/YAML and harmless shell output before
asking a reader to operate a real lab.

## Substrate map

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC; color is supplementary.
flowchart TB
    accTitle: Substrate map
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: Physical hosts and direct disks, KVM QEMU and Proxmox, ZFS or Ceph storage, Cloud-init VMs, Workloads above this course. Connections: Physical hosts and direct disks to KVM QEMU and Proxmox, KVM QEMU and Proxmox to ZFS or Ceph storage, ZFS or Ceph storage to Cloud-init VMs, Cloud-init VMs to Workloads above this course.
    H["Physical hosts and<br/>direct disks"]:::blue --> P["KVM QEMU and Proxmox"]:::orange
    P --> S["ZFS or Ceph storage"]:::teal
    S --> V["Cloud-init VMs"]:::purple
    V --> W["Workloads above this<br/>course"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The arrows show dependency, not an instruction to combine every technology. A small installation may use one
host and ZFS; Ceph and HA require a designed multi-node failure domain. A later Kubernetes course consumes
the VMs; this course makes their substrate deliberate.

Next: [Beginner Examples](./beginner.md) →
