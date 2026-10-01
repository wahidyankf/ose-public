---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Build a small Windows-only console program that creates a child with CreateProcess, runs two threads under both a mutex and a critical section, performs a handle-based overlapped write, and closes every acquired HANDLE.

## Run

```powershell
cl /W4 /TC windows_os_tour.c
.\windows_os_tour.exe
Get-Process windows_os_tour -ErrorAction SilentlyContinue
```

The child runs the same executable with --child. The parent waits on the child and worker handles, prints a counter of exactly two, waits for the overlapped completion event, obtains the final byte count, and removes its temporary file.

## Acceptance checks

- CreateProcess succeeds and the hProcess and hThread handles both close.
- Two workers increment the shared counter exactly twice using a mutex plus critical section.
- The temporary file uses FILE_FLAG_OVERLAPPED and its completion event and file handle close.
- contrast.md contrasts handles/objects with fd and /proc, plus CreateProcess with fork/exec.

```mermaid
flowchart LR
  accTitle: Acceptance checks
  accDescr: Flowchart with 5 nodes and 4 connections. Nodes: Parent, Child image, Workers, counter = 2, completion event. Connections: Parent to Child image (CreateProcess), Parent to Workers (CreateThread twice), Workers to counter = 2 (mutex and critical section), Parent to completion event (overlapped HANDLE I/O).
  P["Parent"]:::blue -->|CreateProcess| C["Child image"]:::orange
  P -->|CreateThread twice| W["Workers"]:::teal
  W -->|mutex and critical<br/>section| N["counter = 2"]:::purple
  P -->|overlapped HANDLE<br/>I/O| F["completion event"]:::brown
  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
  classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```
